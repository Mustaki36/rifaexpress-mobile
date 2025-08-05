
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Music, Music2 } from 'lucide-react';

const audioUrl = "https://files.catbox.moe/1mcrli.mp3";

export function BackgroundMusicPlayer() {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const hasInteracted = useRef(false);

    useEffect(() => {
        // Create audio element programmatically to have more control
        const audio = new Audio(audioUrl);
        audio.loop = true;
        audioRef.current = audio;

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);

        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);

        return () => {
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.pause(); // Clean up audio on component unmount
        };
    }, []);

    const playAudio = useCallback(() => {
         if (audioRef.current) {
            audioRef.current.play().catch(error => {
                // Autoplay was prevented. This is common.
                // The user needs to interact with the page first.
                console.warn("Audio play was prevented by browser:", error);
            });
        }
    }, []);

    useEffect(() => {
        const handleFirstInteraction = () => {
            if (!hasInteracted.current) {
                hasInteracted.current = true;
                playAudio();
            }
            window.removeEventListener('click', handleFirstInteraction);
        };

        window.addEventListener('click', handleFirstInteraction);

        return () => {
            window.removeEventListener('click', handleFirstInteraction);
        };
    }, [playAudio]);


    const togglePlayPause = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                playAudio();
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
