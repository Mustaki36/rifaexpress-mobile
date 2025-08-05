import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Button } from "./ui/button";
import { PlusCircle, Shield } from "lucide-react";

export function MainNav() {
  const { user } = useAuth();
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
      
      {user?.role === 'admin' && (
        <Link
          href="/admin"
          className="transition-colors hover:text-primary font-semibold text-primary flex items-center gap-1"
        >
          <Shield className="h-4 w-4" />
          Panel de Administración
        </Link>
      )}

      {user?.role === 'creator' && (
         <>
          <Button variant="ghost" asChild>
            <Link href="/raffles/create">
              <PlusCircle className="mr-2 h-4 w-4" />
              Crear Rifa
            </Link>
          </Button>
         </>
      )}
      
      {user?.role !== 'admin' && (
        <Link
            href="/profile"
            className="transition-colors hover:text-primary text-muted-foreground"
        >
            Mi Perfil
        </Link>
      )}
    </nav>
  );
}
