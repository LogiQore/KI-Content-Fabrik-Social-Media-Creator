export type Platform =
  | 'instagram_beitrag'
  | 'instagram_reels'
  | 'tiktok'
  | 'youtube_shorts'
  | 'youtube_video'
  | 'pinterest'
  | 'linkedin_beitrag';

export interface SocialMediaFormat {
  platform: Platform; label: string; width: number; height: number;
  aspectRatio: string; maxDurationSec: number; format: 'image' | 'video' | 'both';
  maxFileSizeMB: number; notes: string;
}

export interface Project {
  id: string; name: string; platforms: Platform[]; audience: string; theme: string;
  brandColors: string[]; brandFont: string; toneOfVoice: string; userInstructions: string;
  logoPath?: string; bildstilId?: string; bildstilPrompt?: string;
  avatarPath?: string; avatarName?: string; voiceOverMode?: boolean;
  createdAt: string; updatedAt: string; contents: ContentItem[];
}

export interface ContentItem {
  id: string; type: 'image' | 'carousel' | 'reel' | 'story' | 'video';
  title: string; description: string; platform: Platform; aspectRatio: string; active: boolean;
  imagePrompt?: string; imageUrl?: string; imageLocalPath?: string; imageRemoteUrl?: string;
  videoPrompt?: string; videoUrl?: string; videoLocalPath?: string;
  videoMode?: 'none' | 'image-to-video' | 'text-to-video';
  caption?: string; hashtags?: string[];
  // Voice / Sprechtext
  sprechtext?: string;
  voiceId?: string;
  voiceProvider?: 'elevenlabs' | 'did';
  voiceUrl?: string;
  voiceLocalPath?: string;
  voiceDuration?: number;
  // Tasks
  imageTaskId?: string; videoTaskId?: string; musicTaskId?: string;
  status?: 'idle' | 'generating' | 'done' | 'error'; errorMsg?: string;
  // Script-Referenz
  sceneNumber?: number;
}

export interface VoiceOption {
  id: string;
  name: string;
  provider: 'elevenlabs' | 'did';
  previewUrl?: string;
  language?: string;
  category?: string;
}

// ─── Virales Script (neue Strategie-Struktur) ────────────────────────────────

export interface ScriptHook {
  id: string;
  number: number;    // 1, 2, 3
  text: string;      // Der Hook-Text
}

export interface ScriptScene {
  id: string;
  number: number;           // Szene 1, 2, 3 …
  timing?: string;          // z.B. "0:00 – 0:08"
  dialog: string;           // Deutscher Dialog / Handlung
  bildPrompt: string;       // Englischer Bild-Prompt für KI
  generateImage: boolean;   // Checkbox: Bild generieren?
}

export interface ViralScript {
  selectedHookId: string;
  hooks: ScriptHook[];
  scenes: ScriptScene[];
  cta: string;
  platform: Platform;
  aspectRatio: string;
  hashtags: string[];
}

// ─── Legacy (wird noch von Phase3+ verwendet) ────────────────────────────────

export interface StrategyIdea {
  id: string; type: ContentItem['type']; title: string; description: string;
  platform: Platform; aspectRatio: string; hashtagSuggestions: string[]; active: boolean;
}

export interface EditorProject {
  id: string; projectId: string; width: number; height: number;
  fps: number; durationFrames: number; tracks: EditorTrack[]; bgColor: string;
}

export interface EditorTrack {
  id: string; type: 'media' | 'text' | 'audio' | 'logo'; label: string;
  clips: EditorClip[]; muted?: boolean; volume?: number;
}

export interface EditorClip {
  id: string; trackId: string; type: 'video' | 'image' | 'text' | 'audio';
  startFrame: number; durationFrames: number; url?: string; localPath?: string;
  text?: string; fontFamily?: string; fontSize?: number; color?: string; bgColor?: string;
  posX?: number; posY?: number; textAlign?: 'left' | 'center' | 'right';
  opacity?: number; scale?: number;
  transitionIn?: 'fade' | 'slide' | 'zoom' | 'none'; transitionOut?: 'fade' | 'slide' | 'zoom' | 'none';
  transitionDurationFrames?: number; volume?: number; fadeInFrames?: number; fadeOutFrames?: number;
}

export interface KieTask {
  taskId: string; state: 'waiting' | 'queuing' | 'generating' | 'success' | 'fail';
  resultUrls?: string[]; failMsg?: string; progress?: number;
}

export interface Bildstil {
  id: string; label: string; englisch_prompt: string; beschreibung: string; kategorie: string;
}

export interface Avatar {
  name: string; fileName: string; path: string; publicUrl: string;
}
