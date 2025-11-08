'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Shirt, ShoppingBag, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

import BottomNav from '@/components/BottomNav';
import PageHeader from '@/components/PageHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import { Card, CardContent } from '@/components/ui/card';

import { ArchiveTab } from '@/types/extended';
import { OutfitWithStats } from '@/types/api';

export default function ArchivePage() {
  const router = useRouter();
  const [outfits, setOutfits] = useState<OutfitWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ArchiveTab>('retired');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [outfitToDelete, setOutfitToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const supabase = createClient();

      // Check authentication
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Get archived outfits
      const response = await fetch('/api/outfits?archived=true');
      if (!response.ok) {
        throw new Error('Failed to fetch archived outfits');
      }

      const data = await response.json();
      setOutfits(data.outfits || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('アーカイブの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

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
      setDeleteDialogOpen(false);
      setOutfitToDelete(null);
    }
  };

  // For now, we treat all archived items as "retired"
  // In the future, we can add a flag to distinguish wishlist items
  const retiredOutfits = outfits;
  const wishlistOutfits: OutfitWithStats[] = [];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="アーカイブ" showLogout />
        <main className="max-w-7xl mx-auto px-4 py-6 pb-20">
          <LoadingSpinner message="読み込み中..." />
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="アーカイブ"
        subtitle={`${outfits.length}件のアイテム`}
        showLogout
        action={{
          label: 'コーデを探す',
          onClick: () => router.push('/browse'),
          icon: Search,
        }}
      />

      <main className="max-w-7xl mx-auto px-4 py-6 pb-20">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ArchiveTab)}>
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
                  <Card key={outfit.id} className="group overflow-hidden">
                    <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                      <Image
                        src={outfit.image_url}
                        alt="Archived outfit"
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, 33vw"
                      />

                      {/* Wear count badge */}
                      {outfit.wear_count > 0 && (
                        <Badge className="absolute top-2 left-2 bg-foreground">
                          {outfit.wear_count}回着用
                        </Badge>
                      )}
                    </div>

                    <CardContent className="p-3 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleUnarchive(outfit.id)}
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        戻す
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(outfit.id)}
                      >
                        削除
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
                  <Card key={outfit.id} className="group overflow-hidden">
                    <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                      <Image
                        src={outfit.image_url}
                        alt="Wishlist item"
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, 33vw"
                      />
                    </div>

                    <CardContent className="p-3 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleUnarchive(outfit.id)}
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        コレクションへ
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(outfit.id)}
                      >
                        削除
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
      />
    </div>
  );
}
