'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { generateCustomAudioTemporary, saveCustomAudioPermanently, cleanupTemporaryCustomAudio, CustomAudioFile } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Play, Save, Zap, Volume2, CheckCircle, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';



const QUICK_OPTIONS = [
  {
    id: 'numbers',
    title: 'Numbers 0-9',
    description: 'Generate audio for digits 0 to 9',
    items: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
  },
  {
    id: 'basic-words',
    title: 'Basic Words',
    description: 'Common words used in announcements',
    items: ['Attention', 'Please', 'Thank you', 'Welcome', 'Good morning', 'Good evening', 'Good night']
  },
  {
    id: 'directions',
    title: 'Directions',
    description: 'Directional words for navigation',
    items: ['Left', 'Right', 'Up', 'Down', 'Forward', 'Backward', 'North', 'South', 'East', 'West']
  },
  {
    id: 'time-words',
    title: 'Time Words',
    description: 'Time-related words and phrases',
    items: ['Morning', 'Afternoon', 'Evening', 'Night', 'Today', 'Tomorrow', 'Yesterday', 'Now', 'Later', 'Soon']
  },
  {
    id: 'platform-words',
    title: 'Platform Words',
    description: 'Platform and station related words',
    items: ['Platform', 'Station', 'Train', 'Arriving', 'Departing', 'Delayed', 'Cancelled', 'On time']
  },
  {
    id: 'custom',
    title: 'Custom Text',
    description: 'Enter your own text',
    items: []
  }
];

export default function CustomAudioGenerationPage() {
  const [englishText, setEnglishText] = useState('');
  const [description, setDescription] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['en', 'hi', 'mr', 'gu']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedQuickOption, setSelectedQuickOption] = useState<string>('custom');

  const [previewAudio, setPreviewAudio] = useState<{ [key: string]: string }>({});
  const [generatedFiles, setGeneratedFiles] = useState<CustomAudioFile[]>([]);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<{
    current: number;
    total: number;
    currentText: string;
    currentLanguage: string;
    status: 'generating' | 'completed' | 'error';
  }>({
    current: 0,
    total: 0,
    currentText: '',
    currentLanguage: '',
    status: 'generating'
  });
  const [progressIntervalId, setProgressIntervalId] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Cleanup temporary files when component unmounts
  useEffect(() => {
    return () => {
      if (generatedFiles.length > 0) {
        cleanupTemporaryCustomAudio();
      }
    };
  }, [generatedFiles.length]);

  // Cleanup progress interval when component unmounts
  useEffect(() => {
    return () => {
      if (progressIntervalId) {
        clearInterval(progressIntervalId);
      }
    };
  }, [progressIntervalId]);

  const handleQuickOptionSelect = (optionId: string) => {
    setSelectedQuickOption(optionId);
    if (optionId === 'custom') {
      setEnglishText('');
      setDescription('');
    } else {
      const option = QUICK_OPTIONS.find(opt => opt.id === optionId);
      if (option) {
        setDescription(option.title);
        // Set a sample text for the selected quick option
        if (option.items.length > 0) {
          setEnglishText(option.items[0]); // Set first item as example
        }
      }
    }
  };

  const handleGenerateAudio = async () => {
    let itemsToGenerate: string[] = [];
    
    // Determine what to generate based on selection
    if (selectedQuickOption === 'custom') {
      if (!englishText.trim()) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Please enter some text to generate audio.',
        });
        return;
      }
      itemsToGenerate = [englishText.trim()];
    } else {
      const selectedOption = QUICK_OPTIONS.find(opt => opt.id === selectedQuickOption);
      if (selectedOption && selectedOption.items.length > 0) {
        itemsToGenerate = selectedOption.items;
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No items to generate for this option.',
        });
        return;
      }
    }

    setIsGenerating(true);
    setShowProgressDialog(true);
    setGenerationProgress({
      current: 0,
      total: itemsToGenerate.length * selectedLanguages.length,
      currentText: '',
      currentLanguage: '',
      status: 'generating'
    });

    // Start progress simulation with longer delays
    const intervalId = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev.current < prev.total) {
          const languageNames = ['English', 'Hindi', 'Marathi', 'Gujarati'];
          const currentItemIndex = Math.floor(prev.current / selectedLanguages.length);
          const currentLanguageIndex = prev.current % selectedLanguages.length;
          const currentItem = itemsToGenerate[currentItemIndex] || '';
          const currentLanguage = languageNames[currentLanguageIndex] || '';
          
          return {
            ...prev,
            current: prev.current + 1,
            currentText: currentItem,
            currentLanguage: currentLanguage
          };
        }
        return prev;
      });
    }, 3000); // Update every 3 seconds for better delay
    setProgressIntervalId(intervalId);

    try {
      const allResults: CustomAudioFile[] = [];
      
      for (let i = 0; i < itemsToGenerate.length; i++) {
        const item = itemsToGenerate[i];
        
        try {
          const results = await generateCustomAudioTemporary(
            item,
            selectedLanguages,
            selectedQuickOption === 'custom' ? (description.trim() || undefined) : `${QUICK_OPTIONS.find(opt => opt.id === selectedQuickOption)?.title} - ${item}`
          );
          
          if (results.length > 0) {
            allResults.push(...results);
          }
          
          // Add longer delay between items to avoid rate limiting and ensure audio quality
          if (i < itemsToGenerate.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
          
        } catch (error) {
          console.error(`Failed to generate audio for "${item}":`, error);
          // Continue with other items even if one fails
        }
      }

      if (progressIntervalId) {
        clearInterval(progressIntervalId);
        setProgressIntervalId(null);
      }

      if (allResults.length > 0) {
        setGeneratedFiles(allResults);
        
        // Create preview audio URLs
        const previewUrls: { [key: string]: string } = {};
        allResults.forEach(file => {
          if (file.audio_file_path) {
            previewUrls[file.language_code] = file.audio_file_path;
          }
        });
        setPreviewAudio(previewUrls);

        setGenerationProgress(prev => ({ ...prev, status: 'completed', current: prev.total }));
        
        toast({
          title: 'Audio Generated',
          description: `Generated ${allResults.length} audio file(s) for preview.`,
        });
      } else {
        setGenerationProgress(prev => ({ ...prev, status: 'error' }));
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to generate any audio files.',
        });
      }
    } catch (error) {
      if (progressIntervalId) {
        clearInterval(progressIntervalId);
        setProgressIntervalId(null);
      }
      console.error('Failed to generate audio:', error);
      setGenerationProgress(prev => ({ ...prev, status: 'error' }));
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate audio. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAudio = async () => {
    if (generatedFiles.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No audio files to save. Please generate preview first.',
      });
      return;
    }

    setIsSaving(true);
    try {
      // Move files from temporary to permanent location and save to database
      const savedFiles = await saveCustomAudioPermanently(generatedFiles);
      
      toast({
        title: 'Audio Saved',
        description: `${savedFiles.length} audio file(s) have been saved successfully.`,
      });

      // Clear the preview
      setGeneratedFiles([]);
      setPreviewAudio({});
      setEnglishText('');
      setDescription('');
      setSelectedLanguages(['en', 'hi', 'mr', 'gu']);
      
      // Cleanup any remaining temporary files
      await cleanupTemporaryCustomAudio();
      
    } catch (error) {
      console.error('Failed to save audio:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save audio files. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };



  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-lg font-semibold md:text-2xl">Custom Audio Generation</h1>
        <p className="text-muted-foreground">
          Generate and preview custom audio files from English text in all 4 languages using Google Cloud Text-to-Speech with Chirp3 HD voices.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Generation Form */}
        <Card>
          <CardHeader>
            <CardTitle>Generate Audio</CardTitle>
            <CardDescription>
              Enter English text to generate high-quality audio files in all 4 languages using Google Cloud TTS Chirp3 HD voices.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quick Options */}
            <div className="space-y-2">
              <Label>Quick Generation Options</Label>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_OPTIONS.map((option) => (
                  <div
                    key={option.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedQuickOption === option.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleQuickOptionSelect(option.id)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{option.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                    {option.items.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {option.items.length} items
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>



            {/* Custom Text Input */}
            <div className="space-y-2">
              <Label htmlFor="englishText">English Text *</Label>
              <Textarea
                id="englishText"
                placeholder={selectedQuickOption === 'custom' ? "Enter the text you want to convert to audio..." : "Text will be automatically filled from selected quick option"}
                value={englishText}
                onChange={(e) => setEnglishText(e.target.value)}
                rows={4}
                maxLength={500}
                disabled={selectedQuickOption !== 'custom'}
                className={selectedQuickOption !== 'custom' ? 'opacity-50 cursor-not-allowed' : ''}
              />
              <p className="text-xs text-muted-foreground">
                {selectedQuickOption === 'custom' ? `${englishText.length}/500 characters` : 'Text area is disabled when using quick generation options'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                placeholder="Brief description for the audio file..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                Used for file naming and organization
              </p>
            </div>



            <div className="flex gap-2">
              <Button
                onClick={handleGenerateAudio}
                disabled={isGenerating || (selectedQuickOption === 'custom' && !englishText.trim())}
                className="flex-1"
              >
                {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isGenerating ? 'Generating...' : selectedQuickOption === 'custom' ? 'Generate Audio' : `Generate All ${QUICK_OPTIONS.find(opt => opt.id === selectedQuickOption)?.items.length || 0} Items`}
              </Button>
              
              {generatedFiles.length > 0 && (
                <Button
                  onClick={handleSaveAudio}
                  disabled={isSaving}
                  className="flex-1"
                  variant="outline"
                >
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSaving ? 'Saving...' : 'Save Audio'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Preview Section */}
        <Card>
          <CardHeader>
            <CardTitle>Audio Preview</CardTitle>
            <CardDescription>
              Preview generated audio files before saving.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generatedFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Volume2 className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No audio files generated yet.</p>
                <p className="text-sm text-muted-foreground">Generate preview to see audio files here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Generated Files ({generatedFiles.length})</span>
                  <Badge variant="outline" className="text-xs">
                    Preview Mode
                  </Badge>
                </div>
                <Separator />
                {generatedFiles.map((file, index) => (
                  <div key={file.id || `temp-${file.language_code}-${index}`} className="border rounded-lg p-3 space-y-2">
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
                      </div>
                    </div>
                  </div>
                ))}
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground text-center">
                    Click "Save Audio" to permanently save these files to the database.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Progress Dialog */}
      <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generating Audio</DialogTitle>
            <DialogDescription>
              Please wait while we generate audio files. This may take a few minutes for multiple items.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-muted-foreground">
                {generationProgress.current} / {generationProgress.total}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(generationProgress.current / generationProgress.total) * 100}%` }}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Current Language:</span>
                <Badge variant="outline" className="text-xs">
                  {generationProgress.currentLanguage.toUpperCase()}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Text:</span> {generationProgress.currentText}
              </div>
            </div>
            {generationProgress.status === 'completed' && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Generation completed successfully!</span>
                <p className="text-xs text-muted-foreground mt-1">
                  You can now preview and save the audio files.
                </p>
              </div>
            )}
            {generationProgress.status === 'error' && (
              <div className="flex items-center gap-2 text-red-600">
                <XCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Generation failed. Please try again.</span>
              </div>
            )}
            {generationProgress.status === 'completed' && (
              <Button 
                onClick={() => setShowProgressDialog(false)} 
                className="w-full"
              >
                Close
              </Button>
            )}
            {generationProgress.status === 'error' && (
              <Button 
                onClick={async () => {
                  await cleanupTemporaryCustomAudio();
                  setShowProgressDialog(false);
                  setGeneratedFiles([]);
                }} 
                className="w-full"
                variant="destructive"
              >
                Close & Cleanup
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 