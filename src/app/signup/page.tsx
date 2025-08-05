"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Camera, AlertTriangle, CheckCircle2, UserCheck, Loader2 } from "lucide-react";
import React, { useRef, useState, useEffect } from 'react';
import { verifyIdentity, VerifyIdentityInput } from "@/ai/flows/verify-identity-flow";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { useSettings } from "@/context/SettingsContext";

const formSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  email: z.string().email("Por favor, introduce un email válido."),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
  phone: z.string().min(8, "El número de teléfono no es válido."),
  address: z.string().min(10, "La dirección debe tener al menos 10 caracteres."),
  isOfAge: z.boolean().refine(val => val === true, {
    message: "Debes confirmar que eres mayor de edad.",
  }),
});

type VerificationStatus = 'idle' | 'verifying' | 'success' | 'error';

export default function SignupPage() {
  const { signup } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isVerificationEnabled } = useSettings();
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedUserImage, setCapturedUserImage] = useState<string | null>(null);
  const [licenseImage, setLicenseImage] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('idle');
  const [verificationError, setVerificationError] = useState<string | null>(null);

  useEffect(() => {
    if (!isVerificationEnabled) return;

    const getCameraPermission = async () => {
      if (typeof window !== 'undefined' && navigator.mediaDevices) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setHasCameraPermission(true);
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({
            variant: "destructive",
            title: "Acceso a la cámara denegado",
            description: "Por favor, habilita los permisos de la cámara en tu navegador.",
          });
        }
      } else {
        setHasCameraPermission(false);
      }
    };

    getCameraPermission();

    return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, [toast, isVerificationEnabled]);
  

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
      address: "",
      isOfAge: false,
    },
  });
  
  const handleCaptureUserImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        setCapturedUserImage(canvas.toDataURL('image/jpeg'));
      }
    }
  };
  
  const handleLicenseUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setLicenseImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVerifyIdentity = async () => {
    if (!capturedUserImage || !licenseImage) {
        toast({ variant: "destructive", title: "Faltan imágenes", description: "Por favor, tómate una foto y sube tu licencia."});
        return;
    }

    setVerificationStatus('verifying');
    setVerificationError(null);

    try {
        const input: VerifyIdentityInput = {
            userPhotoDataUri: capturedUserImage,
            documentPhotoDataUri: licenseImage
        };
        const result = await verifyIdentity(input);

        if (result.isVerified && result.isOfAge) {
            setVerificationStatus('success');
            toast({ title: "¡Verificación exitosa!", description: "Tu identidad ha sido confirmada." });
        } else {
            setVerificationStatus('error');
            let errorReason = result.reason || "No se pudo verificar la identidad.";
            if(!result.isOfAge) errorReason = "La IA ha determinado que no eres mayor de edad.";
            if(!result.isMatch) errorReason = "La foto del documento no coincide con tu foto.";
            setVerificationError(errorReason);
            toast({ variant: "destructive", title: "Verificación fallida", description: errorReason});
        }
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : "No se pudo realizar la verificación.";
        setVerificationStatus('error');
        setVerificationError(errorMessage);
        toast({ variant: "destructive", title: "Error en la verificación", description: errorMessage });
    }
  }


  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (isVerificationEnabled && verificationStatus !== 'success') {
      toast({
        variant: "destructive",
        title: "Verificación requerida",
        description: "Debes verificar tu identidad antes de crear la cuenta.",
      });
      return;
    }
    
    try {
      signup(values.name, values.email, values.password, values.phone, values.address, isVerificationEnabled);
      toast({
        title: "¡Cuenta Creada!",
        description: "Tu cuenta ha sido creada exitosamente. ¡Bienvenido!",
      });
      router.push("/profile");
    } catch (error) {
       if (error instanceof Error) {
         toast({
            variant: "destructive",
            title: "Error en el registro",
            description: error.message,
         });
       }
    }
  };

  const VerificationStatusAlert = () => {
    switch (verificationStatus) {
        case 'success':
            return (
                <Alert variant="default" className="bg-green-100 dark:bg-green-900 border-green-500 text-green-900 dark:text-green-100">
                    <CheckCircle2 className="h-4 w-4 !text-green-500" />
                    <AlertTitle>Identidad Verificada</AlertTitle>
                    <AlertDescription>
                        ¡Perfecto! Hemos confirmado tu identidad. Ya puedes crear tu cuenta.
                    </AlertDescription>
                </Alert>
            );
        case 'error':
            return (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Verificación Fallida</AlertTitle>
                    <AlertDescription>
                        {verificationError || "No pudimos verificar tu identidad. Inténtalo de nuevo."}
                    </AlertDescription>
                </Alert>
            );
        default:
            return null;
    }
  }

  const isSubmitDisabled = isVerificationEnabled && verificationStatus !== 'success';

  return (
    <div className="container flex items-center justify-center py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Crear una cuenta</CardTitle>
          <CardDescription>
            Únete a RifasXpress y empieza a ganar premios increíbles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Juan Pérez" {...field} />
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
                        <Input type="email" placeholder="tu@email.com" {...field} />
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
                        <Input type="password" {...field} />
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
                      <FormLabel>Número de Teléfono</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 234 567 890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
               <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección</FormLabel>
                      <FormControl>
                        <Input placeholder="Calle Falsa 123, Springfield" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isVerificationEnabled && (
                  <Card className="bg-muted/50">
                      <CardHeader>
                          <CardTitle className="flex items-center gap-2"><UserCheck />Verificación de Identidad</CardTitle>
                          <CardDescription>Para cumplir con la normativa, necesitamos verificar tu identidad y mayoría de edad.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                            <div>
                                  <FormLabel>1. Tu rostro</FormLabel>
                                  <div className="relative mt-2 aspect-video w-full bg-secondary rounded-md overflow-hidden border">
                                      <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                                      {hasCameraPermission === false && <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white p-4 text-center">La cámara no está disponible. Revisa los permisos.</div>}
                                      {capturedUserImage && <img src={capturedUserImage} alt="Usuario capturado" className="absolute inset-0 w-full h-full object-cover" />}
                                  </div>
                                  <Button type="button" onClick={handleCaptureUserImage} disabled={!hasCameraPermission} className="w-full mt-2">
                                      <Camera className="mr-2" /> {capturedUserImage ? 'Tomar otra foto' : 'Tomar foto'}
                                  </Button>
                            </div>
                            <div>
                                  <FormLabel>2. Tu licencia de conducir</FormLabel>
                                  <div className="mt-2 aspect-video w-full bg-secondary rounded-md border flex items-center justify-center overflow-hidden">
                                    {licenseImage ? (
                                          <img src={licenseImage} alt="Licencia subida" className="w-full h-full object-contain" />
                                    ) : (
                                          <span className="text-sm text-muted-foreground p-4 text-center">Sube una foto clara del frente de tu licencia</span>
                                    )}
                                  </div>
                                  <Input id="license-upload" type="file" accept="image/*" onChange={handleLicenseUpload} className="mt-2 file:text-primary file:font-bold" />
                            </div>
                          </div>
                          <Button type="button" onClick={handleVerifyIdentity} disabled={!capturedUserImage || !licenseImage || verificationStatus === 'verifying' || verificationStatus === 'success'} className="w-full">
                              {verificationStatus === 'verifying' && <Loader2 className="mr-2 animate-spin" />}
                              {verificationStatus === 'success' ? <><CheckCircle2 className="mr-2"/> Verificado</> : 'Verificar Identidad con IA'}
                          </Button>
                          <VerificationStatusAlert />
                      </CardContent>
                  </Card>
                )}

                <FormField
                    control={form.control}
                    name="isOfAge"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Confirmo que soy mayor de 18 años y acepto los términos y condiciones.
                          </FormLabel>
                           <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

              <Button type="submit" className="w-full" disabled={isSubmitDisabled}>
                Crear Cuenta
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <div className="text-center text-sm">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/login" className="underline text-primary">
              Inicia Sesión
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
