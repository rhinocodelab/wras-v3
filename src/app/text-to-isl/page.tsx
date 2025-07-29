
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

import { Textarea } from '@/components/ui/textarea';
import { Loader2, Languages, MessageSquare, Video, Text, Film, Rocket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { translateInputText, getIslVideoPlaylist } from '@/app/actions';

// Source language is fixed to English only
const SOURCE_LANGUAGE = 'en';

const IslVideoPlayer = ({ playlist, title, onPublish }: { playlist: string[]; title: string; onPublish?: () => void }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && playlist.length > 0) {
            videoRef.current.play();
        }
    }, [playlist]);

    if (!playlist || playlist.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-muted rounded-lg p-4 text-center">
                <Video className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">Video will appear here.</p>
            </div>
        )
    }

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5 text-primary" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col p-2 pt-0">
                <video
                    ref={videoRef}
                    className="w-full h-80 rounded-t-md bg-black object-cover"
                    controls={false}
                    autoPlay
                    muted
                    loop
                    playsInline
                >
                    <source src={playlist[0]} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
                <div className="flex-grow p-2 bg-muted rounded-b-md flex flex-col justify-between">
                    <div>
                        <h3 className="font-semibold text-xs mb-1">ISL Video</h3>
                        <p className="text-xs text-muted-foreground">Playing ISL video</p>
                        <div className="mt-1 text-xs text-muted-foreground break-all">
                        Video: {playlist[0].split('/').pop()?.replace('.mp4', '').replace(/_/g, ' ')}
                        </div>
                    </div>
                    {onPublish && playlist.length > 0 && (
                        <div className="mt-4">
                            <Button 
                                onClick={onPublish} 
                                className="w-full" 
                                size="sm"
                                disabled={playlist.length === 0}
                            >
                                <Rocket className="mr-2 h-4 w-4" />
                                Publish Announcement
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};


export default function TextToIslPage() {
    const [inputText, setInputText] = useState('');
    const [islPlaylist, setIslPlaylist] = useState<string[]>([]);
    const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);

    const { toast } = useToast();

    const handleGenerateVideoClick = useCallback(async () => {
        if (!inputText.trim()) return;
        
        setIsGeneratingVideo(true);
        setIslPlaylist([]);
        try {
            // Process the input text (add spaces between digits for better ISL recognition)
            const processedText = inputText.replace(/(\d)/g, ' $1 ');
            const playlist = await getIslVideoPlaylist(processedText);
            setIslPlaylist(playlist);
        } catch (error) {
             console.error("ISL generation failed:", error);
            toast({
                variant: "destructive",
                title: "ISL Video Error",
                description: "Failed to generate the ISL video playlist."
            });
        } finally {
            setIsGeneratingVideo(false);
        }
    }, [inputText, toast]);
    
    const handleClearInput = () => {
        setInputText('');
        setIslPlaylist([]);
    }
    
    const handlePublish = () => {
        if (!inputText) return;

        const tickerText = inputText;
        
        // Convert relative video paths to absolute URLs
        const baseUrl = window.location.origin;
        const absoluteVideoPaths = islPlaylist.map(path => `${baseUrl}${path}`);
        const videoSources = JSON.stringify(absoluteVideoPaths);

        const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Live Announcement</title>
            <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; background-color: #000; color: #fff; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
            .main-content { flex-grow: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 20px; }
            .video-container { width: 80%; max-width: 960px; aspect-ratio: 16 / 9; background-color: #111; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
            video { width: 100%; height: 100%; object-fit: cover; }
            .ticker-wrap { position: fixed; bottom: 0; left: 0; width: 100%; background-color: #1a1a1a; padding: 15px 0; overflow: hidden; }
            .ticker { display: inline-block; white-space: nowrap; padding-left: 100%; animation: ticker 40s linear infinite; font-size: 1.5em; }
            @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-100%); } }
            </style>
        </head>
        <body>
            <div class="main-content">
            <div class="video-container">
                <video id="isl-video" muted playsinline></video>
            </div>
            </div>
            <div class="ticker-wrap">
            <div class="ticker">${tickerText}</div>
            </div>

            <script>
            const videoElement = document.getElementById('isl-video');
            const videoPlaylist = ${videoSources};

            function startPlayback() {
                if (videoPlaylist.length > 0) {
                    videoElement.src = videoPlaylist[0];
                    videoElement.loop = true;
                    videoElement.play().catch(e => console.error("Video play error:", e));
                }
            }

            window.addEventListener('load', startPlayback, { once: true });
            <\/script>
        </body>
        </html>
        `;

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    };

    return (
        <div className="w-full h-full flex flex-col">
            <div>
                <h1 className="text-lg font-semibold md:text-2xl flex items-center gap-2">
                    <Text className="h-6 w-6 text-primary" />
                    Text to ISL Converter
                </h1>
                <p className="text-muted-foreground">
                    Enter English text and generate the ISL video.
                </p>
            </div>



            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
                <Card className="flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="space-y-1.5">
                            <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-primary" />
                            Input Text
                            </CardTitle>
                            <CardDescription>
                                Enter English text to generate ISL video.
                            </CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" onClick={handleClearInput} disabled={!inputText}>
                            Clear
                        </Button>
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col gap-4">
                        <Textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Enter English text here..."
                            className="h-full resize-none"
                        />
                        <div className="flex gap-2">
                            <Button onClick={handleGenerateVideoClick} disabled={isGeneratingVideo || !inputText}>
                                {isGeneratingVideo ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Film className="mr-2 h-4 w-4" />}
                                {isGeneratingVideo ? "Generating..." : "Generate ISL Video"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="h-full min-h-[300px]">
                     {isGeneratingVideo ? (
                         <div className="flex items-center justify-center h-full rounded-lg bg-muted">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                         </div>
                     ) : (
                        <IslVideoPlayer 
                            playlist={islPlaylist} 
                            title="ISL Video Output" 
                            onPublish={handlePublish}
                        />
                     )}
                </div>
            </div>
        </div>
    );
}
