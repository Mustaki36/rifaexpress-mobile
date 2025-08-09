// src/middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Redirige las solicitudes a /admin a /admin/ (trailing slash)
  // Esto es necesario para que las rutas anidadas en el grupo (admin) funcionen correctamente.
  if (request.nextUrl.pathname === '/admin') {
    return NextResponse.redirect(new URL('/admin/', request.url));
  }
  
  // Puedes añadir más lógica de middleware aquí si es necesario en el futuro.
  
  return NextResponse.next();
}

// Configura el middleware para que se ejecute solo en las rutas de /admin
export const config = {
  matcher: ['/admin'],
};
