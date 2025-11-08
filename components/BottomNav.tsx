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
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border safe-area-inset-bottom z-50">
      <div className="max-w-7xl mx-auto px-2">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Button
                key={item.id}
                variant="ghost"
                onClick={() => router.push(item.path)}
                className={`flex flex-col items-center justify-center gap-1 h-auto py-2 px-3 ${
                  active
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                <Icon
                  className="w-5 h-5"
                  strokeWidth={active ? 2 : 1.5}
                />
                <span className={`text-[11px] ${
                  active ? 'font-medium' : ''
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
