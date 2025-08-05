
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/context/SettingsContext";
import { Eye, EyeOff } from "lucide-react";

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


export function SecuritySettingsForm() {
  const { toast } = useToast();
  // In a real app, you would manage credentials securely on the server.
  const [currentMockPassword, setCurrentMockPassword] = useState("password");
  const [currentMockUsername, setCurrentMockUsername] = useState("admin");
  const { isVerificationEnabled, setIsVerificationEnabled } = useSettings();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);


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

  const handleVerificationToggle = (checked: boolean) => {
    setIsVerificationEnabled(checked);
    toast({
        title: "Ajuste guardado",
        description: `La verificación de identidad por IA ha sido ${checked ? 'habilitada' : 'deshabilitada'}.`,
    });
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Seguridad y Configuración</CardTitle>
        <CardDescription>
          Actualiza tus credenciales de administrador y gestiona la configuración de la aplicación.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <Form {...form}>
          <div>
              <h3 className="text-lg font-medium">Registro de Usuarios</h3>
              <div className="flex items-center justify-between rounded-lg border p-4 mt-4">
                  <div className="space-y-0.5">
                      <FormLabel className="text-base">Verificación de Identidad con IA</FormLabel>
                      <FormDescription>
                          Si está activo, los nuevos usuarios deberán verificar su identidad usando su licencia de conducir.
                      </FormDescription>
                  </div>
                  <Switch
                      checked={isVerificationEnabled}
                      onCheckedChange={handleVerificationToggle}
                      aria-label="Toggle de verificación de identidad"
                  />
              </div>
          </div>

          <Separator />

          <div>
          <h3 className="text-lg font-medium mb-4">Credenciales de Administrador</h3>
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
                    <div className="relative">
                        <FormControl>
                            <Input type={showCurrentPassword ? "text" : "password"} {...field} />
                        </FormControl>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                            onClick={() => setShowCurrentPassword(prev => !prev)}
                            >
                            {showCurrentPassword ? <EyeOff /> : <Eye />}
                        </Button>
                    </div>
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
                    <div className="relative">
                        <FormControl>
                            <Input type={showNewPassword ? "text" : "password"} {...field} />
                        </FormControl>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                            onClick={() => setShowNewPassword(prev => !prev)}
                            >
                            {showNewPassword ? <EyeOff /> : <Eye />}
                        </Button>
                    </div>
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
                    <div className="relative">
                        <FormControl>
                            <Input type={showNewPassword ? "text" : "password"} {...field} />
                        </FormControl>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                            onClick={() => setShowNewPassword(prev => !prev)}
                            >
                            {showNewPassword ? <EyeOff /> : <Eye />}
                        </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" size="lg" className="w-full">
                Actualizar Credenciales
              </Button>
            </form>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}
