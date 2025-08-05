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
import { Wand2 } from "lucide-react";


const formSchema = z.object({
  title: z.string().min(5, "El título debe tener al menos 5 caracteres."),
  prize: z.string().min(3, "El premio debe tener al menos 3 caracteres."),
  description: z.string().optional(),
  ticketPrice: z.coerce.number().min(0, "El precio debe ser un número positivo."),
  totalTickets: z.coerce.number().int().min(10, "Debe haber al menos 10 boletos."),
  drawDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Por favor, introduce una fecha válida.",
  }),
  image: z.string().url("Por favor, introduce una URL de imagen válida."),
});

export function CreateRaffleForm() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      prize: "",
      description: "",
      ticketPrice: 10,
      totalTickets: 100,
      drawDate: "",
      image: "https://placehold.co/600x400",
    },
  });

  const handleGenerateDescription = async () => {
    const title = form.getValues("title");
    if (!title) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor, introduce un título para la rifa antes de generar la descripción.",
      });
      return;
    }
    
    setIsGenerating(true);
    try {
      const input: GenerateDescriptionInput = { prompt: `Rifa de ${title}` };
      const result = await generateDescription(input);
      form.setValue("description", result.description);
       toast({
        title: "Descripción generada",
        description: "La descripción ha sido generada y añadida al formulario.",
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo generar la descripción.",
      });
    } finally {
        setIsGenerating(false);
    }
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    toast({
      title: "¡Rifa Creada!",
      description: `La rifa "${values.title}" ha sido creada exitosamente.`,
    });
    form.reset();
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Crear Nueva Rifa</CardTitle>
        <CardDescription>
          Completa los detalles para lanzar una nueva rifa.
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
                        {isGenerating ? 'Generando...' : 'Generar con IA'}
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
                    Esta descripción será visible para los participantes.
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
                    <Input type="datetime-local" {...field} />
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
                    <Input placeholder="https://placehold.co/600x400" {...field} />
                  </FormControl>
                   <FormDescription>
                    Usa una URL de una imagen pública para el premio.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" size="lg" className="w-full">
              Crear Rifa
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
