
"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { MainNav } from "./main-nav";
import { Ticket, LogOut, PlusCircle, Shield } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BackgroundMusicPlayer } from "./background-music-player";
import { Skeleton } from "./ui/skeleton";

export function SiteHeader() {
  const { isAuthenticated, user, logout, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };
  
  const homeLink = user?.role === 'admin' ? '/admin' : '/';

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <Link href={homeLink} className="flex items-center space-x-2">
          <Ticket className="h-6 w-6 text-primary" />
          <span className="inline-block font-bold font-headline text-xl">
            RifaExpress
          </span>
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <MainNav />
          <nav className="flex items-center space-x-2">
            <BackgroundMusicPlayer />
            {loading ? (
                <Skeleton className="h-8 w-24 rounded-md" />
            ) : (
              <>
                {isAuthenticated && user && user.role !== 'admin' ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{user.name}</p>
                          <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => router.push('/profile')}>
                        Mi Perfil
                      </DropdownMenuItem>
                       {(user.role === 'creator' || user.role === 'admin') && (
                        <DropdownMenuItem onClick={() => router.push('/raffles/create')}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Crear Rifa
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Cerrar Sesión</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : !user ? (
                  <>
                    <Button variant="ghost" asChild>
                      <Link href="/login">Iniciar Sesión</Link>
                    </Button>
                    <Button asChild className="hidden sm:inline-flex">
                      <Link href="/signup">Registrarse</Link>
                    </Button>
                  </>
                ) : null}
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

    