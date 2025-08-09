// src/middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Evitar que el middleware se aplique a rutas de la API, assets, etc.
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // Redirige las solicitudes a /admin a /admin/ (trailing slash)
  // Esto es necesario para que las rutas anidadas en el grupo (admin) funcionen correctamente.
  if (pathname === '/admin') {
    return NextResponse.redirect(new URL('/admin/', request.url));
  }
  
  return NextResponse.next();
}

// Configura el middleware para que se ejecute en todas las rutas excepto las de la API y assets.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
