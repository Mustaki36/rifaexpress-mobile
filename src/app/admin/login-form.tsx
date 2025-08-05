
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
import { KeyRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";


const formSchema = z.object({
  email: z.string().email("Debe ser un email válido."),
  password: z.string().min(1, "La contraseña es requerida."),
});


interface AdminLoginFormProps {
    onLoginSuccess: () => void;
}

export function AdminLoginForm({ onLoginSuccess }: AdminLoginFormProps) {
  const { toast } = useToast();
  const { login } = useAuth();
  const router = useRouter();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const user = login(values.email, values.password);

    if (user && user.role === 'admin') {
       toast({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión como administrador.",
      });
      onLoginSuccess();
    } else {
        toast({
            variant: "destructive",
            title: "Error de autenticación",
            description: "Credenciales de administrador incorrectas o el usuario no es administrador.",
        })
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
                    <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                
                <Button type="submit" size="lg" className="w-full">
                    Ingresar
                </Button>
            </form>
            </Form>
        </CardContent>
        </Card>
    </div>
  );
}
