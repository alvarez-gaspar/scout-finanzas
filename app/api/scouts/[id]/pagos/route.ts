import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const pagos = db.prepare(
    `SELECT * FROM pagos WHERE scout_id=? ORDER BY fecha DESC, creado_en DESC`
  ).all(id);
  return NextResponse.json(pagos);
}
