import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { submitSalary } from "@/lib/api/admin.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/submit")({
  head: () => ({
    meta: [
      { title: "Submit your salary — TalentDash" },
      {
        name: "description",
        content: "Contribute an anonymous salary record to help others compare offers.",
      },
    ],
  }),
  component: SubmitPage,
});

function SubmitPage() {
  const router = useRouter();
  const submit = useServerFn(submitSalary);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    company: "",
    role: "",
    level: "",
    location: "",
    experience_years: "",
    base_salary: "",
    bonus: "",
    stock: "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await submit({
        data: {
          company: form.company,
          role: form.role,
          level: form.level || undefined,
          location: form.location || undefined,
          experience_years: Number(form.experience_years),
          base_salary: form.base_salary,
          bonus: form.bonus || undefined,
          stock: form.stock || undefined,
        },
      });
      if (res.accepted > 0) {
        toast.success("Thanks — your submission is live.");
        router.invalidate();
        setForm({
          company: "",
          role: "",
          level: "",
          location: "",
          experience_years: "",
          base_salary: "",
          bonus: "",
          stock: "",
        });
      } else if (res.duplicates > 0) {
        toast.info("Looks like a duplicate of a recent record.");
      } else {
        toast.error(res.rejected[0]?.reason ?? "Could not save the submission.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container mx-auto px-4 py-10 max-w-2xl">
      <h1 className="text-3xl font-semibold mb-2">Submit a salary</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Anonymous and helps everyone compare. All amounts are annual, in INR. Ranges like
        <code className="px-1 mx-1 bg-muted rounded">10-15 LPA</code> are accepted.
      </p>
      <Card>
        <CardHeader>
          <CardTitle>Your offer</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Company *"
              v={form.company}
              on={(v) => set("company", v)}
              placeholder="Google"
            />
            <Field
              label="Role *"
              v={form.role}
              on={(v) => set("role", v)}
              placeholder="Software Engineer"
            />
            <Field
              label="Level / title"
              v={form.level}
              on={(v) => set("level", v)}
              placeholder="SDE-II or L5"
            />
            <Field
              label="Location"
              v={form.location}
              on={(v) => set("location", v)}
              placeholder="Bangalore"
            />
            <Field
              label="Experience (years) *"
              v={form.experience_years}
              on={(v) => set("experience_years", v)}
              placeholder="3.5"
              type="number"
            />
            <Field
              label="Base salary *"
              v={form.base_salary}
              on={(v) => set("base_salary", v)}
              placeholder="25 LPA or 2500000"
            />
            <Field label="Bonus" v={form.bonus} on={(v) => set("bonus", v)} placeholder="3 LPA" />
            <Field
              label="Stock (annual)"
              v={form.stock}
              on={(v) => set("stock", v)}
              placeholder="10 LPA"
            />
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving…" : "Submit"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
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
