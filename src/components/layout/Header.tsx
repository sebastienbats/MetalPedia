'use client';

import Link from 'next/link';
import SearchBar from '@/components/search/SearchBar';
import ThemeSwitcher from '@/components/ui/ThemeSwitcher';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-metal-black/90 border-b border-metal-gray">
      <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4 max-w-7xl">
        <Link href="/" className="flex items-center gap-3 group">
          <span className="text-4xl animate-flame">🔥</span>
          <div>
            <h1 className="font-metal text-3xl md:text-4xl text-metal-rust group-hover:text-metal-fire transition-colors">
              MetalPedia
            </h1>
            <p className="text-xs text-gray-400 font-serif tracking-widest uppercase">
              Encyclopédie du Metal
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex-1 md:w-96">
            <SearchBar />
          </div>
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
}
