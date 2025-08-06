
"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RaffleCard } from "@/components/raffle-card";
import { Filter, Search } from "lucide-react";
import { useRaffles } from "@/context/RaffleContext";
import { useAuth } from "@/context/AuthContext";
import type { Raffle } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Template from "@/components/template";
import { RaffleCardSkeleton } from "@/components/raffle-card-skeleton";

type SortOption = "recent" | "oldest" | "price_asc" | "price_desc";

export default function Home() {
  const { raffles, loading } = useRaffles();
  const { allUsers } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("recent");

  const filteredAndSortedRaffles = useMemo(() => {
    let filtered = raffles.filter(raffle => {
      const creator = allUsers.find(u => u.id === raffle.creatorId);
      const creatorName = creator ? creator.name.toLowerCase() : '';
      const searchLower = searchTerm.toLowerCase();
      
      return (
        raffle.title.toLowerCase().includes(searchLower) ||
        raffle.prize.toLowerCase().includes(searchLower) ||
        creatorName.includes(searchLower)
      );
    });

    switch (sortOption) {
      case "recent":
        filtered.sort((a, b) => b.drawDate.getTime() - a.drawDate.getTime());
        break;
      case "oldest":
        filtered.sort((a, b) => a.drawDate.getTime() - b.drawDate.getTime());
        break;
      case "price_asc":
        filtered.sort((a, b) => a.ticketPrice - b.ticketPrice);
        break;
      case "price_desc":
        filtered.sort((a, b) => b.ticketPrice - a.ticketPrice);
        break;
    }

    return filtered;
  }, [searchTerm, raffles, sortOption, allUsers]);

  return (
    <Template>
      <div className="container mx-auto px-4 py-8">
        <section className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4 text-primary">
            Explora Nuestras Rifas
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Participa en nuestras emocionantes rifas y gana premios increíbles.
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mt-4">
            ¡La suerte está de tu lado!
          </p>
        </section>

        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Buscar por rifa, premio o creador..." 
              className="pl-10" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Ordenar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
                <DropdownMenuRadioItem value="recent">Más Recientes</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="oldest">Más Antiguas</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="price_desc">Más Caro</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="price_asc">Más Barato</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => <RaffleCardSkeleton key={index} />)
          ) : (
            filteredAndSortedRaffles.map((raffle) => (
              <RaffleCard key={raffle.id} raffle={raffle} />
            ))
          )}
        </div>
      </div>
    </Template>
  );
}
