
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { getAudioData, FullAudioInfo } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ChevronRight, Music, Languages } from 'lucide-react';

const LANGUAGE_MAP: { [key: string]: string } = {
  'en': 'English',
  'mr': 'मराठी',
  'hi': 'हिंदी',
  'gu': 'ગુજરાતી',
};

const RECORDS_PER_PAGE = 5;

export default function AudioPage({ onViewChange }: { onViewChange: (view: string) => void }) {
  const [allAudioData, setAllAudioData] = useState<FullAudioInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAudio = async () => {
      setIsLoading(true);
      try {
        const data = await getAudioData();
        setAllAudioData(data);
        if (data.length === 0) {
          toast({
            title: 'No Data',
            description: 'No audio data found. Please generate audio from the Route Translations page.',
          });
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to fetch audio data.',
        });
        console.error('Failed to fetch audio data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAudio();
  }, [toast]);

  const totalPages = Math.ceil(allAudioData.length / RECORDS_PER_PAGE);
  const paginatedAudio = allAudioData.slice(
    (currentPage - 1) * RECORDS_PER_PAGE,
    currentPage * RECORDS_PER_PAGE
  );

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const AudioPlayer = ({ src }: { src: string | null }) => {
    if (!src) return <span className="text-xs text-muted-foreground">N/A</span>;
    return (
      <audio controls className="h-8 w-full" key={src}>
        <source src={src} type="audio/wav" />
        Your browser does not support the audio element.
      </audio>
    );
  };

  return (
    <div className="w-full">
      <div className="flex items-center text-sm text-muted-foreground mb-4">
        <a onClick={() => onViewChange('ai-database')} className="cursor-pointer hover:text-primary">AI Database</a>
        <ChevronRight className="h-4 w-4 mx-1" />
        <span className="font-medium text-foreground">AI Generated Audio</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold md:text-2xl">Route Audio</h1>
          <p className="text-muted-foreground">
            Listen to generated audio for all train routes.
          </p>
        </div>
      </div>
     
      <div className="mt-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : allAudioData.length > 0 ? (
          <>
            <div className="grid gap-6">
              {paginatedAudio.map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Music className="h-5 w-5 text-primary" />
                      {item.train_name} ({item.train_number})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Train Number</h4>
                        <div className="space-y-2">
                          {['en', 'hi', 'mr', 'gu'].map(lang => {
                            const audioRecord = item.audio.find(a => a.language_code === lang);
                            return (
                              <div key={lang} className="grid grid-cols-[80px_1fr] items-center gap-2">
                                <span className="text-sm font-medium">{LANGUAGE_MAP[lang]}</span>
                                <AudioPlayer src={audioRecord?.train_number_audio_path ?? null} />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Train Name</h4>
                         <div className="space-y-2">
                          {['en', 'hi', 'mr', 'gu'].map(lang => {
                            const audioRecord = item.audio.find(a => a.language_code === lang);
                            return (
                              <div key={lang} className="grid grid-cols-[80px_1fr] items-center gap-2">
                                <span className="text-sm font-medium">{LANGUAGE_MAP[lang]}</span>
                                <AudioPlayer src={audioRecord?.train_name_audio_path ?? null} />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                       <div>
                        <h4 className="font-semibold mb-2">Start Station</h4>
                         <div className="space-y-2">
                          {['en', 'hi', 'mr', 'gu'].map(lang => {
                            const audioRecord = item.audio.find(a => a.language_code === lang);
                            return (
                              <div key={lang} className="grid grid-cols-[80px_1fr] items-center gap-2">
                                <span className="text-sm font-medium">{LANGUAGE_MAP[lang]}</span>
                                <AudioPlayer src={audioRecord?.start_station_audio_path ?? null} />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                       <div>
                        <h4 className="font-semibold mb-2">End Station</h4>
                         <div className="space-y-2">
                          {['en', 'hi', 'mr', 'gu'].map(lang => {
                            const audioRecord = item.audio.find(a => a.language_code === lang);
                            return (
                              <div key={lang} className="grid grid-cols-[80px_1fr] items-center gap-2">
                                <span className="text-sm font-medium">{LANGUAGE_MAP[lang]}</span>
                                <AudioPlayer src={audioRecord?.end_station_audio_path ?? null} />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevPage}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="mt-6 text-center text-muted-foreground border rounded-lg p-12">
            <p>No audio data to display.</p>
            <p className='text-sm'>Please generate audio from the AI Database {"->"} Translations page.</p>
          </div>
        )}
      </div>
    </div>
  );
}
