
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

export const metadata: Metadata = {
  title: 'RifasXpress Mobile',
  description: 'Tu plataforma de rifas online.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-body antialiased"
        )}
      >
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
