
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
import { MoreHorizontal, Pencil, Search, PlusCircle, ShieldCheck, ShieldX, Info, UserX, Trash2 } from "lucide-react";
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
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";

type ActionType = "suspend" | "delete";

export function UsersList() {
  const { toast } = useToast();
  const { user, suspendUser, deleteUser, addUser, editUser } = useAuth();
  const { blockUser } = useBlock();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState<ActionType | null>(null);
  const [userToAction, setUserToAction] = useState<UserProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    if (user?.role !== 'admin') { 
        setError("No tienes permiso para ver esta sección.");
        setUsers([]);
        return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
        const querySnapshot = await getDocs(collection(db, "usuarios"));
        const userList = querySnapshot.docs.map(doc => {
            const data = doc.data();
            const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date());
            return { 
                id: doc.id, 
                ...data,
                createdAt: createdAt
            } as UserProfile;
        });
        setUsers(userList);
    } catch (e) {
        console.error("Error fetching users: ", e);
        setError("No se pudieron cargar los usuarios. Verifica los permisos de Firestore y las reglas de seguridad.");
    } finally {
        setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadUsers();
    }
  }, [user, loadUsers]);
  
  const getRoleDisplayName = (role: UserProfile['role']) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'creator':
        return 'Creador';
      case 'suspended':
          return 'Suspendido';
      default:
        return 'Regular';
    }
  };
  
  const getRoleVariant = (role: UserProfile['role']): "default" | "secondary" | "destructive" => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'creator':
        return 'default';
       case 'suspended':
          return 'destructive';
      default:
        return 'secondary';
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

  const handleConfirm = async () => {
    if (!userToAction) return;

    try {
        if (actionToConfirm === 'suspend') {
          if (userToAction.role === 'admin') {
             toast({ variant: "destructive", title: "Acción no permitida", description: "No se puede suspender una cuenta de administrador." });
             return;
          }
          await suspendUser(userToAction.id);
          toast({ title: "Usuario suspendido", description: `El usuario ${userToAction.name} ha sido suspendido.` });
        } else if (actionToConfirm === 'delete') {
          if (userToAction.role === 'admin') {
              toast({ variant: "destructive", title: "Acción no permitida", description: "No se puede eliminar una cuenta de administrador." });
              return;
          }
          await deleteUser(userToAction.id);
          toast({ title: "Usuario Eliminado", description: `Los datos de ${userToAction.name} han sido eliminados.` });
        }
    } catch(error) {
        const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
        toast({ variant: "destructive", title: "Error", description: errorMessage });
    } finally {
        loadUsers();
        setIsAlertOpen(false);
        setUserToAction(null);
        setActionToConfirm(null);
    }
  };

  const handleBlockUser = (user: UserProfile) => {
      blockUser(user.email, "Bloqueado por administrador");
      toast({
        title: "Usuario Bloqueado",
        description: `${user.email} ha sido añadido a la lista de bloqueo.`,
      });
  }
  
  const handleAddUser = async (values: any) => {
      await addUser(values);
      loadUsers(); // Recargar usuarios
  }
  
  const handleEditUser = async (userId: string, values: any) => {
      await editUser(userId, values);
      loadUsers(); // Recargar usuarios
  }
  
  const alertContent = {
    suspend: {
        title: `¿Suspender a ${userToAction?.name}?`,
        description: "Esta acción impedirá que el usuario inicie sesión. Podrás revertir su rol más tarde.",
        actionText: "Suspender",
    },
    delete: {
        title: `¿Eliminar a ${userToAction?.name} permanentemente?`,
        description: "Esta acción no se puede deshacer. Se eliminarán todos los datos del usuario de la base de datos, pero la cuenta de autenticación permanecerá (contácta a soporte para eliminarla por completo).",
        actionText: "Eliminar Permanentemente",
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
            <div>
                <CardTitle>Usuarios Registrados</CardTitle>
                <CardDescription>
                Gestiona todos los usuarios del sistema.
                </CardDescription>
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
                <AlertDescription>
                    {error}
                </AlertDescription>
             </Alert>
           )}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Verificado</TableHead>
                  <TableHead>Registrado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center h-24">Cargando usuarios...</TableCell>
                    </TableRow>
                ) : filteredUsers.length === 0 && !error ? (
                     <TableRow>
                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                            No se encontraron usuarios.
                        </TableCell>
                    </TableRow>
                ) : filteredUsers.map((user) => (
                  <TableRow key={user.id} className={cn(user.role === 'suspended' && 'text-muted-foreground opacity-60')}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                        <Badge variant={getRoleVariant(user.role)}>
                            {getRoleDisplayName(user.role)}
                        </Badge>
                    </TableCell>
                    <TableCell>
                      {user.isVerified ? 
                        <ShieldCheck className="text-green-500" /> : 
                        <ShieldX className="text-muted-foreground" />}
                    </TableCell>
                    <TableCell>{new Date(user.createdAt.seconds * 1000).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menú</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(user)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                <span>Editar</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleBlockUser(user)}>
                                <ShieldX className="mr-2 h-4 w-4" />
                                <span>Bloquear Email</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => confirmAction(user, 'suspend')} disabled={user.role === 'suspended'}>
                                <UserX className="mr-2 h-4 w-4" />
                                <span>Suspender</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => confirmAction(user, 'delete')} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Eliminar</span>
                            </DropdownMenuItem>
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

      <AddUserDialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen} onUserAdded={handleAddUser} />
      <EditUserSheet open={isEditUserOpen} onOpenChange={setIsEditUserOpen} user={userToEdit} onUserEdited={handleEditUser} />

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{actionToConfirm && alertContent[actionToConfirm].title}</AlertDialogTitle>
            <AlertDialogDescription>
              {actionToConfirm && alertContent[actionToConfirm].description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} className="bg-destructive hover:bg-destructive/90">
                {actionToConfirm && alertContent[actionToConfirm].actionText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

    