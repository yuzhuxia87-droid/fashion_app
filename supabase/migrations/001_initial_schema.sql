-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  location_latitude DECIMAL(10, 8),
  location_longitude DECIMAL(11, 8),
  location_city TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Outfits table
CREATE TABLE IF NOT EXISTS public.outfits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_archived BOOLEAN DEFAULT FALSE,
  is_favorite BOOLEAN DEFAULT FALSE,
  season TEXT CHECK (season IN ('spring', 'summer', 'fall', 'winter', 'all')),
  style TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clothing items table
CREATE TABLE IF NOT EXISTS public.clothing_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  outfit_id UUID NOT NULL REFERENCES public.outfits(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('top', 'bottom', 'outer', 'dress', 'shoes', 'accessory')),
  color TEXT NOT NULL,
  item_type TEXT NOT NULL,
  has_item BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wear history table
CREATE TABLE IF NOT EXISTS public.wear_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  outfit_id UUID NOT NULL REFERENCES public.outfits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  worn_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(outfit_id, worn_date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_outfits_user_id ON public.outfits(user_id);
CREATE INDEX IF NOT EXISTS idx_outfits_archived ON public.outfits(is_archived);
CREATE INDEX IF NOT EXISTS idx_outfits_favorite ON public.outfits(is_favorite);
CREATE INDEX IF NOT EXISTS idx_clothing_items_outfit_id ON public.clothing_items(outfit_id);
CREATE INDEX IF NOT EXISTS idx_wear_history_outfit_id ON public.wear_history(outfit_id);
CREATE INDEX IF NOT EXISTS idx_wear_history_user_id ON public.wear_history(user_id);
CREATE INDEX IF NOT EXISTS idx_wear_history_date ON public.wear_history(worn_date);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outfits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clothing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wear_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for outfits table
CREATE POLICY "Users can view own outfits"
  ON public.outfits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own outfits"
  ON public.outfits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own outfits"
  ON public.outfits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own outfits"
  ON public.outfits FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for clothing_items table
CREATE POLICY "Users can view clothing items of own outfits"
  ON public.clothing_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.outfits
    WHERE outfits.id = clothing_items.outfit_id
    AND outfits.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert clothing items for own outfits"
  ON public.clothing_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.outfits
    WHERE outfits.id = clothing_items.outfit_id
    AND outfits.user_id = auth.uid()
  ));

CREATE POLICY "Users can update clothing items of own outfits"
  ON public.clothing_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.outfits
    WHERE outfits.id = clothing_items.outfit_id
    AND outfits.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete clothing items of own outfits"
  ON public.clothing_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.outfits
    WHERE outfits.id = clothing_items.outfit_id
    AND outfits.user_id = auth.uid()
  ));

-- RLS Policies for wear_history table
CREATE POLICY "Users can view own wear history"
  ON public.wear_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wear history"
  ON public.wear_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wear history"
  ON public.wear_history FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wear history"
  ON public.wear_history FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_outfits_updated_at
  BEFORE UPDATE ON public.outfits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Storage bucket for outfit images
INSERT INTO storage.buckets (id, name, public)
VALUES ('outfit-images', 'outfit-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload outfit images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'outfit-images' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can view outfit images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'outfit-images');

CREATE POLICY "Users can update own outfit images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'outfit-images' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete own outfit images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'outfit-images' AND
    auth.role() = 'authenticated'
  );
