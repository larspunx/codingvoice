# Changelog

All notable changes to Coding Voice are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0]

First public release.

### Added

- Numbers are spoken in the sentence's language. ElevenLabs reads with one (English-origin) voice
  and lets the model guess pronunciation token by token, so bare digits came out with an English
  accent inside Polish text. Numbers are now turned into words in the detected language before
  synthesis — `3` → `trzy`, `2026` → `dwa tysiące dwadzieścia sześć`, `75%` → `siedemdziesiąt pięć
  procent`, versions like `1.0.0` read digit-group by digit-group. Identifiers (`mp3`, `utf8`,
  `v2`, `v1.2.3`), permission/code-like leading-zero numbers and very long digit runs are left as
  digits. Space-grouped thousands (`1 234 567`) are read as one number.
- Diacritic-free Polish is detected more reliably: auto-detect now also recognises Polish from
  letter clusters (`rz`, `cz`, `sz`, `dz`) and endings (`-ono`, `-ano`, `-uje`), so short status
  lines like `Naprawiono 42 bledy.` are read in Polish instead of English. English default is
  unchanged — undetermined fragments still fall back to English.
- The detected (or chosen) language is now sent to ElevenLabs as `language_code` on the
  `eleven_turbo_v2_5` model, so short number-only fragments are no longer voiced in a random
  language — with Polish selected, numbers are always read in Polish.

### Changed

- Final marketplace icon and banner; all earlier prototype artwork removed.

### Security

- The state directory (`~/.cursor/coding-voice`) is now created owner-only (`0700`) and its
  permissions are repaired on start, so the on-disk API key copy and buffered answer text can't be
  read by other accounts on a shared machine.
- Removed the temporary activation/queue diagnostics that were only there to trace the multi-window
  race.

## [0.11.6]

### Added

- Voice test at the top of Settings: a short spoken intro that explains what the extension does and
  lets you hear your current voice on one click. It runs through the same pipeline as answer reading,
  so engine, narrator, language, speed and volume changes apply to it immediately.

## [0.11.5]

### Fixed

- Speed slider icons no longer look clipped: the gauge was drawn as a near-full circle with a notch;
  it's now a clean half-dial with a needle, well inside its frame.

## [0.11.4]

### Fixed

- Each open window now reads only answers from its own project. The queue is shared across all
  Cursor windows, so with several windows open a turn used to be spoken by whichever window grabbed
  it first — which, if that window had a different engine or profile, meant the same answer came out
  in ElevenLabs one time and the system voice the next. Turns are now tagged with their workspace and
  claimed only by a window that has that project open.

## [0.11.1]

### Added

- Extension icon and listing metadata (`repository`, `bugs`, `homepage`) for the marketplace.

### Changed

- README now matches the shipped feature set (single-engine choice, per-sentence language,
  Claude Code hook disclosure).

### Removed

- Dead "license key" command and its secret storage — it gated nothing and only looked unfinished.

## [0.11.0]

### Added

- Per-sentence language detection on auto-detect: a mixed English/Polish answer now switches voice
  as it reads, instead of picking one language for the whole answer.

## [0.10.2]

### Changed

- Replaced the emoji glyphs in the settings window with flat, monochrome icons that follow the theme.

## [0.10.1]

### Removed

- OpenAI TTS from the engine list — it was never implemented and silently fell back to the system
  voice. The choices are now System and ElevenLabs.

## [0.10.0]

### Added

- A single settings window (opened from the gear) with every option in one place, including a
  draggable volume slider and the ElevenLabs voice-tuning controls (stability, similarity, style,
  speaker boost).
- ElevenLabs engine with your own API key, audio caching so volume tweaks don't re-bill, and
  guidance for free-tier voices.
- Author footer with a Spotify link and a Ko-fi tip jar.

### Changed

- The play button replays the last answer from the start once reading has finished, and survives a
  window reload.
- The play/pause button turns amber while an answer is actually being spoken.

## [Earlier]

- Reads each finished agent answer aloud via a Cursor hook.
- Status-bar controls: power, play/pause, volume level, settings.
- Markdown cleaning for speech (drops code blocks and tables, shortens paths).
- Read scope: whole answer, key points, or just the ending.
- System voice on macOS, Windows and Linux — free and offline.
- API keys stored in the OS keychain, never in `settings.json`.
