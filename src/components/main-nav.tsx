import Link from "next/link";
import { cn } from "@/lib/utils";

export function MainNav() {
  return (
    <nav className="hidden md:flex items-center space-x-6 text-sm font-medium mx-6">
      <Link
        href="/"
        className="transition-colors hover:text-primary"
      >
        Rifas
      </Link>
      <Link
        href="/results"
        className="transition-colors hover:text-primary text-muted-foreground"
      >
        Resultados
      </Link>
      <Link
        href="/profile"
        className="transition-colors hover:text-primary text-muted-foreground"
      >
        Mi Perfil
      </Link>
    </nav>
  );
}
