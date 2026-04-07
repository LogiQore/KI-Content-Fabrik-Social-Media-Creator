# KI Content Fabrik — Social Media Creator

> Lokale Next.js Web-App zur KI-gestuetzten Erstellung von Social-Media-Content
> Arbeitsverzeichnis: `E:\1_CLAUDE_Web_apps\KI_Content_Fabrik_Social_Media_Creator`
> Erstellt: 2026-04-06 | Letzte Aktualisierung: 2026-04-06 (Session 5)

---

## Projektbeschreibung

Der Nutzer gibt ein Thema / Projekt ein (z.B. "Oster-Kampagne fuer PfotenKraeuter") und die App
fuehrt ihn Schritt fuer Schritt durch den gesamten Content-Erstellungsprozess — von der Idee bis zum
fertigen, exportierbaren Bild/Video-Content fuer alle gaengigen Social-Media-Plattformen.

### Features

- 7-Phasen-Workflow: Projekt -> Strategie -> Bilder -> Captions -> Videos -> Editor -> Export
- KI-Bildgenerierung via kie.ai (Nano Banana 2, Seedream 4.5, Flux 2 Pro, Ideogram V3)
- KI-Videogenerierung via kie.ai (Veo 3 / Veo 3 Fast / Veo 3 Lite, Kling 2.6/3.0)
- KI-Text via Claude Sonnet 4.6 ueber kie.ai (Anthropic-nativer Endpoint)
- Virale Hook-Generierung (5 Vorschlaege per KI, auswaehlbar)
- Story-Modus: zusammenhaengende Story in X Teilen statt einzelner Ideen
- Bildstil-Auswahl (30 Stile aus bildstile.xlsx)
- Avatar / Character-Sheet Unterstuetzung (Ordner: avatare/)
- Voice-Over Charakter Option
- Integrierter Video-Editor: Canvas-Preview + Multi-Track-Timeline
- Export: Einzel-Download + ZIP + Windows Explorer + beitrag_erstellt.md
- Ausgabeformate aus social_media_formate.xlsx

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
| Video-Editor | Browser-native Canvas + FFmpeg.wasm |
| Dateispeicherung | Lokal (`./tmp/`) |
| Konfiguration | `.env.local` |
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

## 7-Phasen-Workflow

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
- Avatar-Referenzbild wird automatisch an das Modell uebergeben
- Nano Banana 2: `image_input` Array fuer echte Charakterkonsistenz
- Bilder werden ohne Text generiert (keine Beschriftungen, Titel etc.)
- Galerie mit Regenerieren/Prompt-bearbeiten

### Phase 4 — Caption & Hashtag Generierung
- Claude generiert Caption + CTA + Hashtag-Set pro Beitrag (Deutsch)
- Editierbar, Zeichen-Zaehler, Neu-generieren-Button

### Phase 5 — Video-Erstellung
- **Standard-Modell: Veo 3 Fast** (voreingestellt), alternativ Veo 3 Quality, Kling 2.6/3.0
- Modell + Dauer pro Teil separat einstellbar (Veo 3: fix 8s, Kling: 5s/10s)
- 2 editierbare Script-Felder pro Teil:
  - **Handlung & Bewegung** — Was passiert, Charakter-Aktionen
  - **Kamera & Perspektive** — Kamerawinkel, Bewegung, Uebergaenge
- KI-Script-Generierung per Button oder manuell schreiben
- Globale Buttons: "Alle Scripts generieren" + "Alle Videos generieren"
- Option "Nur Bild" (kein Video) weiterhin verfuegbar

### Phase 6 — Integrierter Video-Editor
- Canvas-Preview + Properties-Panel
- Multi-Track-Timeline: Video/Bild + Text-Overlays + Audio + Logo
- Drag & Drop, Trim, Uebergaenge (Fade, Slide, Zoom)
- Text-Overlay Editor (Font, Groesse, Farbe, Animation)
- Audio: KI-Musik via Suno oder eigene Datei
- Logo-Upload mit Positionierung
- Export via FFmpeg.wasm (clientseitig) oder Server-Fallback

### Phase 7 — Export & Download
- Uebersicht aller fertigen Files (Bilder, Videos, Captions)
- Content-Kalender-Ansicht
- Einzel-Download + ZIP-Download
- "Im Explorer oeffnen" Button
- beitrag_erstellt.md pro Beitrag

---

## Kritische API-Hinweise

### Claude Text-Generierung

```
Endpoint: POST https://api.kie.ai/claude/v1/messages   <-- Anthropic-Format!
Body:     { model, system, messages: [{role:"user", content}], max_tokens, stream:false }
Response: { content: [{ type:"text", text:"..." }] }
```

| Richtig | Falsch (nicht verwenden) |
|---------|--------------------------|
| `POST /claude/v1/messages` | `/api/v1/chat/completions` -> "Operation not found" |

### Bild-Generierung

**Nano Banana 2 (empfohlen fuer Avatare):**
```
Model:  "nano-banana-2"
Input:  { prompt, aspect_ratio, resolution: "1K", output_format: "png", image_input?: [url] }
```
- `image_input`: Array von Referenzbild-URLs (bis zu 14) fuer Charakterkonsistenz
- Avatar wird als Base64 hochgeladen -> URL -> image_input

**Seedream 4.5:**
```
Model:  "seedream/4.5-text-to-image"
Input:  { prompt, aspect_ratio, quality: "basic", reference_image_url? }
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
- `imageUrls`: 1 Bild (Bild->Video) oder 2 Bilder (Start+End-Frame)
- Eigenes Polling: `successFlag` 0=processing, 1=complete, 2=failed
- Poll-Route: `/api/poll-task?taskId=...&veo=1`

**Kling 2.6 (Alternative):**
```
Bild->Video: "kling-2.6/image-to-video" -> { prompt, image_urls:[url], sound:false, duration:"5" }
Text->Video: "kling-2.6/text-to-video"  -> { prompt, aspect_ratio, duration:"5", sound:false }
```

| Detail | Richtig | Falsch |
|--------|---------|--------|
| Modell | `kling-2.6/image-to-video` | `kling/image-to-video` |
| Bild-Input | `image_urls: [url]` (Array) | `image_url: url` |
| Dauer | `duration: "5"` (String) | `duration: 5` (Zahl) |
| Sound | `sound: false` (PFLICHT!) | sound weglassen |

### Asset-Pipeline

```
kie.ai URL -> POST /api/upload-asset -> lokal in tmp/projects/{id}/
Browser    -> GET /api/serve-asset?path=...
```

### JSON-Parser (lib/claude.ts)

3-stufiger robuster Parser: direkt -> extractAndFixJSON (Single-Quotes, Fences) -> Kontrollzeichen-Strip

---

## Bildgenerierung — Modelle im Vergleich

| Modell | Modell-String | Avatar-Support | Besonderheiten |
|--------|---------------|----------------|----------------|
| Nano Banana 2 | `nano-banana-2` | `image_input` (bis 14 Bilder) | Charakterkonsistenz, 4K, Text-Rendering |
| Seedream 4.5 | `seedream/4.5-text-to-image` | `reference_image_url` (schwach) | Schnell, guenstig |
| Seedream 3.0 | `bytedance/seedream` | — | Nutzt `image_size` statt `aspect_ratio` |
| Ideogram V3 | `ideogram/v3-text-to-image` | — | Gutes Text-Rendering |
| Flux 2 Pro | `flux-2/pro-text-to-image` | — | Hohe Qualitaet |

**Empfehlung:** Nano Banana 2 fuer Projekte mit Avatar/Charakter. Seedream 4.5 fuer schnelle Generierung ohne Avatar.

---

## Verzeichnisstruktur

```
KI_Content_Fabrik_Social_Media_Creator/
|-- README.md                          <-- Diese Datei (Gesamtdokumentation)
|-- AUFGABENBESCHREIBUNG_fuer_ClaudeCode.md  (Original-Spezifikation)
|-- WebApp_starten.bat / WebApp_beenden.bat / start_server.ps1
|-- package.json / tsconfig.json / next.config.js / tailwind.config.ts
|-- .env.local                         (API-Keys, NICHT in git)
|-- avatare/                           (Character-Sheets: Wauzi.png, Lisa.png, ...)
|-- bildstile.xlsx                     (30 Bildstile)
|-- social_media_formate.xlsx          (Plattform-Formate)
|-- tmp/projects/{id}/                 (Projektdaten + generierte Assets)
|   |-- project.json                   (Projektdaten)
|   |-- images/                        (generierte Bilder, lokal)
|   |-- videos/                        (generierte Videos)
|   |-- audio/                         (Musik)
|   |-- export/                        (finale Export-Dateien)
|-- src/
    |-- app/
    |   |-- page.tsx                   (Haupt-UI: 7-Phasen-Stepper)
    |   |-- layout.tsx / globals.css
    |   |-- api/
    |       |-- project/               Projekt speichern/laden
    |       |-- strategy/              Claude Content-Strategie
    |       |-- generate-image/        Bildgenerierung (Nano Banana 2 / Seedream / etc.)
    |       |-- generate-video/        Videogenerierung (Veo 3 / Kling)
    |       |-- generate-hooks/        Virale Hook-Generierung (5 Vorschlaege)
    |       |-- generate-caption/      Claude Captions
    |       |-- generate-music/        Suno Musik
    |       |-- generate-video-script/ Video-Script Generierung
    |       |-- poll-task/             kie.ai Task-Status Polling
    |       |-- upload-asset/          Asset von kie.ai herunterladen
    |       |-- serve-asset/           Lokale Assets an Browser ausliefern
    |       |-- render/                Server-seitiges FFmpeg Render (Fallback)
    |       |-- download-zip/          ZIP Export
    |       |-- export-md/             Beitrag-Markdown Export
    |       |-- open-folder/           Windows Explorer oeffnen
    |       |-- avatare/               Avatar-Liste
    |       |-- bildstile/             Bildstil-Liste
    |       |-- formats/               Plattform-Formate
    |-- components/
    |   |-- Stepper.tsx
    |   |-- phases/
    |   |   |-- Phase1_Setup.tsx ... Phase7_Export.tsx
    |   |-- editor/
    |   |   |-- Timeline.tsx, Preview.tsx, PropertiesPanel.tsx, ...
    |   |-- ui/
    |       |-- KieTaskProgress.tsx, ImageCard.tsx, ContentCard.tsx, PlatformBadge.tsx
    |-- lib/
    |   |-- kie-ai.ts                  API-Wrapper (createTask, pollTask, createVeoTask, uploadFileBase64)
    |   |-- claude.ts                  Claude via kie.ai (Anthropic-Endpoint)
    |   |-- project.ts                 Projekt-Datei-Operationen
    |-- hooks/
    |   |-- useKieTask.ts              React Hook: Task + Polling
    |   |-- useEditor.ts              Editor-Zustand
    |-- types/
        |-- index.ts                   Alle TypeScript-Typen
```

---

## UI-Design / Farbschema

```css
background:   #0f0f1a   (sehr dunkel)
surface:      #1a1a2e   (dunkel blau-lila)
accent:       #7c3aed   (Lila — Haupt-Akzent)
accent-light: #a855f7
text:         #f1f5f9   (fast weiss)
text-muted:   #94a3b8   (grau)
success:      #10b981   (gruen)
error:        #ef4444   (rot)
border:       #2d2d44
```

Layout: App-Header (lila), Credits oben rechts, 7-Phasen-Stepper als Pills,
Phase 6 (Editor) im Vollbild-Modus.

---

## Wichtige Implementierungs-Hinweise

1. **Kein `!` im Pfad** — Webpack reserviert `!`. Pfad `E:\1_CLAUDE_Web_apps\...` ist korrekt.
2. **kie.ai ist async** — IMMER pollen bis `state === "success"`. Timeout: 10 Minuten.
3. **Asset-Download:** Generierte URLs von kie.ai verfallen nach 14 Tagen -> immer lokal speichern.
4. **FFmpeg.wasm** braucht CORP/COOP Headers (in next.config.js konfiguriert).
5. **Rate Limiting** — Max 20 Requests / 10 Sekunden bei kie.ai.
6. **Projekte persistent** — Jedes Projekt = Ordner `./tmp/projects/{projectId}/` mit `project.json`.
7. **pip ist defekt auf diesem System** — Keine Python-Dependencies! Alles in Node.js/TypeScript.
8. **Bilder ohne Text** — Bildprompts enthalten explizite Anweisung: kein Text im Bild.
9. **Avatar-Workflow:** Avatar-Bild -> Base64-Upload -> URL -> als `image_input` (Nano Banana 2) oder `reference_image_url` (Seedream) ans Modell.
10. **Plattform-Formate** aus `social_media_formate.xlsx` — Fallback auf 7 eingebaute Plattformen bei Lese-Fehler.

---

## next.config.js — Pflicht-Headers fuer FFmpeg.wasm

```javascript
const nextConfig = {
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      ],
    }];
  },
};
module.exports = nextConfig;
```

---

## Videogenerierung — Modelle im Vergleich

| Modell | Modell-String | Modus | Dauer | Kosten/Clip |
|--------|---------------|-------|-------|-------------|
| Veo 3 Fast | `veo3_fast` | Bild->Video | 8s fix | ~60 Credits |
| Veo 3 Quality | `veo3` | Bild->Video | 8s fix | ~400 Credits |
| Veo 3 Lite | `veo3_lite` | Bild->Video | 8s fix | guenstig |
| Kling 2.6 | `kling-2.6/image-to-video` | Bild->Video | 5s/10s | mittel |
| Kling 2.6 | `kling-2.6/text-to-video` | Text->Video | 5s/10s | mittel |
| Kling 3.0 | `kling-3.0/image-to-video` | Bild->Video | 5s/10s | mittel |

**Empfehlung:** Veo 3 Fast als Standard fuer beste Qualitaet bei akzeptablen Kosten.

---

## Arbeitsstand / Aenderungsprotokoll

### Session 5 (2026-04-06) — Aktuelle Session

**Bildgenerierung:**
- Nano Banana 2 als Standard-Bildmodell hinzugefuegt (echte Charakterkonsistenz via `image_input`)
- Avatar-Referenzbild wird korrekt an Nano Banana 2 uebergeben
- Explizite Anweisung: KEIN Text in generierten Bildern

**Content-Strategie (Phase 2) — komplett erweitert:**
- Neuer 2-Schritt-Flow: erst Hook waehlen, dann Strategie generieren
- 5 virale Hook-Vorschlaege per KI (oder eigenen Hook schreiben)
- Neues Modus-Dropdown (erweiterbar): "Einzelne Ideen" oder "Zusammenhaengende Story"
- Story-Modus: fortlaufende Geschichte in X Teilen mit rotem Faden
- Neue API-Route: `/api/generate-hooks`

**Video-Erstellung (Phase 5) — komplett ueberarbeitet:**
- Veo 3 als Standard-Videomodell integriert (eigener kie.ai Endpoint)
- Modell + Dauer pro Teil separat einstellbar
- Script-Editor von 4 auf 2 Felder reduziert (Handlung + Kamera)
- Globale Buttons: "Alle Scripts generieren" + "Alle Videos generieren"
- Veo3-Polling ueber eigenen Endpoint mit `?veo=1` Parameter

**Dokumentation:**
- README_First.md und READMEFIRST_datei.md in README.md konsolidiert (geloescht)

### Offene Punkte / Naechste Schritte
- Veo 3 im Live-Test pruefen (API-Aufruf + Polling verifizieren)
- Story-Modus testen (Hook -> Story -> Bilder -> Videos Gesamtflow)
- Editor (Phase 6): Videos zu einem Gesamtvideo zusammenfuegen
- Ggf. Veo 3 Extend-Video Feature nutzen fuer laengere Clips

---

*Version: 3.0 — 2026-04-06 (Session 5)*
