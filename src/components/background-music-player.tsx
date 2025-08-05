
"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Music, Music2 } from 'lucide-react';

const audioUrl = "https://files.catbox.moe/1mcrli.mp3";

export function BackgroundMusicPlayer() {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        // Create audio element programmatically to have more control
        const audio = new Audio(audioUrl);
        audio.loop = true;
        (audioRef as React.MutableRefObject<HTMLAudioElement>).current = audio;

        const handleCanPlay = () => {
            console.log("Audio can play through");
        };

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);

        audio.addEventListener('canplaythrough', handleCanPlay);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);

        return () => {
            audio.removeEventListener('canplaythrough', handleCanPlay);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.pause(); // Clean up audio on component unmount
        };
    }, []);

    const togglePlayPause = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                // Play returns a promise, which can be useful for debugging
                audioRef.current.play().catch(error => {
                    console.error("Audio play failed:", error);
                });
            }
        }
    };

    return (
        <Button variant="ghost" size="icon" onClick={togglePlayPause} title={isPlaying ? "Pausar música" : "Reproducir música"}>
            {isPlaying ? <Music2 className="animate-pulse" /> : <Music />}
            <span className="sr-only">Toggle Background Music</span>
        </Button>
    );
}
