
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DialogFooter,
  DialogClose,
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
import * as XLSX from 'xlsx';
import { saveTrainRoutes, getTrainRoutes, TrainRoute, deleteTrainRoute, clearAllTrainRoutes, addTrainRoute, startTranslationProcess, translateSingleRoute } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trash2, Languages, Loader2 } from 'lucide-react';

const sampleData: TrainRoute[] = [
  {
    'Train Number': '12951',
    'Train Name': 'MUMBAI RAJDHANI',
    'Start Station': 'MUMBAI CENTRAL',
    'Start Code': 'MMCT',
    'End Station': 'NEW DELHI',
    'End Code': 'NDLS',
  },
  {
    'Train Number': '12953',
    'Train Name': 'A. K. RAJDHANI',
    'Start Station': 'MUMBAI CENTRAL',
    'Start Code': 'MMCT',
    'End Station': 'H NIZAMUDDIN',
    'End Code': 'NZM',
  },
];

const initialNewRouteState: Omit<TrainRoute, 'id'> = {
  'Train Number': '',
  'Train Name': '',
  'Start Station': '',
  'Start Code': '',
  'End Station': '',
  'End Code': '',
};

export default function TrainRouteManagementPage() {
  const [data, setData] = useState<TrainRoute[]>([]);
  const [fileName, setFileName] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [newRoute, setNewRoute] = useState(initialNewRouteState);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatingRouteId, setTranslatingRouteId] = useState<number | null>(null);
  const [translationProgress, setTranslationProgress] = useState(0);
  const { toast } = useToast();

  const recordsPerPage = 7;
  
  const nPages = Math.ceil(data.length / recordsPerPage);
  const displayedRecords = data.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );


  const fetchRoutes = async () => {
    const routes = await getTrainRoutes();
    setData(routes);
    
    if (isAdding) {
      setCurrentPage(1);
    } else {
      const totalPages = Math.ceil(routes.length / recordsPerPage);
      if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(totalPages);
      } else if (routes.length === 0) {
        setCurrentPage(1);
      }
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);
  
  useEffect(() => {
    const totalPages = Math.ceil(data.length / recordsPerPage);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [data, currentPage, recordsPerPage]);
  
  const processFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const json = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const headers = json[0] as string[];
        const routes: TrainRoute[] = (json.slice(1) as any[]).map(
          (row: any[]) => {
            const route: any = {};
            headers.forEach((header, i) => {
              route[header] = row[i];
            });
            return route as TrainRoute;
          }
        );

        const result = await saveTrainRoutes(routes);
        await fetchRoutes();
        setCurrentPage(1);
        setIsImportModalOpen(false);
        toast({
          title: "Success",
          description: result.message,
        });

      } catch (error) {
        console.error("Failed to process or save file:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to import routes. Please check the file format and try again.",
        });
      }
    };
    reader.readAsBinaryString(file);
  };

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
    if (file && file.name.endsWith('.xlsx')) {
      processFile(file);
    } else {
       toast({
        variant: "destructive",
        title: "Invalid File",
        description: "Please drop a valid .xlsx file.",
      });
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
  
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const nextPage = () => {
    const totalPages = Math.ceil(data.length / recordsPerPage);
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleDeleteRoute = async (id?: number) => {
    if (id === undefined) return;
    try {
      await deleteTrainRoute(id);
      const newRoutes = data.filter((route) => route.id !== id);
      setData(newRoutes);
      
      const totalPages = Math.ceil(newRoutes.length / recordsPerPage);
      if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(totalPages);
      } else if (newRoutes.length === 0) {
        setCurrentPage(1);
      }

      toast({
        title: "Success",
        description: "Route deleted successfully.",
      });

    } catch (error) {
       toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete route.",
      });
    }
  };

  const handleClearAll = async () => {
    try {
      const result = await clearAllTrainRoutes();
      await fetchRoutes();
      setCurrentPage(1);
      toast({
        title: "Success",
        description: result.message,
      });
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to clear all routes.",
      });
    }
  };
  
  const handleNewRouteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'Start Code' || name === 'End Code') {
      setNewRoute(prev => ({ ...prev, [name]: value.toUpperCase() }));
    } else {
      setNewRoute(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddRoute = async () => {
    try {
      setIsAdding(true);
      const result = await addTrainRoute(newRoute);
      setNewRoute(initialNewRouteState);
      await fetchRoutes();
      toast({
        title: "Success",
        description: result.message,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add route.",
      });
    } finally {
        setIsAdding(false);
    }
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setNewRoute(initialNewRouteState);
  };
  
  const handleTranslateAll = async () => {
    setIsTranslating(true);
    try {
        const routes = await getTrainRoutes();
        if(routes.length === 0){
             toast({
                variant: "destructive",
                title: "No routes",
                description: "There are no routes to translate.",
            });
            setIsTranslating(false);
            return;
        }

        const result = await startTranslationProcess(routes);

        toast({
            title: "Success",
            description: result.message,
        });

    } catch (error) {
        console.error("Translation failed:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to translate routes.",
        });
    } finally {
        setIsTranslating(false);
    }
};

 const handleTranslateSingle = async (route: TrainRoute) => {
    if (!route.id) return;
    setTranslatingRouteId(route.id);
    try {
      const result = await translateSingleRoute(route);
      toast({
        title: 'Success',
        description: result.message,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to translate route.',
      });
    } finally {
      setTranslatingRouteId(null);
    }
  };


  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold md:text-2xl">
            Train Route Management
          </h1>
          <p className="text-muted-foreground">
            Upload and manage train route information.
          </p>
        </div>
        <div className="flex items-center gap-2">
           <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="destructive" disabled={data.length === 0}>
                Clear All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete all
                  train route data from the database.
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
           <Button size="sm" onClick={handleTranslateAll} disabled={isTranslating || data.length === 0}>
            {isTranslating ? 'Translating All...' : 'Translate All'}
          </Button>
          <Button size="sm" onClick={() => setIsAdding(true)} disabled={isAdding}>
            Add Route
          </Button>
          <Button size="sm" onClick={() => setIsImportModalOpen(true)}>
            Import
          </Button>
        </div>
      </div>

      <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Import Train Routes</DialogTitle>
            <DialogDescription>
              Drag and drop an .xlsx file or click browse to upload.
            </DialogDescription>
          </DialogHeader>

          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-md transition-colors
              ${isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
          >
            <p className="text-xs text-muted-foreground mb-2">
              Drag & drop your .xlsx file here
            </p>
            <p className="text-xs text-muted-foreground mb-2">or</p>
            <Input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".xlsx"
              onChange={handleFileUpload}
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium h-8 px-3 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Browse File
            </label>
          </div>

          <div className="mt-2">
            <h3 className="text-xs font-medium text-foreground mb-1">
              Expected Excel Format:
            </h3>
            <div className="rounded-md border">
              <Table className="text-[10px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="h-7 px-2">Train Number</TableHead>
                    <TableHead className="h-7 px-2">Train Name</TableHead>
                    <TableHead className="h-7 px-2">Start Station</TableHead>
                    <TableHead className="h-7 px-2">Start Code</TableHead>
                    <TableHead className="h-7 px-2">End Station</TableHead>
                    <TableHead className="h-7 px-2">End Code</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sampleData.slice(0, 1).map((row, index) => (
                    <TableRow key={index} className="h-7">
                      <TableCell className="p-2">{row['Train Number']}</TableCell>
                      <TableCell className="p-2">{row['Train Name']}</TableCell>
                      <TableCell className="p-2">{row['Start Station']}</TableCell>
                      <TableCell className="p-2">{row['Start Code']}</TableCell>
                      <TableCell className="p-2">{row['End Station']}</TableCell>
                      <TableCell className="p-2">{row['End Code']}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button variant="outline" size="sm">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isTranslating && false} onOpenChange={setIsTranslating}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Translating Routes</DialogTitle>
                <DialogDescription>
                    Please wait while the train routes are being translated. This may take a moment.
                </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 py-4">
                <Progress value={translationProgress} />
                <p className="text-sm text-center text-muted-foreground">{translationProgress}% complete</p>
            </div>
        </DialogContent>
    </Dialog>
      
      <div className="mt-4 rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Train Number</TableHead>
              <TableHead>Train Name</TableHead>
              <TableHead>Start Station</TableHead>
              <TableHead>End Station</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isAdding && (
              <TableRow>
                <TableCell>
                  <Input name="Train Number" value={newRoute['Train Number']} onChange={handleNewRouteChange} placeholder="Train Number" className="h-8" />
                </TableCell>
                <TableCell>
                  <Input name="Train Name" value={newRoute['Train Name']} onChange={handleNewRouteChange} placeholder="Train Name" className="h-8" />
                </TableCell>
                <TableCell>
                  <Input name="Start Station" value={newRoute['Start Station']} onChange={handleNewRouteChange} placeholder="Start Station" className="h-8 mb-1" />
                  <Input name="Start Code" value={newRoute['Start Code']} onChange={handleNewRouteChange} placeholder="Code" className="h-8" />
                </TableCell>
                <TableCell>
                  <Input name="End Station" value={newRoute['End Station']} onChange={handleNewRouteChange} placeholder="End Station" className="h-8 mb-1" />
                  <Input name="End Code" value={newRoute['End Code']} onChange={handleNewRouteChange} placeholder="Code" className="h-8" />
                </TableCell>
                <TableCell className="flex gap-2">
                  <Button size="sm" onClick={handleAddRoute}>Save</Button>
                  <Button size="sm" variant="outline" onClick={handleCancelAdd}>Cancel</Button>
                </TableCell>
              </TableRow>
            )}
            {displayedRecords.length > 0 ? (
              displayedRecords.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row['Train Number']}</TableCell>
                  <TableCell>{row['Train Name']}</TableCell>
                  <TableCell>
                    <div>{row['Start Station']}</div>
                    <Badge variant="secondary">{row['Start Code']}</Badge>
                  </TableCell>
                  <TableCell>
                    <div>{row['End Station']}</div>
                    <Badge variant="secondary">{row['End Code']}</Badge>
                  </TableCell>
                   <TableCell>
                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleTranslateSingle(row)}
                              disabled={translatingRouteId === row.id}
                            >
                              {translatingRouteId === row.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Languages className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Translate this route</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <AlertDialog>
                        <TooltipProvider>
                           <Tooltip>
                            <TooltipTrigger asChild>
                              <AlertDialogTrigger asChild>
                                 <Button variant="ghost" size="icon">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                              </AlertDialogTrigger>
                            </TooltipTrigger>
                             <TooltipContent>
                               <p>Delete this route</p>
                             </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the train route for{' '}
                              <strong>{row['Train Name']} ({row['Train Number']})</strong>.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteRoute(row.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              !isAdding && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    No data available. Import an Excel file to see routes.
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      </div>
      
      {nPages > 1 && (
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
            Page {currentPage} of {nPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={nextPage}
            disabled={currentPage === nPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
