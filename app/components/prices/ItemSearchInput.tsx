'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { SearchIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/app/components/ui/command';
import type { ItemSearchResult, ItemSearchResponse } from '@/types/items';

interface ItemSearchInputProps {
  autoFocus?: boolean;
  className?: string;
}

export function ItemSearchInput({ autoFocus = false, className }: ItemSearchInputProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<ItemSearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Debounced search
  React.useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/items/search?q=${encodeURIComponent(query)}`);
        const data: ItemSearchResponse = await response.json();
        if (data.success && data.data) {
          setResults(data.data);
          setOpen(true);
        }
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Handle click outside to close dropdown
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: ItemSearchResult) => {
    setOpen(false);
    setQuery('');
    router.push(`/prices/${item.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={containerRef} className={cn('relative w-full max-w-2xl', className)}>
      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && results.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar producto por nombre..."
          autoFocus={autoFocus}
          className="w-full h-14 pl-12 pr-12 text-lg rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
        />
        {loading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground animate-spin" />
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50">
          <Command className="rounded-lg border shadow-lg">
            <CommandList>
              <CommandGroup>
                {results.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.name}
                    onSelect={() => handleSelect(item)}
                    className="cursor-pointer py-3 px-4"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{item.name}</span>
                      {item.commodityName && (
                        <span className="text-xs text-muted-foreground">
                          {item.commodityName}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}

      {open && query.length >= 2 && results.length === 0 && !loading && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50">
          <Command className="rounded-lg border shadow-lg">
            <CommandList>
              <CommandEmpty>No se encontraron productos</CommandEmpty>
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}
