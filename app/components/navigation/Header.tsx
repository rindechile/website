'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { SearchIcon } from "lucide-react";

import { Button } from "../ui/button";
import { MunicipalitySearchDialog } from "./MunicipalitySearchDialog";

export function Header() {
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
            <header className="flex flex-row justify-between items-center px-8 pt-8">
                    <Link href="/" className="flex flex-row gap-2 tablet:gap-3 items-center flex-shrink-0 transition-opacity duration-200 hover:opacity-80">
                        <Image
                            src="/logo.svg"
                            alt="Transparenta Logo"
                            width={32}
                            height={32}
                            className="fill-foreground"
                        />
                        <h1 className="text-base tablet:text-xl font-semibold whitespace-nowrap">Rinde Chile</h1>
                    </Link>
                <div className="flex flex-row gap-4 items-center">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSearchOpen(true)}
                        className="text-xs tablet:text-sm gap-2 hidden tablet:flex"
                    >
                        <SearchIcon className="size-4" />
                        <span>Buscar comuna</span>
                        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                            <span className="text-xs">⌘</span>K
                        </kbd>
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSearchOpen(true)}
                        className="text-xs gap-2 tablet:hidden"
                    >
                        <SearchIcon className="size-4" />
                    </Button>

                    <Link href="/methodology">
                        <Button size="sm" className="text-xs tablet:text-sm whitespace-nowrap">
                            Metodología
                        </Button>
                    </Link>
                </div>
            </header>

            <MunicipalitySearchDialog
                open={searchOpen}
                onOpenChange={setSearchOpen}
            />
        </>
    );
};