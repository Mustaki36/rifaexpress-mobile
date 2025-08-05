
"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NumberGrid } from "@/components/number-grid";
import { Badge } from "@/components/ui/badge";
import { Clock, Tag, Ticket } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRaffles } from "@/context/RaffleContext";
import { useAuth } from "@/context/AuthContext";
import { AuthRequiredDialog } from "@/components/auth-required-dialog";

export default function RafflePage() {
  const params = useParams();
  const { raffles, reservedTickets, reserveTicket, releaseTicket, purchaseTickets, releaseTicketsForUser } = useRaffles();
  const { user, isAuthenticated, editUser } = useAuth();
  const raffleId = params.id as string;
  const raffle = raffles.find((r) => r.id === raffleId);
  
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const { toast } = useToast();

  const otherUsersReservedTickets = useMemo(() => {
    return reservedTickets
      .filter(t => t.raffleId === raffleId && t.userId !== user?.id)
      .map(t => t.number);
  }, [reservedTickets, raffleId, user?.id]);

  // When the component unmounts (user navigates away), release their reservations
  useEffect(() => {
    return () => {
      if (user?.id && raffleId) {
        releaseTicketsForUser(user.id, raffleId);
      }
    };
  }, [user?.id, raffleId, releaseTicketsForUser]);

  if (!raffle) {
    return (
      <div className="container text-center py-20">
        <h1 className="text-2xl font-bold">Rifa no encontrada</h1>
        <p>La rifa que buscas no existe o ha finalizado.</p>
      </div>
    );
  }

  const handleNumberSelect = (number: number) => {
    if (!isAuthenticated || !user) {
      setIsAuthDialogOpen(true);
      return;
    }
    
    if (selectedNumbers.includes(number)) {
      // User is de-selecting a number
      releaseTicket(raffle.id, number, user.id);
      setSelectedNumbers((prev) => prev.filter((n) => n !== number));
    } else {
      // User is selecting a number, try to reserve it
      const success = reserveTicket(raffle.id, number, user.id);
      if (success) {
        setSelectedNumbers((prev) => [...prev, number]);
      } else {
        toast({
          variant: "destructive",
          title: "Boleto no disponible",
          description: "Este boleto acaba de ser vendido o reservado por otra persona.",
        });
      }
    }
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

    if (!isAuthenticated || !user) {
      setIsAuthDialogOpen(true);
      return;
    }
    
    purchaseTickets(raffle.id, selectedNumbers, user.id);

    // This part is tricky because it crosses contexts.
    // In a real app, an API call would handle this atomically.
    // Here, we'll manually update the user in the AuthContext.
    const newTicketRecord = {
        raffleId: raffle.id,
        raffleTitle: raffle.title,
        ticketNumbers: selectedNumbers,
    };

    const existingRaffleIndex = user.tickets.findIndex(t => t.raffleId === raffle.id);
    let updatedTickets = [...user.tickets];

    if (existingRaffleIndex > -1) {
        // User already has tickets for this raffle, add new ones
        const existingRecord = updatedTickets[existingRaffleIndex];
        const combinedNumbers = [...existingRecord.ticketNumbers, ...selectedNumbers].sort((a,b) => a-b);
        updatedTickets[existingRaffleIndex] = { ...existingRecord, ticketNumbers: combinedNumbers };
    } else {
        // First time user buys tickets for this raffle
        updatedTickets.push(newTicketRecord);
    }
    
    editUser(user.id, { tickets: updatedTickets });

    toast({
        title: "¡Compra exitosa!",
        description: `Has comprado ${selectedNumbers.length} boleto(s). ¡Mucha suerte!`,
    });
    setSelectedNumbers([]);
  }

  const totalPrice = selectedNumbers.length * raffle.ticketPrice;

  return (
    <>
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
                  reservedTickets={otherUsersReservedTickets}
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
                        Total: ${totalPrice.toFixed(2)}
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
              Comprar Ahora (${totalPrice.toFixed(2)})
            </Button>
          </div>
        </div>
      </div>
      <AuthRequiredDialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen} />
    </>
  );
}
