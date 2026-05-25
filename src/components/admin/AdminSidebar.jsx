import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3, ClipboardCheck, Activity, Database,
  Building2, Briefcase, Layers, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Pipeline Health', icon: Activity, path: '/admin' },
  { label: 'Review Queue', icon: ClipboardCheck, path: '/admin/review', badge: true },
  { label: 'Salary Records', icon: Database, path: '/admin/records' },
  { label: 'Companies', icon: Building2, path: '/admin/companies' },
  { label: 'Roles', icon: Briefcase, path: '/admin/roles' },
  { label: 'Levels', icon: Layers, path: '/admin/levels' },
];

export default function AdminSidebar({ pendingCount = 0 }) {
  const { pathname } = useLocation();

  return (
    <aside className="w-60 min-h-screen bg-navy flex flex-col border-r border-white/5 flex-shrink-0">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-white/5">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-sm tracking-tight">
            Talent<span className="text-primary">Dash</span>
          </span>
        </Link>
        <span className="ml-2 text-xs text-white/30 font-medium">Admin</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ label, icon: Icon, path, badge }) => {
          const active = pathname === path || (path !== '/admin' && pathname.startsWith(path));
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-primary/20 text-primary'
                  : 'text-white/50 hover:text-white/90 hover:bg-white/5'
              )}
            >
              <Icon className={cn('w-4 h-4', active ? 'text-primary' : 'text-white/40')} />
              <span className="flex-1">{label}</span>
              {badge && pendingCount > 0 && (
                <span className="bg-primary text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {pendingCount}
                </span>
              )}
              {active && <ChevronRight className="w-3 h-3 text-primary/60" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/5">
        <Link to="/" className="text-xs text-white/30 hover:text-white/60 transition-colors">
          ← Back to Explorer
        </Link>
      </div>
    </aside>
  );
}