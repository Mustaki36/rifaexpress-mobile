
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
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
import { MoreHorizontal, Pencil, Search, PlusCircle, ShieldCheck, ShieldX, UserX, Trash2 } from "lucide-react";
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
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import type { UserProfile } from "@/lib/types";
import { AddUserDialog } from "./add-user-dialog";
import { EditUserSheet } from "./edit-user-sheet";
import { useBlock } from "@/context/BlockContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type ActionType = "suspend" | "delete";

export function UsersList() {
  const { toast } = useToast();
  const { user, firebaseUser } = useAuth();
  const { blockUser } = useBlock();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState<ActionType | null>(null);
  const [userToAction, setUserToAction] = useState<UserProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!firebaseUser) return;
    setIsLoading(true);
    setError(null);
    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/admin/list-users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Error al cargar usuarios.");
      }
      const data: UserProfile[] = await response.json();
      setUsers(data);
    } catch (e: any) {
      console.error("Error fetching users: ", e);
      setError(e.message || "No se pudieron cargar los usuarios. Verifica los permisos de Firestore y las reglas de seguridad.");
    } finally {
      setIsLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  const getRoleDisplayName = (role: UserProfile['role']) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'creator': return 'Creador';
      case 'suspended': return 'Suspendido';
      default: return 'Regular';
    }
  };
  
  const getRoleVariant = (role: UserProfile['role']): "default" | "secondary" | "destructive" => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'creator': return 'default';
      case 'suspended': return 'destructive';
      default: return 'secondary';
    }
  }
  
  const filteredUsers = useMemo(() => {
    if (!Array.isArray(users)) return [];
    return users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, users]);

  const confirmAction = (user: UserProfile, action: ActionType) => {
    setUserToAction(user);
    setActionToConfirm(action);
    setIsAlertOpen(true);
  };
  
  const handleEdit = (user: UserProfile) => {
    setUserToEdit(user);
    setIsEditUserOpen(true);
  }

  const handleConfirmAction = async () => {
    if (!userToAction || !firebaseUser) return;

    let endpoint = '';
    let successMessage = '';
    let body: any = { userId: userToAction.id };
    
    try {
      const token = await firebaseUser.getIdToken();
      
      if (actionToConfirm === 'suspend') {
        endpoint = '/api/admin/update-role';
        body.role = 'suspended';
        successMessage = `El usuario ${userToAction.name} ha sido suspendido.`;
      } else if (actionToConfirm === 'delete') {
        endpoint = '/api/admin/delete-user';
        successMessage = `El usuario ${userToAction.name} ha sido eliminado.`;
      }
      
      if (!endpoint) return;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Ocurrió un error');
      
      toast({ title: "Operación Exitosa", description: successMessage });
      fetchUsers(); // Refresh user list
    } catch(e: any) {
        toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
        setIsAlertOpen(false);
        setUserToAction(null);
        setActionToConfirm(null);
    }
  };
  
  const handleEditUser = async (userId: string, values: any) => {
      if(!firebaseUser) throw new Error("No autenticado");
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/admin/update-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ userId, role: values.role }),
      });
      const result = await response.json();
      if(!response.ok) throw new Error(result.error || 'No se pudo actualizar el rol');
      fetchUsers(); // Refresh list after editing
  }

  const handleBlockUser = (user: UserProfile) => {
      blockUser(user.email, "Bloqueado por administrador");
      toast({ title: "Usuario Bloqueado", description: `${user.email} ha sido añadido a la lista de bloqueo.` });
  }

  const alertContent = {
    suspend: {
        title: `¿Suspender a ${userToAction?.name}?`,
        description: "Esta acción impedirá que el usuario inicie sesión y le asignará el rol de 'Suspendido'. Podrás revertirlo más tarde editando al usuario.",
        actionText: "Suspender",
    },
    delete: {
        title: `¿Eliminar a ${userToAction?.name} permanentemente?`,
        description: "Esta acción no se puede deshacer. Se eliminarán los datos del usuario de Firestore y su cuenta de Firebase Auth.",
        actionText: "Eliminar Permanentemente",
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
            <div>
                <CardTitle>Usuarios Registrados</CardTitle>
                <CardDescription>Gestiona todos los usuarios del sistema.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Buscar por nombre o email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-64 pl-10"
                    />
                </div>
                <Button onClick={() => setIsAddUserOpen(true)}>
                    <PlusCircle className="mr-2" />
                    Añadir Usuario
                </Button>
            </div>
        </CardHeader>
        <CardContent>
           {error && (
             <Alert variant="destructive" className="mb-4">
                <AlertTitle>Error de Carga</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
             </Alert>
           )}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Verificado por IA</TableHead>
                  <TableHead>Registrado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                    <TableRow><TableCell colSpan={6} className="text-center h-24"><Loader2 className="animate-spin mx-auto" /> Cargando...</TableCell></TableRow>
                ) : filteredUsers.length === 0 && !error ? (
                    <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No se encontraron usuarios.</TableCell></TableRow>
                ) : filteredUsers.map((user) => (
                  <TableRow key={user.id} className={cn(user.role === 'suspended' && 'text-muted-foreground opacity-60')}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell><Badge variant={getRoleVariant(user.role)}>{getRoleDisplayName(user.role)}</Badge></TableCell>
                    <TableCell>{user.isVerified ? <ShieldCheck className="text-green-500" /> : <ShieldX className="text-muted-foreground" />}</TableCell>
                    <TableCell>{user.createdAt ? new Date((user.createdAt as any).seconds * 1000).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Abrir menú</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(user)} disabled={user.id === firebaseUser?.uid}><Pencil className="mr-2 h-4 w-4" /><span>Editar Rol</span></DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleBlockUser(user)}><ShieldX className="mr-2 h-4 w-4" /><span>Bloquear Email</span></DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => confirmAction(user, 'suspend')} disabled={user.role === 'admin' || user.role === 'suspended'}><UserX className="mr-2 h-4 w-4" /><span>Suspender</span></DropdownMenuItem>
                            <DropdownMenuItem onClick={() => confirmAction(user, 'delete')} className="text-destructive focus:text-destructive" disabled={user.role === 'admin'}><Trash2 className="mr-2 h-4 w-4" /><span>Eliminar</span></DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AddUserDialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen} onUserAdded={fetchUsers} />
      <EditUserSheet open={isEditUserOpen} onOpenChange={setIsEditUserOpen} user={userToEdit} onUserEdited={handleEditUser} />

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{actionToConfirm && alertContent[actionToConfirm].title}</AlertDialogTitle>
            <AlertDialogDescription>{actionToConfirm && alertContent[actionToConfirm].description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction} className="bg-destructive hover:bg-destructive/90">{actionToConfirm && alertContent[actionToConfirm].actionText}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
