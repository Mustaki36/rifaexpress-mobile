"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy, ShieldCheck } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useResults } from "@/context/ResultsContext";

export default function ResultsPage() {
  const { results } = useResults();
  return (
    <div className="container mx-auto px-4 py-8">
      <section className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4 text-primary">
          Resultados de Sorteos
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Consulta los ganadores de nuestras rifas anteriores. ¡Tú podrías ser el próximo!
        </p>
      </section>

      <div className="border rounded-lg">
        <TooltipProvider>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rifa</TableHead>
                <TableHead className="text-center">Número Ganador</TableHead>
                <TableHead>Ganador</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Prueba de Justicia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.length > 0 ? (
                results.map((result) => (
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
                      <Tooltip>
                        <TooltipTrigger>
                          <ShieldCheck className="h-6 w-6 text-primary cursor-pointer inline-block" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs max-w-xs break-all font-mono">
                            {result.fairnessProof}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        Aún no hay resultados para mostrar.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TooltipProvider>
      </div>
    </div>
  );
}
