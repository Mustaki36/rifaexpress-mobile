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
import { Camera, AlertTriangle, CheckCircle2, UserCheck, Loader2, Send, Clock, Users, User, BadgeCheck, Eye, EyeOff } from "lucide-react";
import React, { useRef, useState, useEffect } from 'react';
import { verifyIdentity, VerifyIdentityInput } from "@/ai/flows/verify-identity-flow";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { useSettings } from "@/context/SettingsContext";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const formSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  email: z.string().email("Por favor, introduce un email válido."),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
  confirmPassword: z.string().min(6, "La confirmación de contraseña debe tener al menos 6 caracteres."),
  phone: z.string().min(8, "El número de teléfono no es válido."),
  address: z.string().min(10, "La dirección debe tener al menos 10 caracteres."),
  verificationCode: z.string().optional(),
  role: z.enum(["regular", "creator"], {
    required_error: "Debes seleccionar un tipo de cuenta.",
  }),
  isOfAge: z.boolean().refine(val => val === true, {
    message: "Debes confirmar que eres mayor de edad.",
  }),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
});

type VerificationStatus = 'idle' | 'verifying' | 'success' | 'error';

export default function SignupPage() {
  const { signup, requestVerificationCode, verifyCode, isEmailBlocked } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isVerificationEnabled } = useSettings();
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedUserImage, setCapturedUserImage] = useState<string | null>(null);
  const [licenseImage, setLicenseImage] = useState<string | null>(null);
  const [idVerificationStatus, setIdVerificationStatus] = useState<VerificationStatus>('idle');
  const [idVerificationError, setIdVerificationError] = useState<string | null>(null);

  const [codeSent, setCodeSent] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (codeSent) {
      // Allow sending new code once countdown finishes
      // setCodeSent(false); 
    }
    return () => clearTimeout(timer);
  }, [countdown, codeSent]);
  

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      address: "",
      verificationCode: "",
      isOfAge: false,
    },
  });

  const emailValue = form.watch("email");

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

    setIdVerificationStatus('verifying');
    setIdVerificationError(null);

    try {
        const input: VerifyIdentityInput = {
            userPhotoDataUri: capturedUserImage,
            documentPhotoDataUri: licenseImage
        };
        const result = await verifyIdentity(input);

        if (result.isVerified && result.isOfAge) {
            setIdVerificationStatus('success');
            toast({ title: "¡Verificación exitosa!", description: "Tu identidad ha sido confirmada." });
        } else {
            setIdVerificationStatus('error');
            let errorReason = result.reason || "No se pudo verificar la identidad.";
            if(!result.isOfAge) errorReason = "La IA ha determinado que no eres mayor de edad.";
            if(!result.isMatch) errorReason = "La foto del documento no coincide con tu foto.";
            setIdVerificationError(errorReason);
            toast({ variant: "destructive", title: "Verificación fallida", description: errorReason});
        }
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : "No se pudo realizar la verificación.";
        setIdVerificationStatus('error');
        setIdVerificationError(errorMessage);
        toast({ variant: "destructive", title: "Error en la verificación", description: errorMessage });
    }
  }

  const handleRequestCode = async () => {
    const email = form.getValues("email");
    const emailError = form.getFieldState("email").error;
    
    if (!email || emailError) {
      toast({ variant: "destructive", title: "Email inválido", description: "Por favor, introduce un email válido para enviar el código." });
      return;
    }

    if (isEmailBlocked(email)) {
       toast({ variant: "destructive", title: "Email Bloqueado", description: "Este email ha sido bloqueado por demasiados intentos fallidos." });
      return;
    }

    setIsSendingCode(true);
    try {
      await requestVerificationCode(email);
      toast({ 
        title: "Código de prueba generado", 
        description: "Busca el código en la consola del navegador (F12)."
      });
      setCodeSent(true);
      setCountdown(60);
      setIsCodeVerified(false); // Reset verification status on new code
    } catch (error) {
       if (error instanceof Error) {
        toast({ variant: "destructive", title: "Error", description: error.message });
      }
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    const email = form.getValues("email");
    const code = form.getValues("verificationCode");

    if (!code || code.length !== 6) {
      toast({ variant: "destructive", title: "Código inválido", description: "El código debe tener 6 dígitos." });
      return;
    }

    setIsVerifyingCode(true);
    try {
      // Simulate network delay
      await new Promise(res => setTimeout(res, 500));
      const isCodeValid = verifyCode(email, code);

      if (isCodeValid) {
        setIsCodeVerified(true);
        toast({ title: "Código verificado", description: "El código de verificación es correcto." });
      } else {
        setIsCodeVerified(false);
        toast({ variant: "destructive", title: "Código incorrecto", description: "El código de verificación no es válido. Inténtalo de nuevo." });
      }
    } catch (error) {
       if (error instanceof Error) {
         toast({ variant: "destructive", title: "Error", description: error.message });
       }
    } finally {
      setIsVerifyingCode(false);
    }
  };


  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (isVerificationEnabled && idVerificationStatus !== 'success') {
      toast({
        variant: "destructive",
        title: "Verificación de ID requerida",
        description: "Debes verificar tu identidad con tu licencia antes de crear la cuenta.",
      });
      return;
    }

    if (!isCodeVerified) {
       toast({ variant: "destructive", title: "Código no verificado", description: "Por favor, verifica tu código de email antes de continuar." });
       return;
    }
    
    try {
      signup(values.name, values.email, values.password, values.phone, values.address, isVerificationEnabled, values.role);
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

  const IdVerificationStatusAlert = () => {
    switch (idVerificationStatus) {
        case 'success':
            return (
                <Alert variant="default" className="bg-green-100 dark:bg-green-900 border-green-500 text-green-900 dark:text-green-100">
                    <CheckCircle2 className="h-4 w-4 !text-green-500" />
                    <AlertTitle>Identidad Verificada</AlertTitle>
                    <AlertDescription>
                        ¡Perfecto! Hemos confirmado tu identidad.
                    </AlertDescription>
                </Alert>
            );
        case 'error':
            return (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Verificación de ID Fallida</AlertTitle>
                    <AlertDescription>
                        {idVerificationError || "No pudimos verificar tu identidad. Inténtalo de nuevo."}
                    </AlertDescription>
                </Alert>
            );
        default:
            return null;
    }
  }

  const isSubmitDisabled = (isVerificationEnabled && idVerificationStatus !== 'success') || !isCodeVerified || isEmailBlocked(emailValue);

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
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>¿Qué tipo de cuenta quieres?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="regular" id="r1" className="peer sr-only" />
                          </FormControl>
                          <FormLabel htmlFor="r1" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary w-full cursor-pointer">
                              <User className="mb-3 h-6 w-6" />
                              Usuario Regular
                              <span className="text-xs font-normal text-muted-foreground mt-1 text-center">Para comprar boletos y participar.</span>
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="creator" id="r2" className="peer sr-only" />
                          </FormControl>
                           <FormLabel htmlFor="r2" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary w-full cursor-pointer">
                              <Users className="mb-3 h-6 w-6" />
                              Creador de Rifas
                              <span className="text-xs font-normal text-muted-foreground mt-1 text-center">Para crear y gestionar tus propias rifas.</span>
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                          <Input type="email" placeholder="tu@email.com" {...field} disabled={countdown > 0} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contraseña</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input 
                              type={showPassword ? "text" : "password"} 
                              {...field} 
                            />
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
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar Contraseña</FormLabel>
                         <div className="relative">
                            <FormControl>
                              <Input 
                                type={showPassword ? "text" : "password"} 
                                {...field} 
                              />
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
              </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  
                   <div className="space-y-2">
                     <FormLabel>Verificación de Email</FormLabel>
                     <Button type="button" onClick={handleRequestCode} disabled={countdown > 0 || isSendingCode || !emailValue || !!form.getFieldState("email").error} className="w-full">
                        {isSendingCode ? <Loader2 className="mr-2 animate-spin" /> : <Send className="mr-2" />}
                        {codeSent && countdown > 0 ? `Reenviar en ${countdown}s` : "Enviar código"}
                     </Button>
                   </div>
                   <div>
                     <FormField
                      control={form.control}
                      name="verificationCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Código de Verificación</FormLabel>
                          <FormControl>
                            <Input placeholder="Introduce el código de 6 dígitos" {...field} disabled={isCodeVerified} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                   </div>
                </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    <div className="md:col-span-2">
                       <Button type="button" onClick={handleVerifyCode} disabled={!codeSent || isVerifyingCode || isCodeVerified} className="w-full">
                          {isVerifyingCode && <Loader2 className="mr-2 animate-spin" />}
                          {isCodeVerified ? <><BadgeCheck className="mr-2"/> Verificado</> : 'Verificar Código'}
                       </Button>
                    </div>
                 </div>


               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
               </div>
                

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
                          <Button type="button" onClick={handleVerifyIdentity} disabled={!capturedUserImage || !licenseImage || idVerificationStatus === 'verifying' || idVerificationStatus === 'success'} className="w-full">
                              {idVerificationStatus === 'verifying' && <Loader2 className="mr-2 animate-spin" />}
                              {idVerificationStatus === 'success' ? <><CheckCircle2 className="mr-2"/> Verificado</> : 'Verificar Identidad con IA'}
                          </Button>
                          <IdVerificationStatusAlert />
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
                {isEmailBlocked(emailValue) ? "Email Bloqueado" : "Crear Cuenta"}
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
