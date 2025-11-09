'use client';

import { Button } from '@/components/ui/button';
import { LogOut, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  showLogout?: boolean;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ComponentType<{ className?: string }>;
  };
}

export default function PageHeader({
  title,
  subtitle,
  showBack = false,
  showLogout = true,
  action,
}: PageHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      console.log('[CLIENT] Sending logout request');
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      const data = await response.json();
      console.log('[CLIENT] Logout response:', data);

      if (!response.ok) {
        console.error('[CLIENT] Logout failed:', data.error);
        toast.error(data.error || 'ログアウトに失敗しました');
        return;
      }

      console.log('[CLIENT] Logout successful, redirecting to /auth/login');
      toast.success('ログアウトしました');
      // Use window.location to ensure cookies are cleared before navigation
      window.location.href = '/auth/login';
    } catch (error) {
      console.error('[CLIENT] Logout error:', error);
      toast.error('ログアウトに失敗しました');
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-white/20 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            {showBack && (
              <button
                className="p-2 rounded-full hover:bg-secondary-accent transition-colors"
                onClick={handleBack}
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
            )}
            <div>
              <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-foreground">{title}</h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">
                {subtitle || '\u00A0'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {action && (
              <Button onClick={action.onClick}>
                {action.icon && <action.icon className="mr-2" />}
                <span className="hidden sm:inline">{action.label}</span>
              </Button>
            )}
            {showLogout && (
              <button
                className="p-2 rounded-full hover:bg-secondary-accent transition-colors"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5 text-gray-700" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
