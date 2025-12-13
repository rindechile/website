'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { SidebarIcon, Search } from 'lucide-react';

import { Button } from '@/app/components/ui/button';
import { useSidebar } from '@/app/components/ui/sidebar';
import { MunicipalitySearchDialog } from './MunicipalitySearchDialog';

export function SiteHeader() {
  const { toggleSidebar } = useSidebar();
  const [searchOpen, setSearchOpen] = useState(false);

  // Keyboard shortcut: Cmd+K (Mac) or Ctrl+K (Windows/Linux)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="bg-background sticky top-0 z-[60] flex w-full items-center">
        <div className="flex h-(--header-height) w-full items-center justify-between gap-2 px-4">
          {/* Left: Sidebar Toggle (tablet/desktop) + Logo */}
          <div className="flex items-center gap-2">
            <Button
              className="hidden h-8 w-8 md:flex"
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
            >
              <SidebarIcon />
            </Button>
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.svg"
                alt="Rinde Chile Logo"
                width={32}
                height={32}
                className="size-8"
              />
              <span className="truncate font-semibold">RindeChile</span>
            </Link>
          </div>

          {/* Right: Search Button + Sidebar Toggle (mobile) */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="size-4" />
              <span className="hidden sm:inline">Buscar comuna</span>
              <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
            <Button
              className="h-8 w-8 md:hidden"
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
            >
              <SidebarIcon />
            </Button>
          </div>
        </div>
      </header>

      <MunicipalitySearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
      />
    </>
  );
}
