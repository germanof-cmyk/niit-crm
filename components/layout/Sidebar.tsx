'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Kanban, Users, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import NiitLogo from './NiitLogo';

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/crm', label: 'Pipeline CRM', icon: Kanban },
  { href: '/leads', label: 'Leads', icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar-gradient hidden lg:flex flex-col shrink-0" style={{ width: 240, minHeight: '100vh' }}>
      {/* Logo */}
      <div className="px-6 py-7 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <NiitLogo />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150',
                active
                  ? 'border-l-[3px] border-niit-orange pl-[13px]'
                  : 'border-l-[3px] border-transparent pl-[13px] hover:bg-white/10'
              )}
              style={{
                background: active ? 'rgba(255,255,255,0.10)' : undefined,
                color: active ? '#ffffff' : 'rgba(255,255,255,0.55)',
              }}
            >
              <Icon
                className="w-4 h-4 shrink-0"
                style={{ color: active ? '#F7661E' : undefined }}
              />
              <span style={{ color: active ? '#fff' : undefined }}>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* New Lead CTA */}
      <div className="px-4 pb-5">
        <Link
          href="/leads/novo"
          className="btn-orange flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm"
        >
          <Plus className="w-4 h-4" />
          Novo Lead
        </Link>
      </div>

      {/* Footer signature */}
      <div
        className="px-6 py-4 text-center text-[10px] font-medium border-t"
        style={{ borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.25)' }}
      >
        NIIT · Nitretação a plasma
      </div>
    </aside>
  );
}
