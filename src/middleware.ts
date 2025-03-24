import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware is used to handle authentication in production
export function middleware(request: NextRequest) {
  // Skip middleware during static site generation
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    // Skip all static files
    '/((?!_next/static|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}; 