'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

// Pages that should not display the navbar
const HIDDEN_NAVBAR_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password'
];

interface NavbarHandlerProps {
  children: ReactNode;
}

export default function NavbarHandler({ children }: NavbarHandlerProps) {
  const pathname = usePathname();
  
  // Hide navbar on login and other auth pages
  if (pathname && HIDDEN_NAVBAR_PATHS.includes(pathname)) {
    return null;
  }
  
  return <>{children}</>;
} 