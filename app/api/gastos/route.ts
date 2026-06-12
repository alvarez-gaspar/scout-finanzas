import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

interface ItemInput {
  tipo: 'unidad' | 'abono' | 'inscripcion';
  scout_id?: number | null;
  monto: number;
}

export async function GET() {
  const db = getDb();
  const gastos = db.prepare(`
    SELECT g.*,
      (SELECT SUM(gi.monto) FROM gasto_items gi WHERE gi.gasto_id = g.id) AS total
    FROM gastos g
    ORDER BY g.fecha DESC, g.creado_en DESC
    LIMIT 100
  `).all();

  const items = db.prepare(`
    SELECT gi.*, s.nombre, s.apellido
    FROM gasto_items gi
    LEFT JOIN scouts s ON s.id = gi.scout_id
    ORDER BY gi.gasto_id, gi.id
  `).all();

  return NextResponse.json({ gastos, items });
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const fecha = formData.get('fecha') as string;
  const descripcion = formData.get('descripcion') as string | null;
  const itemsJson = formData.get('items') as string;
  const file = formData.get('comprobante') as File | null;

  if (!fecha || !itemsJson) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
  }

  const items: ItemInput[] = JSON.parse(itemsJson);
  if (!items.length) {
    return NextResponse.json({ error: 'Debe haber al menos un ítem' }, { status: 400 });
  }
  if (items.some(i => i.monto <= 0)) {
    return NextResponse.json({ error: 'Todos los montos deben ser mayores a 0' }, { status: 400 });
  }
  if (items.some(i => (i.tipo === 'abono' || i.tipo === 'inscripcion') && !i.scout_id)) {
    return NextResponse.json({ error: 'Los ítems de abono e inscripción requieren un scout' }, { status: 400 });
  }

  let comprobante_url: string | null = null;
  if (file && file.size > 0) {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const ext = file.name.split('.').pop() ?? 'bin';
    const filename = `${uuidv4()}.${ext}`;
    fs.writeFileSync(path.join(uploadDir, filename), Buffer.from(await file.arrayBuffer()));
    comprobante_url = `/uploads/${filename}`;
  }

  const db = getDb();
  const insertGasto = db.prepare(
    `INSERT INTO gastos(fecha, descripcion, comprobante_url) VALUES(?,?,?)`
  );
  const insertItem = db.prepare(
    `INSERT INTO gasto_items(gasto_id, tipo, scout_id, monto) VALUES(?,?,?,?)`
  );

  const gasto = db.transaction(() => {
    const { lastInsertRowid } = insertGasto.run(fecha, descripcion ?? null, comprobante_url);
    for (const item of items) {
      insertItem.run(lastInsertRowid, item.tipo, item.scout_id ?? null, item.monto);
    }
    return db.prepare(`SELECT * FROM gastos WHERE id=?`).get(lastInsertRowid);
  })();

  return NextResponse.json(gasto, { status: 201 });
}
