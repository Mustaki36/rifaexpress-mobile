"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateRaffleForm } from "./create-raffle-form";
import { RafflesList } from "./raffles-list";
import { Ticket, ListOrdered, Shield } from "lucide-react";
import { AdminLoginForm } from "./login-form";
import { ChangePasswordForm } from "./change-password-form";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <AdminLoginForm onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <section className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4 text-primary">
          Panel de Administración
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Gestiona tus rifas, crea nuevas y elige a los ganadores.
        </p>
      </section>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto">
          <TabsTrigger value="create">
            <Ticket className="mr-2" />
            Crear Rifa
          </TabsTrigger>
          <TabsTrigger value="manage">
            <ListOrdered className="mr-2" />
            Gestionar Rifas
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="mr-2" />
            Seguridad
          </TabsTrigger>
        </TabsList>
        <TabsContent value="create">
            <CreateRaffleForm />
        </TabsContent>
        <TabsContent value="manage">
            <RafflesList />
        </TabsContent>
         <TabsContent value="security">
            <ChangePasswordForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
