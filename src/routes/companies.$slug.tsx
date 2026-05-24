import { createFileRoute, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getCompanyBySlug } from "@/lib/api/salaries.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatINR, median } from "@/lib/format";

const q = (slug: string) =>
  queryOptions({
    queryKey: ["company", slug],
    queryFn: () => getCompanyBySlug({ data: { slug } }),
  });

export const Route = createFileRoute("/companies/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} salaries — TalentDash` },
      { name: "description", content: `Salary breakdown at ${params.slug} by level and role.` },
    ],
  }),
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(q(params.slug));
    if (!data) throw notFound();
  },
  component: CompanyPage,
  notFoundComponent: () => (
    <main className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Company not found</h1>
    </main>
  ),
});

function CompanyPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(q(slug));
  if (!data) return null;
  const { company, records } = data;

  // Group by level
  const byLevel = new Map<string, typeof records>();
  records.forEach((r) => {
    const arr = byLevel.get(r.level_standardized) ?? [];
    arr.push(r);
    byLevel.set(r.level_standardized, arr);
  });
  const levelRows = Array.from(byLevel.entries()).map(([lvl, rows]) => {
    const totals = rows.map((r) => Number(r.total_compensation));
    const bases = rows.map((r) => Number(r.base_salary));
    return {
      level: lvl,
      n: rows.length,
      minTotal: Math.min(...totals),
      medianTotal: median(totals),
      maxTotal: Math.max(...totals),
      medianBase: median(bases),
    };
  });
  levelRows.sort((a, b) => a.medianTotal - b.medianTotal);

  return (
    <main className="container mx-auto px-4 py-10 space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Company</p>
        <h1 className="text-3xl font-semibold">{company.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">{records.length} approved records</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>By level</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Level</TableHead>
                <TableHead className="text-right">N</TableHead>
                <TableHead className="text-right">Median base</TableHead>
                <TableHead className="text-right">Median total</TableHead>
                <TableHead className="text-right">Min total</TableHead>
                <TableHead className="text-right">Max total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {levelRows.map((r) => (
                <TableRow key={r.level}>
                  <TableCell><Badge variant="outline">{r.level}</Badge></TableCell>
                  <TableCell className="text-right tabular-nums">{r.n}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatINR(r.medianBase)}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{formatINR(r.medianTotal)}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{formatINR(r.minTotal)}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{formatINR(r.maxTotal)}</TableCell>
                </TableRow>
              ))}
              {!levelRows.length && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No records.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>All records</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Exp</TableHead>
                <TableHead className="text-right">Base</TableHead>
                <TableHead className="text-right">Bonus</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.role}</TableCell>
                  <TableCell><Badge variant="outline">{r.level_standardized}</Badge></TableCell>
                  <TableCell>{r.location ?? "—"}</TableCell>
                  <TableCell>{Number(r.experience_years)}y</TableCell>
                  <TableCell className="text-right tabular-nums">{formatINR(Number(r.base_salary))}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatINR(Number(r.bonus))}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatINR(Number(r.stock))}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{formatINR(Number(r.total_compensation))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
