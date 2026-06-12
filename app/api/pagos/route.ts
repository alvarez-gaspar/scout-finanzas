import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const db = getDb();
  const pagos = db.prepare(`
    SELECT p.*, s.nombre, s.apellido
    FROM pagos p
    JOIN scouts s ON s.id = p.scout_id
    ORDER BY p.fecha DESC, p.creado_en DESC
    LIMIT 50
  `).all();
  return NextResponse.json(pagos);
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const scout_id = formData.get('scout_id') as string;
  const tipo = formData.get('tipo') as string;
  const monto = parseFloat(formData.get('monto') as string);
  const fecha = formData.get('fecha') as string;
  const descripcion = formData.get('descripcion') as string || null;
  const file = formData.get('comprobante') as File | null;

  if (!scout_id || !tipo || isNaN(monto) || !fecha) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
  }

  let comprobante_url: string | null = null;
  if (file && file.size > 0) {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const ext = file.name.split('.').pop() ?? 'bin';
    const filename = `${uuidv4()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(path.join(uploadDir, filename), buffer);
    comprobante_url = `/uploads/${filename}`;
  }

  const db = getDb();
  const result = db.prepare(`
    INSERT INTO pagos(scout_id, tipo, monto, fecha, descripcion, comprobante_url)
    VALUES(?,?,?,?,?,?)
  `).run(scout_id, tipo, monto, fecha, descripcion, comprobante_url);

  const pago = db.prepare(`SELECT * FROM pagos WHERE id=?`).get(result.lastInsertRowid);
  return NextResponse.json(pago, { status: 201 });
}
