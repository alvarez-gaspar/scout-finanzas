import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

interface MonthRow { mes: string; monto: number; }
interface GastoRow { mes: string; tipo: string; monto: number; }

export async function GET() {
  const db = getDb();

  const config = Object.fromEntries(
    (db.prepare(`SELECT key, value FROM config`).all() as { key: string; value: string }[])
      .map(r => [r.key, parseFloat(r.value)])
  );

  const montoAbono = config.cuota_monto_abono;
  const montoUnidad = config.cuota_monto_unidad;
  const totalCuota = montoAbono + montoUnidad;
  const ratioAbono = totalCuota > 0 ? montoAbono / totalCuota : 0;
  const ratioUnidad = totalCuota > 0 ? montoUnidad / totalCuota : 0;

  // Ingresos agrupados por mes y tipo
  const ingresos = db.prepare(`
    SELECT strftime('%Y-%m', fecha) AS mes, tipo, COALESCE(SUM(monto), 0) AS monto
    FROM pagos
    GROUP BY mes, tipo
    ORDER BY mes
  `).all() as (MonthRow & { tipo: string })[];

  // Egresos agrupados por mes y tipo
  const egresos = db.prepare(`
    SELECT strftime('%Y-%m', g.fecha) AS mes, gi.tipo, COALESCE(SUM(gi.monto), 0) AS monto
    FROM gasto_items gi
    JOIN gastos g ON g.id = gi.gasto_id
    GROUP BY mes, gi.tipo
    ORDER BY mes
  `).all() as GastoRow[];

  // Recopilar todos los meses presentes
  const mesesSet = new Set<string>([
    ...ingresos.map(r => r.mes),
    ...egresos.map(r => r.mes),
  ]);

  if (mesesSet.size === 0) {
    return NextResponse.json({ puntos: [] });
  }

  // Rellenar meses intermedios vacíos
  const meses = Array.from(mesesSet).sort();
  const [firstYear, firstMonth] = meses[0].split('-').map(Number);
  const [lastYear, lastMonth] = meses[meses.length - 1].split('-').map(Number);
  const allMeses: string[] = [];
  let y = firstYear, m = firstMonth;
  while (y < lastYear || (y === lastYear && m <= lastMonth)) {
    allMeses.push(`${y}-${String(m).padStart(2, '0')}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }

  // Construir lookup para acceso rápido
  const ingLookup: Record<string, Record<string, number>> = {};
  for (const r of ingresos) {
    if (!ingLookup[r.mes]) ingLookup[r.mes] = {};
    ingLookup[r.mes][r.tipo] = (ingLookup[r.mes][r.tipo] ?? 0) + r.monto;
  }
  const gasLookup: Record<string, Record<string, number>> = {};
  for (const r of egresos) {
    if (!gasLookup[r.mes]) gasLookup[r.mes] = {};
    gasLookup[r.mes][r.tipo] = (gasLookup[r.mes][r.tipo] ?? 0) + r.monto;
  }

  // Calcular saldos acumulados mes a mes
  let acumUnidad = 0, acumAbonos = 0, acumInscripcion = 0;
  const puntos = allMeses.map(mes => {
    const ing = ingLookup[mes] ?? {};
    const gas = gasLookup[mes] ?? {};

    acumUnidad += (ing.cuota ?? 0) * ratioUnidad + (ing.unidad ?? 0) - (gas.unidad ?? 0);
    acumAbonos += (ing.cuota ?? 0) * ratioAbono - (gas.abono ?? 0);
    acumInscripcion += (ing.inscripcion ?? 0) - (gas.inscripcion ?? 0);

    const [yy, mm] = mes.split('-');
    const label = new Date(parseInt(yy), parseInt(mm) - 1).toLocaleDateString('es-CL', { month: 'short', year: '2-digit' });

    return {
      mes,
      label,
      unidad: Math.round(Math.max(0, acumUnidad)),
      abonos: Math.round(Math.max(0, acumAbonos)),
      inscripcion: Math.round(Math.max(0, acumInscripcion)),
    };
  });

  return NextResponse.json({ puntos });
}
