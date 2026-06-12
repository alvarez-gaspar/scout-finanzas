import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { año, mes_inicio, mes_fin, cuota_inscripcion, cuota_monto_abono, cuota_monto_unidad } = body;

  if (!año || !mes_inicio || !mes_fin || !cuota_inscripcion || !cuota_monto_abono || !cuota_monto_unidad) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
  }

  const db = getDb();

  db.transaction(() => {
    db.exec(`DELETE FROM gasto_items`);
    db.exec(`DELETE FROM gastos`);
    db.exec(`DELETE FROM pagos`);

    const upsert = db.prepare(`INSERT INTO config(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`);
    upsert.run('temporada_año', String(año));
    upsert.run('temporada_mes_inicio', String(mes_inicio));
    upsert.run('temporada_mes_fin', String(mes_fin));
    upsert.run('cuota_inscripcion', String(cuota_inscripcion));
    upsert.run('cuota_monto_abono', String(cuota_monto_abono));
    upsert.run('cuota_monto_unidad', String(cuota_monto_unidad));
  })();

  return NextResponse.json({ ok: true });
}
