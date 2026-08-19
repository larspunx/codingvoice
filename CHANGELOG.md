# Changelog

All notable changes to Coding Voice are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] — 2026-08-20

Added: a short "your turn" ring when a turn ends needing you with nothing to read
aloud — a question, a plan, or edit-only work. On by default (`codingVoice.ring`).

Fixed: the reading-volume slider now applies to the macOS system voice; levels
below 100% previously had no effect.

Fixed: the same answer is no longer read twice when two hook channels close one turn.

Changed: ducking scope is now documented. On Windows every app is lowered, including
a browser playing YouTube; on macOS Music, TV, Spotify and Swinsian are lowered
automatically, but a browser tab (YouTube in Chrome/Safari) cannot be.

## [1.1.2] — 2026-08-18

Changed: better discoverability on the marketplace — added the `AI` category
(alongside `Other`) and expanded the search keywords (read aloud, narrator,
speech, ElevenLabs, audio, agent). No functional changes.

## [1.1.1] — 2026-08-18

Added: a **Sponsor** button on the marketplace listing and a polished README, so
the optional "buy me a coffee" support is visible before install. The extension
stays free with every feature unlocked. No functional changes to speech or ducking.

## [1.1.0] — 2026-08-17

Added: optionally quiet other apps while a summary is read, then restore them to
their previous level — no setup or permissions required. The level is relative to
each app's own volume (50% keeps it half as loud, 100% leaves it untouched), with
a configurable fade in and out. On Windows every other app is lowered per app,
including a browser playing YouTube; on macOS Apple Music and Spotify are lowered
automatically (macOS has no public API to control a browser's volume). Off by
default; enable it with `codingVoice.duckSystemAudio`.

Fixed: ElevenLabs errors are now reported accurately. A used-up character quota is
no longer mislabelled as a rejected API key — ElevenLabs returns HTTP 401 for both,
so the error body is inspected and an out-of-credits situation gets a clear
message. A momentarily empty macOS keychain right after a window reload no longer
surfaces as a key error either: the key is recovered from its on-disk backup and
the request retried once, with no need to re-paste it.

## [1.0.1] — 2026-08-16

Fixed: reading stopped working on Cursor 3.15+, which no longer includes the
answer text in the `afterAgentResponse` hook payload. The hook now falls back to
reading the final answer from the conversation transcript.

## [1.0.0] — 2026-08-06

First public release.
