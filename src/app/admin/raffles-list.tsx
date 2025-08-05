"use client";

import { useState } from "react";
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
import { MoreHorizontal, Users, Trophy, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import type { Raffle } from "@/lib/types";

export function RafflesList() {
  const { toast } = useToast();
  const [raffles, setRaffles] = useState<Raffle[]>(MOCK_RAFFLES);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [raffleToDelete, setRaffleToDelete] = useState<string | null>(null);

  const handleSelectWinner = (raffleId: string) => {
    toast({
      title: "Función no implementada",
      description: "La selección de ganador se implementará en el futuro.",
    });
    console.log("Select winner for", raffleId);
  };

  const handleViewEntries = (raffleId: string) => {
    toast({
      title: "Función no implementada",
      description:
        "La visualización de participantes se implementará en el futuro.",
    });
    console.log("View entries for", raffleId);
  };
  
  const handleEdit = (raffleId: string) => {
    toast({
        title: "Función no implementada",
        description: "La edición de rifas se implementará en el futuro."
    });
    console.log("Edit raffle", raffleId);
  }

  const confirmDelete = (raffleId: string) => {
    setRaffleToDelete(raffleId);
    setIsAlertOpen(true);
  };

  const handleDelete = () => {
    if (raffleToDelete) {
      setRaffles(raffles.filter((r) => r.id !== raffleToDelete));
      toast({
        title: "Rifa eliminada",
        description: "La rifa ha sido eliminada exitosamente.",
      });
    }
    setIsAlertOpen(false);
    setRaffleToDelete(null);
  };

  return (
    <>
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
                {raffles.map((raffle) => {
                  const progress =
                    (raffle.soldTickets.length / raffle.totalTickets) * 100;
                  return (
                    <TableRow key={raffle.id}>
                      <TableCell className="font-medium">
                        {raffle.title}
                      </TableCell>
                      <TableCell>{raffle.prize}</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={progress > 80 ? "destructive" : "secondary"}
                        >
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
                            <DropdownMenuItem
                              onClick={() => handleViewEntries(raffle.id)}
                            >
                              <Users className="mr-2 h-4 w-4" />
                              <span>Ver Participantes</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleSelectWinner(raffle.id)}
                            >
                              <Trophy className="mr-2 h-4 w-4" />
                              <span>Elegir Ganador</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                             <DropdownMenuItem onClick={() => handleEdit(raffle.id)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                <span>Editar</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => confirmDelete(raffle.id)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Eliminar</span>
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
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la rifa y todos sus datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
