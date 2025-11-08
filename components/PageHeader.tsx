'use client';

import { Button } from '@/components/ui/button';
import { LogOut, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
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
  const supabase = createClient();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('ログアウトしました');
      router.push('/login');
    } catch {
      toast.error('ログアウトに失敗しました');
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showBack && (
              <button
                className="p-2 rounded-full hover:bg-[#E8E5FF] transition-colors"
                onClick={handleBack}
              >
                <ArrowLeft className="w-5 h-5 text-[#374151]" />
              </button>
            )}
            <div>
              <h1 className="text-lg font-bold text-[#111827]">{title}</h1>
              {subtitle && <p className="text-xs text-[#6B7280] mt-1">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {action && (
              <Button onClick={action.onClick} size="sm">
                {action.icon && <action.icon className="w-4 h-4 mr-1.5" />}
                {action.label}
              </Button>
            )}
            {showLogout && (
              <button
                className="p-2 rounded-full hover:bg-[#E8E5FF] transition-colors"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 text-[#374151]" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
