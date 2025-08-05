"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { MOCK_RAFFLES } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NumberGrid } from "@/components/number-grid";
import { Badge } from "@/components/ui/badge";
import { Clock, Tag, Ticket } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function RafflePage() {
  const params = useParams();
  const raffle = MOCK_RAFFLES.find((r) => r.id === params.id);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const { toast } = useToast();

  if (!raffle) {
    return (
      <div className="container text-center py-20">
        <h1 className="text-2xl font-bold">Rifa no encontrada</h1>
        <p>La rifa que buscas no existe o ha finalizado.</p>
      </div>
    );
  }

  const handleNumberSelect = (number: number) => {
    setSelectedNumbers((prev) =>
      prev.includes(number)
        ? prev.filter((n) => n !== number)
        : [...prev, number]
    );
  };
  
  const handlePurchase = () => {
    if (selectedNumbers.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debes seleccionar al menos un boleto.",
      });
      return;
    }
    
    toast({
        title: "¡Compra exitosa!",
        description: `Has comprado ${selectedNumbers.length} boleto(s). ¡Mucha suerte!`,
    });
    // In a real app, you would handle payment and update sold tickets here.
    setSelectedNumbers([]);
  }

  const totalPrice = selectedNumbers.length * raffle.ticketPrice;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <div>
          <div className="relative aspect-video w-full overflow-hidden rounded-lg shadow-lg mb-6">
            <Image
              src={raffle.image}
              alt={raffle.prize}
              fill
              className="object-cover"
              data-ai-hint={raffle.aiHint}
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold font-headline mb-4 text-primary">
            {raffle.title}
          </h1>
          <div className="flex items-center gap-2 mb-4 text-muted-foreground">
             <Tag className="h-4 w-4 text-primary"/> <span>Premio: <strong>{raffle.prize}</strong></span>
          </div>
           <div className="flex items-center gap-2 mb-4 text-muted-foreground">
             <Clock className="h-4 w-4 text-primary"/> <span>Sorteo: <strong>{raffle.drawDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong></span>
          </div>
          <p className="text-foreground/80 leading-relaxed">
            {raffle.description}
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="text-primary"/>
                Selecciona tus boletos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <NumberGrid
                totalTickets={raffle.totalTickets}
                soldTickets={raffle.soldTickets}
                selectedNumbers={selectedNumbers}
                onSelectNumber={handleNumberSelect}
                pricePerTicket={raffle.ticketPrice}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumen de compra</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedNumbers.length > 0 ? (
                <>
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Boletos seleccionados:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedNumbers.sort((a,b) => a-b).map(num => 
                        <Badge key={num} variant="secondary" className="text-base">{num.toString().padStart(3, '0')}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                      Total: ${totalPrice}
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">
                  Aún no has seleccionado ningún boleto.
                </p>
              )}
            </CardContent>
          </Card>

          <Button size="lg" onClick={handlePurchase} disabled={selectedNumbers.length === 0}>
            Comprar Ahora (${totalPrice})
          </Button>
        </div>
      </div>
    </div>
  );
}
