
"use client";

import { useState } from "react";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import type { UserProfile } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Eye, ShieldCheck, User, Home, Ticket, ListOrdered, Calendar } from "lucide-react";
import { useRaffles } from "@/context/RaffleContext";
import { Separator } from "@/components/ui/separator";

export function UsersList() {
  const { allUsers } = useAuth();
  const { raffles } = useRaffles();
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const handleViewUser = (userId: string) => {
    const user = allUsers.find((u) => u.id === userId);
    if (user) {
      setSelectedUser(user);
    }
  };
  
  const userCreatedRaffles = selectedUser ? raffles.filter(r => r.creatorId === selectedUser.id) : [];

  const fullAddress = selectedUser?.address
    ? `${selectedUser.address.street}, ${selectedUser.address.city}, ${selectedUser.address.state} ${selectedUser.address.postalCode}, ${selectedUser.address.country}`
    : "No proporcionada";

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Usuarios Registrados</CardTitle>
          <CardDescription>
            Visualiza y gestiona todos los usuarios del sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Fecha de Registro</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allUsers.length > 0 ? (
                  allUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={user.avatar} alt={user.name} />
                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="font-medium">{user.name}</div>
                                <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                        </div>
                      </TableCell>
                       <TableCell>
                        <Badge variant={user.role === 'creator' ? "default" : "secondary"}>
                          {user.role === 'creator' ? 'Creador' : 'Regular'}
                        </Badge>
                       </TableCell>
                       <TableCell>
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                       </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewUser(user.id)}
                        >
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalles
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center h-24 text-muted-foreground"
                    >
                      No hay usuarios registrados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Sheet open={!!selectedUser} onOpenChange={(isOpen) => !isOpen && setSelectedUser(null)}>
        <SheetContent className="sm:max-w-lg w-full overflow-y-auto">
            {selectedUser && (
                <>
                <SheetHeader className="text-left mb-6">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={selectedUser.avatar} alt={selectedUser.name} />
                            <AvatarFallback>{selectedUser.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                             <SheetTitle className="text-2xl flex items-center gap-2">
                                {selectedUser.name}
                                {selectedUser.isVerified && <ShieldCheck className="h-6 w-6 text-green-500" />}
                            </SheetTitle>
                            <SheetDescription>{selectedUser.email}</SheetDescription>
                        </div>
                    </div>
                </SheetHeader>
                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><User />Información Personal</CardTitle></CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex items-center"><strong className="font-medium text-muted-foreground w-24 inline-block">Rol:</strong> <Badge variant={selectedUser.role === 'creator' ? "default" : "secondary"}>{selectedUser.role === 'creator' ? 'Creador' : 'Regular'}</Badge></div>
                            <p><strong className="font-medium text-muted-foreground w-24 inline-block">Teléfono:</strong> {selectedUser.phone || 'No disponible'}</p>
                            <p><strong className="font-medium text-muted-foreground w-24 inline-block">Registrado:</strong> {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : 'N/A'}</p>
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Home />Dirección</CardTitle></CardHeader>
                        <CardContent className="text-sm">
                           <p className="text-muted-foreground">{fullAddress}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Ticket />Historial de Participación</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {selectedUser.tickets.length > 0 ? selectedUser.tickets.map(raffle => (
                                <div key={raffle.raffleId} className="p-3 border rounded-md bg-muted/50">
                                    <h4 className="font-semibold mb-2 text-primary">{raffle.raffleTitle}</h4>
                                    <div className="flex flex-wrap gap-1">
                                        {raffle.ticketNumbers.map(num => (
                                            <Badge key={num} variant="secondary" className="font-mono">
                                                #{num.toString().padStart(3, '0')}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )) : (
                                <p className="text-muted-foreground text-center py-2 text-sm">Este usuario no ha comprado boletos.</p>
                            )}
                        </CardContent>
                    </Card>

                     {selectedUser.role === 'creator' && (
                         <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><ListOrdered />Historial de Creación</CardTitle></CardHeader>
                            <CardContent className="space-y-2">
                                {userCreatedRaffles.length > 0 ? userCreatedRaffles.map(raffle => (
                                    <div key={raffle.id} className="p-3 border rounded-md bg-muted/50 flex justify-between items-center">
                                        <div>
                                            <h4 className="font-semibold text-primary">{raffle.title}</h4>
                                            <p className="text-sm text-muted-foreground">Premio: {raffle.prize}</p>
                                        </div>
                                        <div className="text-right text-sm">
                                            <p>{raffle.soldTickets.length} / {raffle.totalTickets}</p>
                                            <p className="text-muted-foreground">Boletos</p>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-muted-foreground text-center py-2 text-sm">Este creador aún no ha publicado rifas.</p>
                                )}
                            </CardContent>
                        </Card>
                     )}
                </div>
                </>
            )}
        </SheetContent>
      </Sheet>
    </>
  );
}
