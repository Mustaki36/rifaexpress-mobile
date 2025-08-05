import { useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface NumberGridProps {
  totalTickets: number;
  soldTickets: number[];
  reservedTickets: number[];
  selectedNumbers: number[];
  onSelectNumber: (number: number) => void;
  pricePerTicket: number;
}

export function NumberGrid({
  totalTickets,
  soldTickets,
  reservedTickets,
  selectedNumbers,
  onSelectNumber,
  pricePerTicket,
}: NumberGridProps) {
  const numbers = Array.from({ length: totalTickets }, (_, i) => i + 1);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleSelect = (number: number) => {
    onSelectNumber(number);
    // Play sound only when selecting, not deselecting
    if (!selectedNumbers.includes(number) && audioRef.current) {
      audioRef.current.load();
      audioRef.current.play();
    }
  }

  return (
    <TooltipProvider delayDuration={100}>
        <audio ref={audioRef} src="https://actions.google.com/sounds/v1/collectables/coin_collect.ogg" preload="auto"></audio>
      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 max-h-80 overflow-y-auto p-2 bg-muted/50 rounded-md">
        {numbers.map((number) => {
          const isSold = soldTickets.includes(number);
          const isReserved = !isSold && reservedTickets.includes(number);
          const isSelected = selectedNumbers.includes(number);
          const formattedNumber = number.toString().padStart(3, '0');

          const isDisabled = isSold || isReserved;

          return (
            <Tooltip key={number}>
              <TooltipTrigger asChild>
                <Button
                  variant={isSelected ? "default" : isDisabled ? "secondary" : "outline"}
                  size="icon"
                  className={cn(
                    "h-9 w-9 text-xs font-bold transition-all duration-200",
                    isSelected && "bg-primary text-primary-foreground scale-110 shadow-lg",
                    isSold && "cursor-not-allowed opacity-50 bg-secondary/50 line-through",
                    isReserved && "cursor-not-allowed opacity-50 bg-amber-200 text-amber-800",
                    !isDisabled && !isSelected && "hover:bg-accent/50"
                  )}
                  onClick={() => handleSelect(number)}
                  disabled={isDisabled}
                  aria-label={`Boleto número ${number}`}
                >
                  {formattedNumber}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Boleto #{formattedNumber}</p>
                 {isSold ? (
                  <p className="font-semibold text-destructive">Vendido</p>
                ) : isReserved ? (
                    <p className="font-semibold text-amber-600">Reservado</p>
                ) : (
                  <p className="font-semibold">${pricePerTicket}</p>
                )}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
