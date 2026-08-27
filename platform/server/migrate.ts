// SQL-first, forward-only migrations (DATA-MODEL.md §5). Plain .sql files, applied in name order,
// each inside a transaction, recorded in schema_migrations.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './db.js';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations');

export async function migrate(): Promise<string[]> {
  await pool.query(
    'CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())',
  );
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  const applied: string[] = [];
  for (const f of files) {
    const done = await pool.query('SELECT 1 FROM schema_migrations WHERE name = $1', [f]);
    if (done.rowCount) continue;
    const sql = fs.readFileSync(path.join(dir, f), 'utf8');
    const c = await pool.connect();
    try {
      await c.query('BEGIN');
      await c.query(sql);
      await c.query('INSERT INTO schema_migrations (name) VALUES ($1)', [f]);
      await c.query('COMMIT');
      applied.push(f);
    } catch (e) {
      await c.query('ROLLBACK');
      throw new Error(`migration ${f} failed: ${(e as Error).message}`);
    } finally {
      c.release();
    }
  }
  return applied;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  migrate()
    .then((a) => {
      console.log(a.length ? `applied: ${a.join(', ')}` : 'up to date');
      return pool.end();
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
