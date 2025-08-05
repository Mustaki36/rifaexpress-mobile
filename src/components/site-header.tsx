import Link from "next/link";
import { Button } from "./ui/button";
import { MainNav } from "./main-nav";
import { Ticket } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <Link href="/" className="flex items-center space-x-2">
          <Ticket className="h-6 w-6 text-primary" />
          <span className="inline-block font-bold font-headline text-xl">
            RifaExpress
          </span>
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <MainNav />
          <nav className="flex items-center space-x-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
            <Button asChild className="hidden sm:inline-flex">
              <Link href="/signup">Registrarse</Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
