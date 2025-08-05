import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RaffleCard } from "@/components/raffle-card";
import { MOCK_RAFFLES } from "@/lib/data";
import { Filter, Search } from "lucide-react";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <section className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4 text-primary">
          Explora Nuestras Rifas
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Participa en nuestras emocionantes rifas y gana premios increíbles. ¡La suerte está de tu lado!
        </p>
      </section>

      <div className="mb-8 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Buscar rifa por nombre o premio..." className="pl-10" />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filtrar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {MOCK_RAFFLES.map((raffle) => (
          <RaffleCard key={raffle.id} raffle={raffle} />
        ))}
      </div>
    </div>
  );
}
