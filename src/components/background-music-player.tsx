
"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Music, Music2 } from 'lucide-react';

const audioUrl = "https://files.catbox.moe/1mcrli.mp3";

export function BackgroundMusicPlayer() {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        const audioElement = audioRef.current;
        if (!audioElement) return;

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);

        audioElement.addEventListener('play', handlePlay);
        audioElement.addEventListener('pause', handlePause);

        return () => {
            audioElement.removeEventListener('play', handlePlay);
            audioElement.removeEventListener('pause', handlePause);
        };
    }, []);

    const togglePlayPause = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                try {
                    audioRef.current.play();
                } catch (error) {
                    console.error("Error attempting to play audio:", error);
                }
            }
        }
    };

    return (
        <>
            <audio 
                ref={audioRef}
                src={audioUrl}
                loop
                muted
                playsInline
                data-autoplay="true"
            />
            <Button variant="ghost" size="icon" onClick={togglePlayPause} title={isPlaying ? "Pausar música" : "Reproducir música"}>
                {isPlaying ? <Music2 className="animate-pulse" /> : <Music />}
                <span className="sr-only">Toggle Background Music</span>
            </Button>
        </>
    );
}
