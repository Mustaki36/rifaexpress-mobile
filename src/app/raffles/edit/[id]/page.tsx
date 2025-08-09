
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
import { useState, useEffect } from "react";
import { generateDescription, GenerateDescriptionInput } from "@/ai/flows/generate-description";
import { Wand2, AlertTriangle, ArrowLeft } from "lucide-react";
import { useRaffles } from "@/context/RaffleContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";


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

export default function EditRafflePage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const raffleId = params.id as string;
  
  const [isGenerating, setIsGenerating] = useState(false);
  const { raffles, editRaffle } = useRaffles();
  const { user, isAuthenticated } = useAuth();
  
  const raffleToEdit = raffles.find(r => r.id === raffleId);
  const hasSoldTickets = raffleToEdit ? raffleToEdit.soldTickets.length > 0 : false;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      prize: "",
      description: "",
      ticketPrice: 0,
      totalTickets: 10,
      drawDate: "",
      image: "https://placehold.co/600x400.png",
      aiHint: ""
    },
  });

  useEffect(() => {
    if (raffleToEdit) {
      form.reset({
        ...raffleToEdit
      });
    }
  }, [raffleToEdit, form]);

  if (!isAuthenticated || !user) {
    return (
        <div className="container text-center py-20">
            <h1 className="text-2xl font-bold mb-4">Acceso Denegado</h1>
            <p className="text-muted-foreground mb-6">Debes iniciar sesión para editar una rifa.</p>
            <Button asChild>
                <Link href="/login">Iniciar Sesión</Link>
            </Button>
      </div>
    );
  }

  if (!raffleToEdit) {
      return (
        <div className="container text-center py-20">
            <h1 className="text-2xl font-bold mb-4">Rifa no encontrada</h1>
            <p className="text-muted-foreground mb-6">La rifa que intentas editar no existe.</p>
            <Button asChild>
                <Link href="/admin">Volver al panel</Link>
            </Button>
      </div>
    );
  }
  
  // Only allow admin or the original creator to edit
  if (user.role !== 'admin' && user.id !== raffleToEdit.creatorId) {
     return (
        <div className="container text-center py-20">
            <h1 className="text-2xl font-bold mb-4">Acceso Denegado</h1>
            <p className="text-muted-foreground mb-6">No tienes permiso para editar esta rifa.</p>
            <Button asChild>
                <Link href="/">Volver al inicio</Link>
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

  function onSubmit(values: z.infer<typeof formSchema>) {
    if(!user) return;
    
    const { ticketPrice, totalTickets, ...editableValues } = values;

    const finalValues = hasSoldTickets ? 
      {
        ...editableValues,
        ticketPrice: raffleToEdit.ticketPrice,
        totalTickets: raffleToEdit.totalTickets,
      } : 
      {
        ...values,
      }

    editRaffle(raffleId, finalValues);

    toast({
      title: "¡Rifa Actualizada!",
      description: `La rifa "${values.title}" ha sido guardada exitosamente.`,
    });
    router.push('/admin');
  }

  return (
    <div className="container py-12">
        <Button variant="outline" size="sm" asChild className="mb-4">
            <Link href="/admin"><ArrowLeft /> Volver al panel</Link>
        </Button>
        <Card className="max-w-2xl mx-auto">
        <CardHeader>
            <CardTitle>Editar Rifa</CardTitle>
            <CardDescription>
                Ajusta los detalles de la rifa. Los cambios se reflejarán inmediatamente.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                {hasSoldTickets && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>¡Atención!</AlertTitle>
                        <AlertDescription>
                            Esta rifa ya tiene boletos vendidos. Para garantizar la justicia, no puedes editar el precio o la cantidad total de boletos.
                        </AlertDescription>
                    </Alert>
                )}

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
                        <Input type="number" {...field} disabled={hasSoldTickets} />
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
                        <Input type="number" {...field} disabled={hasSoldTickets} />
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

                <Button type="submit" size="lg" className="w-full">
                Guardar Cambios
                </Button>
            </form>
            </Form>
        </CardContent>
        </Card>
    </div>
  );
}
