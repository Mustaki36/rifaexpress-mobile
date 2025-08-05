"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";

interface CountdownTimerProps {
    targetDate: string; // ISO string
}

const calculateTimeLeft = (targetDate: string) => {
    const difference = +new Date(targetDate) - +new Date();
    let timeLeft = {};

    if (difference > 0) {
        timeLeft = {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60)
        };
    }

    return timeLeft;
};

export function CountdownTimer({ targetDate }: CountdownTimerProps) {
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(targetDate));

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft(targetDate));
        }, 1000);

        return () => clearTimeout(timer);
    });

    const timerComponents: JSX.Element[] = [];

    Object.keys(timeLeft).forEach((interval) => {
        if (!timeLeft[interval as keyof typeof timeLeft]) {
             if (timerComponents.length > 0) { // Add 0 if it's not the first element and value is 0
                 timerComponents.push(
                    <div key={interval} className="flex flex-col items-center">
                        <span className="text-4xl md:text-6xl font-bold text-primary tabular-nums">
                            {String(0).padStart(2, '0')}
                        </span>
                        <span className="text-sm md:text-base text-muted-foreground uppercase tracking-wider">{interval}</span>
                    </div>
                );
             }
        } else {
            timerComponents.push(
                <div key={interval} className="flex flex-col items-center">
                    <span className="text-4xl md:text-6xl font-bold text-primary tabular-nums">
                        {String(timeLeft[interval as keyof typeof timeLeft]).padStart(2, '0')}
                    </span>
                    <span className="text-sm md:text-base text-muted-foreground uppercase tracking-wider">{interval}</span>
                </div>
            );
        }
    });

    return (
        <Card className="w-full">
            <CardContent className="p-6">
                <div className="flex justify-around">
                     {timerComponents.length ? timerComponents : <span>¡El sorteo ha comenzado!</span>}
                </div>
            </CardContent>
        </Card>
    );
}
