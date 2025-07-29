
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { getTemplateAudioData, TemplateAudioInfo } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ChevronRight, Speaker, Languages } from 'lucide-react';

const LANGUAGE_MAP: { [key: string]: string } = {
  'en': 'English',
  'mr': 'मराठी',
  'hi': 'हिंदी',
  'gu': 'ગુજરાતી',
};

export default function TemplateAudioPage({ onViewChange }: { onViewChange: (view: string) => void }) {
  const [audioData, setAudioData] = useState<TemplateAudioInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAudio = async () => {
      setIsLoading(true);
      try {
        const data = await getTemplateAudioData();
        setAudioData(data);
        if (data.length === 0) {
          toast({
            title: 'No Data',
            description: 'No template audio found. Please generate it from the Announcement Templates page.',
          });
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to fetch template audio data.',
        });
        console.error('Failed to fetch template audio data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAudio();
  }, [toast]);

  const AudioPlayer = ({ src, label }: { src: string | null; label: string }) => {
    if (!src) return null;
    return (
        <div className="flex flex-col items-center gap-1 p-2 border rounded-md bg-muted/50 min-w-[200px]">
             <audio controls className="h-8 w-full" key={src}>
                <source src={src} type="audio/wav" />
                Your browser does not support the audio element.
            </audio>
            <p className="text-xs text-muted-foreground text-center w-full break-words" title={label}>{label}</p>
        </div>
    );
  };
  
  const renderTemplateTextWithPlaceholders = (text: string) => {
    const parts = text.split(/({[a-zA-Z0-9_]+})/g);
    return parts.map((part, index) => {
      if (part.match(/({[a-zA-Z0-9_]+})/g)) {
        return (
          <span key={index} className="px-1 py-0.5 bg-primary/10 text-primary rounded-sm font-mono text-xs">
            {part}
          </span>
        );
      }
      return part;
    });
  }

  return (
    <div className="w-full">
      <div className="flex items-center text-sm text-muted-foreground mb-4">
        <a onClick={() => onViewChange('ai-database')} className="cursor-pointer hover:text-primary">AI Database</a>
        <ChevronRight className="h-4 w-4 mx-1" />
        <span className="font-medium text-foreground">AI Template Audio</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold md:text-2xl">Template Audio</h1>
          <p className="text-muted-foreground">
            Listen to generated audio for all announcement templates.
          </p>
        </div>
      </div>
     
      <div className="mt-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : audioData.length > 0 ? (
          <Accordion type="single" collapsible className="w-full space-y-4">
            {audioData.map((item) => (
                <Card key={item.category}>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Speaker className="h-5 w-5 text-primary" />
                            {item.category}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="single" collapsible className="w-full">
                        {item.templates.map(template => (
                             <AccordionItem value={template.language_code} key={template.language_code}>
                                <AccordionTrigger>
                                    <div className="flex items-center gap-2">
                                        <Languages className="h-4 w-4" />
                                        {LANGUAGE_MAP[template.language_code]}
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-semibold mb-2">Template Text:</h4>
                                            <p className="text-sm text-muted-foreground p-2 border rounded-md bg-muted/50 leading-relaxed">
                                                {renderTemplateTextWithPlaceholders(template.template_text)}
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold mb-2">Audio Parts:</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                            {(() => {
                                                const parts = template.template_text.split(/({[a-zA-Z0-9_]+})/g);
                                                const audioParts = template.template_audio_parts;
                                                
                                                return parts.map((part, index) => {
                                                    if (part.match(/({[a-zA-Z0-9_]+})/g)) {
                                                        // It's a placeholder, no audio
                                                        return null;
                                                    } else if (part.trim().length > 0) {
                                                        // It's a static text part with audio
                                                        const audioPart = audioParts[index];
                                                        if (!audioPart) return null;
                                                        return <AudioPlayer key={audioPart} src={audioPart} label={part.trim()} />;
                                                    }
                                                    return null;
                                                }).filter(Boolean);
                                            })()}
                                            </div>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                        </Accordion>
                    </CardContent>
                </Card>
            ))}
          </Accordion>
        ) : (
          <div className="mt-6 text-center text-muted-foreground border rounded-lg p-12">
            <p>No template audio data to display.</p>
            <p className='text-sm'>Please generate audio from the Announcement Templates page.</p>
          </div>
        )}
      </div>
    </div>
  );
}
