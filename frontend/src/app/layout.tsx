import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'ClipForge AI - Viral Short-Form Video Generator',
  description: 'Turn long videos and live streams into viral YouTube Shorts, Reels, and TikTok clips with one-click upload.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#090a0f',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="min-h-screen flex flex-col bg-[#090a0f] text-gray-100 overflow-x-hidden antialiased selection:bg-purple-600 selection:text-white">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6">
          {children}
        </main>
      </body>
    </html>
  );
}

