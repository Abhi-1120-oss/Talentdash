import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  ReferenceArea,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import {
  listMyEntries,
  upsertMyEntry,
  deleteMyEntry,
  getMyBenchmarks,
} from "@/lib/api/me.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatINR } from "@/lib/format";
import { Plus, Trash2, Pencil, TrendingUp, TrendingDown, Minus } from "lucide-react";

export const Route = createFileRoute("/me")({
  head: () => ({
    meta: [
      { title: "My career — TalentDash" },
      {
        name: "description",
        content:
          "Track your salary history and see how your compensation compares against the market.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MePage,
});

type Entry = {
  id: string;
  company_name: string;
  role: string;
  level: string | null;
  location: string | null;
  experience_years: number;
  base_salary: number;
  bonus: number;
  stock: number;
  total_compensation: number;
  start_date: string;
  end_date: string | null;
  notes: string | null;
};

function MePage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const [authState, setAuthState] = useState<"checking" | "out" | "in">("checking");

  useEffect(() => {
    let mounted = true;
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!mounted) return;
      setAuthState(session?.user ? "in" : "out");
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setAuthState(data.session?.user ? "in" : "out");
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (authState === "out") nav({ to: "/login" });
  }, [authState, nav]);

  const listFn = useServerFn(listMyEntries);
  const benchFn = useServerFn(getMyBenchmarks);
  const upsertFn = useServerFn(upsertMyEntry);
  const deleteFn = useServerFn(deleteMyEntry);

  const entriesQuery = useQuery({
    queryKey: ["me-entries"],
    queryFn: () => listFn() as Promise<Entry[]>,
    enabled: authState === "in",
  });

  const benchQuery = useQuery({
    queryKey: ["me-benchmarks"],
    queryFn: () => benchFn(),
    enabled: authState === "in",
  });

  const upsertMut = useMutation({
    mutationFn: (vars: Parameters<typeof upsertFn>[0]) => upsertFn(vars),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me-entries"] });
      qc.invalidateQueries({ queryKey: ["me-benchmarks"] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me-entries"] });
      qc.invalidateQueries({ queryKey: ["me-benchmarks"] });
    },
  });

  const [editing, setEditing] = useState<Entry | null>(null);
  const [showForm, setShowForm] = useState(false);

  if (authState !== "in") {
    return <main className="container mx-auto px-4 py-10">Loading…</main>;
  }

  const entries = entriesQuery.data ?? [];
  const benchmarks = benchQuery.data ?? [];

  const chartData = entries.map((e) => {
    const b = benchmarks.find((x) => x.id === e.id);
    return {
      date: e.start_date,
      label: `${e.company_name} · ${e.role}`,
      you: e.total_compensation,
      median: b?.median ?? null,
      p25: b?.p25 ?? null,
      p75: b?.p75 ?? null,
    };
  });

  const latest = entries[entries.length - 1];
  const first = entries[0];
  const growthAbs = latest && first ? latest.total_compensation - first.total_compensation : 0;
  const growthPct =
    latest && first && first.total_compensation > 0
      ? (growthAbs / first.total_compensation) * 100
      : 0;
  const yearsSpan =
    latest && first
      ? Math.max(
          0.1,
          (new Date(latest.start_date).getTime() - new Date(first.start_date).getTime()) /
            (1000 * 60 * 60 * 24 * 365),
        )
      : 0;
  const cagr =
    latest && first && first.total_compensation > 0 && yearsSpan > 0
      ? (Math.pow(latest.total_compensation / first.total_compensation, 1 / yearsSpan) - 1) * 100
      : 0;

  const latestBench = latest ? benchmarks.find((b) => b.id === latest.id) : undefined;
  const vsMarket =
    latest && latestBench?.median
      ? ((latest.total_compensation - latestBench.median) / latestBench.median) * 100
      : null;

  return (
    <main className="container mx-auto px-4 py-10 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">My career</h1>
          <p className="text-sm text-muted-foreground">
            Your private salary history, compared against the live market.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1" /> Add entry
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Current total comp"
          value={latest ? formatINR(latest.total_compensation) : "—"}
          sub={latest ? `${latest.role} @ ${latest.company_name}` : "Add your first entry"}
        />
        <Stat
          label="Lifetime growth"
          value={growthAbs ? `${growthPct >= 0 ? "+" : ""}${growthPct.toFixed(0)}%` : "—"}
          sub={
            cagr
              ? `${cagr.toFixed(1)}% CAGR over ${yearsSpan.toFixed(1)}y`
              : "Need 2+ entries"
          }
          tone={growthPct >= 0 ? "success" : "destructive"}
          icon={growthPct >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        />
        <Stat
          label="vs market median"
          value={
            vsMarket == null
              ? "—"
              : `${vsMarket >= 0 ? "+" : ""}${vsMarket.toFixed(0)}%`
          }
          sub={
            latestBench
              ? latestBench.sample_size > 0
                ? `${latestBench.sample_size} comparable records`
                : "No market data for this role yet"
              : "—"
          }
          tone={vsMarket == null ? undefined : vsMarket >= 0 ? "success" : "warning"}
          icon={
            vsMarket == null ? <Minus className="h-4 w-4" /> : vsMarket >= 0 ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )
          }
        />
      </div>

      {showForm && (
        <EntryForm
          initial={editing}
          submitting={upsertMut.isPending}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSubmit={async (entry) => {
            try {
              await upsertMut.mutateAsync({ data: { id: editing?.id, entry } });
              toast.success(editing ? "Entry updated" : "Entry added");
              setShowForm(false);
              setEditing(null);
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Save failed");
            }
          }}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Compensation over time</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              Add an entry to see your growth chart.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v) => formatINR(Number(v))}
                  width={70}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    fontSize: 12,
                  }}
                  formatter={(value) =>
                    value == null ? "—" : formatINR(Number(value))
                  }
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="you"
                  name="You"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="median"
                  name="Market median"
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="p75"
                  name="Top 25%"
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="2 4"
                  strokeWidth={1}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="p25"
                  name="Bottom 25%"
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="2 4"
                  strokeWidth={1}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No entries yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Start</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead className="text-right">Base</TableHead>
                    <TableHead className="text-right">Bonus</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">vs market</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((e) => {
                    const b = benchmarks.find((x) => x.id === e.id);
                    const diffPct =
                      b?.median && b.median > 0
                        ? ((e.total_compensation - b.median) / b.median) * 100
                        : null;
                    return (
                      <TableRow key={e.id}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {e.start_date}
                          {e.end_date ? ` → ${e.end_date}` : " → now"}
                        </TableCell>
                        <TableCell className="font-medium">{e.company_name}</TableCell>
                        <TableCell>{e.role}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {e.level ?? "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatINR(e.base_salary)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatINR(e.bonus)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatINR(e.stock)}
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">
                          {formatINR(e.total_compensation)}
                        </TableCell>
                        <TableCell className="text-right">
                          {diffPct == null ? (
                            <span className="text-xs text-muted-foreground">—</span>
                          ) : (
                            <Badge
                              variant={diffPct >= 0 ? "default" : "secondary"}
                              className={
                                diffPct >= 0
                                  ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20"
                                  : "bg-amber-500/15 text-amber-600 hover:bg-amber-500/20"
                              }
                            >
                              {diffPct >= 0 ? "+" : ""}
                              {diffPct.toFixed(0)}%
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditing(e);
                                setShowForm(true);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm("Delete this entry?")) {
                                  deleteMut.mutate(e.id);
                                }
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <span className="hidden">
        <ReferenceArea />
      </span>
    </main>
  );
}

function Stat({
  label,
  value,
  sub,
  tone,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "success" | "warning" | "destructive";
  icon?: React.ReactNode;
}) {
  const toneClass =
    tone === "success"
      ? "text-emerald-600"
      : tone === "warning"
        ? "text-amber-600"
        : tone === "destructive"
          ? "text-destructive"
          : "text-foreground";
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className={`mt-2 flex items-center gap-2 text-2xl font-semibold ${toneClass}`}>
          {icon}
          {value}
        </div>
        {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function EntryForm({
  initial,
  submitting,
  onSubmit,
  onCancel,
}: {
  initial: Entry | null;
  submitting: boolean;
  onSubmit: (entry: {
    company_name: string;
    role: string;
    level?: string | null;
    location?: string | null;
    experience_years: number;
    base_salary: string | number;
    bonus?: string | number | null;
    stock?: string | number | null;
    start_date: string;
    end_date?: string | null;
    notes?: string | null;
  }) => void;
  onCancel: () => void;
}) {
  const [f, setF] = useState({
    company_name: initial?.company_name ?? "",
    role: initial?.role ?? "",
    level: initial?.level ?? "",
    location: initial?.location ?? "",
    experience_years: initial ? String(initial.experience_years) : "",
    base_salary: initial ? String(initial.base_salary) : "",
    bonus: initial ? String(initial.bonus) : "",
    stock: initial ? String(initial.stock) : "",
    start_date: initial?.start_date ?? "",
    end_date: initial?.end_date ?? "",
    notes: initial?.notes ?? "",
  });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initial ? "Edit entry" : "Add an entry"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!f.company_name || !f.role || !f.start_date || !f.base_salary) {
              toast.error("Company, role, start date and base salary are required");
              return;
            }
            onSubmit({
              company_name: f.company_name,
              role: f.role,
              level: f.level || null,
              location: f.location || null,
              experience_years: Number(f.experience_years || 0),
              base_salary: f.base_salary,
              bonus: f.bonus || 0,
              stock: f.stock || 0,
              start_date: f.start_date,
              end_date: f.end_date || null,
              notes: f.notes || null,
            });
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <Field label="Company *" v={f.company_name} on={(v) => set("company_name", v)} placeholder="Google" />
          <Field label="Role *" v={f.role} on={(v) => set("role", v)} placeholder="Software Engineer" />
          <Field label="Level" v={f.level} on={(v) => set("level", v)} placeholder="SDE-II / L5" />
          <Field label="Location" v={f.location} on={(v) => set("location", v)} placeholder="Bangalore" />
          <Field
            label="Experience (years)"
            v={f.experience_years}
            on={(v) => set("experience_years", v)}
            placeholder="3.5"
            type="number"
          />
          <Field label="Start date *" v={f.start_date} on={(v) => set("start_date", v)} type="date" />
          <Field label="End date" v={f.end_date} on={(v) => set("end_date", v)} type="date" />
          <Field label="Base salary *" v={f.base_salary} on={(v) => set("base_salary", v)} placeholder="25 LPA or 2500000" />
          <Field label="Bonus (annual)" v={f.bonus} on={(v) => set("bonus", v)} placeholder="3 LPA" />
          <Field label="Stock (annual)" v={f.stock} on={(v) => set("stock", v)} placeholder="10 LPA" />
          <div className="sm:col-span-2 grid gap-1.5">
            <Label>Notes</Label>
            <Textarea
              value={f.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
              placeholder="Promotion cycle, joining bonus, anything to remember"
            />
          </div>
          <div className="sm:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : initial ? "Save changes" : "Add entry"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  v,
  on,
  placeholder,
  type = "text",
}: {
  label: string;
  v: string;
  on: (s: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <Input value={v} onChange={(e) => on(e.target.value)} placeholder={placeholder} type={type} />
    </div>
  );
}
