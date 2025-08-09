// src/app/api/admin/update-role/route.ts

import { NextResponse } from 'next/server';
import admin from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/require-admin';
import { z } from 'zod';

const updateRoleSchema = z.object({
  userId: z.string().min(1, "User ID is required."),
  role: z.enum(['regular', 'creator', 'admin', 'suspended']),
});

async function handler(req: Request) {
  try {
    const body = await req.json();
    const validation = updateRoleSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request body', details: validation.error.flatten() }, { status: 400 });
    }
    
    const { userId, role } = validation.data;

    // Evitar que el admin principal se cambie el rol a sí mismo
    const idToken = req.headers.get('Authorization')?.split('Bearer ')[1]!;
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    if (userId === decodedToken.uid && role !== 'admin') {
        return NextResponse.json({ error: 'The main admin cannot change their own role.' }, { status: 403 });
    }

    // 1. Actualizar el documento en Firestore (fuente de verdad)
    const userDocRef = admin.firestore().collection('usuarios').doc(userId);
    await userDocRef.update({ role });
    
    // 2. Establecer los custom claims en Firebase Auth
    await admin.auth().setCustomUserClaims(userId, { role });
    
    // Si el usuario es suspendido, revocar sus tokens de sesión
    if (role === 'suspended') {
        await admin.auth().revokeRefreshTokens(userId);
    }
    
    return NextResponse.json({ success: true, message: `User role updated to ${role}.` }, { status: 200 });

  } catch (error: any) {
    console.error('Error updating user role:', error);
    return NextResponse.json({ error: 'An internal server error occurred while updating the role.' }, { status: 500 });
  }
}

export const POST = requireAdmin(handler);
