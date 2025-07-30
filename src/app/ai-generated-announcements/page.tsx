'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Eye, Info, Trash2 } from 'lucide-react';
import { getSavedAnnouncements, deleteAnnouncement, SavedAnnouncement } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

export default function AIGeneratedAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<SavedAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<SavedAnnouncement | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const data = await getSavedAnnouncements();
      setAnnouncements(data);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load saved announcements.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewAnnouncement = (announcement: SavedAnnouncement) => {
    // Create and open the published HTML page
    const htmlContent = generateAnnouncementHTML(announcement);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const generateAnnouncementHTML = (announcement: SavedAnnouncement) => {
    const baseUrl = window.location.origin;
    
    // Convert relative paths to absolute URLs
    const audioFiles = Object.entries(announcement.audio_files).map(([lang, path]) => ({
      language: lang,
      path: `${baseUrl}${path}`
    }));
    
    const videoFiles = announcement.isl_video_files.map(path => `${baseUrl}${path}`);
    
    const announcementData = Object.entries(announcement.announcement_texts).map(([lang, text]) => ({
      language_code: lang,
      text: text,
      audio_path: announcement.audio_files[lang] ? `${baseUrl}${announcement.audio_files[lang]}` : null
    }));
    
    const announcementDataJson = JSON.stringify(announcementData);
    const audioSources = JSON.stringify(audioFiles.map(a => a.path));
    const videoSources = JSON.stringify(videoFiles);

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Announcement: ${announcement.train_name}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; background-color: #000; color: #fff; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
          .main-content { flex-grow: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 20px; }
          .info-header { text-align: center; margin-bottom: 20px; padding: 15px 25px; border-radius: 12px; background-color: rgba(255, 255, 255, 0.1); }
          .info-header h1 { margin: 0; font-size: 3.2em; }
          .info-header p { margin: 8px 0 0; font-size: 1.6em; letter-spacing: 1px; }
          .route { display: flex; align-items: center; justify-content: center; gap: 20px; }
          .video-container { width: 80%; max-width: 960px; aspect-ratio: 16 / 9; background-color: #111; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
          video { width: 100%; height: 100%; object-fit: cover; }
          .ticker-wrap { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 1200px; background-color: #1a1a1a; padding: 20px; overflow: hidden; min-height: 80px; }
          .ticker { display: block; text-align: center; font-size: 2.2em; transition: opacity 0.5s ease; line-height: 1.4; white-space: nowrap; margin: 0; }
          .ticker.fade { opacity: 0.3; }
          .ticker.active { opacity: 1; }
        </style>
      </head>
      <body>
        <div class="main-content">
          <div class="info-header">
            <h1>${announcement.train_number} - ${announcement.train_name}</h1>
            <div class="route">
              <p>Platform: ${announcement.platform}</p>
              <span>&bull;</span>
              <p>Category: ${announcement.category}</p>
            </div>
          </div>
          <div class="video-container">
            <video id="isl-video" muted playsinline></video>
          </div>
        </div>
        <div class="ticker-wrap">
          <div id="ticker" class="ticker"></div>
        </div>
        <audio id="announcement-audio"></audio>
        <audio id="intro-audio" preload="auto"></audio>

        <script>
          const videoElement = document.getElementById('isl-video');
          const audioPlayer = document.getElementById('announcement-audio');
          const tickerElement = document.getElementById('ticker');
          const tickerWrap = document.querySelector('.ticker-wrap');
          
          const announcementData = ${announcementDataJson};
          const audioPlaylist = ${audioSources};
          const videoPlaylist = ${videoSources};
          
          let currentVideoIndex = 0;
          let currentAudioIndex = 0;
          let isPlaying = false;
          
          function updateTickerText(languageCode) {
            const announcement = announcementData.find(a => a.language_code === languageCode);
            if (announcement) {
              tickerElement.textContent = announcement.text;
              tickerElement.classList.remove('fade');
              tickerElement.classList.add('active');
              
              // Adjust width based on text length
              setTimeout(() => {
                const minWidth = 800;
                const maxWidth = 1800;
                const padding = 40;
                const newWidth = Math.max(minWidth, Math.min(maxWidth, tickerElement.scrollWidth + padding));
                tickerWrap.style.width = newWidth + 'px';
                tickerWrap.style.left = '50%';
                tickerWrap.style.transform = 'translateX(-50%)';
              }, 100);
            }
          }
          
          function fadeTickerText() {
            tickerElement.classList.add('fade');
            tickerElement.classList.remove('active');
          }
          
          function playIntroThenAnnouncement() {
            if (currentAudioIndex < audioPlaylist.length) {
              const audioPath = audioPlaylist[currentAudioIndex];
              audioPlayer.src = audioPath;
              audioPlayer.load();
              
              audioPlayer.oncanplay = () => {
                audioPlayer.play();
                const languageCode = announcementData[currentAudioIndex]?.language_code;
                if (languageCode) {
                  updateTickerText(languageCode);
                }
              };
              
              currentAudioIndex++;
            }
          }
          
          function startPlayback() {
            isPlaying = true;
            currentVideoIndex = 0;
            currentAudioIndex = 0;
            
            // Start video playback
            if (videoPlaylist.length > 0) {
              videoElement.src = videoPlaylist[currentVideoIndex];
              videoElement.load();
              videoElement.play();
              
              videoElement.addEventListener('ended', () => {
                currentVideoIndex = (currentVideoIndex + 1) % videoPlaylist.length;
                videoElement.src = videoPlaylist[currentVideoIndex];
                videoElement.load();
                videoElement.play();
              });
            }
            
            // Initialize ticker with first language
            if (announcementData.length > 0) {
              updateTickerText(announcementData[0].language_code);
            }
            
            // Start audio playback
            setTimeout(() => {
              playIntroThenAnnouncement();
            }, 1000);
          }
          
          // Handle announcement audio ending
          audioPlayer.addEventListener('ended', () => {
            if (isPlaying && currentAudioIndex < audioPlaylist.length) {
              playIntroThenAnnouncement();
            } else if (isPlaying) {
              currentAudioIndex = 0;
              setTimeout(() => {
                if (isPlaying) {
                  playIntroThenAnnouncement();
                }
              }, 1000);
            }
          });
          
          window.addEventListener('load', startPlayback, { once: true });
        </script>
      </body>
      </html>
    `;
  };

  const handleDeleteAnnouncement = async (announcement: SavedAnnouncement) => {
    if (!announcement.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Cannot delete announcement: Invalid ID.",
      });
      return;
    }

    try {
      await deleteAnnouncement(announcement.id);
      
      // Refresh the announcements list
      await fetchAnnouncements();
      
      toast({
        title: "Success",
        description: `Announcement for Train ${announcement.train_number} has been deleted.`,
      });
    } catch (error) {
      console.error('Failed to delete announcement:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete announcement. Please try again.",
      });
    }
  };



  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>AI Generated ISL Announcements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading announcements...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            AI Generated ISL Announcements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {announcements.length === 0 ? (
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold mb-2">No Saved Announcements</h3>
              <p className="text-muted-foreground">
                No AI-generated ISL announcements have been saved yet. Generate and save announcements from the Dashboard.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Train Number</TableHead>
                  <TableHead>Train Name</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {announcements.map((announcement) => (
                  <TableRow key={announcement.id}>
                    <TableCell className="font-medium">{announcement.train_number}</TableCell>
                    <TableCell>{announcement.train_name}</TableCell>
                    <TableCell>{announcement.platform}</TableCell>
                    <TableCell>{announcement.category}</TableCell>
                    <TableCell>{getStatusBadge(announcement.status)}</TableCell>
                    <TableCell>
                      {new Date(announcement.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handlePreviewAnnouncement(announcement)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Preview Announcement</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedAnnouncement(announcement);
                                  setShowDetailsModal(true);
                                }}
                              >
                                <Info className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View Details</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        

                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteAnnouncement(announcement)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Delete Announcement</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Announcement Details</DialogTitle>
            <DialogDescription>
              View detailed information about the saved announcement.
            </DialogDescription>
          </DialogHeader>
          
          {selectedAnnouncement && (
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Train Information</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Number:</span> {selectedAnnouncement.train_number}</p>
                      <p><span className="font-medium">Name:</span> {selectedAnnouncement.train_name}</p>
                      <p><span className="font-medium">Platform:</span> {selectedAnnouncement.platform}</p>
                      <p><span className="font-medium">Category:</span> {selectedAnnouncement.category}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">File Information</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Folder:</span> {selectedAnnouncement.folder_path}</p>
                      <p><span className="font-medium">Status:</span> {selectedAnnouncement.status}</p>
                      <p><span className="font-medium">Created:</span> {new Date(selectedAnnouncement.created_at).toLocaleString()}</p>
                      <p><span className="font-medium">Updated:</span> {new Date(selectedAnnouncement.updated_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Panel - Announcement Texts & Audio */}
                  <div>
                    <h4 className="font-semibold mb-2">Announcement Texts & Audio</h4>
                    <div className="h-96 overflow-y-auto space-y-2 pr-2">
                      {Object.entries(selectedAnnouncement.announcement_texts).map(([lang, text]) => {
                        const languageNames: { [key: string]: string } = {
                          'en': 'English',
                          'hi': 'हिंदी',
                          'mr': 'मराठી',
                          'gu': 'ગુજરાતી'
                        };
                        const audioPath = selectedAnnouncement.audio_files[lang];
                        return (
                          <div key={lang} className="p-3 border rounded-md">
                            <p className="font-medium text-sm mb-1" style={{ fontFamily: 'Arial, sans-serif' }}>{languageNames[lang] || lang.toUpperCase()}</p>
                            <p className="text-sm text-muted-foreground mb-2">{text}</p>
                            {audioPath && (
                              <div className="mt-2">
                                <audio controls className="w-full h-10">
                                  <source src={audioPath} type="audio/wav" />
                                  Your browser does not support the audio element.
                                </audio>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Right Panel - ISL Videos */}
                  <div>
                    <h4 className="font-semibold mb-2">ISL Video Files</h4>
                    <div className="h-96 overflow-y-auto space-y-4 pr-2">
                      {selectedAnnouncement.isl_video_files.map((path, index) => (
                        <div key={index} className="p-3 border rounded-md">
                          <p className="font-medium text-sm mb-2">Video {index + 1}</p>
                          <video controls className="w-full">
                            <source src={path} type="video/mp4" />
                            Your browser does not support the video element.
                          </video>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
            </div>
          )}
          
          <DialogFooter className="mt-2">
            <Button onClick={() => setShowDetailsModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 