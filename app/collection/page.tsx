'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Search, Star, Clock } from 'lucide-react';
import { toast } from 'sonner';

import BottomNav from '@/components/BottomNav';
import PageHeader from '@/components/PageHeader';
import OutfitCard from '@/components/OutfitCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';

import { FilterTab } from '@/types/extended';
import { OutfitWithStats } from '@/types/api';

export default function CollectionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [outfits, setOutfits] = useState<OutfitWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [outfitToDelete, setOutfitToDelete] = useState<string | null>(null);

  useEffect(() => {
    // Set filter from URL params
    const filterParam = searchParams.get('filter');
    if (filterParam === 'notWornRecently') {
      setActiveFilter('notWornRecently');
    }
    loadData();
  }, [searchParams]);

  const loadData = async () => {
    try {
      const supabase = createClient();

      // Check authentication
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Get outfits
      const response = await fetch('/api/outfits?archived=false');
      if (!response.ok) {
        throw new Error('Failed to fetch outfits');
      }

      const data = await response.json();
      setOutfits(data.outfits || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('コレクションの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteToggle = async (id: string) => {
    const outfit = outfits.find((o) => o.id === id);
    if (!outfit) return;

    const newFavoriteStatus = !outfit.is_favorite;

    // Optimistic update
    setOutfits((prev) =>
      prev.map((o) => (o.id === id ? { ...o, is_favorite: newFavoriteStatus } : o))
    );

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('outfits')
        .update({ is_favorite: newFavoriteStatus })
        .eq('id', id);

      if (error) throw error;

      toast.success(
        newFavoriteStatus ? 'お気に入りに追加しました' : 'お気に入りから削除しました'
      );
    } catch (error) {
      // Revert on error
      setOutfits((prev) =>
        prev.map((o) => (o.id === id ? { ...o, is_favorite: outfit.is_favorite } : o))
      );
      console.error('Toggle favorite error:', error);
      toast.error('お気に入りの更新に失敗しました');
    }
  };

  const handleArchive = async (id: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('outfits')
        .update({ is_archived: true })
        .eq('id', id);

      if (error) throw error;

      setOutfits((prev) => prev.filter((o) => o.id !== id));
      toast.success('アーカイブに移動しました');
    } catch (error) {
      console.error('Archive error:', error);
      toast.error('アーカイブに失敗しました');
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

  const getFilteredOutfits = (filter: FilterTab): OutfitWithStats[] => {
    switch (filter) {
      case 'favorites':
        return outfits.filter((o) => o.is_favorite);
      case 'notWornRecently':
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return outfits.filter(
          (o) => !o.last_worn || new Date(o.last_worn) < thirtyDaysAgo
        );
      default:
        return outfits;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader title="マイコレクション" showLogout />
        <main className="max-w-7xl mx-auto px-4 py-6 pb-20">
          <LoadingSpinner message="読み込み中..." />
        </main>
        <BottomNav />
      </div>
    );
  }

  const filteredOutfits = getFilteredOutfits(activeFilter);

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="マイコレクション"
        subtitle={`${outfits.length}件のコーディネート`}
        showLogout
        action={{
          label: 'コーデを探す',
          onClick: () => router.push('/browse'),
          icon: Search,
        }}
      />

      <main className="max-w-7xl mx-auto px-4 py-6 pb-20">
        <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as FilterTab)}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="all">すべて</TabsTrigger>
            <TabsTrigger value="favorites">
              <Star className="w-4 h-4 mr-2" />
              お気に入り
            </TabsTrigger>
            <TabsTrigger value="notWornRecently">
              <Clock className="w-4 h-4 mr-2" />
              最近未着用
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeFilter} className="mt-0">
            {filteredOutfits.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredOutfits.map((outfit) => (
                  <OutfitCard
                    key={outfit.id}
                    outfit={outfit}
                    onFavoriteToggle={handleFavoriteToggle}
                    onArchive={handleArchive}
                    onDelete={handleDelete}
                    showStats
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Search}
                title={
                  activeFilter === 'favorites'
                    ? 'お気に入りがありません'
                    : activeFilter === 'notWornRecently'
                    ? '最近未着用のコーデがありません'
                    : 'コレクションが空です'
                }
                description="新しいコーディネートを追加してみましょう"
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
