'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useSearchBands } from '@/api/hooks';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isMobile, setIsMobile] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const { data: suggestions, isLoading, isError } = useSearchBands(debouncedQuery);

  const rollTheDice = async () => {
    if (isRolling) return;
    setIsRolling(true);

    try {
      const res = await fetch('/api/bands/random');
      if (!res.ok) throw new Error('Random fetch failed');
      const band = await res.json();

      setIsRolling(false);
      router.push(`/band/${band.id}`);
    } catch (error) {
      console.error('[SearchBar] Erreur random:', error);
      setIsRolling(false);
    }
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleGlobalKeyDown = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setShowSuggestions(true);
      }
    };
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [suggestions]);

  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      selectedElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search/${encodeURIComponent(query.trim())}`);
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!suggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
        break;
      case 'Enter':
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          e.preventDefault();
          router.push(`/band/${suggestions[selectedIndex].id}`);
          setShowSuggestions(false);
          setQuery('');
          setSelectedIndex(-1);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const hasSuggestions = showSuggestions && suggestions && suggestions.length > 0;
  const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac');

  return (
    <div ref={wrapperRef} className="relative w-full" role="search">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          {/* Icône de recherche à gauche */}
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleInputKeyDown}
            placeholder={isMobile ? "Rechercher..." : "Rechercher un groupe..."}
            aria-label="Rechercher un groupe"
            aria-expanded={hasSuggestions}
            aria-controls="search-suggestions"
            aria-autocomplete="list"
            role="combobox"
            className="metal-input pl-10 pr-10 sm:pr-28"
          />

          {/* 🎲 Bouton recherche aléatoire */}
          <button
            type="button"
            onClick={rollTheDice}
            disabled={isRolling}
            title="Groupe aléatoire"
            aria-label="Découvrir un groupe aléatoire"
            className="absolute right-2 sm:right-20 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-md text-sm hover:bg-metal-fire/20 transition-all focus:outline-none focus:ring-2 focus:ring-metal-fire/50 disabled:opacity-60 disabled:cursor-wait"
          >
            <span
              className={`inline-block ${isRolling ? 'animate-spin' : 'transition-transform hover:rotate-12'}`}
              aria-hidden="true"
            >
              🎲
            </span>
          </button>
          
          {/* Spinner de chargement */}
          {isLoading && debouncedQuery.length > 0 && (
            <div className="absolute right-2 sm:right-20 top-1/2 -translate-y-1/2">
              <svg className="animate-spin h-4 w-4 text-metal-fire" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}

          {/* Badge Ctrl+K (desktop uniquement) */}
          {!query && !isLoading && !isMobile && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 pointer-events-none">
              <kbd className="px-1.5 py-0.5 bg-metal-gray/50 border border-metal-gray rounded text-[10px] text-gray-400 font-mono">
                {isMac ? '⌘' : 'Ctrl'}
              </kbd>
              <kbd className="px-1.5 py-0.5 bg-metal-gray/50 border border-metal-gray rounded text-[10px] text-gray-400 font-mono">
                K
              </kbd>
            </div>
          )}
        </div>
      </form>

      {/* ✅ Suggestions avec largeur élargie sur mobile */}
      {hasSuggestions && (
        <ul
          id="search-suggestions"
          ref={listRef}
          role="listbox"
          className="absolute z-50 w-[calc(100%+2rem)] -left-4 sm:w-full sm:left-0 mt-2 metal-card max-h-80 overflow-y-auto border border-metal-gray rounded-lg shadow-2xl"
        >
          {suggestions.slice(0, 8).map((band, index) => (
            <li
              key={band.id}
              role="option"
              aria-selected={index === selectedIndex}
              onClick={() => {
                router.push(`/band/${band.id}`);
                setShowSuggestions(false);
                setQuery('');
                setSelectedIndex(-1);
              }}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`px-4 py-3 cursor-pointer transition-colors flex items-center gap-3 ${
                index === selectedIndex
                  ? 'bg-metal-fire/10 border-l-4 border-metal-fire'
                  : 'hover:bg-metal-gray/30 border-l-4 border-transparent'
              }`}
            >
              <div className="w-8 h-8 rounded bg-metal-gray flex items-center justify-center text-xs shrink-0 overflow-hidden">
                {band.image_url ? (
                  <Image src={band.image_url} alt="" width={32} height={32} className="w-full h-full object-cover" />
                ) : (
                  <span>🎸</span>
                )}
              </div>
              
              <div className="flex-1 min-w-0 text-left">
                <p className="font-semibold text-sm text-gray-100 truncate">{band.name}</p>
                <p className="text-xs text-gray-400 truncate">
                  {band.genre}
                  {band.country && ` • ${band.country}`}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Erreur */}
      {isError && showSuggestions && debouncedQuery.length > 0 && (
        <div className="absolute z-50 w-[calc(100%+2rem)] -left-4 sm:w-full sm:left-0 mt-2 metal-card p-4 text-center text-sm text-red-400 border border-red-900/50 rounded-lg">
          Erreur lors de la recherche. Réessayez plus tard.
        </div>
      )}

      {/* Aucun résultat */}
      {!isLoading && !isError && showSuggestions && debouncedQuery.length > 2 && suggestions && suggestions.length === 0 && (
        <div className="absolute z-50 w-[calc(100%+2rem)] -left-4 sm:w-full sm:left-0 mt-2 metal-card p-4 text-center text-sm text-gray-400 border border-metal-gray rounded-lg">
          Aucun groupe trouvé pour "{debouncedQuery}"
        </div>
      )}
    </div>
  );
}
