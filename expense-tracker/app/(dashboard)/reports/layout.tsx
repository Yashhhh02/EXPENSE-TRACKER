'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, CalendarRange, Calendar } from 'lucide-react';

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const tabs = [
    {
      name: 'Monthly Reports',
      href: '/reports/monthly',
      icon: CalendarDays,
      active: pathname === '/reports/monthly' || pathname === '/reports',
    },
    {
      name: 'Weekly Reports',
      href: '/reports/weekly',
      icon: CalendarRange,
      active: pathname === '/reports/weekly',
    },
    {
      name: 'Yearly Reports',
      href: '/reports/yearly',
      icon: Calendar,
      active: pathname === '/reports/yearly',
    },
  ];

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Financial Reports</h1>
        <p className="mt-1 text-sm text-zinc-400">
          In-depth period analysis, cashflow statements, and AI-generated narrative summaries.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 space-x-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center space-x-2 pb-3.5 text-sm font-semibold border-b-2 transition-all ${
                tab.active
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </Link>
          );
        })}
      </div>

      <div>{children}</div>
    </div>
  );
}
