import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, Trash2, Database, Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function AdminDatasets() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ slug: "", name: "", description: "" });
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("datasets").select("*").order("created_at", { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const onUpload = async () => {
    if (!file) { toast.error("Choose a CSV file"); return; }
    const slug = (form.slug || file.name.replace(/\.csv$/i, "")).toLowerCase().replace(/[^a-z0-9_]+/g, "_");
    const name = form.name || slug;
    setUploading(true);
    try {
      const path = `${slug}.csv`;
      const { error: upErr } = await supabase.storage.from("datasets").upload(path, file, { upsert: true, contentType: "text/csv" });
      if (upErr) throw upErr;

      const existing = items.find((i) => i.slug === slug);
      if (existing) {
        const { error } = await supabase.from("datasets").update({ name, description: form.description, storage_path: path }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("datasets").insert({ slug, name, description: form.description, storage_path: path });
        if (error) throw error;
      }
      toast.success("Dataset uploaded");
      setForm({ slug: "", name: "", description: "" });
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onDelete = async (d: any) => {
    if (!confirm(`Delete dataset "${d.slug}"? This removes the file and metadata.`)) return;
    await supabase.storage.from("datasets").remove([d.storage_path]);
    const { error } = await supabase.from("datasets").delete().eq("id", d.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    load();
  };

  const publicUrl = (path: string) => supabase.storage.from("datasets").getPublicUrl(path).data.publicUrl;

  return (
    <div className="container-page py-10 max-w-5xl">
      <Helmet><title>Datasets — Admin</title></Helmet>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold">Datasets</h1>
          <p className="text-muted-foreground">Upload CSVs that power lessons, exercises, and projects.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-2" /> Refresh</Button>
      </div>

      <Card className="mb-8">
        <CardContent className="p-6 space-y-4">
          <h2 className="font-display text-xl font-semibold">Upload CSV</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Slug (table name in DuckDB)</Label>
              <Input placeholder="orders" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              <p className="text-xs text-muted-foreground mt-1">Auto-derived from filename if blank. Lowercase, underscores only.</p>
            </div>
            <div>
              <Label>Display name</Label>
              <Input placeholder="Orders 2024" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea rows={2} placeholder="What's in this dataset?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <Label>CSV file</Label>
            <Input ref={fileRef} type="file" accept=".csv,text/csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            {file && <p className="text-xs text-muted-foreground mt-1">{file.name} • {(file.size / 1024).toFixed(1)} KB</p>}
          </div>
          <Button onClick={onUpload} disabled={uploading || !file}>
            {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            Upload dataset
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-10 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline" /></div>
          ) : items.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">No datasets yet — upload your first CSV above.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Slug</th>
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-left px-4 py-3 font-medium">Description</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((d) => (
                  <tr key={d.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3"><Badge variant="secondary" className="font-mono gap-1"><Database className="h-3 w-3" /> {d.slug}</Badge></td>
                    <td className="px-4 py-3">{d.name}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-md truncate">{d.description}</td>
                    <td className="px-4 py-3 text-right">
                      <a href={publicUrl(d.storage_path)} target="_blank" rel="noreferrer">
                        <Button variant="ghost" size="sm"><Download className="h-4 w-4" /></Button>
                      </a>
                      <Button variant="ghost" size="sm" onClick={() => onDelete(d)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
