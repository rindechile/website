'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Fuse from 'fuse.js';
import { SearchIcon } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/app/components/ui/command';
import { getSlugFromCode } from '@/lib/region-slugs';

interface Municipality {
  id: number;
  name: string;
  region_name: string;
  region_id: number;
}

interface MunicipalitySearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMunicipalitySelect?: (municipalityId: number, regionCode: number) => void;
}

export function MunicipalitySearchDialog({
  open,
  onOpenChange,
  onMunicipalitySelect,
}: MunicipalitySearchDialogProps) {
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [searchResults, setSearchResults] = useState<Municipality[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Fetch all municipalities on mount
  useEffect(() => {
    async function fetchMunicipalities() {
      try {
        setLoading(true);
        const response = await fetch('/api/municipalities');
        if (!response.ok) throw new Error('Failed to fetch municipalities');
        const data = (await response.json()) as Municipality[];
        setMunicipalities(data);
        setSearchResults(data);
      } catch (error) {
        console.error('Error fetching municipalities:', error);
      } finally {
        setLoading(false);
      }
    }

    if (open && municipalities.length === 0) {
      fetchMunicipalities();
    }
  }, [open, municipalities.length]);

  // Fuzzy search using Fuse.js
  useEffect(() => {
    if (!searchQuery || municipalities.length === 0) {
      setSearchResults(municipalities);
      return;
    }

    const fuse = new Fuse(municipalities, {
      keys: ['name', 'region_name'],
      threshold: 0.3,
      ignoreLocation: true,
    });

    const results = fuse.search(searchQuery);
    setSearchResults(results.map((result) => result.item));
  }, [searchQuery, municipalities]);

  const handleSelect = useCallback(
    (municipality: Municipality) => {
      // Navigate to the region with municipality ID in URL
      const slug = getSlugFromCode(municipality.region_id);
      if (slug) {
        // Store municipality ID in sessionStorage to be picked up by the page
        sessionStorage.setItem('selectedMunicipalityId', municipality.id.toString());
        router.push(`/${slug}`, { scroll: false });
      }

      // Notify parent to select this municipality if callback provided
      if (onMunicipalitySelect) {
        onMunicipalitySelect(municipality.id, municipality.region_id);
      }

      // Close dialog
      onOpenChange(false);

      // Reset search
      setSearchQuery('');
    },
    [onMunicipalitySelect, onOpenChange, router]
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Buscar Comuna"
      description="Busca una comuna para ver sus datos de compras públicas. Usa las flechas del teclado para navegar y Enter para seleccionar."
      showCloseButton={true}
      className="sm:max-w-2xl"
    >
      <CommandInput
        placeholder="Buscar comuna..."
        value={searchQuery}
        onValueChange={setSearchQuery}
        autoFocus
      />
      <CommandList className="max-h-[400px]">
        {loading && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Cargando comunas...
          </div>
        )}
        {!loading && searchResults.length === 0 && (
          <CommandEmpty>No se encontraron comunas.</CommandEmpty>
        )}
        {!loading && searchResults.length > 0 && (
          <CommandGroup heading={`${searchResults.length > 50 ? '50 primeras de ' : ''}${searchResults.length} comuna${searchResults.length !== 1 ? 's' : ''}`}>
            {searchResults.slice(0, 50).map((municipality, index) => {
              // Apply stagger animation to first 10 items only
              const staggerClass = index < 10 && index < 5
                ? `animate-fade-in animate-stagger-${index + 1}`
                : index < 10
                ? 'animate-fade-in animate-stagger-5'
                : 'animate-fade-in';

              return (
                <CommandItem
                  key={municipality.id}
                  value={`${municipality.name}-${municipality.id}`}
                  onSelect={() => handleSelect(municipality)}
                  className={`cursor-pointer ${staggerClass}`}
                >
                  <SearchIcon className="mr-2 size-4 shrink-0" />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-medium truncate">{municipality.name}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {municipality.region_name}
                    </span>
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
