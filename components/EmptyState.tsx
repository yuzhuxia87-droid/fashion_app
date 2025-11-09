'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 md:py-16 lg:py-20 px-6 md:px-8 text-center">
        <Icon className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 text-gray-400 mb-4 md:mb-6" />
        <h3 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-900 mb-2">{title}</h3>
        {description && <p className="text-sm md:text-base text-gray-600 mb-6 md:mb-8 max-w-md">{description}</p>}
        {action && (
          <Button onClick={action.onClick} variant="outline" className="h-10 md:h-11 text-sm md:text-base">
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
