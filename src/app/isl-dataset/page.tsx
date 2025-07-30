
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { getIslVideosWithMetadata, VideoMetadata } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FolderKanban, PlayCircle, FileVideo, Calendar, HardDrive, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const VIDEOS_PER_PAGE = 10;

export default function IslDatasetPage() {
  const [videos, setVideos] = useState<VideoMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchVideos = async () => {
      setIsLoading(true);
      try {
        const videoMetadata = await getIslVideosWithMetadata();
        setVideos(videoMetadata);
        if (videoMetadata.length === 0) {
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

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
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
          {videos.length > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {videos.length} video{videos.length !== 1 ? 's' : ''} available • Page {currentPage} of {totalPages}
            </p>
          )}
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <div className="mt-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : videos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedVideos.map((video) => (
                <Card key={video.path} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium capitalize flex items-center gap-2">
                      <FileVideo className="h-4 w-4 text-primary" />
                      {video.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          <span>ISL Video</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <HardDrive className="h-3 w-3" />
                          <span>{(video.size / 1024 / 1024).toFixed(1)} MB</span>
                        </div>
                      </div>
                      {video.duration && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formatDuration(video.duration)}</span>
                        </div>
                      )}
                      <div className="flex justify-end">
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handlePlayClick(video.path)}
                            className="hover:bg-primary hover:text-primary-foreground"
                          >
                            <PlayCircle className="h-4 w-4 mr-1" />
                            Play
                          </Button>
                        </DialogTrigger>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
            <DialogTitle className="capitalize">
              {selectedVideo ? videos.find(v => v.path === selectedVideo)?.name || 'Video' : 'Video'}
            </DialogTitle>
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
