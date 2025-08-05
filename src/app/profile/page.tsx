"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Ticket, Phone, MapPin, ShieldCheck, ListOrdered, Home } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRaffles } from "@/context/RaffleContext";
import { RaffleCard } from "@/components/raffle-card";
import { ForcePasswordChangeDialog } from "./force-password-change-dialog";

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const { raffles } = useRaffles();

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

  const userCreatedRaffles = raffles.filter(r => r.creatorId === user.id);

  const fullAddress = user.address 
    ? `${user.address.street}, ${user.address.city}, ${user.address.state}, ${user.address.postalCode}, ${user.address.country}`
    : 'No proporcionada';

  return (
    <>
    <ForcePasswordChangeDialog />
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
         <Badge variant={user.role === 'creator' ? "default" : "secondary"} className="mt-2">
            {user.role === 'creator' ? 'Creador de Rifas' : 'Usuario Regular'}
         </Badge>
      </section>

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
          <TabsTrigger value="info">
            <User className="mr-2" />
            Mi Información
          </TabsTrigger>
          <TabsTrigger value="tickets">
             <Ticket className="mr-2" />
            Mis Boletos
          </TabsTrigger>
        </TabsList>
        <TabsContent value="info">
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
                        <h3 className="font-semibold flex items-center gap-2"><Home className="w-4 h-4 text-muted-foreground"/>Dirección</h3>
                        <p className="text-muted-foreground pl-6">{fullAddress}</p>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="tickets">
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
        </TabsContent>
      </Tabs>
      
      {user.role === 'creator' && (
        <section className="mt-12">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold font-headline mb-2 text-primary">Mis Rifas Creadas</h2>
                <p className="text-muted-foreground">Aquí puedes ver y gestionar las rifas que has creado.</p>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {userCreatedRaffles.length > 0 ? userCreatedRaffles.map((raffle) => (
                    <RaffleCard key={raffle.id} raffle={raffle} />
                )) : (
                    <div className="md:col-span-3 text-center text-muted-foreground py-10 border-2 border-dashed rounded-lg">
                        <ListOrdered className="mx-auto h-12 w-12 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Aún no has creado ninguna rifa</h3>
                        <p>¡Anímate a crear una! Es muy fácil.</p>
                        <Button asChild className="mt-4">
                            <Link href="/raffles/create">Crear mi primera rifa</Link>
                        </Button>
                    </div>
                )}
            </div>
        </section>
      )}
    </div>
    </>
  );
}
