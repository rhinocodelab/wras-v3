'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { getCustomAudioFiles, deleteCustomAudioFile, CustomAudioFile } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Play, Trash2, Download, FileAudio, ChevronRight } from 'lucide-react';



export default function CustomAudioPage({ onViewChange }: { onViewChange: (view: string) => void }) {
  const [customAudioFiles, setCustomAudioFiles] = useState<CustomAudioFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadCustomAudioFiles();
  }, []);

  const loadCustomAudioFiles = async () => {
    try {
      const files = await getCustomAudioFiles();
      setCustomAudioFiles(files);
    } catch (error) {
      console.error('Failed to load custom audio files:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load custom audio files.',
      });
    } finally {
      setIsLoading(false);
    }
  };





  const handleDeleteFile = async (id: number) => {
    try {
      await deleteCustomAudioFile(id);
      toast({
        title: 'Success',
        description: 'Audio file deleted successfully.',
      });
      await loadCustomAudioFiles();
    } catch (error) {
      console.error('Failed to delete audio file:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete audio file.',
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center text-sm text-muted-foreground mb-4">
        <a onClick={() => onViewChange('ai-database')} className="cursor-pointer hover:text-primary">AI Database</a>
        <ChevronRight className="h-4 w-4 mx-1" />
        <span className="font-medium text-foreground">AI Custom Audio</span>
      </div>

      <div>
        <h1 className="text-lg font-semibold md:text-2xl">AI Custom Audio</h1>
        <p className="text-muted-foreground">
          View and manage all saved custom audio files generated using Google Cloud Text-to-Speech with Chirp3 HD voices.
        </p>
      </div>

      <div className="w-full">
        {/* Saved Audio Files */}
        <Card>
          <CardHeader>
            <CardTitle>Saved Audio Files</CardTitle>
            <CardDescription>
              View and manage all your saved custom audio files.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : customAudioFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileAudio className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No custom audio files generated yet.</p>
                <p className="text-sm text-muted-foreground">Generate your first audio file using the form.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {customAudioFiles.map((file) => (
                  <div key={file.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.english_text}</p>
                        <p className="text-xs text-muted-foreground truncate">{file.translated_text}</p>
                        <div className="flex items-center gap-2 mt-1">
                                                     <Badge variant="outline" className="text-xs">
                             {file.language_code.toUpperCase()}
                           </Badge>
                          {file.description && (
                            <Badge variant="secondary" className="text-xs">
                              {file.description}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const audio = new Audio(file.audio_file_path);
                            audio.play();
                          }}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = file.audio_file_path;
                            link.download = file.audio_file_path.split('/').pop() || 'audio.wav';
                            link.click();
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Audio File</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this audio file? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => file.id && handleDeleteFile(file.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatDate(file.created_at || '')}</span>
                      {file.file_size && <span>{formatFileSize(file.file_size)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 