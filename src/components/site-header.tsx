import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";

export function SiteHeader() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });
    supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user?.email ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-20">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold text-foreground">
          <TrendingUp className="h-5 w-5 text-primary" />
          <span>TalentDash</span>
          <span className="text-xs font-normal text-muted-foreground hidden sm:inline">
            India comp intelligence
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            to="/"
            className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
            activeProps={{ className: "px-3 py-1.5 rounded-md text-foreground bg-accent" }}
            activeOptions={{ exact: true }}
          >
            Explore
          </Link>
          <Link
            to="/submit"
            className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
            activeProps={{ className: "px-3 py-1.5 rounded-md text-foreground bg-accent" }}
          >
            Submit
          </Link>
          <Link
            to="/docs"
            className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
            activeProps={{ className: "px-3 py-1.5 rounded-md text-foreground bg-accent" }}
          >
            API
          </Link>
          {email ? (
            <>
              <Link
                to="/admin/quality"
                className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                Admin
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await supabase.auth.signOut();
                }}
              >
                Sign out
              </Button>
            </>
          ) : (
            <Link to="/login">
              <Button variant="outline" size="sm">
                Admin sign in
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
