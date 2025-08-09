// src/lib/require-admin.ts

import { NextResponse } from 'next/server';
import admin from '@/lib/firebase-admin';

/**
 * Un decorador de middleware que verifica si el solicitante es un administrador.
 * Envuelve una función de handler de ruta de API (como POST, GET, etc.).
 *
 * @param handler - La función de handler de la ruta de API a ejecutar si el usuario es un administrador.
 * @returns Una nueva función de handler que primero realiza la verificación de administrador.
 */
export function requireAdmin(
  handler: (req: Request, ...args: any[]) => Promise<Response>
) {
  return async (req: Request, ...args: any[]): Promise<Response> => {
    const idToken = req.headers.get('Authorization')?.split('Bearer ')[1];
    
    if (!idToken) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }

    try {
      // Verifica el token de ID y comprueba los custom claims.
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      
      // La fuente de verdad para el rol es ahora el documento de Firestore.
      const userDoc = await admin.firestore().collection('usuarios').doc(decodedToken.uid).get();
      const userData = userDoc.data();

      if (!userData || userData.role !== 'admin') {
         return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
      }

      // Si el usuario es un administrador, ejecuta el handler original.
      return handler(req, ...args);

    } catch (error: any) {
      console.error('Authentication error in requireAdmin:', error);
      let errorMessage = 'An internal server error occurred.';
      let statusCode = 500;

      if (error.code === 'auth/id-token-expired') {
        errorMessage = 'Unauthorized: Token expired.';
        statusCode = 401;
      } else if (error.code?.startsWith('auth/')) {
        errorMessage = `Firebase Auth Error: ${error.message}`;
        statusCode = 401;
      }
      
      return NextResponse.json({ error: errorMessage }, { status: statusCode });
    }
  };
}
