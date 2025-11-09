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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || 'fashion outfit';
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '20');

    const unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY;

    if (!unsplashAccessKey) {
      return NextResponse.json(
        { error: 'Unsplash API key not configured' },
        { status: 500 }
      );
    }

    // Unsplash API call
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
        query
      )}&page=${page}&per_page=${perPage}&orientation=portrait`,
      {
        headers: {
          Authorization: `Client-ID ${unsplashAccessKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Unsplash API request failed');
    }

    const data = await response.json();

    // Format the response
    const images = data.results.map((photo: UnsplashPhoto) => ({
      id: photo.id,
      url: photo.urls.regular,
      thumb: photo.urls.small,
      description: photo.description || photo.alt_description,
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html,
      downloadLocation: photo.links.download_location,
    }));

    return NextResponse.json({
      success: true,
      images,
      total: data.total,
      totalPages: data.total_pages,
      hasMore: true, // 常に無限スクロール可能
    });
  } catch (error) {
    console.error('Error searching images:', error);
    return NextResponse.json(
      { error: 'Failed to search images' },
      { status: 500 }
    );
  }
}
