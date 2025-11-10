'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getAvailableCities } from '@/lib/weather/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save, MapPin, Info } from 'lucide-react';
import { toast } from 'sonner';

import BottomNav from '@/components/BottomNav';
import PageHeader from '@/components/PageHeader';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function SettingsPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('東京');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const cities = getAvailableCities();

  const loadData = useCallback(async () => {
    try {
      const supabase = createClient();

      // Check authentication
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      setUserEmail(user.email || '');

      // Get user settings
      const { data: userData } = await supabase
        .from('users')
        .select('location_city')
        .eq('id', user.id)
        .single();

      if (userData?.location_city) {
        setSelectedCity(userData.location_city);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('設定の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('users')
        .update({ location_city: selectedCity })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('設定を保存しました');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('設定の保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="設定" showLogout />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 pb-24">
          <LoadingSpinner message="読み込み中..." />
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="設定" showLogout />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 pb-24 space-y-6 md:space-y-8">
        {/* Account Section */}
        <Card className="shadow-lg hover:shadow-2xl transition-shadow duration-300 border-0">
          <CardHeader className="p-5 md:p-6">
            <CardTitle className="text-lg md:text-xl">アカウント</CardTitle>
            <CardDescription className="text-sm md:text-base">ログイン情報</CardDescription>
          </CardHeader>
          <CardContent className="p-5 md:p-6 pt-0">
            <div className="space-y-2">
              <Label className="text-sm md:text-base">メールアドレス</Label>
              <div className="text-sm md:text-base text-gray-600">{userEmail}</div>
            </div>
          </CardContent>
        </Card>

        {/* Location Section */}
        <Card className="shadow-lg hover:shadow-2xl transition-shadow duration-300 border-0">
          <CardHeader className="p-5 md:p-6">
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <MapPin className="w-5 h-5" />
              位置情報
            </CardTitle>
            <CardDescription className="text-sm md:text-base">
              天気に合わせたコーディネート提案のための設定
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 md:space-y-5 p-5 md:p-6 pt-0">
            <div className="space-y-2">
              <Label htmlFor="city-select" className="text-sm md:text-base">都市</Label>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger id="city-select" className="h-10 md:h-11 text-sm md:text-base">
                  <SelectValue placeholder="都市を選択" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city} className="text-sm md:text-base">
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={saveSettings} disabled={saving} className="w-full">
              <Save className="mr-2" />
              {saving ? '保存中...' : '設定を保存'}
            </Button>
          </CardContent>
        </Card>

        {/* App Info Section */}
        <Card className="shadow-lg hover:shadow-2xl transition-shadow duration-300 border-0">
          <CardHeader className="p-5 md:p-6">
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <Info className="w-5 h-5" />
              アプリ情報
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm md:text-base text-gray-600 p-5 md:p-6 pt-0">
            <div className="flex justify-between">
              <span>バージョン</span>
              <span>1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>最終更新</span>
              <span>{new Date().toLocaleDateString('ja-JP')}</span>
            </div>
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
}
