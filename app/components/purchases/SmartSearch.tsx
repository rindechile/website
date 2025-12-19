"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Loading } from "@/app/components/ui/loading";

interface SmartSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export function SmartSearch({
  value,
  onChange,
  placeholder = "Buscar item o codigo...",
  debounceMs = 300,
}: SmartSearchProps) {
  const [localValue, setLocalValue] = useState(value);
  const [isSearching, setIsSearching] = useState(false);

  // Sync local value with external value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced onChange with loading state
  useEffect(() => {
    // Show loading indicator when user is typing
    if (localValue !== value) {
      setIsSearching(true);
    }

    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
        setIsSearching(false);
      }
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      setIsSearching(false);
    };
  }, [localValue, debounceMs, onChange, value]);

  const handleClear = useCallback(() => {
    setLocalValue("");
    onChange("");
  }, [onChange])

  return (
    <div className="relative flex-1">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
        aria-hidden="true"
      />
      <Input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className="pl-10 pr-10 text-sm tablet:text-base font-medium"
        aria-label="Buscar por nombre de item o codigo ChileCompra"
      />
      {isSearching && (
        <div className="absolute right-10 top-1/2 -translate-y-1/2">
          <Loading size="sm" />
        </div>
      )}
      {localValue && !isSearching && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
          onClick={handleClear}
          aria-label="Limpiar busqueda"
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}
