'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Sliders } from 'lucide-react';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const tabs = [
    {
      name: 'Profile Settings',
      href: '/settings/profile',
      icon: User,
      active: pathname === '/settings/profile' || pathname === '/settings',
    },
    {
      name: 'Preferences & Fixed Expenses',
      href: '/settings/preferences',
      icon: Sliders,
      active: pathname === '/settings/preferences',
    },
  ];

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Manage your personal parameters, currency, financial targets, and fixed expenses.
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
