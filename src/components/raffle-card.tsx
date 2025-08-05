
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
import { useState, useEffect, useRef } from "react";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { CountdownTimer } from "./countdown-timer";

interface RaffleCardProps {
  raffle: Raffle;
}

const calculateTimeLeft = (targetDate: Date) => {
    const difference = +new Date(targetDate) - +new Date();
    let timeLeft = {};

    if (difference > 0) {
        timeLeft = {
            días: Math.floor(difference / (1000 * 60 * 60 * 24)),
            horas: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutos: Math.floor((difference / 1000 / 60) % 60),
            segundos: Math.floor((difference / 1000) % 60)
        };
    }
    return { timeLeft, totalSeconds: difference / 1000 };
};

const getLotteryName = (totalTickets: number): string => {
    if (totalTickets < 100) return "Pega 2";
    if (totalTickets >= 100 && totalTickets < 1000) return "Pega 3";
    if (totalTickets >= 1000 && totalTickets < 10000) return "Pega 4";
    return "Lotería Tradicional";
};

export function RaffleCard({ raffle }: RaffleCardProps) {
  const progress = (raffle.soldTickets.length / raffle.totalTickets) * 100;
  const isSoldOut = progress >= 100;
  const cardOpenSoundUrl = "https://files.catbox.moe/01lxup.mp3";


  const [totalSecondsLeft, setTotalSecondsLeft] = useState(calculateTimeLeft(raffle.drawDate).totalSeconds);

  useEffect(() => {
    const timer = setTimeout(() => {
        const { totalSeconds } = calculateTimeLeft(raffle.drawDate);
        setTotalSecondsLeft(totalSeconds);
    }, 1000);

    return () => clearTimeout(timer);
  });
  
  const drawDateFormatted = new Date(raffle.drawDate).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
  });

  const handleCardClick = () => {
    try {
        const audio = new Audio(cardOpenSoundUrl);
        audio.play();
    } catch (e) {
        console.error("Error playing sound:", e);
    }
  };

  return (
    <Card className={cn(
        "flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02]",
        isSoldOut && totalSecondsLeft > 0 && totalSecondsLeft <= 300 && "animate-pulse border-primary border-2 shadow-primary/50"
        )}
        >
      <CardHeader className="p-0">
        <Link href={`/raffles/${raffle.id}`} aria-label={raffle.title} onClick={handleCardClick}>
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
            <Link href={`/raffles/${raffle.id}`} className="hover:text-primary transition-colors" onClick={handleCardClick}>
              {raffle.title}
            </Link>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-6 pt-0">
        {isSoldOut ? (
            <CountdownTimer 
                targetDate={raffle.drawDate.toISOString()} 
                isCard={false}
                raffleInfo={{
                    prize: raffle.prize,
                    drawDate: drawDateFormatted,
                    lotteryName: getLotteryName(raffle.totalTickets),
                }}
            />
        ) : (
            <>
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
            </>
        )}
      </CardContent>
      <CardFooter className="flex-col items-start gap-4 p-6 pt-0">
         <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="mr-2 h-4 w-4" />
          <span>Sorteo: <span className="font-bold text-primary">{drawDateFormatted}</span></span>
        </div>
        <Button asChild className="w-full" disabled={isSoldOut} onClick={handleCardClick}>
          <Link href={`/raffles/${raffle.id}`}>
            {isSoldOut ? <BadgeCheck className="mr-2 h-4 w-4" /> : <Ticket className="mr-2 h-4 w-4" />}
            {isSoldOut ? '¡RIFA CERRADA!' : 'Comprar Boletos'}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
