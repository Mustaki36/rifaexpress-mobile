"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RafflesList } from "./raffles-list";
import { ListOrdered, Shield, LogOut, History, ShieldX, Users } from "lucide-react";
import { AdminLoginForm } from "./login-form";
import { SecuritySettingsForm } from "./security-settings-form";
import { Button } from "@/components/ui/button";
import { HistoryList } from "./history-list";
import { BlockedUsersList } from "./blocked-users-list";
import { UsersList } from "./users-list";
import { AuthProvider } from "@/context/AuthContext";
import { BlockProvider } from "@/context/BlockContext";

function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <AdminLoginForm onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
       <div className="relative">
         <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLogout} 
            className="absolute top-0 right-0"
          >
           <LogOut className="mr-2 h-4 w-4" />
           Cerrar Sesión
         </Button>
      </div>
      <section className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4 text-primary">
          Panel de Administración
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Gestiona todas las rifas, usuarios y configuraciones del sistema.
        </p>
      </section>

      <Tabs defaultValue="manage" className="w-full">
        <TabsList className="grid w-full grid-cols-5 max-w-3xl mx-auto">
          <TabsTrigger value="manage">
            <ListOrdered className="mr-2" />
            Gestionar Rifas
          </TabsTrigger>
           <TabsTrigger value="users">
            <Users className="mr-2" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="mr-2" />
            Historial
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="mr-2" />
            Seguridad
          </TabsTrigger>
           <TabsTrigger value="blocked">
            <ShieldX className="mr-2" />
            Bloqueos
          </TabsTrigger>
        </TabsList>
        <TabsContent value="manage">
            <RafflesList />
        </TabsContent>
         <TabsContent value="users">
            <UsersList />
        </TabsContent>
        <TabsContent value="history">
            <HistoryList />
        </TabsContent>
        <TabsContent value="security">
            <SecuritySettingsForm />
        </TabsContent>
        <TabsContent value="blocked">
            <BlockedUsersList />
        </TabsContent>
      </Tabs>
    </div>
  );
}


export default function AdminPage() {
  return (
    <BlockProvider>
        <AuthProvider>
            <AdminDashboard />
        </AuthProvider>
    </BlockProvider>
  )
}