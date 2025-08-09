
"use client";

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
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { generateDescription, GenerateDescriptionInput } from "@/ai/flows/generate-description";
import { Wand2, Loader2 } from "lucide-react";
import { useRaffles } from "@/context/RaffleContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";


const formSchema = z.object({
  title: z.string().min(5, "El título debe tener al menos 5 caracteres."),
  prize: z.string().min(3, "El premio debe tener al menos 3 caracteres."),
  description: z.string().optional(),
  ticketPrice: z.coerce.number().min(0, "El precio debe ser un número positivo."),
  totalTickets: z.coerce.number().int().min(10, "Debe haber al menos 10 boletos."),
  drawDate: z.string().refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), {
    message: "Por favor, introduce una fecha válida en formato YYYY-MM-DD.",
  }),
  image: z.string().url("Por favor, introduce una URL de imagen válida."),
  aiHint: z.string().optional(),
});

export default function CreateRafflePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addRaffle } = useRaffles();
  const { user, isAuthenticated } = useAuth();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      prize: "",
      description: "",
      ticketPrice: 10,
      totalTickets: 100,
      drawDate: "",
      image: "https://placehold.co/600x400.png",
      aiHint: ""
    },
  });

  if (!isAuthenticated || !user) {
    return (
        <div className="container text-center py-20">
            <h1 className="text-2xl font-bold mb-4">Acceso Denegado</h1>
            <p className="text-muted-foreground mb-6">Debes iniciar sesión para crear una rifa.</p>
            <Button asChild>
                <Link href="/login">Iniciar Sesión</Link>
            </Button>
      </div>
    );
  }
  
  if (user.role !== 'creator' && user.role !== 'admin') {
     return (
        <div className="container text-center py-20">
            <h1 className="text-2xl font-bold mb-4">Función no disponible</h1>
            <p className="text-muted-foreground mb-6">Necesitas una cuenta de "Creador de Rifas" o ser Administrador para acceder a esta página.</p>
            <Button asChild>
                <Link href="/profile">Volver a mi perfil</Link>
            </Button>
      </div>
    );
  }

  const handleGenerateDescription = async () => {
    const description = form.getValues("description");
    if (!description || description.trim() === "") {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor, escribe una descripción base antes de usar la IA.",
      });
      return;
    }
    
    setIsGenerating(true);
    try {
      const input: GenerateDescriptionInput = { prompt: description };
      const result = await generateDescription(input);
      if (result && result.description) {
        form.setValue("description", result.description);
        toast({
            title: "Descripción mejorada",
            description: "La IA ha mejorado tu descripción. ¡Revísala!",
        });
      } else {
        throw new Error("La respuesta de la IA no contiene una descripción.");
      }
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "No se pudo generar la descripción.";
      toast({
        variant: "destructive",
        title: "Error de IA",
        description: errorMessage,
      });
    } finally {
        setIsGenerating(false);
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if(!user) return;
    setIsSubmitting(true);
    try {
        await addRaffle({
          ...values,
          creatorId: user.id,
          description: values.description || "",
          aiHint: values.aiHint || ""
        });
        toast({
          title: "¡Rifa Creada!",
          description: `La rifa "${values.title}" ha sido creada exitosamente.`,
        });
        form.reset();
        router.push(user.role === 'admin' ? '/admin' : '/profile');
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "No se pudo crear la rifa.";
        toast({ variant: "destructive", title: "Error", description: errorMessage });
        setIsSubmitting(false); // Make sure to stop loading on error
    } 
  }

  return (
    <div className="container py-12">
        <Card className="max-w-2xl mx-auto">
        <CardHeader>
            <CardTitle>Crear Nueva Rifa</CardTitle>
            <CardDescription>
            Completa los detalles para lanzar una nueva rifa para la comunidad.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Título de la Rifa</FormLabel>
                    <FormControl>
                        <Input placeholder="Ej: Rifa de Verano" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                
                <FormField
                control={form.control}
                name="prize"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Premio</FormLabel>
                    <FormControl>
                        <Input placeholder="Ej: PlayStation 5" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="flex justify-between items-center">
                        <span>Descripción</span>
                        <Button type="button" size="sm" variant="outline" onClick={handleGenerateDescription} disabled={isGenerating}>
                            <Wand2 className="mr-2" />
                            {isGenerating ? 'Mejorando...' : 'Mejorar con IA'}
                        </Button>
                    </FormLabel>
                    <FormControl>
                        <Textarea
                        placeholder="Describe el premio y las reglas de la rifa..."
                        className="resize-y"
                        {...field}
                        />
                    </FormControl>
                    <FormDescription>
                        Escribe una base y luego usa la IA para mejorarla.
                    </FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="ticketPrice"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Precio del Boleto ($)</FormLabel>
                        <FormControl>
                        <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="totalTickets"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Total de Boletos</FormLabel>
                        <FormControl>
                        <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                </div>
                
                <FormField
                control={form.control}
                name="drawDate"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Fecha del Sorteo</FormLabel>
                    <FormControl>
                        <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                
                <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>URL de la Imagen</FormLabel>
                    <FormControl>
                        <Input placeholder="https://placehold.co/600x400.png" {...field} />
                    </FormControl>
                    <FormDescription>
                        Usa una URL de una imagen pública para el premio.
                    </FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
                    Crear Rifa
                </Button>
            </form>
            </Form>
        </CardContent>
        </Card>
    </div>
  );
}
