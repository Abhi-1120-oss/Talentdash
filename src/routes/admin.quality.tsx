import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getQualityMetrics } from "@/lib/api/admin.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/quality")({
  head: () => ({ meta: [{ title: "Quality metrics — TalentDash admin" }] }),
  component: QualityPage,
});

function QualityPage() {
  const fn = useServerFn(getQualityMetrics);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-quality"],
    queryFn: () => fn(),
    retry: false,
  });

  if (isLoading) return <main className="container mx-auto px-4 py-10">Loading…</main>;
  if (error) return <main className="container mx-auto px-4 py-10 text-destructive">{(error as Error).message}</main>;
  if (!data) return null;

  return (
    <main className="container mx-auto px-4 py-10 space-y-6">
      <h1 className="text-3xl font-semibold">Ingestion quality</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Approved" value={data.totals.approved} tone="success" />
        <Stat label="Pending review" value={data.totals.pending} tone="warning" />
        <Stat label="Rejected" value={data.totals.rejected} tone="destructive" />
      </div>

      <Card>
        <CardHeader><CardTitle>Confidence distribution</CardTitle></CardHeader>
        <CardContent className="flex gap-4">
          <Stat label="< 0.6 (review)" value={data.confidenceBuckets.low} tone="destructive" small />
          <Stat label="0.6 – 0.85" value={data.confidenceBuckets.mid} tone="warning" small />
          <Stat label="≥ 0.85" value={data.confidenceBuckets.high} tone="success" small />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent ingestion runs</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Started</TableHead>
                <TableHead className="text-right">Scraped</TableHead>
                <TableHead className="text-right">Accepted</TableHead>
                <TableHead className="text-right">Rejected</TableHead>
                <TableHead className="text-right">Dupes</TableHead>
                <TableHead className="text-right">Low conf</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.runs.map((r) => (
                <TableRow key={r.id}>
                  <TableCell><Badge variant="outline">{r.source}</Badge></TableCell>
                  <TableCell>{new Date(r.started_at).toLocaleString()}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.scraped}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.accepted}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.rejected}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.duplicates}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.low_confidence}</TableCell>
                </TableRow>
              ))}
              {!data.runs.length && (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No runs yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}

function Stat({ label, value, tone, small }: { label: string; value: number; tone: "success" | "warning" | "destructive"; small?: boolean }) {
  const color = tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-destructive";
  return (
    <div className="rounded-lg border border-border bg-card p-4 flex-1">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`${small ? "text-2xl" : "text-3xl"} font-semibold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}
