import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'scout.db');

function getDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  initSchema(db);
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS config (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS scouts (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre     TEXT NOT NULL,
      apellido   TEXT NOT NULL,
      seccion    TEXT,
      creado_en  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pagos (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      scout_id        INTEGER REFERENCES scouts(id) ON DELETE CASCADE,
      tipo            TEXT NOT NULL CHECK(tipo IN ('inscripcion','cuota','unidad')),
      monto           REAL NOT NULL,
      fecha           TEXT NOT NULL,
      descripcion     TEXT,
      comprobante_url TEXT,
      creado_en       TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS gastos (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha           TEXT NOT NULL,
      descripcion     TEXT,
      comprobante_url TEXT,
      creado_en       TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS gasto_items (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      gasto_id  INTEGER NOT NULL REFERENCES gastos(id) ON DELETE CASCADE,
      tipo      TEXT NOT NULL CHECK(tipo IN ('unidad','abono','inscripcion')),
      scout_id  INTEGER REFERENCES scouts(id) ON DELETE RESTRICT,
      monto     REAL NOT NULL
    );
  `);

  // Migraciones no destructivas
  try { db.exec(`ALTER TABLE scouts ADD COLUMN fecha_nacimiento TEXT`); } catch {}

  // Defaults de configuración
  const setDefault = db.prepare(`INSERT OR IGNORE INTO config(key,value) VALUES(?,?)`);
  setDefault.run('cuota_monto_abono', '10000');
  setDefault.run('cuota_monto_unidad', '5000');
  setDefault.run('cuota_inscripcion', '5000');
  setDefault.run('temporada_mes_inicio', '4');
  setDefault.run('temporada_mes_fin', '11');
  setDefault.run('temporada_año', String(new Date().getFullYear()));
}

export default getDb;
