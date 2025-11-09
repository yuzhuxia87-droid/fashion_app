import { NextRequest, NextResponse } from 'next/server';

interface UnsplashPhoto {
  id: string;
  urls: {
    regular: string;
    small: string;
  };
  description: string | null;
  alt_description: string | null;
  user: {
    name: string;
    links: {
      html: string;
    };
  };
  links: {
    download_location: string;
  };
}

// Discovery用の多様なクエリ
const DISCOVERY_QUERIES = [
  'casual outfit',
  'formal wear',
  'street style',
  'korean fashion',
  'minimal fashion',
  'summer outfit',
  'winter outfit',
  'business casual',
  'date night outfit',
  'vintage fashion',
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '20');

    const unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY;

    if (!unsplashAccessKey) {
      return NextResponse.json(
        { error: 'Unsplash API key not configured' },
        { status: 500 }
      );
    }

    // ページごとに異なるクエリのミックスを作成
    const startIndex = ((page - 1) * 2) % DISCOVERY_QUERIES.length;
    const queries = [
      DISCOVERY_QUERIES[startIndex],
      DISCOVERY_QUERIES[(startIndex + 1) % DISCOVERY_QUERIES.length],
    ];

    // 各クエリから画像を取得
    const fetchPromises = queries.map(async (query) => {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
          query
        )}&page=${Math.ceil(page / 2)}&per_page=${Math.ceil(perPage / 2)}&orientation=portrait`,
        {
          headers: {
            Authorization: `Client-ID ${unsplashAccessKey}`,
          },
        }
      );

      if (!response.ok) {
        console.error(`Failed to fetch images for query: ${query}`);
        return [];
      }

      const data = await response.json();
      return data.results.map((photo: UnsplashPhoto) => ({
        id: photo.id,
        url: photo.urls.regular,
        thumb: photo.urls.small,
        description: photo.description || photo.alt_description,
        photographer: photo.user.name,
        photographerUrl: photo.user.links.html,
        downloadLocation: photo.links.download_location,
      }));
    });

    const results = await Promise.all(fetchPromises);

    // 2つのクエリ結果を交互に混ぜる（より多様性を出すため）
    const images: Array<{
      id: string;
      url: string;
      thumb: string;
      description: string | null;
      photographer: string;
      photographerUrl: string;
      downloadLocation: string;
    }> = [];
    const maxLength = Math.max(results[0].length, results[1].length);

    for (let i = 0; i < maxLength; i++) {
      if (results[0][i]) images.push(results[0][i]);
      if (results[1][i]) images.push(results[1][i]);
    }

    return NextResponse.json({
      success: true,
      images: images.slice(0, perPage),
      hasMore: true, // 常に無限スクロール可能
    });
  } catch (error) {
    console.error('Error discovering images:', error);
    return NextResponse.json(
      { error: 'Failed to discover images' },
      { status: 500 }
    );
  }
}
