'use client';

import { useState, useEffect } from 'react';
import './globals.css';
import { NavBar } from '@/components/nav-bar';
import { Toaster } from '@/components/ui/toaster';
import { storage, UserSettings } from '@/lib/storage';
import { translations } from '@/lib/translations';
import { Lock, Fingerprint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [isLocked, setIsLocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const s = storage.getSettings();
    setSettings(s);
    if (s.isPinEnabled && s.pin) {
      setIsLocked(true);
    }
    
    // Apply theme on load
    if (s.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const handleUnlock = () => {
    if (settings && pinInput === settings.pin) {
      setIsLocked(false);
    } else {
      setPinInput('');
    }
  };

  if (!isMounted) return <html lang="id"><body>{children}</body></html>;

  const t = settings ? translations[settings.language] : translations.id;

  return (
    <html lang={settings?.language || 'id'} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="https://picsum.photos/seed/fino-icon/180/180" />
      </head>
      <body className="font-body antialiased selection:bg-accent/30 selection:text-primary overflow-x-hidden bg-background">
        {isLocked ? (
          <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background px-8 animate-in fade-in duration-500">
            <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-[24px] bg-primary text-primary-foreground shadow-2xl">
              <Lock className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-bold font-headline mb-2">{t.enterPin}</h2>
            <p className="text-sm text-muted-foreground mb-8 text-center">{t.assistantStatus}</p>
            <div className="w-full max-w-[240px] space-y-4">
              <Input
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                className="h-16 text-center text-3xl font-bold tracking-[1em] rounded-2xl bg-muted/30 border-none focus-visible:ring-2 focus-visible:ring-primary/20"
                autoFocus
              />
              <Button 
                onClick={handleUnlock} 
                className="w-full h-14 rounded-2xl bg-primary text-white shadow-lg font-bold"
                disabled={pinInput.length < 4}
              >
                Unlock
              </Button>
              <div className="flex justify-center mt-6">
                <button className="flex items-center gap-2 text-primary text-xs font-semibold opacity-60 hover:opacity-100 transition-opacity">
                  <Fingerprint className="h-4 w-4" /> Use Biometrics
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <main className="mx-auto min-h-screen max-w-2xl pb-32 md:pb-40 bg-background">
              <div className="px-6 pt-12 md:px-8">
                {children}
              </div>
            </main>
            <NavBar />
          </>
        )}
        <Toaster />
      </body>
    </html>
  );
}
