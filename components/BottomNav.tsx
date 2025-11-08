'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Compass, Shirt, Search, Archive } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  id: string;
  icon: LucideIcon;
  label: string;
  path: string;
}

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      id: 'today',
      icon: Compass,
      label: '今日',
      path: '/home'
    },
    {
      id: 'collection',
      icon: Shirt,
      label: 'コレクション',
      path: '/collection'
    },
    {
      id: 'browse',
      icon: Search,
      label: '探す',
      path: '/browse'
    },
    {
      id: 'archive',
      icon: Archive,
      label: 'アーカイブ',
      path: '/archive'
    },
  ];

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#F5F5F5] safe-area-inset-bottom z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-around items-center h-20">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <button
                key={item.id}
                onClick={() => router.push(item.path)}
                className="flex flex-col items-center justify-center gap-1 py-2 relative group transition-all duration-300 ease-out"
              >
                {/* Icon with pill-shaped background */}
                <div className="relative flex items-center justify-center w-16 h-12">
                  {/* Pill-shaped Active Indicator - horizontal oval */}
                  <div
                    className={`absolute inset-0 rounded-full transition-all duration-300 ease-out ${
                      active
                        ? 'bg-[#FCE7F3] scale-100 opacity-100'
                        : 'bg-transparent scale-95 opacity-0 group-hover:bg-[#FCE7F3] group-hover:scale-100 group-hover:opacity-100'
                    }`}
                  />
                  <Icon
                    className={`w-6 h-6 transition-all duration-200 relative z-10 ${
                      active ? 'text-[#111827]' : 'text-[#6B7280]'
                    }`}
                    strokeWidth={2}
                  />
                </div>

                {/* Label - outside the circular background */}
                <span
                  className={`text-xs font-medium transition-all duration-200 ${
                    active ? 'text-[#111827]' : 'text-[#6B7280]'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
