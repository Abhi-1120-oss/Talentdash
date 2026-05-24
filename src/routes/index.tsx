import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listCompanies, searchSalaries } from "@/lib/api/salaries.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatINR } from "@/lib/format";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Building2, Search, Sparkles } from "lucide-react";

const companiesQuery = queryOptions({
  queryKey: ["companies"],
  queryFn: () => listCompanies(),
});

const salariesQuery = (q: string) =>
  queryOptions({
    queryKey: ["salaries", q],
    queryFn: () => searchSalaries({ data: { q } }),
  });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TalentDash — Compare India tech salaries" },
      {
        name: "description",
        content:
          "Compare software engineering and data science salaries across India by company, level, and experience.",
      },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(companiesQuery);
    context.queryClient.ensureQueryData(salariesQuery(""));
  },
  component: Home,
});

function Home() {
  const [q, setQ] = useState("");
  const { data: companies } = useSuspenseQuery(companiesQuery);
  const { data: salaries } = useSuspenseQuery(salariesQuery(q));

  // Distribution by total comp bucket (L)
  const buckets = [
    { label: "<10 L", min: 0, max: 1_000_000, count: 0 },
    { label: "10–25 L", min: 1_000_000, max: 2_500_000, count: 0 },
    { label: "25–50 L", min: 2_500_000, max: 5_000_000, count: 0 },
    { label: "50 L–1 Cr", min: 5_000_000, max: 10_000_000, count: 0 },
    { label: "1 Cr+", min: 10_000_000, max: Infinity, count: 0 },
  ];
  salaries.forEach((s) => {
    const v = Number(s.total_compensation);
    const b = buckets.find((x) => v >= x.min && v < x.max);
    if (b) b.count++;
  });

  return (
    <main className="container mx-auto px-4 py-10">
      <section className="mb-10">
        <div className="flex items-center gap-2 text-sm text-primary mb-3">
          <Sparkles className="h-4 w-4" />
          <span>Structured · Comparable · Decision-ready</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-foreground">
          India compensation, made comparable.
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Salary data across Indian tech companies, normalized to standard levels with
          confidence scoring so you can actually compare offers.
        </p>
        <div className="mt-6 max-w-xl relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search role or level (e.g. SDE-II, Data Scientist, L5)"
            className="pl-9 h-11"
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3 mb-10">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Total compensation distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={buckets}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="label" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    color: "var(--color-foreground)",
                  }}
                />
                <Bar dataKey="count" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Companies
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 max-h-72 overflow-auto">
            {companies.map((c) => (
              <Link
                key={c.id}
                to="/companies/$slug"
                params={{ slug: c.slug }}
                className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-accent text-sm"
              >
                <span className="font-medium">{c.name}</span>
                <Badge variant="secondary">{c.count}</Badge>
              </Link>
            ))}
            {!companies.length && (
              <p className="text-sm text-muted-foreground p-2">No companies yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent submissions {q && <span className="text-muted-foreground font-normal">· filtered by "{q}"</span>}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Exp</TableHead>
                <TableHead className="text-right">Base</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Confidence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salaries.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    {s.companies ? (
                      <Link to="/companies/$slug" params={{ slug: s.companies.slug }} className="font-medium hover:underline">
                        {s.companies.name}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <Link to="/roles/$role" params={{ role: s.role }} className="hover:underline">
                      {s.role}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{s.level_standardized}</Badge>
                  </TableCell>
                  <TableCell>{Number(s.experience_years)}y</TableCell>
                  <TableCell className="text-right tabular-nums">{formatINR(Number(s.base_salary))}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{formatINR(Number(s.total_compensation))}</TableCell>
                  <TableCell>
                    <ConfidencePill value={Number(s.confidence_score)} />
                  </TableCell>
                </TableRow>
              ))}
              {!salaries.length && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No matching records.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}

function ConfidencePill({ value }: { value: number }) {
  const tone =
    value >= 0.85 ? "bg-success/15 text-success" : value >= 0.6 ? "bg-warning/15 text-warning" : "bg-destructive/15 text-destructive";
  return <span className={`text-xs px-2 py-0.5 rounded-full ${tone}`}>{value.toFixed(2)}</span>;
}
