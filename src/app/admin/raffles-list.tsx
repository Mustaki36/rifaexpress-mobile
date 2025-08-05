"use client";

import { MOCK_RAFFLES } from "@/lib/data";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Users, Trophy } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

export function RafflesList() {
    const { toast } = useToast();

    const handleSelectWinner = (raffleId: string) => {
        // Here you would call the ensureFairness flow
        toast({
            title: "Función no implementada",
            description: "La selección de ganador se implementará en el futuro.",
        });
        console.log("Select winner for", raffleId);
    }
    
    const handleViewEntries = (raffleId: string) => {
         toast({
            title: "Función no implementada",
            description: "La visualización de participantes se implementará en el futuro.",
        });
        console.log("View entries for", raffleId);
    }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestionar Rifas</CardTitle>
        <CardDescription>
          Visualiza, edita y selecciona ganadores para tus rifas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rifa</TableHead>
                <TableHead>Premio</TableHead>
                <TableHead className="text-center">Progreso</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_RAFFLES.map((raffle) => {
                const progress = (raffle.soldTickets.length / raffle.totalTickets) * 100;
                return (
                  <TableRow key={raffle.id}>
                    <TableCell className="font-medium">{raffle.title}</TableCell>
                    <TableCell>{raffle.prize}</TableCell>
                    <TableCell className="text-center">
                        <Badge variant={progress > 80 ? 'destructive' : 'secondary'}>
                            {raffle.soldTickets.length} / {raffle.totalTickets}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menú</span>
                                <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewEntries(raffle.id)}>
                                    <Users className="mr-2 h-4 w-4" />
                                    <span>Ver Participantes</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSelectWinner(raffle.id)}>
                                    <Trophy className="mr-2 h-4 w-4" />
                                    <span>Elegir Ganador</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
