import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const scoutId = parseInt(id);
  if (isNaN(scoutId)) return NextResponse.json({ error: 'id inválido' }, { status: 400 });

  const { nombre, apellido, fecha_nacimiento, etapa, comunidad } = await req.json();
  if (!nombre || !apellido) {
    return NextResponse.json({ error: 'nombre y apellido son requeridos' }, { status: 400 });
  }

  const db = getDb();
  db.prepare(`
    UPDATE scouts SET nombre=?, apellido=?, fecha_nacimiento=?, etapa=?, comunidad=? WHERE id=?
  `).run(nombre.trim(), apellido.trim(), fecha_nacimiento?.trim() ?? null, etapa?.trim() ?? null, comunidad?.trim() ?? null, scoutId);

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const scoutId = parseInt(id);
  if (isNaN(scoutId)) return NextResponse.json({ error: 'id inválido' }, { status: 400 });

  const db = getDb();

  db.transaction(() => {
    const ratioAbono = (() => {
      const cfg = db.prepare(`SELECT key, value FROM config WHERE key IN ('cuota_monto_abono','cuota_monto_unidad')`).all() as { key: string; value: string }[];
      const map = Object.fromEntries(cfg.map(r => [r.key, parseFloat(r.value)]));
      const total = (map.cuota_monto_abono ?? 0) + (map.cuota_monto_unidad ?? 0);
      return total > 0 ? (map.cuota_monto_abono ?? 0) / total : 0;
    })();

    const { total_cuotas } = db.prepare(
      `SELECT COALESCE(SUM(monto),0) AS total_cuotas FROM pagos WHERE scout_id=? AND tipo='cuota'`
    ).get(scoutId) as { total_cuotas: number };

    const { abono_gastado } = db.prepare(
      `SELECT COALESCE(SUM(monto),0) AS abono_gastado FROM gasto_items WHERE scout_id=? AND tipo='abono'`
    ).get(scoutId) as { abono_gastado: number };

    const { total_inscripcion } = db.prepare(
      `SELECT COALESCE(SUM(monto),0) AS total_inscripcion FROM pagos WHERE scout_id=? AND tipo='inscripcion'`
    ).get(scoutId) as { total_inscripcion: number };

    const formalizado = !!(db.prepare(
      `SELECT 1 FROM gasto_items WHERE scout_id=? AND tipo='inscripcion' LIMIT 1`
    ).get(scoutId));

    // Cuotas netas (abono + unidad) menos lo que ya se gastó del abono
    const transferenciaTotal = (total_cuotas - abono_gastado) + (formalizado ? 0 : total_inscripcion);

    if (transferenciaTotal > 0) {
      const nombreScout = (db.prepare(`SELECT nombre, apellido FROM scouts WHERE id=?`).get(scoutId) as { nombre: string; apellido: string } | undefined);
      const desc = nombreScout ? `Baja de pionero: ${nombreScout.apellido}, ${nombreScout.nombre}` : `Baja de pionero #${scoutId}`;
      db.prepare(
        `INSERT INTO pagos(scout_id, tipo, monto, fecha, descripcion) VALUES(NULL,'unidad',?,date('now'),?)`
      ).run(transferenciaTotal, desc);
    }

    // Eliminar gasto_items que referencian al scout (RESTRICT lo bloquearía si no)
    db.prepare(`DELETE FROM gasto_items WHERE scout_id=?`).run(scoutId);

    // Eliminar el scout (CASCADE borra sus pagos)
    db.prepare(`DELETE FROM scouts WHERE id=?`).run(scoutId);
  })();

  return NextResponse.json({ ok: true });
}
