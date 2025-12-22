import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface AudioPlayerProps {
  src: string;
  title?: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, title = "The Resume Reimagined" }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();

  // Initialize audio context and analyser
  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaElementSource(audio);
    
    analyser.fftSize = 256;
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    
    analyserRef.current = analyser;
    dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

    return () => {
      source.disconnect();
      analyser.disconnect();
      audioContext.close();
    };
  }, []);

  // Draw waveform visualization
  const drawWaveform = useCallback(() => {
    if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    
    analyser.getByteFrequencyData(dataArray);

    const width = canvas.width;
    const height = canvas.height;
    
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    const barCount = 60;
    const barWidth = width / barCount;
    const barGap = 2;

    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.floor((i / barCount) * dataArray.length);
      const barHeight = (dataArray[dataIndex] / 255) * height * 0.8;
      
      // Create gradient for each bar
      const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
      gradient.addColorStop(0, '#FF3B30');
      gradient.addColorStop(0.5, '#FF5C45');
      gradient.addColorStop(1, '#FF8C7A');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(
        i * barWidth + barGap,
        height - barHeight,
        barWidth - barGap * 2,
        barHeight
      );
    }

    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(drawWaveform);
    }
  }, [isPlaying]);

  // Start/stop visualization
  useEffect(() => {
    if (isPlaying) {
      drawWaveform();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      // Draw static waveform when paused
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
    }
  }, [isPlaying, drawWaveform]);

  // Handle audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const newTime = parseFloat(e.target.value);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    audioRef.current.volume = newVolume;
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const skip = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Title */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl md:text-3xl font-mono font-bold mb-2" style={{ color: '#FF3B30' }}>
          {title}
        </h1>
        <p className="text-xs md:text-sm font-mono opacity-70">
          How One Leader Mastered AI, Data, and Impact Across Google, YouTube, and Beyond
        </p>
      </div>

      {/* Waveform Visualization */}
      <div className="mb-6 rounded-lg overflow-hidden border" style={{ borderColor: 'rgba(255, 59, 48, 0.3)' }}>
        <canvas
          ref={canvasRef}
          className="w-full h-32 md:h-48"
          style={{ display: 'block' }}
        />
      </div>

      {/* Audio Controls */}
      <div className="space-y-4">
        {/* Progress Bar */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono opacity-70 w-12 text-right">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #FF3B30 0%, #FF3B30 ${(currentTime / duration) * 100}%, rgba(255, 255, 255, 0.1) ${(currentTime / duration) * 100}%, rgba(255, 255, 255, 0.1) 100%)`
            }}
          />
          <span className="text-xs font-mono opacity-70 w-12">
            {formatTime(duration)}
          </span>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => skip(-10)}
            className="p-2 hover:opacity-70 transition-opacity"
            style={{ color: '#FF3B30' }}
            aria-label="Skip back 10 seconds"
          >
            <SkipBack className="h-5 w-5" />
          </button>
          
          <button
            onClick={togglePlay}
            disabled={isLoading}
            className="p-4 rounded-full border-2 transition-all hover:bg-opacity-10"
            style={{
              color: '#FF3B30',
              borderColor: '#FF3B30',
              backgroundColor: isLoading ? 'rgba(255, 59, 48, 0.1)' : 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 59, 48, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isLoading ? 'rgba(255, 59, 48, 0.1)' : 'transparent';
            }}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="h-6 w-6 md:h-8 md:w-8" />
            ) : (
              <Play className="h-6 w-6 md:h-8 md:w-8 ml-0.5" />
            )}
          </button>
          
          <button
            onClick={() => skip(10)}
            className="p-2 hover:opacity-70 transition-opacity"
            style={{ color: '#FF3B30' }}
            aria-label="Skip forward 10 seconds"
          >
            <SkipForward className="h-5 w-5" />
          </button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={toggleMute}
            className="p-2 hover:opacity-70 transition-opacity"
            style={{ color: '#FF3B30' }}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-24 md:w-32 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #FF3B30 0%, #FF3B30 ${(isMuted ? 0 : volume) * 100}%, rgba(255, 255, 255, 0.1) ${(isMuted ? 0 : volume) * 100}%, rgba(255, 255, 255, 0.1) 100%)`
            }}
          />
        </div>
      </div>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default AudioPlayer;

