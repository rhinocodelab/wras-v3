'use client';

import { logout } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { LogOut, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface LogoutButtonProps {
  className?: string;
}

export function LogoutButton({ className }: LogoutButtonProps) {
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
      <form action={handleLogout}>
        <Button
          variant="outline"
          size="sm"
          type="submit"
          className={className}
          disabled={isLoggingOut}
        >
          Sign Out
        </Button>
      </form>

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