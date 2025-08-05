"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Ticket, Phone, MapPin, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return (
        <div className="container text-center py-20">
            <h1 className="text-2xl font-bold mb-4">Acceso Denegado</h1>
            <p className="text-muted-foreground mb-6">Debes iniciar sesión para ver tu perfil.</p>
            <Button asChild>
                <Link href="/login">Iniciar Sesión</Link>
            </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <section className="mb-12 flex flex-col items-center text-center">
        <Avatar className="h-24 w-24 mb-4 border-4 border-primary">
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex items-center gap-2">
            <h1 className="text-4xl font-bold font-headline text-primary">{user.name}</h1>
            {user.isVerified && <ShieldCheck className="h-8 w-8 text-green-500" />}
        </div>
        <p className="text-muted-foreground">{user.email}</p>
      </section>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><User /> Información Personal</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h3 className="font-semibold flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground"/>Nombre</h3>
                        <p className="text-muted-foreground pl-6">{user.name}</p>
                    </div>
                     <div>
                        <h3 className="font-semibold flex items-center gap-2"><Ticket className="w-4 h-4 text-muted-foreground"/>Email</h3>
                        <p className="text-muted-foreground pl-6">{user.email}</p>
                    </div>
                     <div>
                        <h3 className="font-semibold flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground"/>Teléfono</h3>
                        <p className="text-muted-foreground pl-6">{user.phone || 'No proporcionado'}</p>
                    </div>
                     <div>
                        <h3 className="font-semibold flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground"/>Dirección</h3>
                        <p className="text-muted-foreground pl-6">{user.address || 'No proporcionada'}</p>
                    </div>
                </CardContent>
            </Card>
        </div>
        <div className="md:col-span-2">
            <Card>
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Ticket /> Mis Boletos Comprados</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {user.tickets.length > 0 ? user.tickets.map(raffle => (
                        <div key={raffle.raffleId} className="p-4 border rounded-md bg-background">
                            <h4 className="font-semibold mb-3 text-primary">{raffle.raffleTitle}</h4>
                            <div className="flex flex-wrap gap-2">
                                {raffle.ticketNumbers.map(num => (
                                    <Badge key={num} variant="secondary" className="text-base font-mono">
                                        #{num.toString().padStart(3, '0')}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )) : (
                        <p className="text-muted-foreground text-center py-4">Aún no has comprado boletos.</p>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
