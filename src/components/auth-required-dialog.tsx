
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, User, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";

interface AuthRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthRequiredDialog({ open, onOpenChange }: AuthRequiredDialogProps) {
  const router = useRouter();

  const handleNavigate = (path: string) => {
    router.push(path);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center font-headline">
            ¡Ya casi es tuyo!
          </DialogTitle>
          <DialogDescription className="text-center">
            Para finalizar tu compra, necesitas una cuenta. Es rápido, fácil y seguro.
          </DialogDescription>
        </DialogHeader>

        <div className="my-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="flex flex-col">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><User />Usuario Regular</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow space-y-2 text-sm text-muted-foreground">
                    <p>Perfecto para los entusiastas de las rifas.</p>
                    <ul className="list-disc pl-5">
                        <li>Compra boletos fácilmente.</li>
                        <li>Guarda tus números de la suerte.</li>
                        <li>Consulta tu historial de compras.</li>
                    </ul>
                </CardContent>
            </Card>
             <Card className="flex flex-col">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Users />Creador de Rifas</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow space-y-2 text-sm text-muted-foreground">
                   <p>Ideal si quieres organizar tus propias rifas.</p>
                     <ul className="list-disc pl-5">
                        <li>Publica y gestiona tus rifas.</li>
                        <li>Lleva un control de los boletos vendidos.</li>
                        <li>Panel de administración sencillo.</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
        
        <div className="p-4 bg-muted/50 rounded-lg text-center">
             <h3 className="font-semibold flex items-center justify-center gap-2 mb-2"><CreditCard />Métodos de Pago Seguros</h3>
             <p className="text-sm text-muted-foreground">
                Aceptamos las principales tarjetas de crédito y débito.
             </p>
        </div>


        <DialogFooter className="mt-6 sm:justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => handleNavigate("/login")}
            className="w-full sm:w-auto"
          >
            Ya tengo una cuenta (Iniciar Sesión)
          </Button>
          <Button
            onClick={() => handleNavigate("/signup")}
            className="w-full sm:w-auto"
          >
            Crear Nueva Cuenta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
