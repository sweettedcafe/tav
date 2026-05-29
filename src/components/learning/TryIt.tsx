import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, RotateCcw, Database, Sparkles, Download } from "lucide-react";
import { loadCsvFromUrl, runQuery } from "@/lib/duckdb";
import { supabase } from "@/integrations/supabase/client";
import { formatCell } from "@/lib/format";

interface TryItProps {
  initialSql: string;
  datasetSlugs?: string[];
}

export function TryIt({ initialSql, datasetSlugs = [] }: TryItProps) {
  const [sql, setSql] = useState(initialSql);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ rows: any[]; columns: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [datasetMeta, setDatasetMeta] = useState<any[]>([]);

  useEffect(() => { setSql(initialSql); }, [initialSql]);

  useEffect(() => {
    if (!datasetSlugs.length) return;
    (async () => {
      const { data } = await supabase.from("datasets").select("*").in("slug", datasetSlugs);
      setDatasetMeta(data ?? []);
    })();
  }, [datasetSlugs.join(",")]);

  const ensureLoaded = async () => {
    for (const d of datasetMeta) {
      const { data } = supabase.storage.from("datasets").getPublicUrl(d.storage_path);
      await loadCsvFromUrl(d.slug, data.publicUrl);
    }
  };

  const onRun = async () => {
    setRunning(true); setError(null); setResult(null);
    try {
      await ensureLoaded();
      setResult(await runQuery(sql));
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="my-8 rounded-xl border bg-card overflow-hidden shadow-card-elegant">
      <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <span className="font-semibold text-sm">Try it yourself</span>
          {datasetSlugs.map((s) => {
            const meta = datasetMeta.find((m) => m.slug === s);
            const url = meta ? supabase.storage.from("datasets").getPublicUrl(meta.storage_path).data.publicUrl : null;
            return url ? (
              <a key={s} href={url} download target="_blank" rel="noreferrer" title={`Download ${s}.csv`}>
                <Badge variant="secondary" className="font-mono text-[10px] gap-1 hover:bg-accent hover:text-accent-foreground cursor-pointer">
                  <Database className="h-3 w-3" /> {s} <Download className="h-3 w-3" />
                </Badge>
              </a>
            ) : (
              <Badge key={s} variant="secondary" className="font-mono text-[10px] gap-1">
                <Database className="h-3 w-3" /> {s}
              </Badge>
            );
          })}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => { setSql(initialSql); setResult(null); setError(null); }}>
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
          </Button>
          <Button size="sm" onClick={onRun} disabled={running}>
            {running ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Play className="h-3.5 w-3.5 mr-1" />} Run
          </Button>
        </div>
      </div>
      <div className="h-56 border-b">
        <Editor
          height="100%"
          defaultLanguage="sql"
          value={sql}
          onChange={(v) => setSql(v ?? "")}
          theme="vs-dark"
          options={{ minimap: { enabled: false }, fontSize: 13, fontFamily: "JetBrains Mono, monospace", scrollBeyondLastLine: false, padding: { top: 12 } }}
        />
      </div>
      <div className="max-h-72 overflow-auto bg-background">
        {error && <pre className="p-4 text-xs text-destructive whitespace-pre-wrap font-mono">{error}</pre>}
        {result && (
          <div className="p-3">
            <div className="text-xs text-muted-foreground mb-2">{result.rows.length} rows</div>
            <div className="overflow-auto rounded border">
              <table className="w-full text-xs">
                <thead className="bg-muted">
                  <tr>{result.columns.map((c) => <th key={c} className="text-left px-3 py-2 font-medium">{c}</th>)}</tr>
                </thead>
                <tbody>
                  {result.rows.slice(0, 50).map((r, i) => (
                    <tr key={i} className="border-t">
                      {result.columns.map((c) => <td key={c} className="px-3 py-1.5 font-mono">{r[c] == null ? <span className="text-muted-foreground">NULL</span> : formatCell(c, r[c])}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {result.rows.length > 50 && <div className="text-[11px] text-muted-foreground mt-2">Showing first 50 rows.</div>}
          </div>
        )}
        {!result && !error && <div className="p-4 text-xs text-muted-foreground">Edit the query and press Run. Output appears here.</div>}
      </div>
    </div>
  );
}
