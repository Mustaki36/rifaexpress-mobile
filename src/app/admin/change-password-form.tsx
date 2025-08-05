"use client";

import { useState } from "react";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const formSchema = z
  .object({
    newUsername: z.string().min(4, "El nombre de usuario debe tener al menos 4 caracteres."),
    currentPassword: z.string().min(1, "La contraseña actual es requerida."),
    newPassword: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .refine((data) => {
    if (data.newPassword || data.confirmPassword) {
        return data.newPassword === data.confirmPassword;
    }
    return true;
  }, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  })
  .refine((data) => {
    if (data.newPassword) {
      return data.newPassword.length >= 6;
    }
    return true;
  },
  {
    message: "La nueva contraseña debe tener al menos 6 caracteres.",
    path: ["newPassword"],
  });


export function ChangePasswordForm() {
  const { toast } = useToast();
  // In a real app, you would manage credentials securely on the server.
  const [currentMockPassword, setCurrentMockPassword] = useState("password");
  const [currentMockUsername, setCurrentMockUsername] = useState("admin");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newUsername: currentMockUsername,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // IMPORTANT: This is a mock password/username change for demonstration purposes.
    if (values.currentPassword !== currentMockPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "La contraseña actual es incorrecta.",
      });
      return;
    }
    
    let changesMade = false;
    
    if (values.newUsername && values.newUsername !== currentMockUsername) {
        setCurrentMockUsername(values.newUsername);
        changesMade = true;
    }

    if (values.newPassword) {
        setCurrentMockPassword(values.newPassword);
        changesMade = true;
    }
    
    if(changesMade) {
        toast({
          title: "¡Éxito!",
          description: "Tus credenciales han sido actualizadas exitosamente.",
        });
    } else {
        toast({
            title: "Sin cambios",
            description: "No se ha modificado ninguna credencial.",
        });
    }

    form.reset({
        newUsername: values.newUsername,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Seguridad de la Cuenta</CardTitle>
        <CardDescription>
          Actualiza tu nombre de usuario y contraseña de administrador aquí.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="newUsername"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de Usuario</FormLabel>
                  <FormControl>
                    <Input type="text" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña Actual (requerida para cualquier cambio)</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nueva Contraseña (opcional)</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar Nueva Contraseña</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" size="lg" className="w-full">
              Actualizar Credenciales
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
