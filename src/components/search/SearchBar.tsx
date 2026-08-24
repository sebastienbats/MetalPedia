'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchBands } from '@/api/hooks';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { data: suggestions, isLoading } = useSearchBands(debouncedQuery);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search/${encodeURIComponent(query.trim())}`);
      setShowSuggestions(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Rechercher un groupe..."
          className="metal-input"
        />
      </form>

      {showSuggestions && suggestions && suggestions.length > 0 && (
        <div className="absolute z-40 w-full mt-2 metal-card max-h-96 overflow-y-auto">
          {suggestions.slice(0, 8).map((band) => (
            <button
              key={band.id}
              onClick={() => {
                router.push(`/band/${band.id}`);
                setShowSuggestions(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-metal-gray transition-colors"
            >
              <p className="font-semibold">{band.name}</p>
              <p className="text-xs text-gray-400">{band.genre}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
