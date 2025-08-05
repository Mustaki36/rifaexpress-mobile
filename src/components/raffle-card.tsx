
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
import { useState, useEffect } from "react";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

interface RaffleCardProps {
  raffle: Raffle;
}

const calculateTimeLeft = (targetDate: Date) => {
    const difference = +new Date(targetDate) - +new Date();
    let timeLeft = {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    };

    if (difference > 0) {
        timeLeft = {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60)
        };
    }
    return { timeLeft, totalSeconds: difference / 1000 };
};


export function RaffleCard({ raffle }: RaffleCardProps) {
  const progress = (raffle.soldTickets.length / raffle.totalTickets) * 100;
  const isSoldOut = progress >= 100;

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(raffle.drawDate).timeLeft);
  const [totalSecondsLeft, setTotalSecondsLeft] = useState(calculateTimeLeft(raffle.drawDate).totalSeconds);

  useEffect(() => {
     if (!isSoldOut) return;

    const timer = setTimeout(() => {
        const { timeLeft, totalSeconds } = calculateTimeLeft(raffle.drawDate);
        setTimeLeft(timeLeft);
        setTotalSeconds(totalSeconds);
    }, 1000);

    return () => clearTimeout(timer);
  });

  const countdownText = `${timeLeft.days}d ${String(timeLeft.hours).padStart(2, '0')}h ${String(timeLeft.minutes).padStart(2, '0')}m ${String(timeLeft.seconds).padStart(2, '0')}s`;

  return (
    <Card className={cn(
        "flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02]",
        isSoldOut && totalSecondsLeft > 0 && totalSecondsLeft <= 300 && "animate-pulse border-primary border-2 shadow-primary/50"
        )}>
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
          {isSoldOut ? (
             <span>Sorteo en: <span className="font-bold text-primary">{countdownText}</span></span>
          ) : (
             <span>Sorteo: {raffle.drawDate.toLocaleDateString('es-ES', {day: 'numeric', month: 'long'})}</span>
          )}
        </div>
        <Button asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground disabled:bg-destructive disabled:opacity-100" disabled={isSoldOut}>
          <Link href={`/raffles/${raffle.id}`}>
            {isSoldOut ? <BadgeCheck className="mr-2 h-4 w-4" /> : <Ticket className="mr-2 h-4 w-4" />}
            {isSoldOut ? '¡RIFA CERRADA!' : 'Comprar Boletos'}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
