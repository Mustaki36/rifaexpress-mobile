
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
import { MoreHorizontal, Pencil, Trash2, Search, PlusCircle, ShieldCheck, ShieldX } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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

export function UsersList() {
  const { toast } = useToast();
  const { addUser, deleteUser, editUser, fetchAllUsers } = useAuth();
  const { blockUser } = useBlock();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserProfile | null>(null);

  const loadUsers = useCallback(async () => {
      const userList = await fetchAllUsers();
      setUsers(userList);
  }, [fetchAllUsers]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);
  
  const getRoleDisplayName = (role: 'regular' | 'creator' | 'admin') => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'creator':
        return 'Creador';
      default:
        return 'Regular';
    }
  };
  
  const getRoleVariant = (role: 'regular' | 'creator' | 'admin'): "default" | "secondary" | "destructive" => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'creator':
        return 'default';
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

  const confirmDelete = (user: UserProfile) => {
    setUserToDelete(user);
    setIsAlertOpen(true);
  };
  
  const handleEdit = (user: UserProfile) => {
    setUserToEdit(user);
    setIsEditUserOpen(true);
  }

  const handleDelete = async () => {
    if (userToDelete) {
      if(userToDelete.role === 'admin') {
         toast({
            variant: "destructive",
            title: "Acción no permitida",
            description: "No se puede eliminar la cuenta principal de administrador.",
          });
          setIsAlertOpen(false);
          setUserToDelete(null);
          return;
      }
      await deleteUser(userToDelete.id);
      toast({
        title: "Usuario eliminado",
        description: `El usuario ${userToDelete.name} ha sido eliminado.`,
      });
      loadUsers(); // Recargar usuarios
    }
    setIsAlertOpen(false);
    setUserToDelete(null);
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
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
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
                            <DropdownMenuItem onClick={() => confirmDelete(user)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Eliminar</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleBlockUser(user)} className="text-destructive">
                                <ShieldX className="mr-2 h-4 w-4" />
                                <span>Bloquear</span>
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
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente al usuario y todos sus datos.
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
