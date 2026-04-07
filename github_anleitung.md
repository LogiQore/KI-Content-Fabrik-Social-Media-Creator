# GitHub & Git Anleitung fuer KI Content Fabrik

## Dein Repository

- **GitHub:** https://github.com/LogiQore/KI-Content-Fabrik-Social-Media-Creator
- **Lokaler Ordner:** `E:\1_CLAUDE_Web_apps\KI_Content_Fabrik_Social_Media_Creator`

---

## 1. Grundbegriffe

| Begriff | Bedeutung |
|---------|-----------|
| **Repository (Repo)** | Dein Projekt-Ordner mit kompletter Versionshistorie |
| **Commit** | Ein Snapshot deines Projekts zu einem bestimmten Zeitpunkt (wie ein Speicherstand) |
| **Push** | Lokale Commits auf GitHub hochladen |
| **Pull** | Aenderungen von GitHub herunterladen |
| **Stage (git add)** | Dateien fuer den naechsten Commit vormerken |
| **Branch** | Ein paralleler Entwicklungszweig (Standard: `main`) |
| **Remote (origin)** | Die Verbindung zu deinem GitHub-Repository |

---

## 2. Der taegliche Arbeitsablauf

### Status pruefen: Was hat sich geaendert?

```bash
git status
```

Zeigt dir:
- Welche Dateien geaendert wurden (rot = nicht gestaged)
- Welche Dateien bereit zum Commit sind (gruen = gestaged)
- Welche Dateien neu und ungetrackt sind

### Aenderungen ansehen

```bash
# Alle Aenderungen im Detail anzeigen
git diff

# Aenderungen einer bestimmten Datei
git diff src/app/page.tsx
```

---

## 3. Aenderungen speichern (Commit)

### Schritt 1: Dateien vormerken (stagen)

```bash
# Bestimmte Dateien stagen
git add src/app/page.tsx
git add src/components/Stepper.tsx

# Alle geaenderten Dateien stagen
git add -A
```

### Schritt 2: Commit erstellen

```bash
# Commit mit Nachricht
git commit -m "Stepper-Komponente: Farben angepasst und Fehler behoben"
```

**Gute Commit-Nachrichten:**
- Kurz und beschreibend (was wurde gemacht und warum)
- Beispiele:
  - `"Phase3: Bildgenerierung mit kie.ai integriert"`
  - `"Bug behoben: Avatar-Upload funktioniert jetzt"`
  - `"Layout: Mobile Ansicht fuer Captions verbessert"`

---

## 4. Wann sollte ich pushen?

### Push nach GitHub

```bash
git push
```

**Pushe in diesen Situationen:**

| Situation | Warum pushen? |
|-----------|---------------|
| Feature fertig | Sichert deine Arbeit auf GitHub |
| Ende des Arbeitstages | Backup falls dem PC etwas passiert |
| Vor groesseren Umbauten | Sicherheitsnetz bevor du viel aenderst |
| Nach einem wichtigen Bugfix | Damit der Fix nicht verloren geht |
| Wenn Claude Code Aenderungen gemacht hat | Sichert die KI-generierten Aenderungen |

**Nicht pushen wenn:**
- Etwas offensichtlich kaputt ist (erst fixen, dann pushen)
- Du gerade mitten in einer Aenderung steckst

### Komplett-Workflow: Aendern, Committen, Pushen

```bash
# 1. Status pruefen
git status

# 2. Alle Aenderungen stagen
git add -A

# 3. Commit erstellen
git commit -m "Beschreibung der Aenderung"

# 4. Auf GitHub hochladen
git push
```

---

## 5. Aenderungen von GitHub holen (Pull)

```bash
git pull
```

**Wann pullen?**
- Wenn du von einem anderen Rechner aus Aenderungen gepusht hast
- Wenn jemand anderes Aenderungen gemacht hat
- Vor dem Starten neuer Arbeit (sicherheitshalber)

---

## 6. Vorgaengerversionen zurueckholen

### 6a. Einzelne Datei auf den letzten Commit zuruecksetzen

Du hast eine Datei kaputt gemacht und willst den letzten gespeicherten Stand:

```bash
# Eine einzelne Datei zuruecksetzen
git checkout -- src/app/page.tsx
```

### 6b. Alle lokalen Aenderungen verwerfen (zurueck zum letzten Commit)

```bash
# ACHTUNG: Alle nicht-committeten Aenderungen gehen verloren!
git checkout -- .
```

### 6c. Versionshistorie ansehen

```bash
# Letzte Commits anzeigen
git log --oneline

# Ausfuehrlicher mit Datum
git log --oneline --graph --decorate -20
```

Ausgabe sieht so aus:
```
a1b2c3d  Stepper: Farben angepasst
e4f5g6h  Phase3: Bildgenerierung integriert
i7j8k9l  Initial commit
```

### 6d. Eine bestimmte alte Version einer Datei zurueckholen

```bash
# Commit-Hash aus git log kopieren, dann:
git checkout a1b2c3d -- src/app/page.tsx
```

Das holt NUR diese eine Datei aus dem alten Commit. Der Rest bleibt wie er ist.

### 6e. Komplett zu einem alten Commit zurueckkehren

```bash
# Variante 1: Neuen Commit erstellen der den alten Zustand wiederherstellt (SICHER)
git revert HEAD

# Variante 2: Zu einem bestimmten Commit zurueckkehren (SICHER, erstellt Rueckgaengig-Commit)
git revert a1b2c3d
```

`git revert` ist sicher, weil es einen neuen Commit erstellt, der die Aenderungen rueckgaengig macht. Die Historie bleibt erhalten.

### 6f. Letzten Commit komplett rueckgaengig machen (noch nicht gepusht)

```bash
# Commit rueckgaengig, Dateien bleiben geaendert (zum Nachbessern)
git reset --soft HEAD~1

# Commit UND Aenderungen rueckgaengig (alles weg)
git reset --hard HEAD~1
```

> **WICHTIG:** `git reset --hard` nur verwenden wenn du die Aenderungen wirklich nicht mehr brauchst!

---

## 7. Notfall-Szenarien

### "Ich habe alles kaputt gemacht, ich will den GitHub-Stand"

```bash
# Holt den kompletten Stand von GitHub und ueberschreibt lokal
git fetch origin
git reset --hard origin/main
```

> ACHTUNG: Alle lokalen Aenderungen die nicht gepusht wurden gehen verloren!

### "Ich will sehen was in einem alten Commit drin war"

```bash
# Nur anschauen ohne etwas zu aendern
git show a1b2c3d

# Alle Dateien eines Commits auflisten
git show --stat a1b2c3d
```

### "Ich will die letzte funktionierende Version von GitHub herunterladen"

```bash
git pull
```

Falls das nicht klappt weil du lokale Aenderungen hast:

```bash
# Lokale Aenderungen zwischenspeichern
git stash

# GitHub-Version holen
git pull

# Zwischengespeicherte Aenderungen wieder anwenden (optional)
git stash pop
```

---

## 8. Nuetzliche Befehle auf einen Blick

| Was? | Befehl |
|------|--------|
| Status pruefen | `git status` |
| Aenderungen ansehen | `git diff` |
| Alles stagen | `git add -A` |
| Commit erstellen | `git commit -m "Nachricht"` |
| Auf GitHub pushen | `git push` |
| Von GitHub holen | `git pull` |
| Historie ansehen | `git log --oneline -20` |
| Datei zuruecksetzen | `git checkout -- datei.tsx` |
| Letzten Commit rueckgaengig | `git revert HEAD` |
| GitHub-Stand erzwingen | `git fetch origin && git reset --hard origin/main` |
| Aenderungen zwischenspeichern | `git stash` / `git stash pop` |

---

## 9. Tipps

1. **Committe oft, pushe regelmaessig** - Lieber viele kleine Commits als ein riesiger
2. **Schreibe klare Commit-Nachrichten** - Dein zukuenftiges Ich wird es dir danken
3. **Pushe vor Feierabend** - Dein Code ist dann sicher auf GitHub
4. **Vor grossen Aenderungen: Status pruefen** - `git status` ist dein bester Freund
5. **Im Zweifel: Nicht `--hard` verwenden** - Lieber erstmal `git stash` nutzen
6. **Claude Code kann das fuer dich tun** - Sag einfach "committe und pushe meine Aenderungen"
