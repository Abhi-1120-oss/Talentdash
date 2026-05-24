import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getRole } from "@/lib/api/salaries.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/format";

const q = (role: string) =>
  queryOptions({ queryKey: ["role", role], queryFn: () => getRole({ data: { role } }) });

export const Route = createFileRoute("/roles/$role")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.role} salaries in India — TalentDash` },
      { name: "description", content: `Compare ${params.role} compensation across Indian tech companies.` },
    ],
  }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(q(params.role)),
  component: RolePage,
});

function RolePage() {
  const { role } = Route.useParams();
  const { data: records } = useSuspenseQuery(q(role));

  return (
    <main className="container mx-auto px-4 py-10 space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Role</p>
        <h1 className="text-3xl font-semibold">{role}</h1>
        <p className="text-sm text-muted-foreground mt-1">{records.length} records across companies</p>
      </div>
      <Card>
        <CardHeader><CardTitle>All records</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Exp</TableHead>
                <TableHead className="text-right">Base</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    {r.companies ? (
                      <Link to="/companies/$slug" params={{ slug: r.companies.slug }} className="font-medium hover:underline">
                        {r.companies.name}
                      </Link>
                    ) : "—"}
                  </TableCell>
                  <TableCell><Badge variant="outline">{r.level_standardized}</Badge></TableCell>
                  <TableCell>{r.location ?? "—"}</TableCell>
                  <TableCell>{Number(r.experience_years)}y</TableCell>
                  <TableCell className="text-right tabular-nums">{formatINR(Number(r.base_salary))}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{formatINR(Number(r.total_compensation))}</TableCell>
                </TableRow>
              ))}
              {!records.length && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No records.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
