'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Shirt, ShoppingBag, RotateCcw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

import BottomNav from '@/components/BottomNav';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import { Card, CardContent } from '@/components/ui/card';

import { ArchiveTab } from '@/types/extended';
import { OutfitWithStats } from '@/types/api';

interface ArchiveClientProps {
  initialOutfits: OutfitWithStats[];
}

// Validation function for ArchiveTab
function isArchiveTab(value: string): value is ArchiveTab {
  return value === 'retired' || value === 'wishlist';
}

export default function ArchiveClient({ initialOutfits }: ArchiveClientProps) {
  const router = useRouter();
  const [outfits, setOutfits] = useState<OutfitWithStats[]>(initialOutfits);
  const [activeTab, setActiveTab] = useState<ArchiveTab>('retired');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [outfitToDelete, setOutfitToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUnarchive = async (id: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('outfits')
        .update({ is_archived: false })
        .eq('id', id);

      if (error) throw error;

      setOutfits((prev) => prev.filter((o) => o.id !== id));
      toast.success('コレクションへ戻しました');
    } catch (error) {
      console.error('Unarchive error:', error);
      toast.error('コレクションへの移動に失敗しました');
    }
  };

  const handleDelete = (id: string) => {
    setOutfitToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!outfitToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/outfits/${outfitToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete outfit');

      setOutfits((prev) => prev.filter((o) => o.id !== outfitToDelete));
      toast.success('削除しました');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('削除に失敗しました');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setOutfitToDelete(null);
    }
  };

  // For now, we treat all archived items as "retired"
  // In the future, we can add a flag to distinguish wishlist items
  const retiredOutfits = outfits;
  const wishlistOutfits: OutfitWithStats[] = [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-200/75 via-pink-200/60 to-purple-100/70">
      <PageHeader
        title="アーカイブ"
        subtitle={`${outfits.length}件のアイテム`}
        showLogout
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 pb-24 md:pb-8">
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            if (isArchiveTab(v)) {
              setActiveTab(v);
            }
          }}
        >
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="retired">
              <Shirt className="w-4 h-4 mr-2" />
              もう着ない
            </TabsTrigger>
            <TabsTrigger value="wishlist">
              <ShoppingBag className="w-4 h-4 mr-2" />
              欲しい服リスト
            </TabsTrigger>
          </TabsList>

          <TabsContent value="retired" className="mt-0">
            {retiredOutfits.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {retiredOutfits.map((outfit) => (
                  <Card key={outfit.id} className="group overflow-hidden rounded-2xl border-0 shadow-lg hover:shadow-2xl transition-all duration-300">
                    <div className="relative aspect-[3/4] overflow-hidden bg-gray-50/30">
                      <Image
                        src={outfit.image_url}
                        alt="Archived outfit"
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, 33vw"
                      />

                      {/* Wear count badge */}
                      {outfit.wear_count > 0 && (
                        <Badge variant="outline" className="absolute top-3 left-3">
                          {outfit.wear_count}回着用
                        </Badge>
                      )}
                    </div>

                    <CardContent className="p-1.5 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 px-2"
                        onClick={() => handleUnarchive(outfit.id)}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 h-8 px-2 text-gray-600 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(outfit.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Shirt}
                title="もう着ないコーデがありません"
                description="着なくなったコーディネートをアーカイブできます"
              />
            )}
          </TabsContent>

          <TabsContent value="wishlist" className="mt-0">
            {wishlistOutfits.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {wishlistOutfits.map((outfit) => (
                  <Card key={outfit.id} className="group overflow-hidden rounded-2xl border-0 shadow-lg hover:shadow-2xl transition-all duration-300">
                    <div className="relative aspect-[3/4] overflow-hidden bg-gray-50/30">
                      <Image
                        src={outfit.image_url}
                        alt="Wishlist item"
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, 33vw"
                      />
                    </div>

                    <CardContent className="p-1.5 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 px-2"
                        onClick={() => handleUnarchive(outfit.id)}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 h-8 px-2 text-gray-600 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(outfit.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={ShoppingBag}
                title="欲しい服リストが空です"
                description="気になるコーディネートをウィッシュリストに追加できます"
                action={{
                  label: 'コーデを探す',
                  onClick: () => router.push('/browse'),
                }}
              />
            )}
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
