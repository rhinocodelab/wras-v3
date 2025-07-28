
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  DialogDescription,
  DialogTrigger,
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
import { getTranslations, FullTranslationInfo, TranslationRecord, generateAudioForRoute, clearAudioForRoute, TrainRoute } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ChevronRight, Volume2, Trash2 } from 'lucide-react';

const LANGUAGE_MAP: { [key: string]: string } = {
  'en': 'English',
  'mr': 'Marathi',
  'hi': 'Hindi',
  'gu': 'Gujarati',
};

const RECORDS_PER_PAGE = 5;

export default function TranslationsPage({ onViewChange }: { onViewChange: (view: string) => void }) {
  const [allTranslations, setAllTranslations] = useState<FullTranslationInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState<string | null>(null);
  const [isClearingAudio, setIsClearingAudio] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<FullTranslationInfo | null>(null);
  const [selectedLang, setSelectedLang] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFetchTranslations = async () => {
    setIsLoading(true);
    try {
      const data = await getTranslations();
      setAllTranslations(data);
      if (data.length === 0) {
        toast({
          title: 'No Data',
          description: 'No translations found. Please generate them from the Route Management page.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch translations.',
      });
      console.error('Failed to fetch translations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleFetchTranslations();
  }, []);

  const totalPages = Math.ceil(allTranslations.length / RECORDS_PER_PAGE);
  const paginatedTranslations = allTranslations.slice(
    (currentPage - 1) * RECORDS_PER_PAGE,
    currentPage * RECORDS_PER_PAGE
  );

  const getTranslationForLang = (item: FullTranslationInfo, langCode: string) => {
    return item.translations.find(t => t.language_code === langCode) || null;
  }
  
  const handleOpenModal = (item: FullTranslationInfo, langCode: string) => {
    setSelectedItem(item);
    setSelectedLang(langCode);
  };

  const handleGenerateAudio = async (route: FullTranslationInfo) => {
    if (!route.id || route.translations.length === 0) {
        toast({
            variant: "destructive",
            title: "Cannot Generate Audio",
            description: "No translations exist for this route. Please generate translations first."
        });
        return;
    }
    setIsGeneratingAudio(route.train_number);
    try {
      const result = await generateAudioForRoute(route.id, route.train_number, route.translations);
      toast({
        title: 'Success',
        description: result.message,
      });
      await handleFetchTranslations();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate audio.',
      });
      console.error('Audio generation failed:', error);
    } finally {
      setIsGeneratingAudio(null);
    }
  };

  const handleClearAudio = async (routeId: number) => {
    setIsClearingAudio(routeId);
    try {
      const result = await clearAudioForRoute(routeId);
      toast({
        title: 'Success',
        description: result.message,
      });
      await handleFetchTranslations();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to clear audio.',
      });
      console.error('Audio clearing failed:', error);
    } finally {
      setIsClearingAudio(null);
    }
  };

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
  
  const selectedTranslation = selectedItem && selectedLang ? getTranslationForLang(selectedItem, selectedLang) : null;
  const englishTranslation = selectedItem ? getTranslationForLang(selectedItem, 'en') : null;


  return (
    <div className="w-full">
       <div className="flex items-center text-sm text-muted-foreground mb-4">
            <a onClick={() => onViewChange('ai-database')} className="cursor-pointer hover:text-primary">AI Database</a>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span className="font-medium text-foreground">AI Generated Text Translation</span>
        </div>

        <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold md:text-2xl">Route Translations</h1>
              <p className="text-muted-foreground">
                  Displaying translated text for all train routes.
              </p>
            </div>
      </div>
     
        <div className="mt-6">
          {isLoading ? (
             <div className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          ) : allTranslations.length > 0 ? (
            <Dialog>
                <Card>
                    <CardContent className="pt-6">
                       <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead>Train Number</TableHead>
                                <TableHead>Train Name</TableHead>
                                <TableHead>Start Station</TableHead>
                                <TableHead>End Station</TableHead>
                                <TableHead>Translations</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {paginatedTranslations.map((item) => {
                                return (
                                <TableRow key={item.id}>
                                    <TableCell>{item.train_number}</TableCell>
                                    <TableCell>{item.train_name}</TableCell>
                                    <TableCell>{item.start_station}</TableCell>
                                    <TableCell>{item.end_station}</TableCell>
                                    <TableCell>
                                      <div className="flex gap-1">
                                        {item.translations.length > 0 ? (
                                          <>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <DialogTrigger asChild>
                                                            <Button variant="outline" size="xs" onClick={() => handleOpenModal(item, 'hi')}>HI</Button>
                                                        </DialogTrigger>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Hindi</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <DialogTrigger asChild>
                                                            <Button variant="outline" size="xs" onClick={() => handleOpenModal(item, 'mr')}>MR</Button>
                                                        </DialogTrigger>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Marathi</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <DialogTrigger asChild>
                                                            <Button variant="outline" size="xs" onClick={() => handleOpenModal(item, 'gu')}>GU</Button>
                                                        </DialogTrigger>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Gujarati</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                          </>
                                        ) : (
                                          <span className="text-xs text-muted-foreground">No translations</span>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                         <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button 
                                                        variant="outline"
                                                        size="icon" 
                                                        onClick={() => handleGenerateAudio(item)}
                                                        disabled={isGeneratingAudio === item.train_number || item.translations.length === 0}
                                                    >
                                                        {isGeneratingAudio === item.train_number ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Volume2 className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Generate Audio</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                        <AlertDialog>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <AlertDialogTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                disabled={isClearingAudio === item.id}
                                                            >
                                                                {isClearingAudio === item.id ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <Trash2 className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Clear Audio</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will permanently delete all generated audio files for train <strong>{item.train_name} ({item.train_number})</strong>. This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => item.id && handleClearAudio(item.id)}>
                                                        Continue
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                                );
                            })}
                            </TableBody>
                        </Table>
                        </div>
                    </CardContent>
                </Card>
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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {selectedItem && selectedLang ? `${LANGUAGE_MAP[selectedLang]} Translation for ${selectedItem.train_name}` : 'Translation'}
                        </DialogTitle>
                        <DialogDescription>
                            Showing the translated details for the selected language.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedTranslation ? (
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <p className="text-right font-semibold">Train Name</p>
                                <p className="col-span-3">{selectedTranslation.train_name_translation}</p>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <p className="text-right font-semibold">Train Number</p>
                                <p className="col-span-3">{selectedTranslation.train_number_translation}</p>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <p className="text-right font-semibold">Start Station</p>
                                <p className="col-span-3">{selectedTranslation.start_station_translation}</p>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <p className="text-right font-semibold">End Station</p>
                                <p className="col-span-3">{selectedTranslation.end_station_translation}</p>
                            </div>
                        </div>
                    ) : (
                        <p>No translation data available for the selected language.</p>
                    )}
                </DialogContent>
            </Dialog>
          ) : (
            <div className="mt-6 text-center text-muted-foreground border rounded-lg p-12">
              <p>No translation data to display.</p>
              <p className='text-sm'>Please generate translations from the Route Management page.</p>
            </div>
          )}
        </div>
         <Dialog open={!!isGeneratingAudio}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Generating Audio</DialogTitle>
                    <DialogDescription>
                        Please wait while audio files are being generated for train {isGeneratingAudio}. This may take a moment.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4 items-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Processing...</p>
                </div>
            </DialogContent>
        </Dialog>
    </div>
  );
}

    

    