
"use client";

import { useState } from "react";
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
import { Trash2, Trophy } from "lucide-react";
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
import { useResults } from "@/context/ResultsContext";

export function HistoryList() {
  const { toast } = useToast();
  const { results, deleteResult } = useResults();
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [resultToDelete, setResultToDelete] = useState<string | null>(null);

  const confirmDelete = (resultId: string) => {
    setResultToDelete(resultId);
    setIsAlertOpen(true);
  };

  const handleDelete = () => {
    if (resultToDelete) {
      deleteResult(resultToDelete);
      toast({
        title: "Resultado eliminado",
        description: "El resultado de la rifa ha sido eliminado del historial.",
      });
    }
    setIsAlertOpen(false);
    setResultToDelete(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Historial de Rifas</CardTitle>
          <CardDescription>
            Visualiza y elimina los resultados de rifas pasadas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rifa</TableHead>
                  <TableHead className="text-center">Número Ganador</TableHead>
                  <TableHead>Ganador</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.length > 0 ? results.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell className="font-medium">{result.raffleTitle}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="default" className="text-lg bg-primary">
                        <Trophy className="mr-2 h-4 w-4" />
                        {result.winningNumber.toString().padStart(3, '0')}
                      </Badge>
                    </TableCell>
                    <TableCell>{result.winnerName}</TableCell>
                    <TableCell>{result.drawDate}</TableCell>
                    <TableCell className="text-right">
                       <Button variant="destructive" size="sm" onClick={() => confirmDelete(result.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                       </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                            No hay resultados en el historial.
                        </TableCell>
                    </TableRow>
                )}
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
              Esta acción no se puede deshacer. Esto eliminará permanentemente el resultado de la rifa del historial.
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
