
'use client';

import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, Ticket, BadgeCheck } from "lucide-react";
import type { Raffle } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "./ui/badge";

interface RaffleCardProps {
  raffle: Raffle;
}

export function RaffleCard({ raffle }: RaffleCardProps) {
  const progress = (raffle.soldTickets.length / raffle.totalTickets) * 100;
  const isSoldOut = progress >= 100;

  const timeRemaining = formatDistanceToNow(raffle.drawDate, {
    addSuffix: true,
    locale: es,
  });

  return (
    <Card className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
      <CardHeader className="p-0">
        <Link href={`/raffles/${raffle.id}`} aria-label={raffle.title}>
          <div className="relative h-48 w-full">
            <Image
              src={raffle.image}
              alt={raffle.prize}
              fill
              className="object-cover"
              data-ai-hint={raffle.aiHint}
            />
             {isSoldOut && (
                <Badge className="absolute top-2 right-2 text-md px-3 py-1 bg-destructive">¡VENDIDA!</Badge>
              )}
          </div>
        </Link>
        <div className="p-6 pb-2">
          <CardTitle className="font-headline text-xl leading-tight">
            <Link href={`/raffles/${raffle.id}`} className="hover:text-primary transition-colors">
              {raffle.title}
            </Link>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-6 pt-0">
        <div className="mb-4">
          <p className="text-2xl font-bold text-primary">
            ${raffle.ticketPrice}
            <span className="text-sm font-normal text-muted-foreground"> / boleto</span>
          </p>
        </div>
        <div>
          <div className="flex justify-between items-center text-sm text-muted-foreground mb-1">
            <span>Boletos vendidos</span>
            <span>
              {raffle.soldTickets.length} / {raffle.totalTickets}
            </span>
          </div>
          <Progress value={progress} aria-label={`${progress.toFixed(0)}% de boletos vendidos`} />
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-4 p-6 pt-0">
        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="mr-2 h-4 w-4" />
          <span>Sorteo {timeRemaining}</span>
        </div>
        <Button asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground disabled:bg-destructive disabled:opacity-100" disabled={isSoldOut}>
          <Link href={`/raffles/${raffle.id}`}>
            {isSoldOut ? <BadgeCheck className="mr-2 h-4 w-4" /> : <Ticket className="mr-2 h-4 w-4" />}
            {isSoldOut ? '¡VENDIDA!' : 'Comprar Boletos'}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
