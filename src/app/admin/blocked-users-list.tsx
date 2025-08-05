"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { ShieldCheck, ShieldX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useBlock } from "@/context/BlockContext";
import { Checkbox } from "@/components/ui/checkbox";

export function BlockedUsersList() {
  const { toast } = useToast();
  const { blockedUsers, unblockUser, updateNotes } = useBlock();
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const handleUnblockSelected = () => {
    if (selectedUsers.length === 0) return;
    selectedUsers.forEach(email => unblockUser(email));
    toast({
      title: "Usuarios desbloqueados",
      description: `${selectedUsers.length} usuario(s) ha(n) sido desbloqueado(s).`,
    });
    setSelectedUsers([]);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(blockedUsers.map((u) => u.email));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectRow = (email: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers((prev) => [...prev, email]);
    } else {
      setSelectedUsers((prev) => prev.filter((e) => e !== email));
    }
  };


  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Usuarios Bloqueados</CardTitle>
            <CardDescription>
              Gestiona los emails que han sido bloqueados del sistema.
            </CardDescription>
          </div>
          {selectedUsers.length > 0 && (
            <Button variant="outline" onClick={handleUnblockSelected}>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Desbloquear ({selectedUsers.length})
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead padding="checkbox" className="w-12">
                     <Checkbox
                      checked={selectedUsers.length > 0 && selectedUsers.length === blockedUsers.length}
                      onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                      aria-label="Seleccionar todo"
                    />
                  </TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Razón del Bloqueo</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Notas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blockedUsers.length > 0 ? blockedUsers.map((user) => (
                  <TableRow key={user.email}>
                     <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedUsers.includes(user.email)}
                          onCheckedChange={(checked) => handleSelectRow(user.email, Boolean(checked))}
                          aria-label={`Seleccionar usuario ${user.email}`}
                        />
                      </TableCell>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell className="text-destructive text-xs">{user.reason}</TableCell>
                    <TableCell>{user.blockedAt.toLocaleString()}</TableCell>
                    <TableCell>
                        <Input 
                            defaultValue={user.notes}
                            onBlur={(e) => updateNotes(user.email, e.target.value)}
                            placeholder="Añadir notas..."
                            className="text-xs h-8"
                        />
                    </TableCell>
                  </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                            <ShieldX className="mx-auto h-8 w-8 mb-2" />
                            No hay usuarios bloqueados.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
