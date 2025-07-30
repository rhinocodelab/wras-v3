
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Home,
  GitFork,
  Database,
  PanelLeft,
  TramFront,
  FolderKanban,
  ClipboardList,
  Speech,
  Text,
  FileAudio,
} from 'lucide-react';
import Link from 'next/link';
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet';
import { Dashboard } from '@/components/dashboard';
import { LogoutButton } from '@/components/logout-button';
import TrainRouteManagementPage from '@/app/train-route-management/page';
import AiDatabasePage from '@/app/ai-database/page';
import TranslationsPage from '@/app/ai-database/translations/page';
import AudioPage from '@/app/ai-database/audio/page';
import TemplateAudioPage from '@/app/ai-database/template-audio/page';
import CustomAudioPage from '@/app/ai-database/custom-audio/page';
import CustomAudioGenerationPage from '@/app/custom-audio-generation/page';
import IslDatasetPage from '@/app/isl-dataset/page';
import AnnouncementTemplatesPage from '@/app/announcement-templates/page';
import SpeechToIslPage from '@/app/speech-to-isl/page';
import TextToIslPage from '@/app/text-to-isl/page';
import AudioFileToIslPage from '@/app/audio-file-to-isl/page';


export default function HomePage() {
  const [activeView, setActiveView] = useState('dashboard');
  const session = { name: 'Admin' }; // This should be replaced by a proper session management call

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'route-management':
        return <TrainRouteManagementPage />;
      case 'ai-database':
        return <AiDatabasePage onViewChange={setActiveView} />;
      case 'translations':
        return <TranslationsPage onViewChange={setActiveView} />;
      case 'audio':
        return <AudioPage onViewChange={setActiveView} />;
      case 'template-audio':
        return <TemplateAudioPage onViewChange={setActiveView} />;
      case 'custom-audio':
        return <CustomAudioPage onViewChange={setActiveView} />;
      case 'custom-audio-generation':
        return <CustomAudioGenerationPage />;
      case 'isl-dataset':
        return <IslDatasetPage />;
      case 'announcement-templates':
        return <AnnouncementTemplatesPage />;
      case 'speech-to-isl':
        return <SpeechToIslPage />;
      case 'text-to-isl':
        return <TextToIslPage />;
      case 'audio-file-to-isl':
        return <AudioFileToIslPage />;
      default:
        return <Dashboard />;
    }
  };

  const getLinkClassName = (view: string) => {
    const baseClass = `flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary`;
    const isActive = activeView === view || (view === 'ai-database' && (activeView === 'translations' || activeView === 'audio' || activeView === 'template-audio' || activeView === 'custom-audio'));
    return `${baseClass} ${
      isActive
        ? 'bg-muted text-primary'
        : 'text-muted-foreground'
    }`;
  };

  const getMobileLinkClassName = (view: string) => {
    const baseClass = `flex cursor-pointer items-center gap-4 px-2.5 transition-all hover:text-foreground`;
    const isActive = activeView === view || (view === 'ai-database' && (activeView === 'translations' || activeView === 'audio' || activeView === 'template-audio' || activeView === 'custom-audio'));
    return `${baseClass} ${
      isActive
        ? 'text-foreground'
        : 'text-muted-foreground'
    }`;
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40 p-4">
      <div className="flex h-full w-full max-w-7xl flex-1 rounded-lg bg-background shadow-lg">
        <aside className="hidden w-60 flex-col border-r bg-background sm:flex">
          <div className="flex h-16 items-center border-b px-6">
              <div className="flex items-center gap-2 font-semibold text-primary">
                  <TramFront className="h-6 w-6" />
                  <span className="text-lg font-bold text-primary">WRAS-DHH</span>
              </div>
          </div>
          <nav className="flex-1 overflow-auto py-4">
            <div className="grid items-start px-4 text-sm font-medium space-y-4">
              {/* Core Management Section */}
              <div className="space-y-2">
                <div className="px-2 py-1">
                  <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#F4B400' }}>
                    Core Management
                  </h3>
                </div>
                <div
                  onClick={() => setActiveView('dashboard')}
                  className={getLinkClassName('dashboard')}
                >
                  <Home className="h-4 w-4" />
                  Dashboard
                </div>
                <div
                  onClick={() => setActiveView('route-management')}
                  className={getLinkClassName('route-management')}
                >
                  <GitFork className="h-4 w-4" />
                  Route Management
                </div>
              </div>

              {/* AI & Content Generation Section */}
              <div className="space-y-2">
                <div className="px-2 py-1">
                  <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#F4B400' }}>
                    AI & Content Generation
                  </h3>
                </div>
                <div
                  onClick={() => setActiveView('custom-audio-generation')}
                  className={getLinkClassName('custom-audio-generation')}
                >
                  <FileAudio className="h-4 w-4" />
                  Custom Audio Generation
                </div>
                <div
                  onClick={() => setActiveView('announcement-templates')}
                  className={getLinkClassName('announcement-templates')}
                >
                  <ClipboardList className="h-4 w-4" />
                  Announcement Templates
                </div>
                <div
                  onClick={() => setActiveView('ai-database')}
                  className={getLinkClassName('ai-database')}
                >
                  <Database className="h-4 w-4" />
                  AI Generated Assets
                </div>
              </div>

              {/* Sign Language (ISL) Section */}
              <div className="space-y-2">
                <div className="px-2 py-1">
                  <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#F4B400' }}>
                    Sign Language (ISL)
                  </h3>
                </div>
                <div
                  onClick={() => setActiveView('isl-dataset')}
                  className={getLinkClassName('isl-dataset')}
                >
                  <FolderKanban className="h-4 w-4" />
                  ISL Dataset
                </div>
                <div
                  onClick={() => setActiveView('speech-to-isl')}
                  className={getLinkClassName('speech-to-isl')}
                >
                  <Speech className="h-4 w-4" />
                  Speech to ISL
                </div>
                <div
                  onClick={() => setActiveView('text-to-isl')}
                  className={getLinkClassName('text-to-isl')}
                >
                  <Text className="h-4 w-4" />
                  Text to ISL
                </div>
                <div
                  onClick={() => setActiveView('audio-file-to-isl')}
                  className={getLinkClassName('audio-file-to-isl')}
                >
                  <FileAudio className="h-4 w-4" />
                  Audio File to ISL
                </div>
              </div>
            </div>
          </nav>
        </aside>
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
            <Sheet>
              <SheetTrigger asChild>
                <Button size="icon" variant="outline" className="sm:hidden">
                  <PanelLeft className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="sm:max-w-xs">
                <nav className="grid gap-6 text-lg font-medium">
                  <Link
                    href="#"
                    className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
                    prefetch={false}
                  >
                    <Home className="h-5 w-5 transition-all group-hover:scale-110" />
                    <span className="sr-only">Railway Dashboard</span>
                  </Link>
                  
                  {/* Core Management Section */}
                  <div className="space-y-2">
                    <div className="px-2 py-1">
                      <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#F4B400' }}>
                        Core Management
                      </h3>
                    </div>
                    <div
                      onClick={() => setActiveView('dashboard')}
                      className={getMobileLinkClassName('dashboard')}
                    >
                      <Home className="h-5 w-5" />
                      Dashboard
                    </div>
                    <div
                      onClick={() => setActiveView('route-management')}
                      className={getMobileLinkClassName('route-management')}
                    >
                      <GitFork className="h-5 w-5" />
                      Route Management
                    </div>
                  </div>

                  {/* AI & Content Generation Section */}
                  <div className="space-y-2">
                    <div className="px-2 py-1">
                      <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#F4B400' }}>
                        AI & Content Generation
                      </h3>
                    </div>
                    <div
                      onClick={() => setActiveView('custom-audio-generation')}
                      className={getMobileLinkClassName('custom-audio-generation')}
                    >
                      <FileAudio className="h-5 w-5" />
                      Custom Audio Generation
                    </div>
                    <div
                      onClick={() => setActiveView('announcement-templates')}
                      className={getMobileLinkClassName('announcement-templates')}
                    >
                      <ClipboardList className="h-5 w-5" />
                      Announcement Templates
                    </div>
                    <div
                      onClick={() => setActiveView('ai-database')}
                      className={getMobileLinkClassName('ai-database')}
                    >
                      <Database className="h-5 w-5" />
                      AI Generated Assets
                    </div>
                  </div>

                  {/* Sign Language (ISL) Section */}
                  <div className="space-y-2">
                    <div className="px-2 py-1">
                      <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#F4B400' }}>
                        Sign Language (ISL)
                      </h3>
                    </div>
                    <div
                      onClick={() => setActiveView('isl-dataset')}
                      className={getMobileLinkClassName('isl-dataset')}
                    >
                      <FolderKanban className="h-5 w-5" />
                      ISL Dataset
                    </div>
                    <div
                      onClick={() => setActiveView('speech-to-isl')}
                      className={getMobileLinkClassName('speech-to-isl')}
                    >
                      <Speech className="h-5 w-5" />
                      Speech to ISL
                    </div>
                    <div
                      onClick={() => setActiveView('text-to-isl')}
                      className={getMobileLinkClassName('text-to-isl')}
                    >
                      <Text className="h-5 w-5" />
                      Text to ISL
                    </div>
                    <div
                      onClick={() => setActiveView('audio-file-to-isl')}
                      className={getMobileLinkClassName('audio-file-to-isl')}
                    >
                      <FileAudio className="h-5 w-5" />
                      Audio File to ISL
                    </div>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
            <div className="flex h-16 items-center border-b px-6 sm:hidden">
                <div className="flex items-center gap-2 font-semibold text-primary">
                    <TramFront className="h-6 w-6" />
                    <span className="text-lg font-bold text-primary">WRAS-DHH</span>
                </div>
            </div>
            <div className="ml-auto flex items-center gap-4">
              {session && (
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span>Welcome, {session.name}</span>
                </div>
              )}
              <LogoutButton className="border-gray-300 hover:bg-destructive/10 hover:text-destructive hover:border-destructive" />
            </div>
          </header>
          <div className="flex flex-1 flex-col overflow-hidden">
            <main className="flex-1 overflow-y-auto p-4 sm:p-6">
              {renderContent()}
            </main>
            <footer className="border-t bg-background p-3">
              <div className="text-center text-sm text-muted-foreground">
                  Designed and Developed by Sundyne Technologies copyright 2025
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
