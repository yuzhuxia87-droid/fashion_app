'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Home, Shirt, Search, Archive } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
      icon: Home,
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
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-100 safe-area-inset-bottom z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Button
                key={item.id}
                variant="ghost"
                onClick={() => router.push(item.path)}
                className={`flex flex-col items-center justify-center gap-1 h-auto py-2 px-4 rounded-xl transition-all ${
                  active
                    ? 'text-purple-600 hover:text-purple-600 hover:bg-purple-50'
                    : 'text-gray-500 hover:text-purple-500 hover:bg-purple-50'
                }`}
              >
                <Icon
                  className={`w-6 h-6 transition-transform ${
                    active ? 'scale-110' : ''
                  }`}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span className={`text-xs font-medium ${
                  active ? 'font-semibold' : ''
                }`}>
                  {item.label}
                </span>
              </Button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
