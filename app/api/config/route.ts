import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
  const db = getDb();
  const rows = db.prepare(`SELECT key, value FROM config`).all() as { key: string; value: string }[];
  return NextResponse.json(Object.fromEntries(rows.map(r => [r.key, r.value])));
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const db = getDb();
  const upsert = db.prepare(`INSERT OR REPLACE INTO config(key,value) VALUES(?,?)`);
  for (const [key, value] of Object.entries(body)) {
    upsert.run(key, String(value));
  }
  const rows = db.prepare(`SELECT key, value FROM config`).all() as { key: string; value: string }[];
  return NextResponse.json(Object.fromEntries(rows.map(r => [r.key, r.value])));
}
