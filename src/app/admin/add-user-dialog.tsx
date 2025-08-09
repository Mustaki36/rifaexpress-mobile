
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/context/AuthContext";

const formSchema = z.object({
  name: z.string().min(2, "El nombre es requerido."),
  email: z.string().email("Debe ser un email válido."),
  role: z.enum(["regular", "creator"], {
    required_error: "Debes seleccionar un rol.",
  }),
});

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserAdded: () => void; // Callback to refresh the user list
}

export function AddUserDialog({ open, onOpenChange, onUserAdded }: AddUserDialogProps) {
  const { toast } = useToast();
  const { firebaseUser } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "regular",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firebaseUser) {
        toast({
            variant: "destructive",
            title: "Error de autenticación",
            description: "No estás autenticado. Por favor, vuelve a iniciar sesión.",
        });
        return;
    }

    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Ocurrió un error en el servidor.');
      }
      
      toast({
        title: "Operación Exitosa",
        description: result.message,
      });
      onUserAdded(); // Refresh the list in the parent component
      onOpenChange(false);
      form.reset();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
      toast({
        variant: "destructive",
        title: "Error al crear/actualizar usuario",
        description: errorMessage,
      });
    }
  };

  const handleDialogClose = (isOpen: boolean) => {
    if (!isOpen) {
      form.reset();
    }
    onOpenChange(isOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Añadir o Actualizar Usuario</DialogTitle>
          <DialogDescription>
            Crea un nuevo usuario o actualiza uno existente. Si el email ya existe, se actualizará el nombre y el rol. Se enviará un enlace para establecer/restablecer la contraseña.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ej: Maria López" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} placeholder="ejemplo@email.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                    <FormLabel>Rol del Usuario</FormLabel>
                    <FormControl>
                        <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                        >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                            <RadioGroupItem value="regular" />
                            </FormControl>
                            <FormLabel className="font-normal">Regular</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                            <RadioGroupItem value="creator" />
                            </FormControl>
                            <FormLabel className="font-normal">Creador</FormLabel>
                        </FormItem>
                        </RadioGroup>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            
            <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                   {form.formState.isSubmitting && <Loader2 className="mr-2 animate-spin" />}
                   Guardar Usuario
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
