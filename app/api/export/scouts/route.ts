import getDb from '@/lib/db';
import { toCSV, csvResponse } from '@/lib/csv';

export async function GET() {
  const db = getDb();

  const config = Object.fromEntries(
    (db.prepare(`SELECT key, value FROM config`).all() as { key: string; value: string }[])
      .map(r => [r.key, parseFloat(r.value)])
  );
  const totalCuota = config.cuota_monto_abono + config.cuota_monto_unidad;
  const ratioAbono = totalCuota > 0 ? config.cuota_monto_abono / totalCuota : 0;

  const rows = db.prepare(`
    SELECT
      s.apellido AS "Apellido",
      s.nombre AS "Nombre",
      s.seccion AS "Sección",
      COALESCE(SUM(CASE WHEN p.tipo='inscripcion' THEN p.monto END), 0) AS "Pagado Inscripción",
      CASE WHEN EXISTS(SELECT 1 FROM gasto_items gi WHERE gi.scout_id=s.id AND gi.tipo='inscripcion')
        THEN 'Sí' ELSE 'No' END AS "Formalizado",
      ROUND(
        COALESCE(SUM(CASE WHEN p.tipo='cuota' THEN p.monto * ? END), 0)
        - COALESCE((SELECT SUM(gi.monto) FROM gasto_items gi WHERE gi.scout_id=s.id AND gi.tipo='abono'), 0)
      , 0) AS "Saldo Abono",
      COALESCE(SUM(CASE WHEN p.tipo='cuota' THEN p.monto END), 0) AS "Total Cuotas Pagadas",
      s.creado_en AS "Fecha Ingreso"
    FROM scouts s
    LEFT JOIN pagos p ON p.scout_id = s.id
    GROUP BY s.id
    ORDER BY s.apellido, s.nombre
  `).all(ratioAbono) as Record<string, unknown>[];

  const fecha = new Date().toISOString().slice(0, 10);
  return csvResponse(toCSV(rows), `scouts_${fecha}.csv`);
}
