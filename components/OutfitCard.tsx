'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
      className="group cursor-pointer overflow-hidden hover:shadow-lg transition-all bg-white rounded-2xl border-0"
      onClick={() => onClick?.(outfit)}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-[#F5F5F5]">
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
            className="absolute top-3 right-3 bg-white/95 hover:bg-white rounded-full shadow-sm p-2 transition-all"
            onClick={handleFavoriteClick}
          >
            <Star
              className={`w-4 h-4 ${
                outfit.is_favorite
                  ? 'fill-[#EC4899] text-[#EC4899]'
                  : 'text-[#6B7280]'
              }`}
            />
          </button>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {outfit.season && (
            <Badge>
              {outfit.season}
            </Badge>
          )}
          {outfit.style && (
            <Badge variant="secondary">
              {outfit.style}
            </Badge>
          )}
        </div>
      </div>

      {/* Stats below image */}
      {showStats && (
        <div className="px-4 py-3 bg-white">
          <div className="flex items-center gap-3 text-xs text-[#374151]">
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
        </div>
      )}

      {/* Actions */}
      {(onArchive || onDelete) && (
        <CardContent className="p-3 flex gap-2">
          {onArchive && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleArchiveClick}
            >
              <Archive className="w-3.5 h-3.5 mr-1.5" />
              アーカイブ
            </Button>
          )}
          {onDelete && (
            <Button
              variant="destructive"
              size="sm"
              className="flex-1"
              onClick={handleDeleteClick}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              削除
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  );
}
