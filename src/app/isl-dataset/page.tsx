
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
} from '@/components/ui/dialog';
import { getIslVideos } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FolderKanban, PlayCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const VIDEOS_PER_PAGE = 5;

export default function IslDatasetPage() {
  const [videos, setVideos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchVideos = async () => {
      setIsLoading(true);
      try {
        const videoPaths = await getIslVideos();
        setVideos(videoPaths);
        if (videoPaths.length === 0) {
          toast({
            title: 'No Videos Found',
            description: 'The ISL dataset directory is empty or does not exist.',
          });
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to fetch ISL dataset videos.',
        });
        console.error('Failed to fetch ISL videos:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchVideos();
  }, [toast]);

  const totalPages = Math.ceil(videos.length / VIDEOS_PER_PAGE);
  const paginatedVideos = videos.slice(
    (currentPage - 1) * VIDEOS_PER_PAGE,
    currentPage * VIDEOS_PER_PAGE
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

  const handlePlayClick = (videoSrc: string) => {
    setSelectedVideo(videoSrc);
    setIsModalOpen(true);
  }

  const getFileName = (path: string) => {
    return path.split('/').pop()?.replace('.mp4', '').replace(/_/g, ' ') ?? 'video';
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold md:text-2xl flex items-center gap-2">
            <FolderKanban className="h-6 w-6 text-primary" />
            ISL Dataset
          </h1>
          <p className="text-muted-foreground">
            A collection of pre-recorded ISL videos for various words and phrases.
          </p>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <div className="mt-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : videos.length > 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Video Name</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedVideos.map((videoSrc) => (
                        <TableRow key={videoSrc}>
                          <TableCell className="font-medium capitalize">{getFileName(videoSrc)}</TableCell>
                          <TableCell className="text-right">
                             <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => handlePlayClick(videoSrc)}>
                                    <PlayCircle className="h-5 w-5" />
                                </Button>
                            </DialogTrigger>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="mt-6 text-center text-muted-foreground border rounded-lg p-12">
              <p>No videos found in the ISL dataset.</p>
              <p className="text-sm">
                Add `.mp4` files to the `public/isl_dataset` directory to see them here.
              </p>
            </div>
          )}
        </div>
        
        {videos.length > 0 && totalPages > 1 && (
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
            <DialogTitle className="capitalize">{selectedVideo ? getFileName(selectedVideo) : 'Video'}</DialogTitle>
          </DialogHeader>
          {selectedVideo && (
            <div className="mt-4">
                <video key={selectedVideo} controls autoPlay className="w-full rounded-md" muted>
                    <source src={selectedVideo} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
