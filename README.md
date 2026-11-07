# Virtuelles Praktikum: Redoxreaktionen mit Kaliumpermanganat (Kursstufe Leistungsfach)

> **Interaktives Selbstlernportal für die Kursstufe (Leistungsfach Chemie, Schule Birklehof)**  
> Didaktische Ausarbeitung zur Wiederholung von Redoxreaktionen, Donator-Akzeptor-Prinzip, Oxidationszahlen und Milieuabhängigkeit (Bildungsplan Baden-Württemberg 2016 / 2022, 3.4.7 Elektrochemie).

---

## 🎯 Zweck & Einsatzszenario

Dieses interaktive HTML5-Portal ermöglicht Schülerinnen und Schülern das vollständige **Selbststudium der Versuchsreihe**, falls sie am Präsenz-Praktikum nicht teilnehmen konnten (z. B. wegen Krankheit, Beurlaubung oder zur Klausurvorbereitung).

### Didaktische Kernfunktionen:
1. **Interaktive Visualisierung aller Teilversuche:**
   - **Teil A (Petrischale):** A1 (Oxidation primärer vs. sekundärer Alkohole mit KOH) & A2 („Gummibärchen-Chamäleon“ mit NaOH).
   - **Teil B (pH-Abhängigkeit):** Reagenzgläser 1–4 mit Natriumsulfit bei variierendem pH (neutral, stark alkalisch, sauer) inklusive **Thymolphthalein-Zugabe** in RG 3.
   - **Teil C (Saure Reaktionen):** Reagenzgläser 1–5 mit Fe²⁺, I⁻ (+ Heptan-Ausschüttelung), H₂O₂ (+ Glimmspanprobe), Propan-1-ol (+ Geruchsprobe) und Methansäure (+ Kalkwasser-Trübung).
   - Die Beobachtungsschritte laufen zeitlich realistisch ab und tragen das Beobachtungsergebnis nach Abschluss automatisch in die Protokolltabellen ein.
2. **Formative Tabellen-Auswertung mit Dropdowns & Direktfeedback:**
   - Insgesamt 44 interaktive Dropdown-Entscheidungen (Spezies, Oxidationszahlen, Reaktionsprodukte, Rollen als Oxidations-/Reduktionsmittel).
   - Farbliches Sofortfeedback (grün/rot) mit fachlicher Begründung; nach dem 2. Fehlversuch wird die Mustererklärung eingeblendet.
   - Fortschrittsanzeige in der Kopfzeile (`X / 44 richtig`).
3. **Aufgaben zur Auswertung mit aufklappbaren Musterlösungen:**
   - Aufgaben 1 bis 5 (alle 9 Redox-Teilreaktionen, Thymolphthalein-Deutung, Nernst-Gleichung mit Didaktik-Hinweis, Stöchiometrie).
   - Integrierte Textfelder für eigene Schüler-Notizen (werden wie die Auswahlen automatisch im `localStorage` gesichert).
   - HTML `<details>`-Akkordeons für jede Teilaufgabe zur gezielten Selbstkontrolle.

---

## 📂 Dateien & Struktur

* `index.html`: Semantisches HTML5-Gerüst mit barrierefreien Regionen und Sticky-Header.
* `style.css`: Modernes Birklehof-Design, SVG-Animationsstile, `@container`-Responsive-Tables und Dark/Light-Harmonisierung.
* `app.js`: Reines Vanilla-ES-Modul ohne externe Bibliotheken; steuert SVG-Visualisierungen, Tabellen-Validierung und State-Persistenz.
* `assets/`: Enthält das offizielle MINT-Logo und das Birklehof-Schulwappen.

---

## 🚀 Lokale Nutzung

Die Datei `index.html` kann direkt in jedem modernen Webbrowser (Chrome, Safari, Firefox, Edge) geöffnet werden:

```bash
open "KS_Leistungsfach/E-Chemie/Lernportal_Redox_KMnO4/index.html"
```
