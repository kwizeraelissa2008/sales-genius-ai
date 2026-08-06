import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import {
  Plus,
  Search,
  Upload,
  Trash2,
  Pencil,
  Sparkles,
  MoreHorizontal,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { LeadDialog } from "@/components/lead-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  listLeads,
  deleteLead,
  createLead,
  heuristicScore,
  LEAD_STATUSES,
  STATUS_STYLES,
  type Lead,
  type LeadStatus,
} from "@/lib/leads";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/leads")({
  head: () => ({ meta: [{ title: "Leads — SalesGenius AI" }] }),
  component: LeadsPage,
});

function LeadsPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [toDelete, setToDelete] = useState<Lead | null>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: leads, isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: listLeads,
  });

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return (leads ?? []).filter((l) => {
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (!q) return true;
      return [l.name, l.email, l.company, l.job_title]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q));
    });
  }, [leads, query, statusFilter]);

  function openAdd() {
    setEditing(null);
    setDialogOpen(true);
  }
  function openEdit(lead: Lead) {
    setEditing(lead);
    setDialogOpen(true);
  }

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await deleteLead(toDelete.id);
      toast.success("Lead deleted");
      qc.invalidateQueries({ queryKey: ["leads"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setToDelete(null);
    }
  }

  async function onImportFile(file: File) {
    if (!/\.csv$/i.test(file.name)) {
      toast.error("Please upload a .csv file (Excel .xlsx is not supported — export as CSV first).");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setImporting(true);
    const pick = (row: Record<string, string>, keys: string[]) => {
      const norm = (s: string) => s.toLowerCase().replace(/[\s_-]+/g, "");
      const map = new Map(Object.entries(row).map(([k, v]) => [norm(k), v]));
      for (const k of keys) {
        const v = map.get(norm(k));
        if (v && String(v).trim()) return String(v).trim();
      }
      return "";
    };
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data;
          if (!rows.length) {
            toast.error("CSV appears empty or missing a header row.");
            return;
          }
          let ok = 0;
          let skipped = 0;
          const errors: string[] = [];
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const first = pick(row, ["first_name", "firstname", "given name"]);
            const last = pick(row, ["last_name", "lastname", "surname", "family name"]);
            const full = pick(row, ["name", "full name", "fullname", "contact", "contact name"]);
            const name = (full || `${first} ${last}`.trim()).trim();
            if (!name) { skipped++; continue; }
            const email = pick(row, ["email", "email address", "e-mail", "mail"]) || null;
            const company = pick(row, ["company", "company name", "organization", "organisation", "account"]) || null;
            const job_title = pick(row, ["job_title", "title", "position", "role"]) || null;
            const notes = pick(row, ["notes", "note", "comments", "description"]) || null;
            try {
              await createLead({
                name, email, company, job_title, notes,
                status: "new",
                lead_score: heuristicScore({ job_title, company, email }),
              });
              ok += 1;
            } catch (err) {
              const msg = err instanceof Error ? err.message : String(err);
              if (errors.length < 3) errors.push(`Row ${i + 2}: ${msg}`);
            }
          }
          qc.invalidateQueries({ queryKey: ["leads"] });
          if (ok > 0) {
            toast.success(`Imported ${ok} lead${ok === 1 ? "" : "s"}${skipped ? ` (${skipped} skipped: missing name)` : ""}`);
          }
          if (errors.length) {
            toast.error(errors.join(" · "));
          } else if (ok === 0) {
            toast.error("No rows imported. Ensure your CSV has a 'name' (or first_name/last_name) column.");
          }
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Import failed");
        } finally {
          setImporting(false);
          if (fileRef.current) fileRef.current.value = "";
        }
      },
      error: (err) => {
        toast.error(`Parse error: ${err.message}`);
        setImporting(false);
        if (fileRef.current) fileRef.current.value = "";
      },
    });
  }

  return (
    <AppShell title="Leads" userEmail={user.email}>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm text-muted-foreground">
            {leads?.length ?? 0} total · {filtered.length} shown
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImportFile(f);
            }}
          />
          <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={importing}>
            {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Import CSV
          </Button>
          <Button variant="outline" onClick={() => setEnrichOpen(true)}>
            <Link2 className="mr-2 h-4 w-4" /> Enrich from link
          </Button>
          <Button onClick={openAdd} className="shadow-[var(--shadow-elegant)]">
            <Plus className="mr-2 h-4 w-4" /> Add lead
          </Button>

        </div>
      </div>

      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, company..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as LeadStatus | "all")}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {LEAD_STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-[var(--shadow-card)]">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-[24%]">Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="w-[110px]">Score</TableHead>
              <TableHead className="w-[130px]">Status</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <div className="mx-auto max-w-sm text-sm text-muted-foreground">
                    {leads && leads.length === 0
                      ? "No leads yet. Add your first lead or import a CSV."
                      : "No leads match your filters."}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((lead) => (
                <TableRow key={lead.id} className="group">
                  <TableCell>
                    <div className="font-medium">{lead.name}</div>
                    {lead.email && <div className="text-xs text-muted-foreground">{lead.email}</div>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{lead.company ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{lead.job_title ?? "—"}</TableCell>
                  <TableCell>
                    <ScoreCell score={lead.lead_score} />
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={cn("capitalize font-medium", STATUS_STYLES[lead.status])}>
                      {lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(lead)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            navigate({ to: "/ai", search: { leadId: lead.id } })
                          }
                        >
                          <Sparkles className="mr-2 h-4 w-4" /> Generate email
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setToDelete(lead)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <LeadDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        lead={editing}
        onSaved={() => qc.invalidateQueries({ queryKey: ["leads"] })}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this lead?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {toDelete?.name} and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

function ScoreCell({ score }: { score: number }) {
  const color =
    score >= 80 ? "text-success" : score >= 55 ? "text-warning" : "text-muted-foreground";
  const bar =
    score >= 80 ? "bg-success" : score >= 55 ? "bg-warning" : "bg-muted-foreground/40";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full", bar)} style={{ width: `${score}%` }} />
      </div>
      <span className={cn("text-sm font-semibold tabular-nums", color)}>{score}</span>
    </div>
  );
}
