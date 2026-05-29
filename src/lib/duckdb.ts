import * as duckdb from "@duckdb/duckdb-wasm";

let dbPromise: Promise<duckdb.AsyncDuckDB> | null = null;
const loadedDatasets = new Set<string>();

export function getDuckDB() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const bundles = duckdb.getJsDelivrBundles();
      const bundle = await duckdb.selectBundle(bundles);
      const worker_url = URL.createObjectURL(new Blob([`importScripts("${bundle.mainWorker}");`], { type: "text/javascript" }));
      const worker = new Worker(worker_url);
      const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING);
      const db = new duckdb.AsyncDuckDB(logger, worker);
      await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
      URL.revokeObjectURL(worker_url);
      return db;
    })();
  }
  return dbPromise;
}

export async function loadCsvFromUrl(name: string, url: string) {
  if (loadedDatasets.has(name)) return;
  const db = await getDuckDB();
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch dataset ${name}`);
  const buf = new Uint8Array(await res.arrayBuffer());
  await db.registerFileBuffer(`${name}.csv`, buf);
  const conn = await db.connect();
  try {
    await conn.query(`CREATE OR REPLACE TABLE "${name}" AS SELECT * FROM read_csv_auto('${name}.csv', header=true);`);
  } finally {
    await conn.close();
  }
  loadedDatasets.add(name);
}

export async function runQuery(sql: string) {
  const db = await getDuckDB();
  const conn = await db.connect();
  try {
    const result = await conn.query(sql);
    const rows = result.toArray().map((r: any) => {
      const obj: any = {};
      for (const f of result.schema.fields) {
        const v = r[f.name];
        obj[f.name] = typeof v === "bigint" ? Number(v) : v;
      }
      return obj;
    });
    const columns = result.schema.fields.map((f: any) => f.name);
    return { rows, columns };
  } finally {
    await conn.close();
  }
}

// Compare two result sets (array of row objects)
export function compareResults(actual: any[], expected: any[], orderMatters: boolean): boolean {
  if (actual.length !== expected.length) return false;
  if (actual.length === 0) return true;
  const stringify = (rows: any[]) => rows.map((r) => JSON.stringify(Object.fromEntries(Object.entries(r).map(([k, v]) => [k.toLowerCase(), v == null ? null : String(v)]))));
  const a = stringify(actual);
  const e = stringify(expected);
  if (orderMatters) return a.every((row, i) => row === e[i]);
  return [...a].sort().join("|") === [...e].sort().join("|");
}
