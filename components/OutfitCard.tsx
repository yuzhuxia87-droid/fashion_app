'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Archive, Trash2, Shirt } from 'lucide-react';
import { OutfitWithStats } from '@/types/api';
import Image from 'next/image';

interface OutfitCardProps {
  outfit: OutfitWithStats;
  onFavoriteToggle?: (id: string) => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: (outfit: OutfitWithStats) => void;
  showStats?: boolean;
}

export default function OutfitCard({
  outfit,
  onFavoriteToggle,
  onArchive,
  onDelete,
  onClick,
  showStats = true,
}: OutfitCardProps) {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFavoriteToggle?.(outfit.id);
  };

  const handleArchiveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onArchive?.(outfit.id);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(outfit.id);
  };

  return (
    <Card
      className="group cursor-pointer overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 rounded-2xl border-0"
      onClick={() => onClick?.(outfit)}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-50/30">
        <Image
          src={outfit.image_url}
          alt="Outfit"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, 33vw"
        />

        {/* Favorite button */}
        {onFavoriteToggle && (
          <button
            className={`absolute top-3 right-3 rounded-full shadow-lg p-2.5 transition-all hover:scale-110 active:scale-95 ${
              outfit.is_favorite
                ? 'bg-pink-400 hover:bg-pink-500'
                : 'bg-white/90 backdrop-blur-md hover:bg-white'
            }`}
            onClick={handleFavoriteClick}
          >
            <Star
              className={`w-4 h-4 transition-all ${
                outfit.is_favorite
                  ? 'fill-white text-white'
                  : 'text-gray-700'
              }`}
              strokeWidth={2}
            />
          </button>
        )}
      </div>

      {/* Stats and Actions - unified in CardContent */}
      {(showStats || onArchive || onDelete) && (
        <CardContent className="p-3 space-y-2">
          {/* Stats */}
          {showStats && (
            <div className="flex items-center gap-3 text-xs text-gray-700">
              <span className="flex items-center gap-1.5">
                <Shirt className="w-3.5 h-3.5" />
                {outfit.wear_count || 0}回
              </span>
              {outfit.last_worn && (
                <span>
                  {new Date(outfit.last_worn).toLocaleDateString('ja-JP', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
            </div>
          )}

          {/* Actions */}
          {(onArchive || onDelete) && (
            <div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
              {onArchive && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 px-2"
                  onClick={handleArchiveClick}
                >
                  <Archive className="w-3.5 h-3.5" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 px-2"
                  onClick={handleDeleteClick}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
