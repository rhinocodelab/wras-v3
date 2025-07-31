'use client';

import { logout } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { LogOut, User, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

type HeaderProps = {
  session: {
    name: string;
    email: string;
  } | null;
};

export function Header({ session }: HeaderProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async (formData: FormData) => {
    setIsLoggingOut(true);
    try {
      // Add a small delay to show the loading modal
      await new Promise(resolve => setTimeout(resolve, 1000));
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <div className="flex items-center gap-4 ml-auto">
          {session && (
            <div className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              <span>Welcome, {session.name}</span>
            </div>
          )}
          <form action={handleLogout}>
            <Button variant="outline" size="sm" type="submit" className="border-gray-300" disabled={isLoggingOut}>
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Sign Out</span>
            </Button>
          </form>
        </div>
      </header>

      <Dialog open={isLoggingOut} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col gap-4 py-4 items-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Signing out...</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
