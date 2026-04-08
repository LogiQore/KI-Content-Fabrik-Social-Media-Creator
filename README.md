# KI Content Fabrik — Social Media Creator

> Lokale Next.js Web-App zur KI-gestuetzten Erstellung von Social-Media-Content
> Arbeitsverzeichnis: `E:\1_CLAUDE_Web_apps\KI_Content_Fabrik_Social_Media_Creator`
> Erstellt: 2026-04-06 | Letzte Aktualisierung: 2026-04-07 (Session 6b)

---

## Projektbeschreibung

Der Nutzer gibt ein Thema / Projekt ein (z.B. "Oster-Kampagne fuer PfotenKraeuter") und die App
fuehrt ihn Schritt fuer Schritt durch den gesamten Content-Erstellungsprozess — von der Idee bis zum
fertigen, exportierbaren Bild/Video-Content fuer alle gaengigen Social-Media-Plattformen.

### Features

- 8-Phasen-Workflow: Projekt -> Strategie -> Bilder -> Captions -> Voice -> Videos -> Editor -> Export
- KI-Bildgenerierung via kie.ai (Nano Banana 2, Seedream 4.5, Flux 2 Pro, Ideogram V3)
- KI-Videogenerierung via kie.ai (Veo 3 / Veo 3 Fast / Veo 3 Lite, Kling 2.6/3.0)
- KI-Text via Claude Sonnet 4.6 ueber kie.ai (Anthropic-nativer Endpoint)
- Virale Hook-Generierung (5 Vorschlaege per KI, auswaehlbar)
- Story-Modus: zusammenhaengende Story in X Teilen statt einzelner Ideen
- Bildstil-Auswahl (30 Stile aus bildstile.xlsx)
- Avatar / Character-Sheet mit automatischer Komprimierung und KI-Beschreibung
- **Voice & Sprechtext:** ElevenLabs TTS + D-ID Lipsync-Vorbereitung
- Stimmenauswahl mit Probehoeren, KI-Sprechtextgenerierung, Audio-Export
- Integrierter Video-Editor: Canvas-Preview + Multi-Track-Timeline
- Export: Einzel-Download + ZIP + Windows Explorer + fortlaufend nummerierte .md Dateien
- Ausgabeformate aus social_media_formate.xlsx
- Zurueck-Navigation in allen Phasen (Stepper + Buttons)
- GitHub-Integration (eigenes Repository)

---

## Tech-Stack

| Bereich | Technologie |
|---------|-------------|
| Framework | Next.js 15 (App Router) |
| Sprache | TypeScript |
| Styling | Tailwind CSS |
| KI-Modelle (Bild) | kie.ai: Nano Banana 2, Seedream 4.5, Flux 2 Pro, Ideogram V3 |
| KI-Modelle (Video) | kie.ai: Veo 3 (Standard), Kling 2.6/3.0 |
| KI-Text / Analyse | Claude Sonnet 4.6 via kie.ai Anthropic-Endpoint |
| Bildverarbeitung | sharp (Avatar-Komprimierung) |
| Video-Editor | Browser-native Canvas + FFmpeg.wasm |
| Dateispeicherung | Lokal (`./tmp/`) |
| Konfiguration | `.env.local` |
| Versionskontrolle | Git + GitHub (LogiQore/KI-Content-Fabrik-Social-Media-Creator) |
| Starter-Skripte | `WebApp_starten.bat`, `WebApp_beenden.bat` |

---

## Schnellstart

### 1. Installation

```bash
cd E:\1_CLAUDE_Web_apps\KI_Content_Fabrik_Social_Media_Creator
npm install
```

### 2. Umgebungsvariablen

`.env.local` muss vorhanden sein:

```bash
KIE_API_KEY=dein_kie_ai_api_key
ELEVENLABS_API_KEY=dein_elevenlabs_api_key
DID_API_KEY=dein_did_api_key
UPLOAD_DIR=./tmp/uploads
OUTPUT_DIR=./tmp/output
PROJECTS_DIR=./tmp/projects
```

### 3. App starten

**Doppelklick:** `WebApp_starten.bat` (startet Server + oeffnet Browser)

**Oder manuell:** `npm run dev` -> http://localhost:3000

### 4. App beenden

**Doppelklick:** `WebApp_beenden.bat`

---

## 8-Phasen-Workflow

### Phase 1 — Projekt-Setup
- Projekt-Name, Ziel-Plattform(en), Zielgruppe, Kampagnen-Thema
- Brand-Style (Farben, Schriften, Tone of Voice)
- Bildstil-Auswahl (30 Stile aus bildstile.xlsx)
- Avatar-Auswahl (Character-Sheets aus avatare/)
- Eigene Anweisungen (optionales Prioritaets-Textfeld)
- Speichert als JSON in `./tmp/projects/{projectId}/project.json`

### Phase 2 — Content-Strategie (KI-generiert)
- **Schritt 1 — Viraler Hook:** 5 KI-generierte Hook-Vorschlaege zur Auswahl (oder eigenen schreiben)
- **Schritt 2 — Strategie:** Modus-Auswahl:
  - "Einzelne Ideen" — unabhaengige Content-Stuecke (bisheriges Verhalten)
  - "Zusammenhaengende Story" — eine fortlaufende Geschichte in X Teilen mit rotem Faden
- Hook + Modus fliessen in die KI-Generierung ein
- UI: Karten-Grid zum Aktivieren/Deaktivieren/Bearbeiten

### Phase 3 — Bild-Generierung
- Modell-Auswahl: Nano Banana 2 (empfohlen fuer Avatare), Seedream 4.5, Flux 2 Pro, Ideogram V3
- **Avatar-Konsistenz:** Avatar wird komprimiert (sharp, max 1024px), per Claude beschrieben und die Beschreibung in jeden Prompt eingebaut
- Avatar-Referenzbild wird automatisch an das Modell uebergeben
- Nano Banana 2: `image_input` Array fuer echte Charakterkonsistenz
- Bilder werden ohne Text generiert (keine Beschriftungen, Titel etc.)
- Originale kie.ai-URLs (`imageRemoteUrl`) werden fuer spaetere Videogenerierung gespeichert
- Galerie mit Regenerieren/Prompt-bearbeiten

### Phase 4 — Caption & Hashtag Generierung
- Claude generiert Caption + CTA + Hashtag-Set pro Beitrag (Deutsch)
- Editierbar, Zeichen-Zaehler, Neu-generieren-Button
- **Export:** `beitrag_erstellt.md` — fortlaufend nummeriert (01_, 02_, ...), nie ueberschrieben

### Phase 5 — Voice & Sprechtext (NEU)
- **Stimmenauswahl:** ElevenLabs-Stimmen + D-ID Voice-Klone in einem Dropdown, gruppiert nach Provider
- **Probehoeren:** Jede Stimme kann per Klick angehoert werden (preview_url)
- **Sprechtext pro Szene:** Editierbares Textfeld mit Woerter-Zaehler und Dauer-Schaetzung
- **KI-Sprechtext:** Claude generiert natuerlichen Sprechtext optimiert fuer gesprochene Sprache
  - Erster Teil: starker Hook; Letzter Teil: klarer Call-to-Action
  - Kurze Saetze, emotionale Ansprache, Pausen-Markierungen mit "..."
- **Audio generieren:** ElevenLabs TTS (multilingual v2, Deutsch) pro Szene oder Batch
- **Fortschrittsbalken** bei "Alle Audios generieren"
- **Voice On/Off Toggle:** Phase kann uebersprungen werden ("Ohne Voice-Over")
- Audio wird lokal gespeichert: `tmp/projects/{id}/audio/voice_*.mp3`
- Voice-Daten (voiceId, voiceUrl, voiceDuration) werden an Phase 6 (Videos) weitergegeben

**API-Endpunkte:**
- `GET /api/voices` — Stimmen von ElevenLabs + D-ID laden
- `POST /api/generate-sprechtext` — KI-Sprechtext per Claude
- `POST /api/generate-voice` — ElevenLabs TTS → MP3 lokal speichern

**Lib-Dateien:**
- `src/lib/elevenlabs.ts` — getVoices(), textToSpeech()
- `src/lib/did.ts` — getVoiceClones(), getPresenters() (Lipsync-Vorbereitung)

### Phase 6 — Video-Erstellung
- **Standard-Modell: Veo 3 Fast** (voreingestellt), alternativ Veo 3 Quality, Kling 2.6/3.0
- Modell + Dauer pro Teil separat einstellbar (Veo 3: fix 8s, Kling: 5s/10s)
- 2 editierbare Script-Felder pro Teil:
  - **Handlung & Bewegung** — Was passiert, Charakter-Aktionen
  - **Kamera & Perspektive** — Kamerawinkel, Bewegung, Uebergaenge
- **Modell-optimierte Scripts:** KI-generierte Prompts sind auf das jeweilige Modell (Veo 3, Kling) zugeschnitten
- **Szenenbild-Kontext:** imagePrompt, Caption und Avatar fliessen in die Script-Generierung ein
- Globale Buttons: "Alle Scripts generieren" + "Alle Videos generieren" + "videoscript.md"
- **Fortschrittsbalken** bei "Alle Videos generieren" (Video 1/3, 2/3, 3/3 mit Prozentanzeige)
- Option "Nur Standbild / kein Video" pro Teil
- **Export:** `videoscript.md` — fortlaufend nummeriert, nie ueberschrieben
- **Veo 3 Aspect-Ratio-Mapping:** 1:1, 4:5, 2:3 werden automatisch auf 9:16 gemappt

### Phase 7 — Integrierter Video-Editor
- Canvas-Preview + Properties-Panel
- Multi-Track-Timeline: Video/Bild + Text-Overlays + Audio + Logo
- Drag & Drop, Trim, Uebergaenge (Fade, Slide, Zoom)
- Text-Overlay Editor (Font, Groesse, Farbe, Animation)
- Audio: KI-Musik via Suno oder eigene Datei
- Logo-Upload mit Positionierung
- Export via FFmpeg.wasm (clientseitig) oder Server-Fallback

### Phase 8 — Export & Download
- Uebersicht aller fertigen Files (Bilder, Videos, Captions)
- Content-Kalender-Ansicht
- Einzel-Download + ZIP-Download
- "Im Explorer oeffnen" Button
- Zurueck-Button zum Editor

---

## Avatar-System

### Komprimierung (automatisch)
- Avatar-Bilder (oft 19-24 MB) werden automatisch mit `sharp` auf max 1024px / ~200KB komprimiert
- Cache: `avatare/.cache/{name}_ref.png` — wird nur einmal erstellt
- Bei neuen Avataren automatisch beim ersten Laden komprimiert

### KI-Beschreibung (automatisch)
- Claude analysiert das Avatar-Bild einmalig und erstellt eine detaillierte Charakter-Beschreibung
- Beschreibt: Art-Stil, Geschlecht, Alter, Hautton, Haare, Augen, Gesichtsform, Kleidung
- Cache: `avatare/.cache/{name}_desc.txt` — ueberlebt Server-Neustarts
- Diese Beschreibung wird wortwoertlich in jeden Bild-Prompt eingebaut

### Konsistenz-Workflow
```
Avatar-Auswahl → Komprimierung (sharp) → KI-Beschreibung (Claude)
                     ↓                         ↓
              Referenzbild an Modell    Beschreibung in Prompt
                     ↓                         ↓
              Konsistentes Aussehen in allen generierten Bildern
```

---

## Kritische API-Hinweise

### Claude Text-Generierung

```
Endpoint: POST https://api.kie.ai/claude/v1/messages   <-- Anthropic-Format!
Body:     { model, system, messages: [{role:"user", content}], max_tokens, stream:false }
Response: { content: [{ type:"text", text:"..." }] }
```

### Bild-Generierung

**Nano Banana 2 (empfohlen fuer Avatare):**
```
Model:  "nano-banana-2"
Input:  { prompt, aspect_ratio, resolution: "1K", output_format: "png", image_input?: [url] }
```

**Alle Bildmodelle:**
```
Endpoint: POST https://api.kie.ai/api/v1/jobs/createTask
Poll:     GET  https://api.kie.ai/api/v1/jobs/recordInfo?taskId=...
```

### Video-Generierung

**Veo 3 (Standard, empfohlen):**
```
Endpoint: POST https://api.kie.ai/api/v1/veo/generate
Polling:  GET  https://api.kie.ai/api/v1/veo/record-info?taskId=...
Models:   "veo3_fast" (Standard), "veo3" (Quality), "veo3_lite" (Budget)
Input:    { prompt, model, aspect_ratio, imageUrls?: [url], enableTranslation: true }
```
- Dauer: fix ~8s pro Clip (nicht einstellbar)
- `aspect_ratio`: Nur "9:16", "16:9" oder "Auto" erlaubt
- `imageUrls`: Remote-URL (https://...) erforderlich, keine lokalen URLs!
- Polling: `successFlag` 0=processing, 1=complete, 2=failed
- **Wichtig:** resultUrls liegen unter `data.response.resultUrls` (nicht direkt unter `data`)

### ElevenLabs TTS (Voice-Over)

```
Base:     https://api.elevenlabs.io
Header:   xi-api-key: {ELEVENLABS_API_KEY}
Voices:   GET  /v1/voices → { voices: [{ voice_id, name, category, preview_url }] }
TTS:      POST /v1/text-to-speech/{voice_id}?output_format=mp3_44100_128
Body:     { text, model_id: "eleven_multilingual_v2", language_code: "de", voice_settings }
Response: Binary audio (application/octet-stream)
```

### D-ID (Lipsync, vorbereitet)

```
Base:     https://api.d-id.com
Header:   Authorization: Basic {DID_API_KEY}
Clones:   GET  /tts/voices → eigene geklonte Stimmen
Clips:    POST /clips → Lipsync-Video mit Avatar + Stimme
```

**Kling 2.6 (Alternative):**
```
Bild->Video: "kling-2.6/image-to-video" -> { prompt, image_urls:[url], sound:false, duration:"5" }
Text->Video: "kling-2.6/text-to-video"  -> { prompt, aspect_ratio, duration:"5", sound:false }
```

---

## Verzeichnisstruktur

```
KI_Content_Fabrik_Social_Media_Creator/
|-- README.md                          <-- Diese Datei (Gesamtdokumentation)
|-- github_anleitung.md                <-- Git/GitHub Anleitung fuer den Nutzer
|-- AUFGABENBESCHREIBUNG_fuer_ClaudeCode.md  (Original-Spezifikation)
|-- WebApp_starten.bat / WebApp_beenden.bat / start_server.ps1
|-- package.json / tsconfig.json / next.config.js / tailwind.config.ts
|-- .env.local                         (API-Keys, NICHT in git)
|-- avatare/                           (Character-Sheets: Annett_pixar.png, Lisa.png, ...)
|   |-- .cache/                        (komprimierte Bilder + Beschreibungen, auto-generiert)
|       |-- {name}_ref.png             (komprimiertes Referenzbild, ~200KB)
|       |-- {name}_desc.txt            (KI-generierte Charakter-Beschreibung)
|-- bildstile.xlsx                     (30 Bildstile)
|-- social_media_formate.xlsx          (Plattform-Formate)
|-- tmp/projects/{id}/                 (Projektdaten + generierte Assets)
|   |-- project.json                   (Projektdaten)
|   |-- images/                        (generierte Bilder, lokal)
|   |-- videos/                        (generierte Videos)
|   |-- audio/                         (Musik)
|   |-- export/                        (finale Export-Dateien)
|   |-- 01_beitrag_{name}.md           (fortlaufend nummeriert)
|   |-- 01_videoscript_{name}.md       (fortlaufend nummeriert)
|-- src/
    |-- app/
    |   |-- page.tsx                   (Haupt-UI: 8-Phasen-Stepper mit Zurueck-Navigation)
    |   |-- layout.tsx / globals.css
    |   |-- api/
    |       |-- project/               Projekt speichern/laden
    |       |-- strategy/              Claude Content-Strategie
    |       |-- generate-image/        Bildgenerierung mit Avatar-Beschreibung
    |       |-- generate-video/        Videogenerierung (Veo 3 / Kling) mit Remote-URL
    |       |-- generate-hooks/        Virale Hook-Generierung (5 Vorschlaege)
    |       |-- generate-caption/      Claude Captions
    |       |-- generate-music/        Suno Musik
    |       |-- generate-video-script/ Modell-optimierte Video-Scripts
    |       |-- generate-sprechtext/   KI-Sprechtext per Claude (natuerliche Sprache)
    |       |-- generate-voice/        ElevenLabs TTS → MP3 lokal speichern
    |       |-- voices/                Stimmen laden (ElevenLabs + D-ID)
    |       |-- describe-avatar/       KI-Beschreibung des Avatars (mit Datei-Cache)
    |       |-- poll-task/             kie.ai Task-Status Polling (inkl. Veo)
    |       |-- upload-asset/          Asset von kie.ai herunterladen
    |       |-- serve-asset/           Lokale Assets an Browser ausliefern
    |       |-- render/                Server-seitiges FFmpeg Render (Fallback)
    |       |-- download-zip/          ZIP Export
    |       |-- export-md/             Beitrag-Markdown Export (fortlaufend nummeriert)
    |       |-- export-videoscript/    Videoscript-Markdown Export (fortlaufend nummeriert)
    |       |-- open-folder/           Windows Explorer oeffnen
    |       |-- avatare/               Avatar-Liste (mit auto-Komprimierung via sharp)
    |       |-- bildstile/             Bildstil-Liste
    |       |-- formats/               Plattform-Formate
    |-- components/
    |   |-- Stepper.tsx                (klickbar + Zurueck-Navigation)
    |   |-- phases/
    |   |   |-- Phase1_Setup.tsx ... Phase5_Voice.tsx ... Phase7_Export.tsx (alle mit onBack)
    |   |-- editor/
    |   |   |-- Timeline.tsx, Preview.tsx, PropertiesPanel.tsx, ...
    |   |-- ui/
    |       |-- KieTaskProgress.tsx, ImageCard.tsx, ContentCard.tsx, PlatformBadge.tsx
    |-- lib/
    |   |-- kie-ai.ts                  API-Wrapper (createTask, pollTask, createVeoTask, uploadFileBase64)
    |   |-- claude.ts                  Claude via kie.ai (Anthropic-Endpoint)
    |   |-- elevenlabs.ts              ElevenLabs API (getVoices, textToSpeech)
    |   |-- did.ts                     D-ID API (getVoiceClones, getPresenters)
    |   |-- project.ts                 Projekt-Datei-Operationen
    |-- hooks/
    |   |-- useKieTask.ts              React Hook: Task + Polling
    |   |-- useEditor.ts              Editor-Zustand
    |-- types/
        |-- index.ts                   Alle TypeScript-Typen (inkl. imageRemoteUrl, VoiceOption)
```

---

## Arbeitsstand / Aenderungsprotokoll

### Session 6b (2026-04-07) — Aktuelle Session

**Phase 5 "Voice & Sprechtext" (komplett neu):**
- Neue Phase zwischen Captions (4) und Videos (6) eingefuegt
- Workflow erweitert von 7 auf 8 Phasen
- ElevenLabs-Integration: Stimmen laden, Probehoeren, TTS-Generierung (multilingual v2)
- D-ID-Integration vorbereitet: Voice-Klone laden (Lipsync folgt)
- KI-Sprechtext per Claude: natuerliche Sprechsprache, emotional, Hook/CTA-optimiert
- Sprechtext pro Szene editierbar mit Woerter-Zaehler und Dauer-Schaetzung
- Batch-Audio-Generierung mit Fortschrittsbalken
- Voice On/Off Toggle (Phase ueberspringbar)
- Audio lokal gespeichert in `tmp/projects/{id}/audio/`
- Neue Dateien: Phase5_Voice.tsx, elevenlabs.ts, did.ts, 3 API-Routen
- Stepper.tsx und page.tsx auf 8 Phasen umnummeriert
- ContentItem erweitert: sprechtext, voiceId, voiceProvider, voiceUrl, voiceLocalPath, voiceDuration
- Neues Interface: VoiceOption (id, name, provider, previewUrl, language, category)

**Status:** Implementiert, noch nicht live getestet. API-Keys eingetragen. Naechster Schritt: Durchlauf testen.

### Session 6 (2026-04-07)

**GitHub-Integration:**
- Eigenes Repository erstellt: https://github.com/LogiQore/KI-Content-Fabrik-Social-Media-Creator
- GitHub CLI (gh) authentifiziert und konfiguriert
- `github_anleitung.md` erstellt (Git-Grundlagen, Workflow, Vorgaengerversionen zurueckholen)

**Avatar-Konsistenz (komplett neues System):**
- `sharp` als Dependency hinzugefuegt fuer Bild-Komprimierung
- Avatar-Bilder werden automatisch auf max 1024px / ~200KB komprimiert (`avatare/.cache/`)
- Neuer API-Endpunkt `/api/describe-avatar`: Claude beschreibt den Avatar einmalig (Datei-Cache)
- Avatar-Beschreibung wird wortwoertlich in jeden Bild-Prompt eingebaut
- Konsistenter Charakter ueber alle generierten Bilder hinweg

**Fortlaufend nummerierte Exports (nie ueberschreiben):**
- `beitrag_erstellt.md` → `01_beitrag_{name}.md`, `02_beitrag_{name}.md`, ...
- Neuer Endpunkt `/api/export-videoscript` + Button "videoscript.md" in Phase 5
- `videoscript.md` → `01_videoscript_{name}.md`, `02_videoscript_{name}.md`, ...

**Zurueck-Navigation in allen Phasen:**
- Jede Phase (2-7) hat einen "Zurueck"-Button links unten
- Stepper oben bleibt ebenfalls klickbar fuer abgeschlossene Schritte

**Video-Script-Generierung (komplett ueberarbeitet):**
- Modell-spezifische Prompt-Guides (Veo 3, Kling 2.6/3.0) mit Staerken und Limitierungen
- Szenenbild-Kontext (imagePrompt) fliesst in Script-Generierung ein
- Caption/Kernaussage wird beruecksichtigt fuer emotional passende Handlung
- Avatar-Name wird als Hauptdarsteller referenziert
- Dauer-bewusste Scripts (optimiert auf 5s/8s/10s)
- Image-to-Video vs Text-to-Video Unterscheidung im Prompt

**Video-Generierung (Bugfixes):**
- Veo 3 Aspect-Ratio Fix: Nur 9:16, 16:9, Auto erlaubt — automatisches Mapping
- Remote-URL Fix: Bilder werden als `imageRemoteUrl` (kie.ai URL) gespeichert statt lokaler URLs
- Veo Polling Fix: `data.response.resultUrls` wird korrekt ausgelesen (vorher fehlerhaft)
- Videos werden jetzt erfolgreich generiert und heruntergeladen

**Batch-Video-Generierung mit Fortschritt:**
- "Alle Videos generieren" zeigt Fortschrittsbalken (Video 1/3, 2/3, 3/3)
- 2,5 Sekunden Pause zwischen jedem Video-Start
- Button deaktiviert waehrend Batch laeuft
- Abschluss-Meldung nach Fertigstellung

**UI-Verbesserungen:**
- "Nur Bild" umbenannt zu "Nur Standbild / kein Video" fuer Klarheit

### Session 5 (2026-04-06)

**Bildgenerierung:**
- Nano Banana 2 als Standard-Bildmodell (echte Charakterkonsistenz via `image_input`)
- Explizite Anweisung: KEIN Text in generierten Bildern

**Content-Strategie (Phase 2):**
- 2-Schritt-Flow: erst Hook waehlen, dann Strategie generieren
- 5 virale Hook-Vorschlaege per KI
- Story-Modus: fortlaufende Geschichte in X Teilen

**Video-Erstellung (Phase 5):**
- Veo 3 als Standard-Videomodell integriert
- Script-Editor: 2 Felder (Handlung + Kamera)

### Offene Punkte / Naechste Schritte
- **Phase 5 Voice testen:** Stimmen laden, Sprechtext generieren, Audio erstellen (erster Live-Test)
- **D-ID Lipsync:** Sprechendes Avatar-Video mit D-ID Clips API (vorbereitet, noch nicht implementiert)
- **Voice in Video integrieren:** Audio aus Phase 5 automatisch in Phase 6 (Videos) einbinden
- Editor (Phase 7): Videos + Voice zu einem Gesamtvideo zusammenfuegen
- Ggf. Veo 3 Extend-Video Feature nutzen fuer laengere Clips
- Upload-Endpunkt bei kie.ai hat sich geaendert — `uploadFileBase64` ggf. aktualisieren

### Testplan fuer naechste Session
1. App starten (`npm run dev` oder `WebApp_starten.bat`)
2. Projekt erstellen → Strategie → Bilder → Texte durchlaufen
3. **Phase 5 (Voice):** Stimmen-Dropdown pruefen, Stimme auswaehlen, probehoeren
4. **KI-Sprechtext:** "Alle Sprechtexte per KI" klicken, Texte pruefen/editieren
5. **Audio generieren:** "Alle Audios generieren" klicken, Fortschritt pruefen
6. **Abspielen:** Generierte Audios pro Szene anhoeren
7. **Weiter:** "Weiter → Videos" klicken und pruefen ob Voice-Daten ankommen

---

*Version: 5.0 — 2026-04-07 (Session 6b)*
