import Image from "next/image";
import Link from "next/link";

import { Button } from "../ui/button";

export function Header() {
    return (
        <header className="flex flex-row justify-between items-center px-4 py-3">
            <div className="flex flex-row gap-12">
                <Link href="/" className="flex flex-row gap-2 tablet:gap-3 items-center flex-shrink-0">
                    <Image
                        src="/logo.svg"
                        alt="Transparenta Logo"
                        width={32}
                        height={32}
                        className="fill-foreground"
                    />
                    <h1 className="text-base tablet:text-xl font-semibold whitespace-nowrap">Vigil Chile</h1>
                </Link>

                <Button size="sm" variant="ghost" className="text-sm hidden tablet:block whitespace-nowrap">
                    Metodología
                </Button>
            </div>

            <Button size="sm" className="text-xs tablet:text-sm whitespace-nowrap">
                Apóyanos
            </Button>
        </header>
    )
};