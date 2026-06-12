import getDb from '@/lib/db';
import { toCSV, csvResponse } from '@/lib/csv';

const TIPO_LABEL: Record<string, string> = {
  inscripcion: 'Inscripción',
  cuota: 'Cuota mensual',
  unidad: 'Pago directo unidad',
};

export async function GET() {
  const db = getDb();

  const rows = db.prepare(`
    SELECT
      p.fecha AS "Fecha",
      s.apellido AS "Apellido Scout",
      s.nombre AS "Nombre Scout",
      s.seccion AS "Sección",
      p.tipo AS "_tipo",
      p.monto AS "Monto",
      p.descripcion AS "Descripción",
      CASE WHEN p.comprobante_url IS NOT NULL THEN 'Sí' ELSE 'No' END AS "Tiene Comprobante",
      p.creado_en AS "Registrado En"
    FROM pagos p
    JOIN scouts s ON s.id = p.scout_id
    ORDER BY p.fecha DESC, p.creado_en DESC
  `).all() as Record<string, unknown>[];

  const mapped = rows.map(r => {
    const out = { ...r };
    out['Tipo'] = TIPO_LABEL[r['_tipo'] as string] ?? r['_tipo'];
    delete out['_tipo'];
    return out;
  });

  const fecha = new Date().toISOString().slice(0, 10);
  return csvResponse(toCSV(mapped), `pagos_${fecha}.csv`);
}
