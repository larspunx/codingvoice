# Changelog

All notable changes to Coding Voice are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-08-06

First public release.

### Added

- Reads every finished agent answer aloud via Cursor hooks — no button to press.
- Status bar controls: enable/disable, play/pause/replay, volume level, settings gear.
- Markdown cleaning for speech: drops code blocks and tables, shortens paths, skips emoji.
- Read scope: whole answer (`full`), key points only (`essentials`), or closing summary (`ending`).
- English and Polish — auto-detected per sentence, or pinned in settings.
- Numbers spoken as words in the chosen language (`3` → *trzy* / *three*, `1 234 567`, `75%`, version strings like `2.0.0`); identifiers like `v1.2.3`, `mp3`, `utf8` left untouched.
- Free offline system voice on macOS, Windows, and Linux.
- ElevenLabs engine with your own API key; language enforced via `language_code` on `eleven_turbo_v2_5`.
- Female and male narrator; optional custom ElevenLabs voice ID.
- Per-window reading: each Cursor window reads only answers from its own project.
- Claude Code panel support via a matching `Stop` hook in `~/.claude/settings.json`.
- Voice test in Settings — hear your current voice on one click.
- Unified settings panel: engine, voice, language, speed, scope, ElevenLabs tuning, volume slider.

### Security

- API keys stored in the OS keychain, never in `settings.json`.
- State directory (`~/.cursor/coding-voice`) created owner-only (`0700`).
