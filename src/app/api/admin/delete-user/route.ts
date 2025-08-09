// src/app/api/admin/delete-user/route.ts

import { NextResponse } from 'next/server';
import admin from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/require-admin';
import { z } from 'zod';

const deleteUserSchema = z.object({
  userId: z.string().min(1, "User ID is required."),
});

async function handler(req: Request) {
  try {
    const body = await req.json();
    const validation = deleteUserSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request body', details: validation.error.flatten() }, { status: 400 });
    }
    
    const { userId } = validation.data;

    // Evitar que un admin se borre a sí mismo
    const idToken = req.headers.get('Authorization')?.split('Bearer ')[1]!;
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    if (userId === decodedToken.uid) {
        return NextResponse.json({ error: 'Admins cannot delete themselves.' }, { status: 403 });
    }
    
    // 1. Eliminar usuario de Firebase Auth
    await admin.auth().deleteUser(userId);
    
    // 2. Eliminar documento de usuario de Firestore
    const userDocRef = admin.firestore().collection('usuarios').doc(userId);
    await userDocRef.delete();
    
    return NextResponse.json({ success: true, message: 'User deleted successfully.' }, { status: 200 });

  } catch (error: any) {
    console.error('Error deleting user:', error);
    let errorMessage = 'An internal server error occurred while deleting the user.';
    
    if (error.code === 'auth/user-not-found') {
        errorMessage = 'User not found in Firebase Authentication. The Firestore document might have been deleted.';
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export const POST = requireAdmin(handler);
