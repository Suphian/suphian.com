
import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from "lucide-react";

interface YouTubeMusicPlayerProps {
  className?: string;
}

// Sample playlist for demo
const samplePlaylist = [
  {
    id: "dQw4w9WgXcQ",
    title: "Rick Astley - Never Gonna Give You Up",
    artist: "Rick Astley"
  },
  {
    id: "kJQP7kiw5Fk",
    title: "Despacito",
    artist: "Luis Fonsi ft. Daddy Yankee"
  },
  {
    id: "fJ9rUzIMcZQ",
    title: "Bohemian Rhapsody",
    artist: "Queen"
  }
];

export const YouTubeMusicPlayer: React.FC<YouTubeMusicPlayerProps> = ({ className }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [volume, setVolume] = useState([75]);
  const [isMuted, setIsMuted] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [customVideoId, setCustomVideoId] = useState("");
  const playerRef = useRef<any>(null);

  // Extract video ID from YouTube URL
  const extractVideoId = (url: string) => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const handleUrlSubmit = () => {
    const videoId = extractVideoId(youtubeUrl);
    if (videoId) {
      setCustomVideoId(videoId);
      setYoutubeUrl("");
    }
  };

  const currentVideoId = customVideoId || samplePlaylist[currentTrack].id;
  const currentSong = customVideoId 
    ? { title: "Custom YouTube Video", artist: "Unknown Artist" }
    : samplePlaylist[currentTrack];

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const nextTrack = () => {
    if (!customVideoId) {
      setCurrentTrack((prev) => (prev + 1) % samplePlaylist.length);
    }
  };

  const prevTrack = () => {
    if (!customVideoId) {
      setCurrentTrack((prev) => (prev - 1 + samplePlaylist.length) % samplePlaylist.length);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const clearCustomVideo = () => {
    setCustomVideoId("");
    setIsPlaying(false);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🎵 YouTube Music Player
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* YouTube URL Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Add YouTube Video</label>
          <div className="flex gap-2">
            <Input
              placeholder="Paste YouTube URL here..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleUrlSubmit} variant="outline">
              Load
            </Button>
          </div>
        </div>

        {/* YouTube Video Embed */}
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${currentVideoId}?enablejsapi=1&rel=0&modestbranding=1`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Now Playing Info */}
        <div className="text-center space-y-1">
          <h3 className="font-semibold truncate">{currentSong.title}</h3>
          <p className="text-sm text-muted-foreground truncate">{currentSong.artist}</p>
          {customVideoId && (
            <Button variant="ghost" size="sm" onClick={clearCustomVideo}>
              Back to Playlist
            </Button>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={prevTrack}
            disabled={!!customVideoId}
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={togglePlay}
            className="h-12 w-12"
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 ml-1" />
            )}
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={nextTrack}
            disabled={!!customVideoId}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={toggleMute}>
            {isMuted || volume[0] === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <Slider
            value={isMuted ? [0] : volume}
            onValueChange={setVolume}
            max={100}
            step={1}
            className="flex-1"
          />
          <span className="text-sm text-muted-foreground w-10">
            {isMuted ? 0 : volume[0]}%
          </span>
        </div>

        {/* Playlist (when not using custom video) */}
        {!customVideoId && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Sample Playlist</h4>
            <div className="space-y-1">
              {samplePlaylist.map((song, index) => (
                <button
                  key={song.id}
                  onClick={() => setCurrentTrack(index)}
                  className={`w-full text-left p-2 rounded-md transition-colors ${
                    index === currentTrack
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-muted"
                  }`}
                >
                  <div className="font-medium text-sm truncate">{song.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{song.artist}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="text-xs text-muted-foreground text-center">
          This player embeds YouTube videos. Please respect copyright and use only videos you have rights to play.
        </div>
      </CardContent>
    </Card>
  );
};
