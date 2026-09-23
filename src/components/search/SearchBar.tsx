'use client';

import { useState, useEffect, useRef, FormEvent, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchBands } from '@/api/hooks';

// ═══════════════════════════════════════════════════════════
// 🔍 BARRE DE RECHERCHE ACCESSIBLE & NAVIGABLE AU CLAVIER
// ═══════════════════════════════════════════════════════════
export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Hook de recherche (React Query)
  const { data: suggestions, isLoading, isError } = useSearchBands(debouncedQuery);

  // 1. Debounce de la requête (400ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(timer);
  }, [query]);

  // 2. Fermeture au clic extérieur
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

  // 3. Raccourci clavier Ctrl+K (ou ⌘K sur Mac)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setShowSuggestions(true);
      }
    };
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // 4. Reset de la sélection quand les suggestions changent
  useEffect(() => {
    setSelectedIndex(-1);
  }, [suggestions]);

  // 5. Scroll automatique vers l'élément sélectionné au clavier
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      selectedElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // 6. Soumission du formulaire
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search/${encodeURIComponent(query.trim())}`);
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  // 7. Navigation clavier dans les suggestions
  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
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
            placeholder="Rechercher un groupe..."
            aria-label="Rechercher un groupe"
            aria-expanded={hasSuggestions}
            aria-controls="search-suggestions"
            aria-autocomplete="list"
            role="combobox"
            className="metal-input pr-20" // pr-20 pour laisser place au spinner + raccourci
          />
          
          {/* 🔄 Indicateur de chargement (résout le warning isLoading unused) */}
          {isLoading && debouncedQuery.length > 0 && (
            <div className="absolute right-12 top-1/2 -translate-y-1/2">
              <svg className="animate-spin h-4 w-4 text-metal-fire" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}

          {/* ⌨️ Indicateur de raccourci Ctrl+K / ⌘K */}
          {!query && !isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
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

      {/* 📋 Liste de suggestions (Accessible) */}
      {hasSuggestions && (
        <ul
          id="search-suggestions"
          ref={listRef}
          role="listbox"
          className="absolute z-50 w-full mt-2 metal-card max-h-80 overflow-y-auto border border-metal-gray rounded-lg shadow-2xl"
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
              {/* Miniature ou fallback */}
              <div className="w-8 h-8 rounded bg-metal-gray flex items-center justify-center text-xs shrink-0 overflow-hidden">
                {band.image_url ? (
                  <img src={band.image_url} alt="" className="w-full h-full object-cover" />
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

      {/* ❌ État d'erreur */}
      {isError && showSuggestions && debouncedQuery.length > 0 && (
        <div className="absolute z-50 w-full mt-2 metal-card p-4 text-center text-sm text-red-400 border border-red-900/50 rounded-lg">
          Erreur lors de la recherche. Réessayez plus tard.
        </div>
      )}

      {/* 🔍 Aucun résultat */}
      {!isLoading && !isError && showSuggestions && debouncedQuery.length > 2 && suggestions && suggestions.length === 0 && (
        <div className="absolute z-50 w-full mt-2 metal-card p-4 text-center text-sm text-gray-400 border border-metal-gray rounded-lg">
          Aucun groupe trouvé pour "{debouncedQuery}"
        </div>
      )}
    </div>
  );
}
