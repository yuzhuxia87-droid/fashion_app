import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "コーデアプリ - 毎朝の服選びをもっと簡単に",
  description: "AIがあなたのコーディネートを提案。天気に合わせた服選びで、毎朝の時間を節約。",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "コーデアプリ",
  },
};

/**
 * Viewport Configuration
 *
 * ⚠️ 重要: この設定を変更する前に必ずSCROLL_FIX_DOCUMENTATION.mdを読むこと
 *
 * 絶対にやってはいけないこと:
 * - userScalable: false を設定 → iOSでスクロール不可になる
 * - maximumScale: 1 を設定 → アクセシビリティ違反 & iOS scroll問題
 *
 * この設定により:
 * - ✅ iOSでスクロール可能
 * - ✅ アクセシビリティ準拠（WCAG 2.1）
 * - ✅ ピンチズーム可能（視覚障害者対応）
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,  // 5まで許可（アクセシビリティ対応）
  viewportFit: "cover",
  themeColor: "#3b82f6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased bg-background min-h-screen`}
      >
        {children}
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
