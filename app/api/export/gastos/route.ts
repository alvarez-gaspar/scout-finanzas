import getDb from '@/lib/db';
import { toCSV, csvResponse } from '@/lib/csv';

const TIPO_LABEL: Record<string, string> = {
  unidad: 'Fondo Unidad',
  abono: 'Abono Scout',
  inscripcion: 'Inscripción Scout',
};

export async function GET() {
  const db = getDb();

  const rows = db.prepare(`
    SELECT
      g.fecha AS "Fecha",
      g.descripcion AS "Descripción Gasto",
      gi.tipo AS "_tipo",
      s.apellido AS "Apellido Scout",
      s.nombre AS "Nombre Scout",
      gi.monto AS "Monto",
      CASE WHEN g.comprobante_url IS NOT NULL THEN 'Sí' ELSE 'No' END AS "Tiene Comprobante",
      g.creado_en AS "Registrado En"
    FROM gasto_items gi
    JOIN gastos g ON g.id = gi.gasto_id
    LEFT JOIN scouts s ON s.id = gi.scout_id
    ORDER BY g.fecha DESC, g.creado_en DESC
  `).all() as Record<string, unknown>[];

  const mapped = rows.map(r => {
    const out = { ...r };
    out['Tipo'] = TIPO_LABEL[r['_tipo'] as string] ?? r['_tipo'];
    delete out['_tipo'];
    return out;
  });

  const fecha = new Date().toISOString().slice(0, 10);
  return csvResponse(toCSV(mapped), `gastos_${fecha}.csv`);
}
