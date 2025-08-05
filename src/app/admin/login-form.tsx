
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";

const formSchema = z.object({
  email: z.string().email("Debe ser un email válido."),
  password: z.string().min(1, "La contraseña es requerida."),
});

export function AdminLoginForm() {
  const { toast } = useToast();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
        const user = await login(values.email, values.password);

        if (user && user.role === 'admin') {
           toast({
            title: "¡Bienvenido!",
            description: "Has iniciado sesión como administrador.",
          });
          // The parent component will re-render and show the dashboard
        } else {
            // If login is successful but user is not admin, or login fails
            toast({
                variant: "destructive",
                title: "Acceso Denegado",
                description: "Credenciales de administrador incorrectas o el usuario no es administrador.",
            })
        }
    } catch (error) {
         toast({
            variant: "destructive",
            title: "Error de autenticación",
            description: "No se pudo iniciar sesión. Verifica tus credenciales.",
        })
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <div className="container flex items-center justify-center py-24">
        <Card className="max-w-md mx-auto w-full">
        <CardHeader className="text-center">
            <div className="mx-auto bg-primary text-primary-foreground rounded-full p-3 w-fit mb-4">
                <KeyRound className="h-8 w-8" />
            </div>
            <CardTitle>Acceso de Administrador</CardTitle>
            <CardDescription>
            Ingresa tus credenciales para gestionar las rifas.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Email de Administrador</FormLabel>
                    <FormControl>
                        <Input placeholder="admin@rifasxpress.com" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                
                <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                     <div className="relative">
                        <FormControl>
                           <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} />
                        </FormControl>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                            onClick={() => setShowPassword(prev => !prev)}
                            >
                            {showPassword ? <EyeOff /> : <Eye />}
                        </Button>
                    </div>
                    <FormMessage />
                    </FormItem>
                )}
                />
                
                <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 animate-spin" />}
                    Ingresar
                </Button>
            </form>
            </Form>
        </CardContent>
        </Card>
    </div>
  );
}
