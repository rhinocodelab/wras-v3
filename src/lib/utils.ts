import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateTextToIslHtml(
    originalText: string,
    translations: { en: string; mr: string; hi: string; gu: string },
    islVideoPath: string,
    audioFiles: { en?: string; mr?: string; hi?: string; gu?: string }
): string {
    // Create language-specific data for synchronization
    const announcementData = Object.entries(translations)
        .filter(([lang, text]) => text && audioFiles[lang as keyof typeof audioFiles])
        .map(([lang, text]) => ({
            language_code: lang,
            text: text,
            audio_path: audioFiles[lang as keyof typeof audioFiles] || null
        }));
    const announcementDataJson = JSON.stringify(announcementData);
    
    // Convert audio paths to absolute URLs - ensure they point to text_to_isl/audio
    const audioPaths = Object.values(audioFiles).filter(p => p !== null);
    const audioSources = JSON.stringify(audioPaths);
    
    // Convert video path to absolute URL - ensure it points to isl_video
    const videoSources = JSON.stringify([islVideoPath]);
    
    // Use dynamic origin detection in JavaScript
    const originScript = `
        const origin = window.location.origin || 'http://localhost:3000';
        const videoSources = ${videoSources}.map(path => origin + path);
        const audioSources = ${audioSources}.map(path => origin + path);
    `;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ISL Announcement - ${originalText.substring(0, 50)}</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
            margin: 0; 
            background-color: #000; 
            color: #fff; 
            display: flex; 
            flex-direction: column; 
            height: 100vh; 
            overflow: hidden; 
        }
        .main-content { 
            flex-grow: 1; 
            display: flex; 
            flex-direction: column; 
            justify-content: center; 
            align-items: center; 
            padding: 20px; 
        }
        .info-header { 
            text-align: center; 
            margin-bottom: 20px; 
            padding: 15px 25px; 
            border-radius: 12px; 
            background-color: rgba(255, 255, 255, 0.1); 
        }
        .info-header h1 { 
            margin: 0; 
            font-size: 3.2em; 
        }
        .info-header p { 
            margin: 8px 0 0; 
            font-size: 1.6em; 
            letter-spacing: 1px; 
        }
        .video-container { 
            width: 80%; 
            max-width: 960px; 
            aspect-ratio: 16 / 9; 
            background-color: #111; 
            overflow: hidden; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.5); 
        }
        video { 
            width: 100%; 
            height: 100%; 
            object-fit: cover; 
        }
        .ticker-wrap { 
            position: fixed; 
            bottom: 0; 
            left: 50%; 
            transform: translateX(-50%); 
            width: 1200px; 
            background-color: #1a1a1a; 
            padding: 20px; 
            overflow: hidden; 
            min-height: 80px; 
        }
        .ticker { 
            display: block; 
            text-align: center; 
            font-size: 2.2em; 
            transition: opacity 0.5s ease; 
            line-height: 1.4; 
            white-space: nowrap; 
            margin: 0; 
        }
        .ticker.fade { 
            opacity: 0.3; 
        }
        .ticker.active { 
            opacity: 1; 
        }
    </style>
</head>
<body>
    <div class="main-content">
        <div class="info-header">
            <h1>ISL Announcement</h1>
            <p>Multi-language Railway Announcement with Indian Sign Language</p>
        </div>
        <div class="video-container">
            <video id="isl-video" muted playsinline loop></video>
        </div>
    </div>
    <div class="ticker-wrap">
        <div id="ticker" class="ticker"></div>
    </div>
    <audio id="announcement-audio"></audio>
    <audio id="intro-audio" preload="auto"></audio>

    <script>
        ${originScript}
        
        const videoElement = document.getElementById('isl-video');
        const audioPlayer = document.getElementById('announcement-audio');
        const introAudio = document.getElementById('intro-audio');
        const tickerElement = document.getElementById('ticker');
        const announcementData = ${announcementDataJson};
        const introAudioPath = origin + '/audio/intro_audio/intro.wav';
        let currentAudioIndex = 0;
        let isPlaying = false;
        let isPlayingIntro = false;

        // Set up intro audio
        introAudio.src = introAudioPath;
        introAudio.volume = 1.0;

        function updateTickerText(languageCode) {
            const announcement = announcementData.find(a => a.language_code === languageCode);
            if (announcement && tickerElement) {
                tickerElement.textContent = announcement.text;
                tickerElement.classList.add('active');
                tickerElement.classList.remove('fade');
                
                // Adjust card width based on text content
                setTimeout(() => {
                    const tickerWrap = tickerElement.parentElement;
                    const textWidth = tickerElement.scrollWidth;
                    const minWidth = 800; // Minimum width in pixels
                    const maxWidth = 1800; // Maximum width in pixels
                    const padding = 40; // 20px left + 20px right padding
                    const newWidth = Math.max(minWidth, Math.min(maxWidth, textWidth + padding));
                    tickerWrap.style.width = newWidth + 'px';
                    tickerWrap.style.left = '50%';
                    tickerWrap.style.transform = 'translateX(-50%)';
                }, 50); // Small delay to ensure text is rendered
            }
        }

        function fadeTickerText() {
            if (tickerElement) {
                tickerElement.classList.add('fade');
                tickerElement.classList.remove('active');
            }
        }

        function playIntroThenAnnouncement() {
            if (!audioPlayer || audioSources.length === 0) return;
            
            // Play intro first
            isPlayingIntro = true;
            fadeTickerText(); // Fade out current text during intro
            
            // Reset intro audio event listener
            introAudio.onended = () => {
                isPlayingIntro = false;
                audioPlayer.src = audioSources[currentAudioIndex];
                
                // Update ticker text to match the current audio language
                const currentAnnouncement = announcementData[currentAudioIndex];
                if (currentAnnouncement) {
                    updateTickerText(currentAnnouncement.language_code);
                }
                
                audioPlayer.play().catch(e => console.error("Audio play error:", e));
                currentAudioIndex++;
            };
            
            introAudio.play().catch(e => console.error("Intro audio play error:", e));
        }
        
        function startPlayback() {
             if (videoSources.length > 0) {
                console.log('Starting video playback with:', videoSources[0]);
                videoElement.src = videoSources[0];
                videoElement.loop = true;
                
                // Add event listeners for debugging
                videoElement.addEventListener('loadstart', () => console.log('Video loadstart'));
                videoElement.addEventListener('loadeddata', () => console.log('Video loadeddata'));
                videoElement.addEventListener('canplay', () => console.log('Video canplay'));
                videoElement.addEventListener('play', () => console.log('Video play'));
                videoElement.addEventListener('ended', () => console.log('Video ended - restarting'));
                videoElement.addEventListener('error', (e) => console.error('Video error:', e));
                
                videoElement.play().catch(e => console.error("Video play error:", e));
                
                // Ensure video restarts when it ends (backup for loop)
                videoElement.addEventListener('ended', () => {
                    console.log('Video ended, restarting...');
                    videoElement.currentTime = 0;
                    videoElement.play().catch(e => console.error("Video restart error:", e));
                });
             } else {
                console.log('No video playlist available');
             }
             if (audioSources.length > 0) {
                isPlaying = true;
                
                // Initialize ticker with first language text
                if (announcementData.length > 0) {
                    updateTickerText(announcementData[0].language_code);
                }
                
                playIntroThenAnnouncement();
             }
        }

        // Handle announcement audio ending
        audioPlayer.addEventListener('ended', () => {
            if (isPlaying && currentAudioIndex < audioSources.length) {
                // Continue to next announcement
                playIntroThenAnnouncement();
            } else if (isPlaying) {
                // All announcements finished, restart the cycle
                currentAudioIndex = 0;
                setTimeout(() => {
                    if (isPlaying) {
                        playIntroThenAnnouncement();
                    }
                }, 1000); // 1 second pause before restarting
            }
        });
        
        // Use a more reliable event to start playback
        window.addEventListener('load', startPlayback, { once: true });
        
        // Fallback: also try to start playback when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', startPlayback, { once: true });
        } else {
            // DOM is already ready
            setTimeout(startPlayback, 100);
        }
    </script>
</body>
</html>`;
}
