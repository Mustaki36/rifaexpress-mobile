
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { UserProfile } from "@/lib/types";
import { useEffect } from "react";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  name: z.string().min(2, "El nombre es requerido."),
  email: z.string().email("Debe ser un email válido."),
  role: z.enum(["regular", "creator", "admin"], {
    required_error: "Debes seleccionar un rol.",
  }),
});

interface EditUserSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile | null;
}

export function EditUserSheet({ open, onOpenChange, user }: EditUserSheetProps) {
  const { editUser } = useAuth();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "regular",
    },
  });
  
  useEffect(() => {
    if (user) {
        form.reset({
            name: user.name,
            email: user.email,
            role: user.role,
        })
    }
  }, [user, form]);


  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) return;
    
    // Prevent changing the main admin's role
    if (user.id === 'admin-user-id' && values.role !== 'admin') {
         toast({
            variant: "destructive",
            title: "Acción no permitida",
            description: "No se puede cambiar el rol de la cuenta principal de administrador.",
          });
          return;
    }
    
    try {
      await editUser(user.id, values);
      toast({
        title: "Usuario Actualizado",
        description: `Los datos de ${values.name} han sido actualizados.`,
      });
      onOpenChange(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
      toast({
        variant: "destructive",
        title: "Error al actualizar",
        description: errorMessage,
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Editar Usuario</SheetTitle>
          <SheetDescription>
            Modifica los detalles del usuario. Los cambios se guardarán inmediatamente.
          </SheetDescription>
        </SheetHeader>
        <Separator className="my-4" />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                    <Input type="email" {...field} />
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
                        value={field.value}
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
            <SheetFooter className="pt-6">
                <SheetClose asChild>
                    <Button type="button" variant="outline">Cancelar</Button>
                </SheetClose>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                   {form.formState.isSubmitting && <Loader2 className="mr-2 animate-spin" />}
                   Guardar Cambios
                </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
