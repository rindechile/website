'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { SidebarIcon, Search } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { Button } from '@/app/components/ui/button';
import { useSidebar } from '@/app/components/ui/sidebar';
import { MunicipalitySearchDialog } from './MunicipalitySearchDialog';
import { useScrolled } from './hooks/useScrolled';

export function SiteHeader() {
  const { toggleSidebar } = useSidebar();
  const [searchOpen, setSearchOpen] = useState(false);
  const isScrolled = useScrolled(50);

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
        <div className="flex h-(--header-height) w-full items-center justify-between gap-2 px-6 py-12 tablet:p-12">
          {/* Left: Sidebar Toggle (tablet/desktop) + Logo */}
          <div className="flex items-center gap-16">
            <Link href="/" className="flex items-center">
              <div className="relative h-[32px] w-[100px]">
                <AnimatePresence mode="wait">
                  {!isScrolled ? (
                    <motion.div
                      key="text-logo"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="h-full"
                    >
                      <Image
                        src="/logo-text.svg"
                        alt="RindeChile Logo"
                        loading="eager"
                        width={100}
                        height={32}
                        className="h-full w-auto object-contain object-left"
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="icon-logo"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center h-full"
                    >
                        <Image
                          src="/logo-icon.svg"
                          alt="RindeChile Logo"
                          loading="eager"
                          width={32}
                          height={32}
                          className="object-contain"
                        />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Link>
            <Button
              className="hidden h-8 w-8 tablet:flex"
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
              variant="ghost"
              className="gap-2"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="size-4 stroke-muted"/>
              <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-accent-foreground tablet:inline-flex">
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
