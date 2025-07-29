
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, ClipboardList, Volume2 } from 'lucide-react';
import { getAnnouncementTemplates, saveAnnouncementTemplate, Template, clearAllAnnouncementTemplates, generateAndSaveTemplateAudio, checkTemplateAudioExists } from '@/app/actions';

const ANNOUNCEMENT_CATEGORIES = ['Arriving', 'Delay', 'Cancelled', 'Platform_Change'];
const LANGUAGES = ['English', 'हिंदी', 'मराठी', 'ગુજરાતી'];
const LANGUAGE_CODES: { [key: string]: string } = {
    'English': 'en',
    'हिंदी': 'hi',
    'मराठी': 'mr',
    'ગુજરાતી': 'gu'
};
const LANGUAGE_MAP: { [key: string]: string } = {
  'en': 'English',
  'mr': 'मराठी',
  'hi': 'हिंदी',
  'gu': 'ગુજરાતી',
};


export default function AnnouncementTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [generatingAudioCategory, setGeneratingAudioCategory] = useState<string | null>(null);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [pendingAudioCategory, setPendingAudioCategory] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
        const data = await getAnnouncementTemplates();
        setTemplates(data);
    } catch(error) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to load templates from the database.'
        });
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith('.json')) {
      processFile(file);
    } else {
      toast({
        variant: 'destructive',
        title: 'Invalid File',
        description: 'Please drop a valid .json file.',
      });
    }
  };
  
  const processFileContent = async (content: string) => {
    setIsProcessing(true);
    try {
        const parsedData = JSON.parse(content);
        let templatesSaved = 0;
        
        for (const category of ANNOUNCEMENT_CATEGORIES) {
            if (!parsedData[category]) {
                console.warn(`Category "${category}" not found in JSON file. Skipping.`);
                continue;
            }

            for (const lang of LANGUAGES) {
                const langCode = LANGUAGE_CODES[lang];
                 if (typeof parsedData[category][langCode] !== 'string') {
                    console.warn(`Template for category "${category}" and language "${langCode}" is missing or invalid. Skipping.`);
                    continue;
                }
                await saveAnnouncementTemplate({
                    category,
                    language_code: langCode,
                    template_text: parsedData[category][langCode],
                });
                templatesSaved++;
            }
        }
        
        if (templatesSaved > 0) {
            await fetchTemplates();
            toast({
              title: 'Success',
              description: 'Announcement templates have been saved successfully.',
            });
        } else {
             toast({
              variant: 'destructive',
              title: 'No Templates Saved',
              description: 'The JSON file did not contain any valid templates.',
            });
        }

    } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'File Error',
          description: `Failed to process file: ${error.message}`,
        });
    } finally {
        setIsProcessing(false);
    }
  }


  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      await processFileContent(content);
    };
    reader.readAsText(file);
  };

  const handleUseSample = async () => {
    setIsProcessing(true);
    try {
        const response = await fetch('/sample_annoucement_template/announcement_templates.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch sample file: ${response.statusText}`);
        }
        const content = await response.text();
        await processFileContent(content);
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: `Could not load sample data: ${error.message}`,
        });
    } finally {
        setIsProcessing(false);
    }
  }

  const handleClearAll = async () => {
    setIsClearing(true);
    try {
      const result = await clearAllAnnouncementTemplates();
      toast({
        title: 'Success',
        description: result.message,
      });
      await fetchTemplates(); // Refresh the list
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to clear templates.',
      });
    } finally {
      setIsClearing(false);
    }
  };


  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const getTemplate = (category: string, lang: string) => {
    const langCode = LANGUAGE_CODES[lang];
    return templates.find(t => t.category === category && t.language_code === langCode);
  }

  const handleOpenModal = (template: Template | undefined) => {
    if (template) {
        setSelectedTemplate(template);
    }
  };

  const handleGenerateAudioForCategory = async (category: string) => {
    // Prevent multiple clicks
    if (generatingAudioCategory === category) {
      return;
    }

    try {
      // Check if audio already exists
      const audioExists = await checkTemplateAudioExists(category);
      
      if (audioExists) {
        // Show confirmation dialog for regeneration
        setPendingAudioCategory(category);
        setShowRegenerateDialog(true);
        return;
      }
      
      // If no audio exists, proceed with generation
      await generateAudioForCategory(category);
      
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to check audio status.',
      });
    }
  }

  const generateAudioForCategory = async (category: string) => {
    setGeneratingAudioCategory(category);
    
    try {
      let successCount = 0;
      for (const lang of LANGUAGES) {
        const langCode = LANGUAGE_CODES[lang];
        if (getTemplate(category, lang)) {
          toast({
            title: 'Processing...',
            description: `Generating audio for ${category} in ${LANGUAGE_MAP[langCode]}.`,
          });
          await generateAndSaveTemplateAudio(category, langCode);
          successCount++;
          // Add delay between API calls
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      if (successCount > 0) {
        toast({
          title: 'Success!',
          description: `Audio generation complete for the ${category} category.`,
        });
      } else {
         toast({
          variant: 'destructive',
          title: 'Error',
          description: `No templates found for category: ${category}.`,
        });
      }

    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Audio Generation Failed',
            description: error.message || `An unexpected error occurred.`
        });
    } finally {
        setGeneratingAudioCategory(null);
    }
  }

  const handleRegenerateAudio = async () => {
    if (!pendingAudioCategory) return;
    
    setShowRegenerateDialog(false);
    setPendingAudioCategory(null);
    
    // Proceed with regeneration
    await generateAudioForCategory(pendingAudioCategory);
  }
  
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold md:text-2xl flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            Announcement Templates
          </h1>
          <p className="text-muted-foreground">
            Upload and manage multilingual announcement templates from a single JSON file.
          </p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" disabled={isClearing || templates.length === 0}>
                {isClearing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Clear All
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete all
                announcement templates and their generated audio from the database.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearAll}>
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle>Upload Templates</CardTitle>
                    <CardDescription>Upload a JSON file with all language translations.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-md transition-colors
                        ${isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
                    >
                        <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground mb-2">
                        Drag & drop your .json file here
                        </p>
                        <p className="text-sm text-muted-foreground mb-4">or</p>
                         <div className="flex gap-2">
                            <Input
                            type="file"
                            id="file-upload"
                            className="hidden"
                            accept=".json"
                            onChange={handleFileUpload}
                            />
                            <label
                            htmlFor="file-upload"
                            className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                            Browse File
                            </label>
                            <Button variant="secondary" onClick={handleUseSample} className="h-9 px-4 py-2">Use Sample</Button>
                        </div>
                    </div>
                     <div className="mt-4 text-xs text-muted-foreground">
                        <p>The JSON file should be an object where each category key contains translations:</p>
                        <pre className="mt-2 p-2 bg-muted rounded-md text-xs">
                            {`{\n  "Arriving": {\n    "en": "...",\n    "hi": "...",\n    "mr": "...",\n    "gu": "..."\n  },\n  "Delay": { ... }\n}`}
                        </pre>
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-2">
        <Dialog>
           <Card>
                <CardHeader>
                    <CardTitle>Current Templates</CardTitle>
                    <CardDescription>
                        These are the templates currently loaded in the system.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : templates.length > 0 ? (
                        <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead>Category</TableHead>
                                <TableHead className="w-[45%]">English Template</TableHead>
                                <TableHead className="text-center">Translations</TableHead>
                                <TableHead className="text-center">AI Audio</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {ANNOUNCEMENT_CATEGORIES.map(category => (
                                <TableRow key={category}>
                                <TableCell className="font-medium">{category.replace('_', ' ')}</TableCell>
                                <TableCell className="text-xs">{getTemplate(category, 'English')?.template_text || 'N/A'}</TableCell>
                                <TableCell className="text-center">
                                   <div className="flex gap-1 justify-center">
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="xs" onClick={() => handleOpenModal(getTemplate(category, 'हिंदी'))} disabled={!getTemplate(category, 'हिंदी')}>हि</Button>
                                        </DialogTrigger>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="xs" onClick={() => handleOpenModal(getTemplate(category, 'मराठी'))} disabled={!getTemplate(category, 'मराठी')}>म</Button>
                                        </DialogTrigger>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="xs" onClick={() => handleOpenModal(getTemplate(category, 'ગુજરાતી'))} disabled={!getTemplate(category, 'ગુજરાતી')}>ગ</Button>
                                        </DialogTrigger>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon"
                                                    onClick={() => handleGenerateAudioForCategory(category)}
                                                    disabled={generatingAudioCategory === category || !getTemplate(category, 'English')}
                                                >
                                                    {generatingAudioCategory === category ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Volume2 className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Generate or regenerate audio for this category</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground p-12 border rounded-md">
                            <p>No templates loaded.</p>
                            <p className='text-sm'>Upload a JSON file or use the sample to get started.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
             <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {selectedTemplate ? `${LANGUAGE_MAP[selectedTemplate.language_code]} Template - ${selectedTemplate.category.replace('_', ' ')}` : 'Template'}
                    </DialogTitle>
                </DialogHeader>
                {selectedTemplate ? (
                    <div className="py-4">
                       <p className="text-sm">{selectedTemplate.template_text}</p>
                    </div>
                ) : (
                    <p>No template data available.</p>
                )}
            </DialogContent>
            </Dialog>
        </div>
      </div>
      
       <Dialog open={isProcessing}>
            <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Processing Templates</DialogTitle>
                    <DialogDescription>
                        Please wait while templates are being saved. This should only take a moment.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4 items-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
            </DialogContent>
        </Dialog>

        {/* Regenerate Audio Confirmation Dialog */}
        <AlertDialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Audio Already Exists</AlertDialogTitle>
                    <AlertDialogDescription>
                        Audio for the "{pendingAudioCategory?.replace('_', ' ')}" category has already been generated. 
                        Do you want to regenerate it? This will replace the existing audio files.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => {
                        setShowRegenerateDialog(false);
                        setPendingAudioCategory(null);
                    }}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={handleRegenerateAudio}>
                        Regenerate
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}


    