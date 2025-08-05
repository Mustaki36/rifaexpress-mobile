

"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { NumberGrid } from "@/components/number-grid";
import { Badge } from "@/components/ui/badge";
import { Clock, Tag, Ticket, Trophy, Info, Calendar, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRaffles } from "@/context/RaffleContext";
import { useAuth } from "@/context/AuthContext";
import { AuthRequiredDialog } from "@/components/auth-required-dialog";
import { getLotteryInfo, GetLotteryInfoOutput } from "@/ai/flows/get-lottery-info";
import { CountdownTimer } from "@/components/countdown-timer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Template from "@/components/template";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function RafflePage() {
  const params = useParams();
  const router = useRouter();
  const { raffles, reservedTickets, reserveTicket, releaseTicket, purchaseTickets, releaseTicketsForUser } = useRaffles();
  const { user, isAuthenticated, firebaseUser } = useAuth();
  const raffleId = params.id as string;
  const raffle = raffles.find((r) => r.id === raffleId);
  
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [lotteryInfo, setLotteryInfo] = useState<GetLotteryInfoOutput | null>(null);
  const [isLoadingLottery, setIsLoadingLottery] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const { toast } = useToast();

  const isRaffleSoldOut = useMemo(() => {
    if (!raffle) return false;
    return raffle.soldTickets.length >= raffle.totalTickets;
  }, [raffle]);

  useEffect(() => {
    if (isRaffleSoldOut && raffle && !lotteryInfo && !isLoadingLottery) {
        const fetchLotteryInfo = async () => {
            setIsLoadingLottery(true);
            try {
                const info = await getLotteryInfo({ totalTickets: raffle.totalTickets });
                setLotteryInfo(info);
            } catch (error) {
                console.error("Error fetching lottery info:", error);
                toast({
                    variant: "destructive",
                    title: "Error de IA",
                    description: "No se pudo obtener la información del próximo sorteo.",
                });
            } finally {
                setIsLoadingLottery(false);
            }
        };
        fetchLotteryInfo();
    }
  }, [isRaffleSoldOut, raffle, lotteryInfo, isLoadingLottery, toast]);

  const otherUsersReservedTickets = useMemo(() => {
    return reservedTickets
      .filter(t => t.raffleId === raffleId && t.userId !== user?.id)
      .map(t => t.number);
  }, [reservedTickets, raffleId, user?.id]);

  // When the component unmounts (user navigates away), release their reservations
  useEffect(() => {
    return () => {
      if (firebaseUser?.uid && raffleId) {
        releaseTicketsForUser(firebaseUser.uid, raffleId);
      }
    };
  }, [firebaseUser?.uid, raffleId, releaseTicketsForUser]);

  if (!raffle) {
    return (
      <div className="container text-center py-20">
        <h1 className="text-2xl font-bold">Rifa no encontrada</h1>
        <p>La rifa que buscas no existe o ha finalizado.</p>
      </div>
    );
  }

  const handleNumberSelect = (number: number) => {
    if (!isAuthenticated || !firebaseUser) {
      setIsAuthDialogOpen(true);
      return;
    }
    
    if (selectedNumbers.includes(number)) {
      // User is de-selecting a number
      releaseTicket(raffle.id, number, firebaseUser.uid);
      setSelectedNumbers((prev) => prev.filter((n) => n !== number));
    } else {
      // User is selecting a number, try to reserve it
      const success = reserveTicket(raffle.id, number, firebaseUser.uid);
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
  
  const handlePurchase = async () => {
    if (selectedNumbers.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debes seleccionar al menos un boleto.",
      });
      return;
    }

    if (!isAuthenticated || !firebaseUser) {
      setIsAuthDialogOpen(true);
      return;
    }
    
    setIsPurchasing(true);
    try {
        await purchaseTickets(raffle.id, selectedNumbers, firebaseUser.uid);

        // Update user's tickets in Firestore
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const newTicketRecord = {
                raffleId: raffle.id,
                raffleTitle: raffle.title,
                ticketNumbers: selectedNumbers,
            };

            const existingRaffleIndex = userData.tickets.findIndex((t: any) => t.raffleId === raffle.id);
            let updatedTickets = [...userData.tickets];

            if (existingRaffleIndex > -1) {
                const existingRecord = updatedTickets[existingRaffleIndex];
                const combinedNumbers = [...existingRecord.ticketNumbers, ...selectedNumbers].sort((a,b) => a-b);
                updatedTickets[existingRaffleIndex] = { ...existingRecord, ticketNumbers: combinedNumbers };
            } else {
                updatedTickets.push(newTicketRecord);
            }
            await updateDoc(userDocRef, { tickets: updatedTickets });
        }
        
        toast({
            title: "¡Compra exitosa!",
            description: `Has comprado ${selectedNumbers.length} boleto(s). ¡Mucha suerte!`,
        });
        setSelectedNumbers([]);
        // Optional: redirect to profile page after purchase
        // router.push('/profile');
    } catch(error) {
        const errorMessage = error instanceof Error ? error.message : "No se pudo completar la compra.";
        toast({ variant: "destructive", title: "Error en la compra", description: errorMessage });
    } finally {
        setIsPurchasing(false);
    }
  }

  const totalPrice = selectedNumbers.length * raffle.ticketPrice;

  return (
    <Template>
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
               {isRaffleSoldOut && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Badge className="text-2xl px-6 py-3 bg-destructive">¡VENDIDA!</Badge>
                </div>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold font-headline mb-4 text-primary">
              {raffle.title}
            </h1>
            <div className="flex items-center gap-2 mb-4 text-muted-foreground">
              <Tag className="h-4 w-4 text-primary"/> <span>Premio: <strong>{raffle.prize}</strong></span>
            </div>
            <div className="flex items-center gap-2 mb-4 text-muted-foreground">
              <Clock className="h-4 w-4 text-primary"/> <span>Fecha de sorteo original: <strong>{raffle.drawDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong></span>
            </div>
            <p className="text-foreground/80 leading-relaxed">
              {raffle.description}
            </p>
          </div>

          <div className="flex flex-col gap-6">
            {isRaffleSoldOut ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-amber-500"><Trophy />¡Rifa Cerrada!</CardTitle>
                        <CardDescription>
                            Todos los boletos han sido vendidos. La cuenta regresiva para el sorteo ha comenzado.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isLoadingLottery && <p>Obteniendo información del sorteo...</p>}
                        {lotteryInfo && (
                            <>
                                <CountdownTimer targetDate={lotteryInfo.nextDrawDate} />
                                <div className="text-center text-muted-foreground font-medium flex items-center justify-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  <span>
                                    {new Date(lotteryInfo.nextDrawDate).toLocaleString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' })}
                                  </span>
                                </div>
                                 <Alert>
                                    <Info className="h-4 w-4" />
                                    <AlertTitle>Sorteo Justo y Transparente</AlertTitle>
                                    <AlertDescription>
                                        El número ganador de esta rifa será el resultado del próximo sorteo de <strong>{lotteryInfo.lotteryName} de la Lotería de Puerto Rico</strong>. ¡Mucha suerte a todos!
                                    </AlertDescription>
                                </Alert>
                            </>
                        )}
                    </CardContent>
                </Card>
            ) : (
              <>
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

                <Button size="lg" onClick={handlePurchase} disabled={selectedNumbers.length === 0 || isPurchasing}>
                  {isPurchasing && <Loader2 className="animate-spin mr-2" />}
                  {isPurchasing ? 'Procesando...' : `Comprar Ahora ($${totalPrice.toFixed(2)})`}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      <AuthRequiredDialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen} />
    </Template>
  );
}
