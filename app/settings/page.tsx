'use client';

import { useState, useEffect } from 'react';
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
  };

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
        <main className="max-w-7xl mx-auto px-4 py-6 pb-20">
          <LoadingSpinner message="読み込み中..." />
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="設定" showLogout />

      <main className="max-w-3xl mx-auto px-4 py-6 pb-20 space-y-6">
        {/* Account Section */}
        <Card>
          <CardHeader>
            <CardTitle>アカウント</CardTitle>
            <CardDescription>ログイン情報</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>メールアドレス</Label>
              <div className="text-sm text-gray-600">{userEmail}</div>
            </div>
          </CardContent>
        </Card>

        {/* Location Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              位置情報
            </CardTitle>
            <CardDescription>
              天気に合わせたコーディネート提案のための設定
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="city-select">都市</Label>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger id="city-select">
                  <SelectValue placeholder="都市を選択" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={saveSettings} disabled={saving} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              {saving ? '保存中...' : '設定を保存'}
            </Button>
          </CardContent>
        </Card>

        {/* App Info Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              アプリ情報
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
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
