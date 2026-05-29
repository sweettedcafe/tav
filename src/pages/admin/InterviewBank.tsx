import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const empty = { category: "sql", difficulty: "beginner", title: "", prompt: "", sample_answer: "", hints: "", tags: "", is_published: true };

export default function AdminInterviewBank() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("interview_questions").select("*").order("created_at", { ascending: false });
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    const payload = {
      category: editing.category, difficulty: editing.difficulty, title: editing.title, prompt: editing.prompt,
      sample_answer: editing.sample_answer || null, hints: editing.hints || null,
      tags: typeof editing.tags === "string" ? editing.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : (editing.tags ?? []),
      is_published: editing.is_published, source: "admin", created_by: user?.id,
    };
    const { error } = editing.id
      ? await supabase.from("interview_questions").update(payload).eq("id", editing.id)
      : await supabase.from("interview_questions").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Saved"); setOpen(false); setEditing(null); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this question?")) return;
    const { error } = await supabase.from("interview_questions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const startEdit = (q: any) => { setEditing({ ...q, tags: (q.tags ?? []).join(", ") }); setOpen(true); };
  const startNew = () => { setEditing({ ...empty }); setOpen(true); };

  return (
    <div className="container-page py-10">
      <Helmet><title>Interview bank — Admin</title></Helmet>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold">Interview question bank</h1>
          <p className="text-muted-foreground">Add your own questions alongside the curated set.</p>
        </div>
        <Button onClick={startNew}><Plus className="h-4 w-4 mr-2" /> New question</Button>
      </div>

      <div className="space-y-2">
        {items.map((q) => (
          <Card key={q.id}>
            <CardContent className="p-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="capitalize">{q.category}</Badge>
                  <Badge variant="outline" className="capitalize">{q.difficulty}</Badge>
                  <Badge variant="outline" className="capitalize text-xs">{q.source}</Badge>
                  {!q.is_published && <Badge variant="destructive">Draft</Badge>}
                </div>
                <div className="font-medium truncate">{q.title}</div>
                <p className="text-sm text-muted-foreground line-clamp-2">{q.prompt}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => startEdit(q)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => remove(q.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit question" : "New question"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Select value={editing.category} onValueChange={(v) => setEditing({ ...editing, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["sql","python","statistics","case","behavioral"].map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={editing.difficulty} onValueChange={(v) => setEditing({ ...editing, difficulty: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["beginner","intermediate","advanced"].map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Input placeholder="Title" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              <Textarea placeholder="Prompt / question" rows={4} value={editing.prompt} onChange={(e) => setEditing({ ...editing, prompt: e.target.value })} />
              <Textarea placeholder="Sample answer (optional)" rows={4} value={editing.sample_answer ?? ""} onChange={(e) => setEditing({ ...editing, sample_answer: e.target.value })} className="font-mono text-sm" />
              <Textarea placeholder="Hint (optional)" rows={2} value={editing.hints ?? ""} onChange={(e) => setEditing({ ...editing, hints: e.target.value })} />
              <Input placeholder="Tags (comma separated)" value={editing.tags ?? ""} onChange={(e) => setEditing({ ...editing, tags: e.target.value })} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editing.is_published} onChange={(e) => setEditing({ ...editing, is_published: e.target.checked })} /> Published
              </label>
              <Button onClick={save} className="w-full">Save</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
