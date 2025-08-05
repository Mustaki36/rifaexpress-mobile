
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Info } from 'lucide-react';

interface CountdownTimerProps {
    targetDate: string; // ISO string
    isCard?: boolean;
    raffleInfo?: {
        prize: string;
        drawDate: string;
    }
}

const calculateTimeLeft = (targetDate: string) => {
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

    return timeLeft;
};

export function CountdownTimer({ targetDate, isCard = true, raffleInfo }: CountdownTimerProps) {
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(targetDate));

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft(targetDate));
        }, 1000);

        return () => clearTimeout(timer);
    });

    const timerComponents: JSX.Element[] = [];

    Object.keys(timeLeft).forEach((interval) => {
        const value = timeLeft[interval as keyof typeof timeLeft];
        if (!value && value !== 0) return; // Skip if interval doesn't exist

        timerComponents.push(
            <div key={interval} className="flex flex-col items-center">
                <span className="text-3xl md:text-4xl font-bold text-primary tabular-nums">
                    {String(value).padStart(2, '0')}
                </span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">{interval}</span>
            </div>
        );
    });

    const finishedContent = (
         <div className="text-center text-muted-foreground py-4 space-y-2">
            <Info className="mx-auto h-8 w-8 text-primary"/>
            <p className="font-semibold">¡Sorteo en curso!</p>
            {raffleInfo && (
                <p className="text-xs">
                    El ganador para <span className="font-bold">{raffleInfo.prize}</span> se anunciará pronto.
                </p>
            )}
        </div>
    )

    const content = (
         <div className="flex justify-around">
            {timerComponents.length ? timerComponents : finishedContent}
        </div>
    );
    
    if (!isCard) {
        return content;
    }

    return (
        <Card className="w-full">
            <CardContent className="p-4">
              {content}
            </CardContent>
        </Card>
    );
}
