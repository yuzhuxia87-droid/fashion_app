'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Archive, Trash2, Shirt } from 'lucide-react';
import { Outfit } from '@/types';
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
      className="group cursor-pointer overflow-hidden"
      onClick={() => onClick?.(outfit)}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
        <Image
          src={outfit.image_url}
          alt="Outfit"
          fill
          className="object-cover transition-transform group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 33vw"
        />

        {/* Favorite button */}
        {onFavoriteToggle && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm hover:bg-white"
            onClick={handleFavoriteClick}
          >
            <Star
              className={`w-5 h-5 ${
                outfit.is_favorite
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-600'
              }`}
            />
          </Button>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {outfit.season && (
            <Badge variant="secondary" className="bg-white/80 backdrop-blur-sm">
              {outfit.season}
            </Badge>
          )}
          {outfit.style && (
            <Badge variant="secondary" className="bg-white/80 backdrop-blur-sm">
              {outfit.style}
            </Badge>
          )}
        </div>

        {/* Stats overlay */}
        {showStats && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 text-white">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Shirt className="w-4 h-4" />
                  {outfit.wear_count || 0}回
                </span>
                {outfit.last_worn && (
                  <span className="text-xs opacity-80">
                    {new Date(outfit.last_worn).toLocaleDateString('ja-JP', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

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
              <Archive className="w-4 h-4 mr-1" />
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
              <Trash2 className="w-4 h-4 mr-1" />
              削除
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  );
}
