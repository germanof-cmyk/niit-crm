'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Kanban, Users, Plus } from 'lucide-react';
import Sidebar from './Sidebar';
import NiitLogo from './NiitLogo';
import { cn } from '@/lib/utils';

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/crm', label: 'Pipeline', icon: Kanban },
  { href: '/leads', label: 'Leads', icon: Users },
];

function MobileTopbar() {
  const pathname = usePathname();
  return (
    <header
      className="lg:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-50"
      style={{ background: '#1C4061' }}
    >
      <NiitLogo compact />
      <div className="flex items-center gap-1">
        {nav.map(({ href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'p-2 rounded-lg transition-colors',
                active ? 'bg-white/15' : 'hover:bg-white/10'
              )}
            >
              <Icon className="w-5 h-5" style={{ color: active ? '#F7661E' : 'rgba(255,255,255,0.7)' }} />
            </Link>
          );
        })}
        <Link
          href="/leads/novo"
          className="ml-1 flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-sm font-bold"
          style={{ background: '#F7661E' }}
        >
          <Plus className="w-4 h-4" />
        </Link>
      </div>
    </header>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-niit-surface">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileTopbar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
