
"use client";

import { useState, useEffect, useMemo } from "react";
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
import { MoreHorizontal, Users, Trophy, Pencil, Trash2, Search, Filter, PlusCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
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
import { useRaffles } from "@/context/RaffleContext";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { Raffle } from "@/lib/types";
import { useRouter } from "next/navigation";

type SortOption = "recent" | "oldest" | "highest_progress" | "lowest_progress" | "price_asc" | "price_desc";

export function RafflesList() {
  const { toast } = useToast();
  const router = useRouter();
  const { raffles, deleteRaffle } = useRaffles();
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [raffleToDelete, setRaffleToDelete] = useState<string | null>(null);
  const [selectedRaffles, setSelectedRaffles] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("recent");

  const filteredAndSortedRaffles = useMemo(() => {
    let filtered = raffles.filter(raffle =>
      raffle.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      raffle.prize.toLowerCase().includes(searchTerm.toLowerCase())
    );

    switch (sortOption) {
      case "recent":
        filtered.sort((a, b) => new Date(b.drawDate).getTime() - new Date(a.drawDate).getTime());
        break;
      case "oldest":
        filtered.sort((a, b) => new Date(a.drawDate).getTime() - new Date(b.drawDate).getTime());
        break;
      case "highest_progress":
        filtered.sort((a, b) => (b.soldTickets.length / b.totalTickets) - (a.soldTickets.length / a.totalTickets));
        break;
      case "lowest_progress":
        filtered.sort((a, b) => (a.soldTickets.length / a.totalTickets) - (b.soldTickets.length / b.totalTickets));
        break;
      case "price_asc":
        filtered.sort((a, b) => a.ticketPrice - b.ticketPrice);
        break;
      case "price_desc":
        filtered.sort((a, b) => b.ticketPrice - a.ticketPrice);
        break;
    }

    return filtered;
  }, [searchTerm, raffles, sortOption]);


  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRaffles(filteredAndSortedRaffles.map((r) => r.id));
    } else {
      setSelectedRaffles([]);
    }
  };

  const handleSelectRow = (raffleId: string, checked: boolean) => {
    if (checked) {
      setSelectedRaffles((prev) => [...prev, raffleId]);
    } else {
      setSelectedRaffles((prev) => prev.filter((id) => id !== raffleId));
    }
  };

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
    router.push(`/raffles/edit/${raffleId}`);
  }

  const confirmDelete = (raffleId: string) => {
    setRaffleToDelete(raffleId);
    setIsAlertOpen(true);
  };

  const handleDelete = () => {
    if (raffleToDelete) {
      deleteRaffle(raffleToDelete);
      setSelectedRaffles(prev => prev.filter(id => id !== raffleToDelete));
      toast({
        title: "Rifa eliminada",
        description: "La rifa ha sido eliminada exitosamente.",
      });
    } else if (selectedRaffles.length > 0) {
        selectedRaffles.forEach(id => deleteRaffle(id));
        toast({
            title: `${selectedRaffles.length} rifas eliminadas`,
            description: "Las rifas seleccionadas han sido eliminadas."
        });
        setSelectedRaffles([]);
    }
    setIsAlertOpen(false);
    setRaffleToDelete(null);
  };

  const confirmDeleteSelected = () => {
    if (selectedRaffles.length > 0) {
      setRaffleToDelete(null);
      setIsAlertOpen(true);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
               <div>
                    <CardTitle>Gestionar Rifas</CardTitle>
                    <CardDescription>
                    Visualiza, edita y selecciona ganadores para tus rifas.
                    </CardDescription>
                </div>
                 <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button onClick={() => router.push('/raffles/create')}>
                        <PlusCircle className="mr-2" />
                        Crear Nueva Rifa
                    </Button>
                    <div className="relative flex-grow sm:flex-grow-0">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Buscar rifa o premio..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full sm:w-64 pl-10"
                        />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                          <Filter className="mr-2 h-4 w-4" />
                          Filtrar
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
                        <DropdownMenuRadioGroup value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
                          <DropdownMenuRadioItem value="recent">Más Recientes</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="oldest">Más Antiguas</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="highest_progress">Mayor Progreso</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="lowest_progress">Menor Progreso</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="price_desc">Más Caro</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="price_asc">Más Barato</DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                </div>
           </div>
            {selectedRaffles.length > 0 && (
                <div className="mt-4">
                    <Button variant="destructive" onClick={confirmDeleteSelected}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar ({selectedRaffles.length})
                    </Button>
                </div>
            )}
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead padding="checkbox" className="w-12">
                    <Checkbox
                      checked={filteredAndSortedRaffles.length > 0 && selectedRaffles.length === filteredAndSortedRaffles.length}
                      onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                      aria-label="Seleccionar todo"
                    />
                  </TableHead>
                  <TableHead>Rifa</TableHead>
                  <TableHead>Premio</TableHead>
                  <TableHead className="text-center">Progreso</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedRaffles.map((raffle) => {
                  const progress =
                    (raffle.soldTickets.length / raffle.totalTickets) * 100;
                  const isSelected = selectedRaffles.includes(raffle.id);
                  return (
                    <TableRow key={raffle.id} data-state={isSelected ? "selected" : ""}>
                       <TableCell padding="checkbox">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectRow(raffle.id, Boolean(checked))}
                          aria-label={`Seleccionar rifa ${raffle.title}`}
                        />
                      </TableCell>
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
