import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
  const db = getDb();
  const scouts = db.prepare(`
    SELECT
      s.*,
      COALESCE(SUM(CASE WHEN p.tipo='inscripcion' THEN p.monto END), 0) AS total_inscripcion,
      COALESCE(SUM(CASE WHEN p.tipo='cuota' THEN p.monto * (
        CAST((SELECT value FROM config WHERE key='cuota_monto_abono') AS REAL) /
        NULLIF(CAST((SELECT value FROM config WHERE key='cuota_monto_abono') AS REAL) + CAST((SELECT value FROM config WHERE key='cuota_monto_unidad') AS REAL), 0)
      ) END), 0) AS saldo_abono
    FROM scouts s
    LEFT JOIN pagos p ON p.scout_id = s.id
    GROUP BY s.id
    ORDER BY s.apellido, s.nombre
  `).all();

  const config = db.prepare(`SELECT key, value FROM config`).all() as { key: string; value: string }[];
  const cfg = Object.fromEntries(config.map(r => [r.key, r.value]));

  return NextResponse.json({ scouts, config: cfg });
}

export async function POST(req: NextRequest) {
  const { nombre, apellido, seccion } = await req.json();
  if (!nombre || !apellido) {
    return NextResponse.json({ error: 'nombre y apellido son requeridos' }, { status: 400 });
  }
  const db = getDb();
  const result = db.prepare(
    `INSERT INTO scouts(nombre, apellido, seccion) VALUES(?,?,?)`
  ).run(nombre.trim(), apellido.trim(), seccion?.trim() ?? null);

  const scout = db.prepare(`SELECT * FROM scouts WHERE id=?`).get(result.lastInsertRowid);
  return NextResponse.json(scout, { status: 201 });
}
