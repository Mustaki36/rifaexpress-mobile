
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";

interface CountdownTimerProps {
    targetDate: string; // ISO string
    isCard?: boolean;
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

export function CountdownTimer({ targetDate, isCard = true }: CountdownTimerProps) {
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

    const content = (
         <div className="flex justify-around">
            {timerComponents.length ? timerComponents : <span className="py-8">¡El sorteo ha comenzado!</span>}
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
