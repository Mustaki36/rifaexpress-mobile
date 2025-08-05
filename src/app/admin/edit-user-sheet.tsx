
"use client";

import { useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import type { UserProfile } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";

const formSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  email: z.string().email("Por favor, introduce un email válido."),
  phone: z.string().min(8, "El número de teléfono no es válido."),
  role: z.enum(["regular", "creator"]),
  street: z.string().min(5, "La calle debe tener al menos 5 caracteres."),
  city: z.string().min(3, "La ciudad debe tener al menos 3 caracteres."),
  state: z.string().min(2, "El estado/provincia debe tener al menos 2 caracteres."),
  postalCode: z.string().min(4, "El código postal no es válido."),
  country: z.string().min(3, "El país debe tener al menos 3 caracteres."),
});

interface EditUserSheetProps {
  user: UserProfile | null;
  onOpenChange: (open: boolean) => void;
}

export function EditUserSheet({ user, onOpenChange }: EditUserSheetProps) {
  const { toast } = useToast();
  const { editUser } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      role: "regular",
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        role: user.role,
        street: user.address?.street || "",
        city: user.address?.city || "",
        state: user.address?.state || "",
        postalCode: user.address?.postalCode || "",
        country: user.address?.country || "",
      });
    }
  }, [user, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!user) return;
    try {
        const { street, city, state, postalCode, country, ...restOfValues } = values;
        const address = { street, city, state, postalCode, country };
        editUser(user.id, {...restOfValues, address});
        toast({
            title: "Usuario Actualizado",
            description: `Los datos de ${values.name} han sido actualizados.`,
        });
        onOpenChange(false);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "No se pudo actualizar el usuario.";
        toast({ variant: "destructive", title: "Error", description: errorMessage });
    }
  };

  return (
    <Sheet open={!!user} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>Editar Usuario</SheetTitle>
          <SheetDescription>
            Actualiza los datos del usuario. Los cambios se guardarán inmediatamente.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-grow pr-6 -mr-6">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Nombre</FormLabel>
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
                    name="phone"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                        <Input {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Rol</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="regular">Regular</SelectItem>
                        <SelectItem value="creator">Creador</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <h4 className="font-medium text-sm pt-2">Dirección</h4>
                <FormField
                    control={form.control}
                    name="street"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">Calle</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-2 gap-2">
                    <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="text-xs text-muted-foreground">Ciudad</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="text-xs text-muted-foreground">Estado</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <FormField
                        control={form.control}
                        name="postalCode"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="text-xs text-muted-foreground">Código Postal</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="text-xs text-muted-foreground">País</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* This empty div is a spacer to push the footer down */}
                <div className="pt-4" /> 

                <SheetFooter className="pt-4 bg-background sticky bottom-0 -mx-6 px-6 pb-2 -mb-2">
                    <SheetClose asChild>
                        <Button type="button" variant="secondary">Cancelar</Button>
                    </SheetClose>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && <Loader2 className="mr-2 animate-spin" />}
                    Guardar Cambios
                    </Button>
                </SheetFooter>
            </form>
            </Form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
