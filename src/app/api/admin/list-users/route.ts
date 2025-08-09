// src/app/api/admin/list-users/route.ts

import { NextResponse } from 'next/server';
import admin from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/require-admin';

async function handler(req: Request) {
  try {
    // 1. Obtener todos los usuarios de Firebase Authentication
    const listUsersResult = await admin.auth().listUsers(1000); // Límite de 1000 por página, ajustar si es necesario
    const authUsers = listUsersResult.users;

    // 2. Obtener todos los documentos de usuario de Firestore
    const usersSnapshot = await admin.firestore().collection('usuarios').get();
    const firestoreUsers = new Map(usersSnapshot.docs.map(doc => [doc.id, doc.data()]));

    // 3. Combinar los datos de Auth y Firestore
    const combinedUsers = authUsers.map(authUser => {
      const firestoreData = firestoreUsers.get(authUser.uid);
      
      return {
        id: authUser.uid,
        email: authUser.email || '',
        name: firestoreData?.name || authUser.displayName || 'N/A',
        role: firestoreData?.role || 'regular',
        createdAt: firestoreData?.createdAt || null, // Los timestamps se serializarán
        isVerified: firestoreData?.isVerified || false,
        avatar: firestoreData?.avatar || '',
        // No incluir datos sensibles
      };
    });
    
    // Devolver la lista combinada y enriquecida
    return NextResponse.json(combinedUsers, { status: 200 });
  } catch (error: any) {
    console.error('Error listing users:', error);
    return NextResponse.json({ error: 'Failed to list users.' }, { status: 500 });
  }
}

// Envolver el handler con el middleware de `requireAdmin`
export const GET = requireAdmin(handler);
