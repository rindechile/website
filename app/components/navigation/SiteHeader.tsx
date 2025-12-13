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
        <div className="flex h-(--header-height) w-full items-center justify-between gap-2 py-8 px-6 tablet:p-8">
          {/* Left: Sidebar Toggle (tablet/desktop) + Logo */}
          <div className="flex items-center gap-16">
            <Link href="/">
              <Image
                src="/logo-text.svg"
                alt="Rinde Chile Logo"
                loading="eager"
                width={100}
                height={100}
              />
            </Link>
            <Button
              className="hidden h-8 w-8 md:flex"
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
            >
              <SidebarIcon className="stroke-muted" />
            </Button>
          </div>

          {/* Right: Search Button + Sidebar Toggle (mobile) */}
          <div className="flex items-center gap-2">

            {/* Search Button */}
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="size-4 stroke-muted"/>
              <span className="hidden text-muted tablet:inline">Buscar comuna</span>
              <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-accent px-1.5 font-mono text-[10px] font-medium text-accent-foreground tablet:inline-flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>

            {/* Sidebar Toggle for Mobile */}
            <Button
              className="tablet:hidden"
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
            >
              <SidebarIcon className="size-4 stroke-muted" />
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
