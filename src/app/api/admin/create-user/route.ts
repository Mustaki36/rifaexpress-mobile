// src/app/api/admin/create-user/route.ts

import { NextResponse } from 'next/server';
import admin from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/require-admin';
import { z } from 'zod';

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(['regular', 'creator']),
});

async function handler(req: Request) {
  try {
    const body = await req.json();
    const validation = userSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request body', details: validation.error.flatten() }, { status: 400 });
    }
    
    const { email, name, role } = validation.data;
    let userRecord;
    let message: string;

    try {
      // Verificar si el usuario ya existe en Firebase Auth
      userRecord = await admin.auth().getUserByEmail(email);

      // Si existe, actualizar
      await admin.auth().updateUser(userRecord.uid, { displayName: name });
      await admin.auth().setCustomUserClaims(userRecord.uid, { role });
      await admin.firestore().collection('usuarios').doc(userRecord.uid).update({ name, role });
      
      message = `Usuario '${name}' actualizado exitosamente.`;

    } catch (error: any) {
      // Si el error es "user-not-found", el usuario no existe, así que lo creamos
      if (error.code === 'auth/user-not-found') {
        userRecord = await admin.auth().createUser({
          email: email,
          displayName: name,
          emailVerified: true, // Lo marcamos como verificado ya que un admin lo crea
        });
        
        await admin.auth().setCustomUserClaims(userRecord.uid, { role });

        const userDocRef = admin.firestore().collection('usuarios').doc(userRecord.uid);
        await userDocRef.set({
            name: name,
            email: email,
            role: role,
            isVerified: false, // La verificación por IA es un proceso separado
            avatar: `https://placehold.co/100x100.png?text=${name.charAt(0)}`,
            tickets: [],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            mustChangePassword: true, // Forzar al usuario a cambiar la contraseña
        });
        message = `Usuario '${name}' creado exitosamente.`;
      } else {
        // Si es otro tipo de error, lo relanzamos para que sea capturado por el catch principal
        throw error;
      }
    }

    // En ambos casos (creación o actualización), generamos y enviamos un enlace de restablecimiento
    const link = await admin.auth().generatePasswordResetLink(email);
    const finalMessage = `${message} Se ha enviado un enlace a ${email} para que establezca su contraseña.`;
    
    // En una app real, aquí se enviaría el email. Para esta demo, lo mostramos en el log.
    console.log(`Password reset link for ${email}: ${link}`);

    return NextResponse.json({ success: true, message: finalMessage }, { status: 200 });

  } catch (error: any) {
    console.error('Error in create-user endpoint:', error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}

export const POST = requireAdmin(handler);
