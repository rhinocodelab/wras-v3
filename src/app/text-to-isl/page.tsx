
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

import { Textarea } from '@/components/ui/textarea';
import { Loader2, Languages, MessageSquare, Video, Text, Film, Rocket, Globe, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { translateInputText, getIslVideoPlaylist, translateTextToMultipleLanguages, generateTextToSpeech, saveTextToIslAudio } from '@/app/actions';
import { generateTextToIslHtml } from '@/lib/utils';

// Source language is fixed to English only
const SOURCE_LANGUAGE = 'en';

const IslVideoPlayer = ({ playlist, title }: { playlist: string[]; title: string }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

    useEffect(() => {
        if (videoRef.current && playlist.length > 0) {
            videoRef.current.play();
        }
    }, [playlist, currentVideoIndex]);

    const handleVideoEnd = () => {
        if (currentVideoIndex < playlist.length - 1) {
            setCurrentVideoIndex(currentVideoIndex + 1);
        } else {
            // Loop back to the first video
            setCurrentVideoIndex(0);
        }
    };

    if (!playlist || playlist.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-muted rounded-lg p-4 text-center">
                <Video className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">Video will appear here.</p>
            </div>
        )
    }

    const currentVideo = playlist[currentVideoIndex];
    const videoName = currentVideo.split('/').pop()?.replace('.mp4', '').replace(/_/g, ' ') || 'Unknown';

    return (
        <div className="h-full flex flex-col min-h-0">
            <div className="flex-1 min-h-0 flex flex-col">
                <video
                    ref={videoRef}
                    className="w-full h-full rounded-md bg-black object-cover"
                    controls={false}
                    autoPlay
                    muted
                    playsInline
                    loop
                    onEnded={handleVideoEnd}
                >
                    <source src={currentVideo} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            </div>
            <div className="p-2 bg-muted rounded-md mt-2 flex-shrink-0">
                <div>
                    <h3 className="font-semibold text-xs mb-1">ISL Video Sequence</h3>
                    <p className="text-xs text-muted-foreground">
                        Playing video {currentVideoIndex + 1} of {playlist.length}
                    </p>
                    <div className="mt-1 text-xs text-muted-foreground break-all">
                        Current: {videoName}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                        Total videos: {playlist.length}
                    </div>
                </div>
            </div>
        </div>
    );
};


export default function TextToIslPage() {
    const [inputText, setInputText] = useState('');
    const [islPlaylist, setIslPlaylist] = useState<string[]>([]);
    const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
    const [translations, setTranslations] = useState<{ en: string; mr: string; hi: string; gu: string }>({
        en: '',
        mr: '',
        hi: '',
        gu: ''
    });
    const [isTranslating, setIsTranslating] = useState(false);
    const [savedAudioFiles, setSavedAudioFiles] = useState<{ en?: string; mr?: string; hi?: string; gu?: string }>({});
    const [islVideoPath, setIslVideoPath] = useState<string>('');
    const [audioStates, setAudioStates] = useState<{ [key: string]: { url: string; isGenerating: boolean } }>({});
    const [isPublishing, setIsPublishing] = useState(false);
    const [bulkAudioModal, setBulkAudioModal] = useState<{ isOpen: boolean; progress: { [key: string]: boolean } }>({ 
        isOpen: false, 
        progress: { english: false, marathi: false, hindi: false, gujarati: false } 
    });

    const { toast } = useToast();

    // Helper function to add spaces between digits
    const addSpacesToDigits = (text: string): string => {
        return text.replace(/(\d{2,})/g, (match) => match.split('').join(' '));
    };

    const handleTranslateText = useCallback(async () => {
        if (!inputText.trim()) {
            setTranslations({ en: '', mr: '', hi: '', gu: '' });
            return;
        }

        setIsTranslating(true);
        try {
            const translatedTexts = await translateTextToMultipleLanguages(inputText);
            setTranslations(translatedTexts);
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
    }, [inputText, toast]);

    const handleTtsClick = async (text: string, language: string) => {
        if (!text.trim()) return;
        
        // Set generating state for this specific language
        setAudioStates(prev => ({
            ...prev,
            [language]: { ...prev[language], isGenerating: true }
        }));
        
        try {
            const audioDataUrl = await generateTextToSpeech(text, language);
            
            // Set the audio URL for this specific language
            setAudioStates(prev => ({
                ...prev,
                [language]: { url: audioDataUrl, isGenerating: false }
            }));
            
            toast({
                title: "Audio Generated",
                description: `${language} audio has been generated successfully.`
            });
        } catch (error) {
            console.error("Audio generation failed:", error);
            toast({
                variant: "destructive",
                title: "Generation Error",
                description: "Failed to generate audio."
            });
            
            // Reset generating state on error
            setAudioStates(prev => ({
                ...prev,
                [language]: { ...prev[language], isGenerating: false }
            }));
        }
    };

    const handleSaveAudio = async (language: string, text: string) => {
        const audioState = audioStates[language];
        if (!audioState?.url) return;
        
        try {
            // Use original English text for filename, translated text for content
            const originalText = inputText.trim();
            const result = await saveTextToIslAudio(audioState.url, language, originalText);
            
            // Map language to correct key for savedAudioFiles
            const languageMap: { [key: string]: string } = {
                'english': 'en',
                'marathi': 'mr',
                'hindi': 'hi',
                'gujarati': 'gu'
            };
            const saveKey = languageMap[language] || language;
            
            // Track saved audio file for publishing
            setSavedAudioFiles(prev => ({
                ...prev,
                [saveKey]: result.filePath
            }));
            
            toast({
                title: "Audio Saved",
                description: `Audio file has been saved successfully.`
            });
        } catch (error) {
            console.error("Audio save failed:", error);
            toast({
                variant: "destructive",
                title: "Save Error",
                description: "Failed to save audio file."
            });
        }
    };

    const handleSaveAllAudio = async () => {
        const languages = [
            { key: 'english', saveKey: 'en', text: translations.en, label: 'English' },
            { key: 'marathi', saveKey: 'mr', text: translations.mr, label: 'Marathi' },
            { key: 'hindi', saveKey: 'hi', text: translations.hi, label: 'Hindi' },
            { key: 'gujarati', saveKey: 'gu', text: translations.gu, label: 'Gujarati' }
        ];

        let savedCount = 0;
        let totalCount = 0;

        // Use original English text for all filenames
        const originalText = inputText.trim();

        for (const { key, saveKey, text, label } of languages) {
            const audioState = audioStates[key];
            if (audioState?.url && text.trim()) {
                totalCount++;
                try {
                    const result = await saveTextToIslAudio(audioState.url, key, originalText);
                    // Save to the correct key in savedAudioFiles
                    setSavedAudioFiles(prev => ({
                        ...prev,
                        [saveKey]: result.filePath
                    }));
                    savedCount++;
                } catch (error) {
                    console.error(`Failed to save ${label} audio:`, error);
                }
            }
        }

        if (totalCount === 0) {
            toast({
                variant: "destructive",
                title: "No Audio Files",
                description: "No audio files to save. Please generate audio first."
            });
            return;
        }

        if (savedCount === totalCount) {
            toast({
                title: "All Audio Saved",
                description: `Successfully saved ${savedCount} audio file(s).`
            });
        } else {
            toast({
                variant: "destructive",
                title: "Partial Save",
                description: `Saved ${savedCount} of ${totalCount} audio file(s).`
            });
        }
    };

    const handlePublish = async () => {
        if (!inputText.trim()) {
            toast({
                variant: "destructive",
                title: "No Input Text",
                description: "Please enter some text to publish."
            });
            return;
        }

        if (!translations.en && !translations.mr && !translations.hi && !translations.gu) {
            toast({
                variant: "destructive",
                title: "No Translations",
                description: "Please generate translations first."
            });
            return;
        }

        if (!Object.values(savedAudioFiles).some(path => path)) {
            toast({
                variant: "destructive",
                title: "No Saved Audio Files",
                description: "Please save audio files first before publishing."
            });
            return;
        }

        if (!islPlaylist || islPlaylist.length === 0) {
            toast({
                variant: "destructive",
                title: "No ISL Video",
                description: "Please generate ISL video first."
            });
            return;
        }

        setIsPublishing(true);

        try {
            // Get all available audio files - use saved file paths instead of data URLs
            const audioFiles = {
                en: savedAudioFiles.en,
                mr: savedAudioFiles.mr,
                hi: savedAudioFiles.hi,
                gu: savedAudioFiles.gu
            };

            // Get all translations
            const allTranslations = {
                en: translations.en,
                mr: translations.mr,
                hi: translations.hi,
                gu: translations.gu
            };

            // Get ISL video path (use the first video in playlist for now)
            const islVideoPath = islPlaylist[0] || '';

            // Generate HTML content directly
            const htmlContent = generateTextToIslHtml(inputText, allTranslations, islVideoPath, audioFiles);

            // Create blob and open in new tab (like Dashboard)
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');

            toast({
                title: "Published Successfully",
                description: "Your announcement has been published with all content."
            });

        } catch (error) {
            console.error("Publishing failed:", error);
            toast({
                variant: "destructive",
                title: "Publishing Error",
                description: "Failed to publish the announcement."
            });
        } finally {
            setIsPublishing(false);
        }
    };

    const handleGenerateAllAudio = async () => {
        if (!translations.en && !translations.mr && !translations.hi && !translations.gu) {
            toast({
                variant: "destructive",
                title: "No Translations",
                description: "Please generate translations first."
            });
            return;
        }

        // Open modal and reset progress
        setBulkAudioModal({
            isOpen: true,
            progress: { english: false, marathi: false, hindi: false, gujarati: false }
        });

        const languages = [
            { key: 'english', text: translations.en, label: 'English' },
            { key: 'marathi', text: translations.mr, label: 'Marathi' },
            { key: 'hindi', text: translations.hi, label: 'Hindi' },
            { key: 'gujarati', text: translations.gu, label: 'Gujarati' }
        ];

        try {
            for (let i = 0; i < languages.length; i++) {
                const { key, text, label } = languages[i];
                
                if (!text.trim()) {
                    // Skip if no translation text
                    setBulkAudioModal(prev => ({
                        ...prev,
                        progress: { ...prev.progress, [key]: true }
                    }));
                    continue;
                }

                // Update progress for current language
                setBulkAudioModal(prev => ({
                    ...prev,
                    progress: { ...prev.progress, [key]: true }
                }));

                try {
                    // Generate audio for current language
                    const audioDataUrl = await generateTextToSpeech(text, key);
                    
                    // Set the audio URL for this language
                    setAudioStates(prev => ({
                        ...prev,
                        [key]: { url: audioDataUrl, isGenerating: false }
                    }));

                    // Add delay between API calls (2 seconds)
                    if (i < languages.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                } catch (error) {
                    console.error(`Failed to generate audio for ${label}:`, error);
                    toast({
                        variant: "destructive",
                        title: "Generation Error",
                        description: `Failed to generate audio for ${label}.`
                    });
                }
            }

            toast({
                title: "Audio Generation Complete",
                description: "All audio files have been generated successfully."
            });
        } catch (error) {
            console.error("Bulk audio generation failed:", error);
            toast({
                variant: "destructive",
                title: "Generation Error",
                description: "Failed to generate some audio files."
            });
        } finally {
            // Close modal
            setBulkAudioModal({ isOpen: false, progress: { english: false, marathi: false, hindi: false, gujarati: false } });
        }
    };


    // Auto-translate when input text changes (with debounce)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (inputText.trim()) {
                handleTranslateText();
            } else {
                setTranslations({ en: '', mr: '', hi: '', gu: '' });
            }
        }, 1000); // 1 second debounce

        return () => clearTimeout(timeoutId);
    }, [inputText, handleTranslateText]);

    const handleGenerateVideo = async () => {
        // Use English translation from translations area
        const englishText = translations.en || inputText;
        
        if (!englishText.trim()) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Please enter some text to generate ISL video."
            });
            return;
        }
        
        setIsGeneratingVideo(true);
        try {
            const result = await getIslVideoPlaylist(englishText);
            setIslPlaylist(result.playlist);
            
            // Set the first video as the ISL video path for publishing
            if (result.playlist.length > 0) {
                setIslVideoPath(result.playlist[0]);
            }
            
            const videoCount = result.playlist.length;
            const isStitched = result.playlist.length === 1 && result.playlist[0].includes('isl_announcement_');
            
            // Show toast based on results
            if (result.playlist.length === 0) {
                // No videos generated at all - clear audio files
                const unmatchedText = result.unmatchedWords.join(', ');
                
                // Clear audio files from public folder
                try {
                    const clearFilesResponse = await fetch('/api/clear-text-to-isl-files', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    });

                    if (!clearFilesResponse.ok) {
                        console.error('Failed to clear audio files');
                    }
                } catch (error) {
                    console.error('Error clearing audio files:', error);
                }
                
                // Clear saved audio files state
                setSavedAudioFiles({});
                
                toast({
                    title: "No ISL Videos Found",
                    description: `No matching ISL videos found for any words: ${unmatchedText}. Audio files have been cleared.`,
                    variant: "destructive"
                });
            } else if (result.unmatchedWords.length > 0) {
                // Some videos generated, but some words unmatched
                const unmatchedText = result.unmatchedWords.join(', ');
                toast({
                    title: "ISL Video Generated",
                    description: `ISL video generated successfully. No matching videos found for: ${unmatchedText}`,
                    variant: "default"
                });
            } else {
                // All words matched
                toast({
                    title: "ISL Video Generated",
                    description: "ISL video has been generated successfully."
                });
            }
        } catch (error) {
            console.error("Video generation failed:", error);
            toast({
                variant: "destructive",
                title: "Generation Error",
                description: "Failed to generate ISL video."
            });
        } finally {
            setIsGeneratingVideo(false);
        }
    };
    
    const handleClearInput = () => {
        setInputText('');
        setIslPlaylist([]);
        setTranslations({ en: '', mr: '', hi: '', gu: '' });
        setAudioStates({});
        setSavedAudioFiles({});
    }

    const handleClearAll = async () => {
        try {
            // Clear files from public folders
            const clearFilesResponse = await fetch('/api/clear-text-to-isl-files', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!clearFilesResponse.ok) {
                console.error('Failed to clear files from public folders');
            }
        } catch (error) {
            console.error('Error clearing files:', error);
        }

        // Clear all state
        setInputText('');
        setIslPlaylist([]);
        setTranslations({ en: '', mr: '', hi: '', gu: '' });
        setAudioStates({});
        setSavedAudioFiles({});
        setIslVideoPath('');
        setIsGeneratingVideo(false);
        setIsPublishing(false);
        setBulkAudioModal({ isOpen: false, progress: { english: false, marathi: false, hindi: false, gujarati: false } });
        
        toast({
            title: "All Data Cleared",
            description: "Input text, translations, audio files, and ISL video have been cleared."
        });
    }

    return (
        <div className="w-full h-full flex flex-col">
            <style dangerouslySetInnerHTML={{
                __html: `
                    audio {
                        border-radius: 0 !important;
                        -webkit-border-radius: 0 !important;
                        -moz-border-radius: 0 !important;
                        border: none !important;
                    }
                    audio::-webkit-media-controls-panel {
                        border-radius: 0 !important;
                        -webkit-border-radius: 0 !important;
                        border: none !important;
                    }
                    audio::-webkit-media-controls {
                        border-radius: 0 !important;
                        -webkit-border-radius: 0 !important;
                        border: none !important;
                    }
                    audio::-webkit-media-controls-play-button {
                        border-radius: 0 !important;
                        -webkit-border-radius: 0 !important;
                        border: none !important;
                    }
                    audio::-webkit-media-controls-timeline {
                        border-radius: 0 !important;
                        -webkit-border-radius: 0 !important;
                        border: none !important;
                    }
                    audio::-webkit-media-controls-volume-slider {
                        border-radius: 0 !important;
                        -webkit-border-radius: 0 !important;
                        border: none !important;
                    }
                    audio::-webkit-media-controls-mute-button {
                        border-radius: 0 !important;
                        -webkit-border-radius: 0 !important;
                        border: none !important;
                    }
                    audio::-webkit-media-controls-current-time-display {
                        border-radius: 0 !important;
                        -webkit-border-radius: 0 !important;
                    }
                    audio::-webkit-media-controls-time-remaining-display {
                        border-radius: 0 !important;
                        -webkit-border-radius: 0 !important;
                    }
                    audio::-webkit-media-controls-fullscreen-button {
                        border-radius: 0 !important;
                        -webkit-border-radius: 0 !important;
                    }
                    audio::-webkit-media-controls-rewind-button {
                        border-radius: 0 !important;
                        -webkit-border-radius: 0 !important;
                    }
                    audio::-webkit-media-controls-return-to-realtime-button {
                        border-radius: 0 !important;
                        -webkit-border-radius: 0 !important;
                    }
                    audio::-webkit-media-controls-seek-back-button {
                        border-radius: 0 !important;
                        -webkit-border-radius: 0 !important;
                    }
                    audio::-webkit-media-controls-seek-forward-button {
                        border-radius: 0 !important;
                        -webkit-border-radius: 0 !important;
                    }
                    audio::-webkit-media-controls-picture-in-picture-button {
                        border-radius: 0 !important;
                        -webkit-border-radius: 0 !important;
                    }
                    audio::-webkit-media-controls-overlay-play-button {
                        border-radius: 0 !important;
                        -webkit-border-radius: 0 !important;
                    }
                    audio::-webkit-media-controls-overlay-enclosure {
                        border-radius: 0 !important;
                        -webkit-border-radius: 0 !important;
                    }
                    audio::-webkit-media-controls-enclosure {
                        border-radius: 0 !important;
                        -webkit-border-radius: 0 !important;
                    }
                `
            }} />
            <div className="flex items-center justify-between p-6 border-b">
                <div>
                    <h1 className="text-lg font-semibold md:text-2xl flex items-center gap-2">
                        Text to ISL Converter
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Enter English text and generate the ISL video with translations.
                    </p>
                </div>
                <Button 
                    variant="outline" 
                    onClick={handleClearAll}
                    className="border-2 border-gray-300 hover:border-gray-400"
                >
                    Clear All
                </Button>
            </div>

            <div className="mt-6 flex flex-col gap-6 flex-grow">
                {/* Input Text Card - Stretched */}
                <div className="space-y-4">
                    <Card className="flex flex-col h-full">
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
                                className="flex-1 resize-none"
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Translations Card - Below Input Text */}
                <div className="space-y-4">
                    <Card className="flex flex-col flex-grow">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Globe className="h-5 w-5 text-primary" />
                                Translations
                                {isTranslating && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                            </CardTitle>
                            <CardDescription>
                                Automatic translations of your text
                            </CardDescription>
                            <div className="mt-2 flex gap-2">
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={handleGenerateAllAudio}
                                    disabled={!translations.en && !translations.mr && !translations.hi && !translations.gu}
                                >
                                    Generate Audio
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={handleSaveAllAudio}
                                    disabled={!Object.values(audioStates).some(state => state?.url)}
                                >
                                    Save Audio
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow flex gap-4">
                            {/* Left Panel - Translations */}
                            <div className="flex-1 flex flex-col">
                                <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">English</label>
                                        <div className="mt-1 p-3 bg-muted rounded-md min-h-[60px] flex items-center justify-between">
                                            <span className="text-sm">
                                                {isTranslating ? (
                                                    <span className="flex items-center gap-2">
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        Translating...
                                                    </span>
                                                ) : addSpacesToDigits(translations.en) || 'Translation will appear here'}
                                            </span>
                                        </div>
                                        {audioStates.english?.url && (
                                            <div className="mt-2 flex gap-2 items-center">
                                                <audio controls className="flex-1">
                                                    <source src={audioStates.english.url} type="audio/wav" />
                                                    Your browser does not support the audio element.
                                                </audio>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">मराठी</label>
                                        <div className="mt-1 p-3 bg-muted rounded-md min-h-[60px] flex items-center justify-between">
                                            <span className="text-sm">
                                                {isTranslating ? (
                                                    <span className="flex items-center gap-2">
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        Translating...
                                                    </span>
                                                ) : addSpacesToDigits(translations.mr) || 'Translation will appear here'}
                                            </span>
                                        </div>
                                        {audioStates.marathi?.url && (
                                            <div className="mt-2 flex gap-2 items-center">
                                                <audio controls className="flex-1">
                                                    <source src={audioStates.marathi.url} type="audio/wav" />
                                                    Your browser does not support the audio element.
                                                </audio>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">हिंदी</label>
                                        <div className="mt-1 p-3 bg-muted rounded-md min-h-[60px] flex items-center justify-between">
                                            <span className="text-sm">
                                                {isTranslating ? (
                                                    <span className="flex items-center gap-2">
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        Translating...
                                                    </span>
                                                ) : addSpacesToDigits(translations.hi) || 'Translation will appear here'}
                                            </span>
                                        </div>
                                        {audioStates.hindi?.url && (
                                            <div className="mt-2 flex gap-2 items-center">
                                                <audio controls className="flex-1">
                                                    <source src={audioStates.hindi.url} type="audio/wav" />
                                                    Your browser does not support the audio element.
                                                </audio>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">ગુજરાતી</label>
                                        <div className="mt-1 p-3 bg-muted rounded-md min-h-[60px] flex items-center justify-between">
                                            <span className="text-sm">
                                                {isTranslating ? (
                                                    <span className="flex items-center gap-2">
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        Translating...
                                                    </span>
                                                ) : addSpacesToDigits(translations.gu) || 'Translation will appear here'}
                                            </span>
                                        </div>
                                        {audioStates.gujarati?.url && (
                                            <div className="mt-2 flex gap-2 items-center">
                                                <audio controls className="flex-1">
                                                    <source src={audioStates.gujarati.url} type="audio/wav" />
                                                    Your browser does not support the audio element.
                                                </audio>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Panel - ISL Video Output */}
                            <div className="flex-1 flex flex-col">
                                <div className="flex-1 min-h-0">
                                    {isGeneratingVideo ? (
                                        <div className="flex items-center justify-center h-full rounded-lg bg-muted">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        </div>
                                    ) : (
                                        <IslVideoPlayer 
                                            playlist={islPlaylist} 
                                            title="ISL Video Output" 
                                        />
                                    )}
                                </div>
                                
                                <div className="mt-4 flex gap-2 flex-shrink-0">
                                    <Button onClick={handleGenerateVideo} disabled={isGeneratingVideo || !translations.en} className="flex-1">
                                        {isGeneratingVideo ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                        {isGeneratingVideo ? "Generating..." : "Generate ISL Video"}
                                    </Button>

                                    <Button 
                                        variant="outline" 
                                        onClick={handlePublish} 
                                        disabled={isPublishing || !inputText.trim()}
                                        className="flex-1 border-2 border-gray-300 hover:border-gray-400"
                                    >
                                        {isPublishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                        {isPublishing ? "Publishing..." : "Publish"}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* TTS Modal */}
            {/* The TTS modal is removed as per the edit hint. */}

            {/* Bulk Audio Generation Progress Modal */}
            {bulkAudioModal.isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Generating Audio for All Languages</h3>
                        </div>
                        
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm">English</span>
                                {bulkAudioModal.progress.english ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                                        <span className="text-sm text-green-600">Complete</span>
                                    </div>
                                ) : (
                                    <span className="text-sm text-muted-foreground">Pending</span>
                                )}
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Marathi</span>
                                {bulkAudioModal.progress.marathi ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                                        <span className="text-sm text-green-600">Complete</span>
                                    </div>
                                ) : (
                                    <span className="text-sm text-muted-foreground">Pending</span>
                                )}
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Hindi</span>
                                {bulkAudioModal.progress.hindi ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                                        <span className="text-sm text-green-600">Complete</span>
                                    </div>
                                ) : (
                                    <span className="text-sm text-muted-foreground">Pending</span>
                                )}
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Gujarati</span>
                                {bulkAudioModal.progress.gujarati ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                                        <span className="text-sm text-green-600">Complete</span>
                                    </div>
                                ) : (
                                    <span className="text-sm text-muted-foreground">Pending</span>
                                )}
                            </div>
                        </div>
                        
                        <div className="mt-4 text-center">
                            <p className="text-sm text-muted-foreground">
                                Please wait while audio files are being generated...
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
