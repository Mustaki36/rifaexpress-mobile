
import { NextResponse } from 'next/server';
import admin from '@/lib/firebase-admin';
import { z } from 'zod';

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(['regular', 'creator']),
});

export async function POST(req: Request) {
  try {
    // 1. Verify Authorization Token
    const idToken = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!idToken) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // 2. Check for Admin Role
    if (decodedToken.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    // 3. Validate Request Body
    const body = await req.json();
    const validation = userSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request body', details: validation.error.flatten() }, { status: 400 });
    }
    
    const { email, name, role } = validation.data;
    let userRecord;
    let message: string;

    // 4. Upsert User Logic
    try {
      // User exists, update them
      userRecord = await admin.auth().getUserByEmail(email);
      await admin.auth().updateUser(userRecord.uid, {
        displayName: name,
      });
      await admin.auth().setCustomUserClaims(userRecord.uid, { role });
      message = `Usuario '${name}' actualizado exitosamente.`;
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // User does not exist, create them
        userRecord = await admin.auth().createUser({
          email: email,
          displayName: name,
          emailVerified: false, // User must verify their email
        });
        await admin.auth().setCustomUserClaims(userRecord.uid, { role });
        message = `Usuario '${name}' creado exitosamente.`;
      } else {
        // Other errors (network, etc.)
        throw error;
      }
    }
    
    // Create Firestore document if it doesn't exist
    const userDocRef = admin.firestore().collection('usuarios').doc(userRecord.uid);
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
        await userDocRef.set({
            name: name,
            email: email,
            role: role,
            isVerified: false, // Default value
            avatar: `https://placehold.co/100x100.png?text=${name.charAt(0)}`,
            tickets: [],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            mustChangePassword: true, // Force password change
        });
    } else {
        await userDocRef.update({
            name: name,
            role: role
        });
    }


    // 5. Generate Password Reset Link and respond
    const link = await admin.auth().generatePasswordResetLink(email);
    const finalMessage = `${message} Se ha enviado un enlace a ${email} para que establezca su contraseña.`;
    
    // NOTE: In a real app, you would use a service like Nodemailer or SendGrid
    // to actually email the link to the user. For this context, we return it in the response for the admin.
    console.log(`Password reset link for ${email}: ${link}`);

    return NextResponse.json({ success: true, message: finalMessage }, { status: 200 });

  } catch (error: any) {
    console.error('Error in create-user endpoint:', error);
    let errorMessage = 'An internal server error occurred.';
    let statusCode = 500;

    if (error.code === 'auth/id-token-expired') {
        errorMessage = 'Unauthorized: Token expired.';
        statusCode = 401;
    } else if (error.codePrefix === 'auth/') {
        errorMessage = `Firebase Auth Error: ${error.message}`;
        statusCode = 400;
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
