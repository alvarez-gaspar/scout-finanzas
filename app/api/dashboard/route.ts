import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
  const db = getDb();

  const config = Object.fromEntries(
    (db.prepare(`SELECT key, value FROM config`).all() as { key: string; value: string }[])
      .map(r => [r.key, parseFloat(r.value)])
  );

  const montoAbono = config.cuota_monto_abono;
  const montoUnidad = config.cuota_monto_unidad;
  const cuotaInscripcion = config.cuota_inscripcion;
  const totalCuota = montoAbono + montoUnidad;
  const ratioAbono = totalCuota > 0 ? montoAbono / totalCuota : 0;
  const ratioUnidad = totalCuota > 0 ? montoUnidad / totalCuota : 0;

  // Ingresos
  const { total_inscripcion } = db.prepare(
    `SELECT COALESCE(SUM(monto),0) AS total_inscripcion FROM pagos WHERE tipo='inscripcion'`
  ).get() as { total_inscripcion: number };

  const { total_cuotas } = db.prepare(
    `SELECT COALESCE(SUM(monto),0) AS total_cuotas FROM pagos WHERE tipo='cuota'`
  ).get() as { total_cuotas: number };

  const { total_unidad_directo } = db.prepare(
    `SELECT COALESCE(SUM(monto),0) AS total_unidad_directo FROM pagos WHERE tipo='unidad'`
  ).get() as { total_unidad_directo: number };

  // Egresos por tipo
  const { gasto_unidad } = db.prepare(
    `SELECT COALESCE(SUM(monto),0) AS gasto_unidad FROM gasto_items WHERE tipo='unidad'`
  ).get() as { gasto_unidad: number };

  const { gasto_inscripcion } = db.prepare(
    `SELECT COALESCE(SUM(monto),0) AS gasto_inscripcion FROM gasto_items WHERE tipo='inscripcion'`
  ).get() as { gasto_inscripcion: number };

  const fondo_unidad = total_cuotas * ratioUnidad + total_unidad_directo - gasto_unidad;
  const fondo_inscripcion = total_inscripcion - gasto_inscripcion;

  // Cuotas vencidas en la temporada configurada
  const mesInicio = config.temporada_mes_inicio ?? 4;
  const mesFin = config.temporada_mes_fin ?? 11;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  let cuotas_debidas_temporada = 0;
  if (month >= mesInicio) {
    for (let m = mesInicio; m <= Math.min(month, mesFin); m++) {
      const lastDayOfMonth = new Date(year, m, 0).getDate();
      if (m < month || (m === month && now.getDate() >= lastDayOfMonth)) {
        cuotas_debidas_temporada++;
      }
    }
  }

  // Scouts: saldo abono = ingresos cuotas (abono) - gastos abono de ese scout
  const scouts = db.prepare(`
    SELECT
      s.id, s.nombre, s.apellido, s.seccion, s.fecha_nacimiento,
      COALESCE(SUM(CASE WHEN p.tipo='inscripcion' THEN p.monto END), 0) AS pagado_inscripcion,
      COALESCE(SUM(CASE WHEN p.tipo='cuota' THEN p.monto * ? END), 0)
        - COALESCE((SELECT SUM(gi.monto) FROM gasto_items gi WHERE gi.scout_id = s.id AND gi.tipo='abono'), 0)
        AS saldo_abono,
      EXISTS(SELECT 1 FROM gasto_items gi WHERE gi.scout_id = s.id AND gi.tipo='inscripcion') AS formalizado,
      COALESCE((SELECT COUNT(*) FROM pagos p2 WHERE p2.scout_id = s.id AND p2.tipo='cuota'), 0) AS cuotas_pagadas
    FROM scouts s
    LEFT JOIN pagos p ON p.scout_id = s.id
    GROUP BY s.id
    ORDER BY s.apellido, s.nombre
  `).all(ratioAbono) as Array<{
    id: number; nombre: string; apellido: string; seccion: string | null;
    pagado_inscripcion: number; saldo_abono: number; formalizado: number; cuotas_pagadas: number;
  }>;

  // Añadir cuotas_debidas a cada scout
  const scoutsConCuotas = scouts.map(s => ({
    ...s,
    cuotas_debidas: cuotas_debidas_temporada,
  }));

  const fondo_abonos = scoutsConCuotas.reduce((sum, s) => sum + Math.max(0, s.saldo_abono), 0);
  const inscritos = scoutsConCuotas.filter(s => s.formalizado).length;
  const pagaron_inscripcion = scoutsConCuotas.filter(s => s.pagado_inscripcion >= cuotaInscripcion).length;

  return NextResponse.json({
    fondo_inscripcion,
    fondo_unidad,
    fondo_abonos,
    total_scouts: scoutsConCuotas.length,
    inscritos,
    pagaron_inscripcion,
    no_inscritos: scoutsConCuotas.length - inscritos,
    scouts: scoutsConCuotas,
    config,
    cuotas_debidas_temporada,
  });
}
