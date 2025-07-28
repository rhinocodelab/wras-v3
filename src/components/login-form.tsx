'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { login } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Lock, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

const initialState: { message: string, errors?: any } = {
  message: '',
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {pending ? 'Signing In...' : 'Sign In'}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(login, initialState);

  return (
    <div className="flex h-full flex-col justify-center">
       <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-800 mb-1">Welcome Back</h2>
        <p className="text-gray-600 text-xs">Please sign in to your account</p>
      </div>
      <form action={formAction} className="space-y-3">
        <div>
            <Label htmlFor="email" className='text-xs font-medium text-gray-700 mb-1'>Username</Label>
            <div className="relative flex items-center">
              <Input
                id="email"
                name="email"
                type="text"
                placeholder="Enter username"
                required
                className="w-full pr-3 py-2 text-sm border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 focus:outline-none transition-all duration-200"
                aria-describedby="email-error"
              />
            </div>
            {state.errors?.email && (
              <p id="email-error" className="text-sm text-destructive mt-1">{state.errors.email[0]}</p>
            )}
        </div>
        <div>
            <Label htmlFor="password"  className='text-xs font-medium text-gray-700 mb-1'>Password</Label>
            <div className="relative flex items-center">
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter password"
                required
                className="w-full pr-3 py-2 text-sm border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 focus:outline-none transition-all duration-200"
                aria-describedby="password-error"
              />
            </div>
            {state.errors?.password && (
              <p id="password-error" className="text-sm text-destructive mt-1">{state.errors.password[0]}</p>
            )}
        </div>
        
        {state.message && !state.errors && (
            <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Authentication Failed</AlertTitle>
                <AlertDescription>{state.message}</AlertDescription>
            </Alert>
        )}

        <SubmitButton />
      </form>
      <div className="mt-3 p-2 bg-gray-50 border">
        <p className="text-xs text-gray-600 mb-1 font-medium">Default Credentials:</p>
         <p className="text-xs text-gray-600">Username: <span className="font-mono font-semibold">admin</span></p>
         <p className="text-xs text-gray-600">Password: <span className="font-mono font-semibold">wras@dhh</span></p>
      </div>
    </div>
  );
}