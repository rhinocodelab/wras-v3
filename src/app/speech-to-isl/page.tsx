
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Mic, MicOff, Loader2, Languages, MessageSquare, Video, Speech, Rocket, Film, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { translateSpeechText, getIslVideoPlaylist } from '@/app/actions';

const LANGUAGE_OPTIONS: { [key: string]: string } = {
  'en-US': 'English',
  'hi-IN': 'हिंदी',
  'mr-IN': 'मराठी',
  'gu-IN': 'ગુજરાતી',
};

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
                <p className="text-sm text-muted-foreground">No matching ISL videos found.</p>
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
                    className="w-full h-64 rounded-t-md bg-black object-cover"
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


export default function SpeechToIslPage() {
    const [selectedLang, setSelectedLang] = useState('en-US');
    const [isRecording, setIsRecording] = useState(false);
    const [transcribedText, setTranscribedText] = useState('');
    const [finalTranscribedText, setFinalTranscribedText] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    const [islPlaylist, setIslPlaylist] = useState<string[]>([]);
    const [isTranslating, setIsTranslating] = useState(false);
    const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);

    const { toast } = useToast();
    const recognitionRef = useRef<any>(null);
    const recordingRef = useRef(isRecording);
    const isRecognitionActiveRef = useRef(false);

    useEffect(() => {
        recordingRef.current = isRecording;
    }, [isRecording]);

     const handleTranslateClick = useCallback(async () => {
        const textToTranslate = finalTranscribedText;
        if (!textToTranslate.trim()) return;

        setIsTranslating(true);
        setIslPlaylist([]); // Clear previous playlist
        try {
            if (selectedLang === 'en-US') {
                setTranslatedText(textToTranslate);
            } else {
                const formData = new FormData();
                formData.append('text', textToTranslate);
                formData.append('lang', selectedLang.split('-')[0]);
                const result = await translateSpeechText(formData);
                setTranslatedText(result.translatedText);
            }
        } catch (error) {
            console.error("Translation failed:", error);
            toast({
                variant: "destructive",
                title: "Translation Error",
                description: "Failed to translate the text."
            });
        } finally {
            setIsTranslating(false);
        }
    }, [finalTranscribedText, selectedLang, toast]);

    const handleGenerateVideoClick = useCallback(async () => {
        if (!translatedText.trim()) return;
        
        setIsGeneratingVideo(true);
        try {
            const playlist = await getIslVideoPlaylist(translatedText);
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
    }, [translatedText, toast]);

    useEffect(() => {
        // @ts-ignore
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = selectedLang;

            recognition.onresult = (event: any) => {
                let interimTranscript = '';
                let newFinalTranscript = '';
                
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                         newFinalTranscript += event.results[i][0].transcript.trim() + ' ';
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
                
                if (newFinalTranscript) {
                    setFinalTranscribedText(prev => prev + newFinalTranscript);
                }
                setTranscribedText(finalTranscribedText + newFinalTranscript + interimTranscript);
            };

            recognition.onerror = (event: any) => {
                 if (event.error === 'aborted' || event.error === 'no-speech') {
                    console.log(`Speech recognition stopped: ${event.error}`);
                    if (recordingRef.current && !isRecognitionActiveRef.current) {
                        try {
                           isRecognitionActiveRef.current = true;
                           recognition.start();
                        } catch(e) {
                           console.error("Error restarting recognition:", e)
                           isRecognitionActiveRef.current = false;
                           setIsRecording(false);
                        }
                    } else {
                       setIsRecording(false);
                    }
                    return;
                }
                
                console.error("Speech recognition error", event.error);
                toast({
                    variant: 'destructive',
                    title: 'Speech Recognition Error',
                    description: `An error occurred: ${event.error}. Please ensure you have microphone permissions.`
                });
                isRecognitionActiveRef.current = false;
                setIsRecording(false);
            };
            
            recognition.onend = () => {
                isRecognitionActiveRef.current = false;
                if (recordingRef.current && !isRecognitionActiveRef.current) {
                   try {
                     isRecognitionActiveRef.current = true;
                     recognition.start();
                   } catch(e) {
                     console.error("Error restarting recognition onend:", e);
                     isRecognitionActiveRef.current = false;
                     setIsRecording(false);
                   }
                } else {
                    setIsRecording(false);
                }
            };

            recognitionRef.current = recognition;
        } else {
            toast({
                variant: 'destructive',
                title: 'Unsupported Browser',
                description: 'Speech recognition is not supported by your browser.'
            });
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };

    }, [selectedLang, toast, finalTranscribedText]);

    const handleMicClick = () => {
        if (isRecording) {
            recognitionRef.current?.stop();
            isRecognitionActiveRef.current = false;
            setIsRecording(false);
        } else {
            setTranscribedText('');
            setFinalTranscribedText('');
            setTranslatedText('');
            setIslPlaylist([]);
            setIsRecording(true);
            try {
              isRecognitionActiveRef.current = true;
              recognitionRef.current?.start();
            } catch (e) {
                console.error("Could not start recognition:", e);
                isRecognitionActiveRef.current = false;
                setIsRecording(false);
            }
        }
    };
    
    const handlePublish = () => {
        if (!translatedText && !transcribedText) return;

        const tickerText = [transcribedText, translatedText].filter(Boolean).join(' &nbsp; | &nbsp; ');
        
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

    const handleClearTranscription = () => {
        setTranscribedText('');
        setFinalTranscribedText('');
        setTranslatedText('');
        setIslPlaylist([]);
    }

    const handleClearTranslation = () => {
        setTranslatedText('');
        setIslPlaylist([]);
    }

    return (
        <div className="w-full h-full flex flex-col">
            <div>
                <h1 className="text-lg font-semibold md:text-2xl flex items-center gap-2">
                    <Speech className="h-6 w-6 text-primary" />
                    Speech to ISL Converter
                </h1>
                <p className="text-muted-foreground">
                    Select a language, speak, and see the ISL translation in real-time.
                </p>
            </div>

            <Card className="mt-6">
                <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-full sm:w-auto">
                        <label className="text-sm font-medium">Spoken Language</label>
                        <Select value={selectedLang} onValueChange={setSelectedLang} disabled={isRecording}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Select a language" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(LANGUAGE_OPTIONS).map(([code, name]) => (
                                    <SelectItem key={code} value={code}>{name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex-grow" />

                    <Button 
                        onClick={handleMicClick} 
                        size="lg" 
                        className="rounded-full h-16 w-16 flex items-center justify-center"
                        variant={isRecording ? "destructive" : "default"}
                    >
                        {isRecording ? (
                            <MicOff className="h-8 w-8" />
                        ) : (
                            <svg className="w-8 h-8 text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9v3a5.006 5.006 0 0 1-5 5h-4a5.006 5.006 0 0 1-5-5V9m7 9v3m-3 0h6M11 3h2a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3h-2a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z"/>
                            </svg>
                        )}
                    </Button>
                    <p className="text-sm text-muted-foreground w-28 text-center">
                        {isRecording ? 'Recording...' : 'Tap to speak'}
                    </p>

                    <div className="flex-grow" />
                </CardContent>
            </Card>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 flex-grow">
                <div className="md:col-span-2 grid grid-rows-2 gap-6">
                    <Card className="flex flex-col row-span-1">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="space-y-1.5">
                                <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5 text-primary" />
                                Transcribed Text
                                </CardTitle>
                            </div>
                            <Button variant="ghost" size="sm" onClick={handleClearTranscription} disabled={!transcribedText}>
                                Clear
                            </Button>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <Textarea
                                value={transcribedText}
                                readOnly
                                placeholder="Your spoken words will appear here..."
                                className="h-full resize-none"
                            />
                        </CardContent>
                    </Card>

                    <Card className="flex flex-col row-span-1">
                        <CardHeader className="flex flex-row items-center justify-between">
                             <div className="space-y-1.5">
                                <CardTitle className="flex items-center gap-2">
                                    <Languages className="h-5 w-5 text-primary" />
                                    English Translation
                                </CardTitle>
                                 <CardDescription>
                                    This text will be used to generate the ISL video.
                                </CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" onClick={handleClearTranslation} disabled={!translatedText}>
                                Clear
                            </Button>
                        </CardHeader>
                        <CardContent className="flex-grow flex flex-col gap-4">
                            <Textarea
                                value={translatedText}
                                readOnly
                                placeholder="The English translation will appear here..."
                                className="h-full resize-none"
                            />
                            <div className="flex gap-2">
                                <Button onClick={handleTranslateClick} disabled={isTranslating || !finalTranscribedText || isRecording}>
                                    {isTranslating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Languages className="mr-2 h-4 w-4"/>}
                                    {isTranslating ? "Translating..." : "Translate"}
                                </Button>
                                 <Button onClick={handleGenerateVideoClick} disabled={isGeneratingVideo || !translatedText}>
                                    {isGeneratingVideo ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Film className="mr-2 h-4 w-4" />}
                                    {isGeneratingVideo ? "Generating..." : "Generate ISL Video"}
                                 </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>


                <div className="md:col-span-1 h-full min-h-[300px]">
                     {isTranslating || isGeneratingVideo ? (
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
