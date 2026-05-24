import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getReviewQueue, reviewRecord } from "@/lib/api/admin.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/review")({
  head: () => ({ meta: [{ title: "Review queue — TalentDash admin" }] }),
  component: ReviewPage,
});

function ReviewPage() {
  const qc = useQueryClient();
  const fn = useServerFn(getReviewQueue);
  const review = useServerFn(reviewRecord);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-review"],
    queryFn: () => fn(),
    retry: false,
  });
  const m = useMutation({
    mutationFn: (vars: { id: string; decision: "approve" | "reject" }) => review({ data: vars }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-review"] });
      toast.success("Updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  if (isLoading) return <main className="container mx-auto px-4 py-10">Loading…</main>;
  if (error) return <main className="container mx-auto px-4 py-10 text-destructive">{(error as Error).message}</main>;
  if (!data) return null;

  return (
    <main className="container mx-auto px-4 py-10 space-y-6">
      <h1 className="text-3xl font-semibold">Review queue</h1>
      <Card>
        <CardHeader><CardTitle>{data.length} records awaiting decision</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Conf</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.companies?.name ?? "—"}</TableCell>
                  <TableCell>{r.role}</TableCell>
                  <TableCell><Badge variant="outline">{r.level_standardized}</Badge></TableCell>
                  <TableCell className="tabular-nums">{Number(r.confidence_score).toFixed(2)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatINR(Number(r.total_compensation))}</TableCell>
                  <TableCell><Badge>{r.status}</Badge></TableCell>
                  <TableCell className="text-right flex gap-2 justify-end">
                    <Button size="sm" variant="outline" disabled={m.isPending} onClick={() => m.mutate({ id: r.id, decision: "approve" })}>
                      Approve
                    </Button>
                    <Button size="sm" variant="destructive" disabled={m.isPending} onClick={() => m.mutate({ id: r.id, decision: "reject" })}>
                      Reject
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!data.length && (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Queue empty.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
