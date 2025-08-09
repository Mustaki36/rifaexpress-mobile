
"use client";

import { useEffect } from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { RaffleProvider } from '@/context/RaffleContext';
import { AuthProvider } from '@/context/AuthContext';
import { ResultsProvider } from '@/context/ResultsContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { BlockProvider } from '@/context/BlockContext';
import { TransitionProvider } from '@/context/TransitionContext';

// Metadata cannot be exported from a client component.
// We keep it here, but it won't be used by Next.js in this client-side layout.
// For metadata, you would typically use a server-side layout.
/*
export const metadata: Metadata = {
  title: 'RifasXpress Mobile',
  description: 'Tu plataforma de rifas online.',
};
*/

/**
 * AutoplayManager component handles browser restrictions on autoplaying media.
 * It listens for the first user interaction and then plays all media elements
 * marked with `data-autoplay="true"`.
 */
function AutoplayManager() {
  useEffect(() => {
    const handleFirstInteraction = () => {
      // Find all audio and video elements that are supposed to autoplay
      const mediaElements = document.querySelectorAll<HTMLAudioElement | HTMLVideoElement>('[data-autoplay="true"]');
      
      mediaElements.forEach(media => {
        // Unmute and play the media
        media.muted = false;
        media.play().catch(error => {
          // Log any errors that occur during playback attempt
          console.warn(`Could not autoplay media element with src ${media.src}:`, error);
        });
      });

      // Remove the event listener after the first interaction
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };

    // Add event listeners for the first user interaction
    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);

    // Cleanup function to remove listeners when the component unmounts
    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, []); // Empty dependency array ensures this effect runs only once

  return null; // This component does not render anything
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <title>RifasXpress Mobile</title>
        <meta name="description" content="Tu plataforma de rifas online." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-body antialiased"
        )}
      >
        <AutoplayManager />
        <TransitionProvider>
          <SettingsProvider>
            <AuthProvider>
              <BlockProvider>
                <RaffleProvider>
                  <ResultsProvider>
                    <div className="relative flex min-h-screen flex-col">
                      <SiteHeader />
                      <main className="flex-1">{children}</main>
                      <SiteFooter />
                    </div>
                    <Toaster />
                  </ResultsProvider>
                </RaffleProvider>
              </BlockProvider>
            </AuthProvider>
          </SettingsProvider>
        </TransitionProvider>
      </body>
    </html>
  );
}
