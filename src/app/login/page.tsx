import { getSession } from '@/app/actions';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/login-form';
import { TramFront } from 'lucide-react';

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect('/');
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex flex-col md:flex-row">
          <div className="flex w-full flex-col items-center justify-center bg-primary p-8 text-white md:w-1/2 relative">
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
              <div className="text-3xl font-bold text-white/20 select-none">
                POC DEMO
              </div>
            </div>
            <div className="text-center">
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                <TramFront className="h-6 w-6 text-white" />
              </div>
              <h1 className="mb-2 text-lg font-bold">WRAS-DHH</h1>
              <p className="mb-3 text-xs leading-relaxed text-blue-100">
                Western Railway Announcement System
                <br />
                for Deaf and Hard of Hearing
              </p>
              <div className="mx-auto mb-3 h-0.5 w-12 bg-white/30"></div>
              <p className="text-xs text-blue-100">
                Empowering accessibility through
                <br />
                visual railway announcements
              </p>
            </div>
          </div>
          <div className="flex w-full flex-col justify-center p-8 md:w-1/2">
            <LoginForm />
          </div>
        </div>
      </div>
    </main>
  );
}
