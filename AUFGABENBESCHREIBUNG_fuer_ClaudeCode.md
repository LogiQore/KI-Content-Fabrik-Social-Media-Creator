# KI Content Fabrik — Social Media Creator
## Vollständige Aufgabenbeschreibung für Claude Code

> Erstellt: 2026-04-06
> Zielverzeichnis: `E:\1_CLAUDE_Web_apps\KI_Content_Fabrik_Social_Media_Creator`
> Referenz-Vorlage: Workflow aus 54 Screenshots (Natalie FellFit – Osterprojekt · KI Marketing Club)
> API-Zugang: kie.ai (Key in `.env.local`)

---

## 1. Was gebaut werden soll

Eine vollständige **lokale Next.js Web-App** zur KI-gestützten Erstellung von Social-Media-Content.

Der Nutzer gibt ein Thema / ein Projekt ein (z. B. „Oster-Kampagne für PfotenKraeuter") und die App
führt ihn Schritt für Schritt durch den gesamten Content-Erstellungsprozess — von der Idee bis zum
fertigen, exportierbaren Bild/Video-Content für Instagram Beitrag, Instagram Reel, TikTok, YouTube Shorts, Youtube Video , Pinterest, LinkedIn  usw.... 
- die Ausgabeformate für die entspchendene Social Media Platform sollen in der Webapp in einer tabellen-datei (social_media_formate.xlsx )
von der Web App erfasst und ausgelesen werden

**Kern-Unterschied zum bestehenden Video-Editor:**
Der bestehende `KI_Content_Fabrik_video_editor` bearbeitet *vorhandene* Videos.
Der neue `KI_Content_Fabrik_Social_Media_Creator` **erstellt Content von Grund auf neu** —
mit KI-Bildgenerierung, KI-Videogenerierung, KI-Texterstellung — und enthält dann einen eigenen,
viel leistungsstärkeren integrierten Video-Editor.
Der neue `KI_Content_Fabrik_Social_Media_Creator` bearbeitet auch *vorhandene* Videos 

---

## 2. Tech-Stack

| Bereich | Technologie |
|---------|-------------|
| Framework | Next.js 15 (App Router) |
| Sprache | TypeScript |
| Styling | Tailwind CSS |
| KI-Modelle (Bild, Video, Audio) | **kie.ai API** (`https://api.kie.ai`) |
| KI-Text / Analyse | Anthropic Claude via kie.ai Chat-Endpoint |
| Video-Rendering / Editor | Browser-native Canvas + FFmpeg.wasm |
| Dateispeicherung | Lokal (`./tmp/`) |
| Konfiguration | `.env.local` |
| Starter-Skripte | `WebApp_starten.bat`, `WebApp_beenden.bat` |

### kie.ai API-Grundprinzip (WICHTIG für alle Generierungen)
```
POST /api/v1/jobs/task  →  { taskId }
GET  /api/v1/jobs/recordInfo?taskId=...  →  poll bis state === "success"
result.resultUrls[0]  →  URL des generierten Assets
```
Auth: `Authorization: Bearer ${KIE_API_KEY}` in jedem Request.

---

## 3. Workflow — 7 Hauptphasen (aus den 54 Screenshots abgeleitet)


### Phase 1 — Projekt-Setup
**User-Eingaben:**
- Projekt-Name (z.B. „Oster-Kampagne FellFit")
- Ziel-Plattform(en): Instagram Feed, Instagram Reels, TikTok, YouTube Shorts, Pinterest
- Zielgruppe / Persona (Freitext)
- Kampagnen-Thema / Kernbotschaft (Freitext)
- Brand-Style (optional: Farben als Hex, Schriften, Tone of Voice)
- Eigene Anweisungen / Sonderwünsche (optionales Prioritäts-Textfeld)

**App-Aktion:** Speichert Projekt als JSON in `./tmp/projects/{projectId}/project.json`

---

### Phase 2 — Content-Strategie (KI-generiert)
**App-Aktion:**
- POST an kie.ai Chat (`/api/v1/chat/completions`, Modell: `claude-sonnet-4-6`)
- Generiert Liste von Content-Ideen, jeweils mit: Typ, Titel, Beschreibung, Format, Hashtag-Vorschläge

**UI:** Karten-Grid — Ideen aktivieren/deaktivieren/bearbeiten/hinzufügen

---

### Phase 3 — Bild-Generierung
**App-Aktion:**
- Für jede aktive Content-Idee: Prompt via Claude → Bild via kie.ai
- Modell: `seedream/text-to-image` oder `flux-2-pro/text-to-image`
- Seitenverhältnis aus Phase 1 (z.B. `"9:16"` für Reels/TikTok, `"1:1"` für Feed)
- Polling bis Ergebnis → Download → `./tmp/projects/{id}/images/`

**UI:** Galerie mit Regenerieren/Prompt-bearbeiten/Löschen je Bild

---

### Phase 4 — Caption & Hashtag Generierung
**App-Aktion:** Claude generiert Caption + CTA + Hashtag-Set pro Beitrag (Deutsch)

**UI:** Editierbares Caption-Feld, Hashtags als Tags, Zeichen-Zähler, Neu-generieren-Button

---

### Phase 5 — Video-Erstellung (KI-generiert)
**3 Optionen pro Content-Stück:**
- Option A: Bild-zu-Video → `kling/image-to-video` oder `hailuo/image-to-video`
- Option B: Text-zu-Video → `kling/text-to-video` oder `wan/text-to-video`
- Option C: Nur Bild (kein Video)

**UI:** Toggle pro Beitrag + animierte Fortschritts-Karte während Generierung (Polling 3s)


---

### Phase 6 — Integrierter Video-Editor (Herzstück der App)

#### Layout
```
┌──────────────────────────────┬────────────────────────┐
│  CANVAS PREVIEW              │  PROPERTIES PANEL      │
│  [Aktueller Frame]           │  - Clip-Dauer          │
│  [Play/Pause/Scrubber]       │  - Position X/Y        │
│                              │  - Skalierung          │
│                              │  - Opacity             │
│                              │  - Übergangs-Effekt    │
├──────────────────────────────┴────────────────────────┤
│  TIMELINE                                             │
│  🟦 Video/Bild: [Clip1][Clip2][Clip3]                 │
│  🟨 Text:       [Overlay 1]   [Overlay 2]             │
│  🟩 Audio:      [Musik ───────────────────────]       │
│  ⬜ Logo:       [Logo ─────────────────────── ]       │
└───────────────────────────────────────────────────────┘
```

#### Timeline-Funktionen
- Drag & Drop: Clips verschieben + Reihenfolge ändern
- Trim: Clip-Enden ziehen zum Kürzen
- Übergänge: Fade, Slide, Zoom zwischen Clips
- Multi-Track: Video + Text-Overlays + Audio + Logo

#### Text-Overlay Editor
- Text per Drag & Drop positionieren (im Canvas)
- Font, Größe, Farbe, Einblend-Animation (Fade/Slide/Typewriter)
- Start-/Endzeit auf Timeline

#### Audio / Musik
- Option A: KI-Musik via kie.ai Suno (`/api/v1/suno/generate`)
- Option B: Eigene Audiodatei hochladen
- Option C: Kein Audio
- Lautstärke-Slider, Fade In/Out

#### Brand-Elemente
- Logo-Upload (PNG mit Transparenz) → auf alle Clips
- Position: 4 Ecken oder Mitte, Opacity einstellbar

#### Format-Vorlagen (Quick-Select)
| Plattform | Auflösung | Seitenverhältnis |
|-----------|-----------|-----------------|
| Instagram Feed | 1080×1080 | 1:1 |
| Instagram Reels | 1080×1920 | 9:16 |
| TikTok | 1080×1920 | 9:16 |
| YouTube Shorts | 1080×1920 | 9:16 |
| Pinterest | 1000×1500 | 2:3 |

#### Export / Render
- Primär: **FFmpeg.wasm** (clientseitig, kein Server nötig)
  - `npm install @ffmpeg/ffmpeg @ffmpeg/util`
  - Benötigt Headers in `next.config.js`:
    `Cross-Origin-Embedder-Policy: require-corp`
    `Cross-Origin-Opener-Policy: same-origin`
- Fallback: `/api/render` (Server-seitig mit fluent-ffmpeg)
- Output: MP4 H.264
- Fortschrittsbalken + Download-Button


---

### Phase 7 — Export & Download
- Übersicht aller fertigen Files: Bilder (JPG/PNG), Videos (MP4), Captions (.txt)
- Content-Kalender-Ansicht (optionale Planung: Wochentag + Uhrzeit)
- Einzel-Download + ZIP-Download (alles auf einmal)
- „Im Explorer öffnen" Button (Windows: `explorer /select, datei`)

---

## 4. Verzeichnisstruktur

```
KI_Content_Fabrik_Social_Media_Creator/
├── AUFGABENBESCHREIBUNG_fuer_ClaudeCode.md  ← Diese Datei
├── READMEFIRST_datei.md                     ← Fortschrittsprotokoll
├── README.md                                ← Setup-Anleitung
├── WebApp_starten.bat
├── WebApp_beenden.bat
├── start_server.ps1
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── postcss.config.js
├── .env.local                               ← API-Keys (NICHT in git)
└── src/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx                         ← Haupt-UI (7-Phasen-Stepper)
    │   ├── globals.css
    │   └── api/
    │       ├── project/route.ts             ← Projekt speichern/laden
    │       ├── strategy/route.ts            ← Claude Content-Strategie
    │       ├── generate-image/route.ts      ← kie.ai Bildgenerierung
    │       ├── generate-video/route.ts      ← kie.ai Videogenerierung
    │       ├── generate-caption/route.ts    ← Claude Captions
    │       ├── generate-music/route.ts      ← kie.ai Suno Musik
    │       ├── poll-task/route.ts           ← kie.ai Task-Status
    │       ├── render/route.ts              ← Server-seitiges Render (Fallback)
    │       ├── download-zip/route.ts        ← ZIP Export
    │       └── open-folder/route.ts         ← Windows Explorer öffnen
    ├── components/
    │   ├── Stepper.tsx
    │   ├── phases/
    │   │   ├── Phase1_Setup.tsx
    │   │   ├── Phase2_Strategy.tsx
    │   │   ├── Phase3_Images.tsx
    │   │   ├── Phase4_Captions.tsx
    │   │   ├── Phase5_Video.tsx
    │   │   ├── Phase6_Editor.tsx
    │   │   └── Phase7_Export.tsx
    │   ├── editor/
    │   │   ├── Timeline.tsx
    │   │   ├── TimelineTrack.tsx
    │   │   ├── TimelineClip.tsx
    │   │   ├── Preview.tsx                  ← Canvas-basierte Vorschau
    │   │   ├── PropertiesPanel.tsx
    │   │   ├── TextOverlayEditor.tsx
    │   │   ├── AudioTrack.tsx
    │   │   └── ExportPanel.tsx
    │   └── ui/
    │       ├── KieTaskProgress.tsx          ← Animations-Fortschrittskarte
    │       ├── ImageCard.tsx
    │       ├── ContentCard.tsx
    │       └── PlatformBadge.tsx
    ├── lib/
    │   ├── kie-ai.ts                        ← API-Wrapper (createTask, pollTask)
    │   ├── claude.ts                        ← Claude via kie.ai Chat
    │   ├── project.ts                       ← Projekt-Datei-Operationen
    │   └── ffmpeg-server.ts                 ← Server-FFmpeg (Fallback)
    ├── hooks/
    │   ├── useKieTask.ts                    ← React Hook: Task + Polling
    │   └── useEditor.ts                     ← Editor-Zustand
    └── types/
        └── index.ts
```


---

## 5. Umgebungsvariablen (.env.local)

```bash
KIE_API_KEY=your_kie_ai_api_key_here
UPLOAD_DIR=./tmp/uploads
OUTPUT_DIR=./tmp/output
PROJECTS_DIR=./tmp/projects
```

---

## 6. TypeScript-Typen (types/index.ts — vollständig)

```typescript
type Platform = "instagram_beitrag" | "instagram_reels" | "tiktok" | "youtube_shorts" | "pinterest" | "youtube_video" | "linked_beitrag" |;

interface Project {
  id: string;
  name: string;
  platforms: Platform[];
  audience: string;
  theme: string;
  brandColors: string[];
  brandFont: string;
  toneOfVoice: string;
  userInstructions: string;
  createdAt: string;
  contents: ContentItem[];
}

interface ContentItem {
  id: string;
  type: "image" | "carousel" | "reel" | "story";
  title: string;
  description: string;
  platform: Platform;
  aspectRatio: string;
  active: boolean;
  imagePrompt?: string;
  imageUrl?: string;
  imageLocalPath?: string;
  videoPrompt?: string;
  videoUrl?: string;
  videoLocalPath?: string;
  caption?: string;
  hashtags?: string[];
  imageTaskId?: string;
  videoTaskId?: string;
  musicTaskId?: string;
}

interface EditorProject {
  id: string;
  width: number;
  height: number;
  fps: number;
  durationFrames: number;
  tracks: EditorTrack[];
}

interface EditorTrack {
  id: string;
  type: "video" | "image" | "text" | "audio" | "logo";
  clips: EditorClip[];
}

interface EditorClip {
  id: string;
  type: "video" | "image" | "text" | "audio";
  startFrame: number;
  durationFrames: number;
  url?: string;
  localPath?: string;
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  posX?: number;
  posY?: number;
  opacity?: number;
  transitionIn?: "fade" | "slide" | "zoom" | "none";
  transitionOut?: "fade" | "slide" | "zoom" | "none";
}

interface KieTask {
  taskId: string;
  state: "waiting" | "queuing" | "generating" | "success" | "fail";
  resultUrls?: string[];
  failMsg?: string;
}
```


---

## 7. kie.ai API-Wrapper (lib/kie-ai.ts — Schnittstelle)

```typescript
const KIE_BASE = "https://api.kie.ai";

// Alle Requests benötigen:
// Authorization: Bearer ${process.env.KIE_API_KEY}
// Content-Type: application/json

// Task erstellen — mit Retry bei HTTP 429 (max 3 Versuche, exponential backoff)
export async function createTask(
  model: string,
  input: Record<string, unknown>,
  callBackUrl?: string
): Promise<string>  // → taskId

// Task pollen alle 3s bis success/fail (Timeout 10 Min)
export async function pollTask(
  taskId: string,
  timeoutMs = 600_000
): Promise<string[]>  // → resultUrls

// Kurzform-Helfer (nutzen createTask + pollTask intern):
export async function generateImage(prompt: string, aspectRatio: string, model?: string): Promise<string>
export async function imageToVideo(imageUrl: string, prompt: string, duration?: number): Promise<string>
export async function textToVideo(prompt: string, aspectRatio: string, duration?: number): Promise<string>
export async function claudeChat(systemPrompt: string, userMessage: string): Promise<string>
export async function generateMusic(description: string, duration?: number): Promise<string>
export async function getCredits(): Promise<number>
```

---

## 8. UI-Design-Vorgaben

### Farbschema (konsistent mit bestehendem Video-Editor)
```css
background:   #0f0f1a   (sehr dunkel)
surface:      #1a1a2e   (dunkel blau-lila)
accent:       #7c3aed   (Lila — Haupt-Akzent)
accent-light: #a855f7
text:         #f1f5f9   (fast weiß)
text-muted:   #94a3b8   (grau)
success:      #10b981   (grün)
error:        #ef4444   (rot)
border:       #2d2d44
```

### Layout-Prinzipien
- **App-Header:** „🎬 KI Content Fabrik — Social Media Creator" (lila + weiß, zentriert)
- **Credits-Anzeige:** rechts oben (kie.ai Reststand)
- **Stepper:** 7 Phasen als Pills oben — aktive Phase pulsiert
- **Phase 1:** max-w-2xl zentriert
- **Phase 2–5:** Karten-Grid (2–3 Spalten)
- **Phase 6 (Editor):** Vollbild — Preview oben-links, Properties oben-rechts, Timeline unten
- **Phase 7:** Galerie + Download-Sektion

### KI-Task Fortschritts-Karte (KieTaskProgress.tsx)
```
🎨 Bild wird generiert...
[████████░░░░░░░░░] ca. 55%
Modell: seedream/text-to-image · Task: abc123
```
- Polling alle 3s mit Puls-Animation
- Zeigt Modell-Name + TaskId
- Bei Fertigstellung: Bild/Video erscheint automatisch

---

## 9. next.config.js — PFLICHT-Einstellung für FFmpeg.wasm

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};
module.exports = nextConfig;
```


---

## 10. Starter-Skripte (Windows — 1:1 aus bestehendem Video-Editor übernehmen)

### WebApp_starten.bat
```bat
@echo off
cd /d "%~dp0"
start "" powershell.exe -ExecutionPolicy Bypass -File "%~dp0start_server.ps1"
timeout /t 4 /nobreak > nul
for /l %%p in (3000,1,3999) do (
    netstat -ano | findstr ":%%p " | findstr LISTENING > nul 2>&1
    if not errorlevel 1 (
        start "" "http://localhost:%%p"
        exit /b
    )
)
```

### WebApp_beenden.bat
```bat
@echo off
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":300" ^| findstr LISTENING') do (
    wmic process where ProcessId=%%a get CommandLine 2>nul | findstr "next" > nul
    if not errorlevel 1 taskkill /PID %%a /F
)
echo Server beendet.
pause
```

---

## 11. Wichtige Implementierungs-Hinweise

1. **Kein `!` im Pfad** — Webpack reserviert `!`. Pfad `E:\1_CLAUDE_Web_apps\...` ist korrekt.

2. **kie.ai ist async** — IMMER pollen bis `state === "success"`. Timeout: 10 Minuten.
   Nie annehmen, dass ein Task sofort fertig ist.

3. **Asset-Download:** Generierte URLs von kie.ai → Download auf lokalen Server →
   in `./tmp/projects/{id}/` speichern. Kie.ai-URLs verfallen nach 14 Tagen.

4. **FFmpeg.wasm** braucht CORP/COOP Headers (siehe next.config.js oben).

5. **Polling im Frontend** via `useKieTask` Hook mit `setInterval` (3000ms),
   mit Cleanup-Funktion bei Unmount (`clearInterval`).

6. **Projekte persistent** — Jedes Projekt = Ordner `./tmp/projects/{projectId}/`
   mit `project.json`. Beim App-Start: alle Projekte aus Dateisystem einlesen.

7. **Claude via kie.ai Chat** — Modell: `claude-sonnet-4-6`,
   Endpoint: `POST /api/v1/chat/completions` (OpenAI-kompatibel).
   System-Prompts immer auf Deutsch.

8. **Rate Limiting** — Max 20 Requests / 10 Sekunden bei kie.ai.
   Bei mehreren parallelen Generierungen: sequenziell oder mit 500ms Delay senden.

9. **Fehlerbehandlung** — Jeder kie.ai-Call: try/catch mit User-sichtbarer Fehlermeldung.
   `state === "fail"` → `failMsg` anzeigen + Retry-Button.

10. **pip ist defekt auf diesem System** — Keine Python-Dependencies!
    Alles in Node.js/TypeScript implementieren.

11. **Ordnerpfad-Problem vermeiden** — Keine Sonderzeichen (`!`, `·`, `#`) in
    Dateinamen die als Webpack-Pfade genutzt werden.

---

## 12. Empfohlene Build-Reihenfolge für Claude Code

```
Schritt 1:  Projektstruktur erstellen (package.json, tsconfig, next.config, tailwind)
            + .env.local + WebApp_starten/beenden.bat + start_server.ps1

Schritt 2:  types/index.ts (alle Typen vollständig)
            + lib/kie-ai.ts (createTask, pollTask, alle Helfer)

Schritt 3:  Phase 1 UI (Projekt-Setup-Formular)
            + /api/project route (speichern/laden)

Schritt 4:  Phase 2 UI (Content-Strategie Karten-Grid)
            + /api/strategy route

Schritt 5:  Phase 3 UI (Bildgenerierung + KieTaskProgress-Komponente)
            + /api/generate-image route
            + hooks/useKieTask.ts

Schritt 6:  Phase 4 UI (Caption-Textfelder + Hashtag-Tags)
            + /api/generate-caption route

Schritt 7:  Phase 5 UI (Video-Toggle pro Beitrag)
            + /api/generate-video route

Schritt 8:  Phase 6 — Editor-Grundstruktur (Timeline + Canvas-Preview)
            + hooks/useEditor.ts

Schritt 9:  Phase 6 — Editor-Funktionen (Text-Overlay, Audio, Logo, Übergänge)

Schritt 10: Phase 6 — Export (FFmpeg.wasm Integration)
            + /api/render route (Fallback)

Schritt 11: Phase 7 UI (Export-Galerie + ZIP-Download)
            + /api/download-zip + /api/open-folder

Schritt 12: README.md + READMEFIRST_datei.md finalisieren
```

---

## 13. Referenz — Bestehender Video-Editor

**Pfad:** `E:\1_CLAUDE_Web_apps\KI_Content_Fabrik_video_editor`

**Aus dem bestehenden Projekt ÜBERNEHMEN:**
- `WebApp_starten.bat` / `WebApp_beenden.bat` / `start_server.ps1` → 1:1 kopieren
- `/api/open-folder` Route → 1:1 kopieren
- Tailwind-Farbschema (dunkel + lila) → übernehmen + ausbauen
- Progress-Pills/Stepper-Konzept → weiterentwickeln
- `READMEFIRST_datei.md` Format → neu anlegen

**NICHT übernehmen (neues System):**
- Remotion → ersetzt durch FFmpeg.wasm + Canvas
- OpenAI Whisper → nicht nötig
- yt-dlp → nicht nötig
- ffmpeg-static → optional als Fallback; primär FFmpeg.wasm

---

## 14. Use-Case / Vorlage

Die 54 Screenshots in `Beispiel_Dateien_zur_Vorlage_Natalie_FellFit\Fellfit_natalie\`
zeigen den **konkreten Anwendungsfall**:

**Natalie** (FellFit, Fitness/Personal Training) erstellt ihr **Oster-Projekt**
im Rahmen des **KI Marketing Club**:
- Oster-Kampagne für Instagram + TikTok planen
- KI-Bilder im FellFit-Stil erstellen
- Kurze Reels/Videos generieren lassen
- Passende Captions + Hashtags verfassen
- Alles im Editor zusammenschneiden
- Fertige Files exportieren + direkt posten

→ Die App soll genau diesen Workflow so intuitiv und schnell wie möglich machen.

---

*Ende der Aufgabenbeschreibung*
*Version: 1.0 — 2026-04-06*
*Diese Datei direkt in Claude Code öffnen oder als Kontext einfügen.*
