'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Compass, ShoppingBag, Search, Archive } from 'lucide-react';
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
      icon: ShoppingBag,
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
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-white/20 safe-area-inset-bottom z-50 md:hidden">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-around items-center h-20">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <button
                key={item.id}
                onClick={() => router.push(item.path)}
                className="flex flex-col items-center justify-center gap-1 py-2 transition-all duration-300 ease-out"
              >
                {/* Icon with circular background */}
                <div className="relative flex items-center justify-center">
                  {/* Circular background (active state) */}
                  <div
                    className={`absolute inset-0 rounded-full transition-all duration-300 ease-out ${
                      active ? 'bg-pink-100 scale-100 opacity-100' : 'bg-transparent scale-75 opacity-0'
                    }`}
                    style={{ width: '40px', height: '40px' }}
                  />
                  {/* Icon */}
                  <Icon
                    className={`relative w-6 h-6 transition-all duration-300 ease-out ${
                      active ? 'text-pink-400' : 'text-gray-500'
                    }`}
                    strokeWidth={active ? 2.5 : 1.5}
                  />
                </div>

                {/* Label */}
                <span
                  className={`text-xs transition-all duration-300 ease-out ${
                    active ? 'text-pink-400 font-semibold' : 'text-gray-500 font-normal'
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
