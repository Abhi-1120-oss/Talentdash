import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PublicNavbar() {
  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <BarChart3 className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-bold text-lg text-foreground tracking-tight">
            Talent<span className="text-primary">Dash</span>
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Link to="/explorer" className="text-sm text-muted-foreground hover:text-foreground font-medium transition-colors">
            Explore
          </Link>
          <Link to="/compare" className="text-sm text-muted-foreground hover:text-foreground font-medium transition-colors">
            Compare
          </Link>
          <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground font-medium transition-colors">
            My Dashboard
          </Link>
          <Link to="/admin">
            <Button variant="outline" size="sm" className="gap-1.5 text-sm">
              <LogIn className="w-3.5 h-3.5" /> Admin
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}