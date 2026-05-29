import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Helmet } from "react-helmet-async";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, Send, Database, CheckCircle2 } from "lucide-react";
import Editor from "@monaco-editor/react";
import { formatCell } from "@/lib/format";
import { compareResults, loadCsvFromUrl, runQuery } from "@/lib/duckdb";
import { toast } from "sonner";

export default function Playground() {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<any[]>([]);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [sql, setSql] = useState("");
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ rows: any[]; columns: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [solved, setSolved] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const [{ data: ex }, { data: ds }, { data: subs }] = await Promise.all([
        supabase.from("exercises_public").select("*").order("created_at"),
        supabase.from("datasets").select("*"),
        user ? supabase.from("exercise_submissions").select("exercise_id").eq("user_id", user.id).eq("is_correct", true) : Promise.resolve({ data: [] as any[] }),
      ]);
      setExercises(ex ?? []);
      setDatasets(ds ?? []);
      setSolved(new Set((subs ?? []).map((s: any) => s.exercise_id)));
      if (ex && ex.length && !selected) {
        setSelected(ex[0]);
        setSql(ex[0].starter_sql ?? "-- Write your query here\nSELECT 1;");
      }
    })();
  }, [user]);

  const datasetMap = useMemo(() => Object.fromEntries(datasets.map((d) => [d.id, d])), [datasets]);
  const exerciseDatasets = useMemo(() => (selected?.dataset_ids ?? []).map((id: string) => datasetMap[id]).filter(Boolean), [selected, datasetMap]);

  const ensureLoaded = async () => {
    for (const d of exerciseDatasets) {
      const { data } = supabase.storage.from("datasets").getPublicUrl(d.storage_path);
      await loadCsvFromUrl(d.slug, data.publicUrl);
    }
  };

  const onRun = async () => {
    setRunning(true); setError(null); setResult(null);
    try {
      await ensureLoaded();
      const r = await runQuery(sql);
      setResult(r);
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setRunning(false);
    }
  };

  const onSubmit = async () => {
    if (!selected || !user) return;
    setSubmitting(true); setError(null);
    try {
      await ensureLoaded();
      const userResult = await runQuery(sql);
      setResult(userResult);
      const { data, error: rpcErr } = await supabase.rpc("grade_exercise", {
        _exercise_id: selected.id,
        _submitted: userResult.rows as any,
        _sql_text: sql,
      });
      if (rpcErr) throw rpcErr;
      const row = (data as any)?.[0];
      if (!row?.gradable) {
        toast.warning("This exercise isn't auto-gradable yet — your submission was saved.");
      } else if (row.is_correct) {
        toast.success("Correct! Saved to your progress.");
        setSolved(new Set([...solved, selected.id]));
      } else {
        toast.error("Not quite — your result doesn't match the expected output.");
      }
    } catch (e: any) {
      setError(e.message ?? String(e));
      toast.error("Query failed");
    } finally {
      setSubmitting(false);
    }
  };

  const selectExercise = (ex: any) => {
    setSelected(ex);
    setSql(ex.starter_sql ?? "-- Write your query\n");
    setResult(null); setError(null);
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] lg:h-screen flex flex-col">
      <Helmet><title>SQL Playground — The Analytics Vanguard</title></Helmet>
      <div className="border-b bg-background px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold">SQL Playground</h1>
          <p className="text-xs text-muted-foreground">Powered by DuckDB — runs entirely in your browser</p>
        </div>
        {selected && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onRun} disabled={running}>
              {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />} Run
            </Button>
            <Button size="sm" onClick={onSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />} Submit
            </Button>
          </div>
        )}
      </div>

      <div className="flex-1 grid lg:grid-cols-[280px_1fr] min-h-0">
        <aside className="border-r bg-muted/30 overflow-y-auto">
          <div className="p-4 text-xs uppercase tracking-wider text-muted-foreground font-semibold">Exercises</div>
          {exercises.length === 0 && <p className="px-4 text-sm text-muted-foreground">No exercises yet.</p>}
          <ul>
            {exercises.map((ex) => (
              <li key={ex.id}>
                <button onClick={() => selectExercise(ex)} className={`w-full text-left px-4 py-3 border-l-2 text-sm hover:bg-background ${selected?.id === ex.id ? "border-primary bg-background" : "border-transparent"}`}>
                  <div className="flex items-center gap-2">
                    {solved.has(ex.id) && <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />}
                    <span className="truncate">{ex.title}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 capitalize">{ex.difficulty}</div>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="grid grid-rows-[auto_1fr_1fr] min-h-0">
          {selected && (
            <div className="border-b bg-background p-5">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-display text-lg font-semibold">{selected.title}</h2>
                <Badge variant="secondary" className="capitalize">{selected.difficulty}</Badge>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selected.prompt}</p>
              {exerciseDatasets.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {exerciseDatasets.map((d: any) => (
                    <span key={d.id} className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded font-mono"><Database className="h-3 w-3" /> {d.slug}</span>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="border-b min-h-0">
            <Editor
              height="100%"
              defaultLanguage="sql"
              value={sql}
              onChange={(v) => setSql(v ?? "")}
              theme="vs-dark"
              options={{ minimap: { enabled: false }, fontSize: 14, fontFamily: "JetBrains Mono, monospace", scrollBeyondLastLine: false }}
            />
          </div>
          <div className="overflow-auto bg-background">
            {error && <div className="p-4 text-sm text-destructive font-mono whitespace-pre-wrap">{error}</div>}
            {result && (
              <div className="p-4">
                <div className="text-xs text-muted-foreground mb-2">{result.rows.length} rows</div>
                <div className="overflow-auto rounded border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>{result.columns.map((c) => <th key={c} className="text-left px-3 py-2 font-medium">{c}</th>)}</tr>
                    </thead>
                    <tbody>
                      {result.rows.slice(0, 100).map((r, i) => (
                        <tr key={i} className="border-t">
                          {result.columns.map((c) => <td key={c} className="px-3 py-2 font-mono text-xs">{r[c] == null ? <span className="text-muted-foreground">NULL</span> : formatCell(c, r[c])}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {result.rows.length > 100 && <div className="text-xs text-muted-foreground mt-2">Showing first 100 rows.</div>}
              </div>
            )}
            {!result && !error && <div className="p-6 text-sm text-muted-foreground">Run your query to see results here.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
