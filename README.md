# Coding Voice

![Coding Voice](https://raw.githubusercontent.com/larspunx/codingvoice/main/assets/banner.png)

Listen to your agent instead of reading it. When a prompt finishes, Coding Voice reads the answer
out loud — and gives you play, pause and a volume slider you can grab, in one small bar at the
bottom of the window.

Built for the moment you fire off a long task, look away, and want to know what came back without
scrolling up.

**Repository:** [github.com/larspunx/codingvoice](https://github.com/larspunx/codingvoice)

**Marketplace assets:**

| Asset | URL |
| --- | --- |
| Logo (1:1 PNG) | `https://raw.githubusercontent.com/larspunx/codingvoice/main/assets/logo.png` |
| Banner (2:1 PNG) | `https://raw.githubusercontent.com/larspunx/codingvoice/main/assets/banner.png` |

## Architecture

This repo ships a **Cursor Plugin** and a **VS Code extension** in one place:

| Piece | Location | Role |
| --- | --- | --- |
| **Cursor Plugin manifest** | `.cursor-plugin/plugin.json` | Marketplace metadata and discovery |
| **Agent hooks** | `hooks/hooks.json`, `scripts/` | Capture agent answers and queue them for speech |
| **VS Code extension** | `dist/extension.js`, `package.json` | Status bar, settings, TTS engines, playback |

Both parts are required: hooks move text into a queue; the extension reads it aloud.

## What it does

- **Speaks every finished answer.** Cursor hooks catch the end of each agent turn; nothing to press.
- **Four icons in the status bar.** Power, play / pause, volume level and settings gear.
- **Reads markdown, not markup.** Code blocks, tables and image links are dropped; paths shrink to file names.
- **Choose how much you hear.** Full answer, key points only, or just the ending.
- **English and Polish**, detected per sentence or pinned in settings. Numbers are spoken as words in the chosen language.
- **System voice (free) or ElevenLabs** with your own API key.
- **macOS, Windows and Linux.**

## Installation

### From the Extensions panel (Open VSX)

In Cursor: **Extensions** → search **Coding Voice** → **Install**. Cursor's Extensions
panel is backed by [Open VSX](https://open-vsx.org).

### Build a VSIX locally

```bash
npm install
npm run package        # produces coding-voice-<version>.vsix
```

In Cursor: **Extensions → … → Install from VSIX…**

### From source

```bash
git clone git@github.com:larspunx/codingvoice.git
cd codingvoice
npm install && npm run build
```

On first activation the extension registers hooks in `~/.cursor/hooks.json`. The plugin also ships
`hooks/hooks.json` for marketplace discovery — both paths use the same `dist/hook.js` logic.

## Settings

| Setting | What it does |
| --- | --- |
| `codingVoice.enabled` | Turn reading aloud on or off. |
| `codingVoice.scope` | How much to read: `full`, `essentials`, or `ending`. |
| `codingVoice.engine` | `system` (free, offline) or `elevenlabs` (your own API key). |
| `codingVoice.voice` | Female or male narrator. |
| `codingVoice.language` | `auto`, `en`, or `pl`. |
| `codingVoice.rate` | Speech rate, `1` is normal. |
| `codingVoice.volume` | Reading volume in percent, relative to other apps. |
| `codingVoice.maxCharacters` | Stop after N characters. `0` reads everything. |
| `codingVoice.skipCodeBlocks` | Drop fenced code and tables. On by default. |

Your API key is stored in the OS keychain, never in `settings.json`.

## Privacy

No server of ours — there isn't one. System engine: nothing leaves your machine. Cloud engine: text
goes only to the provider whose key you entered. No telemetry, no analytics, no account.

## How it hooks in

Two Cursor hooks (`afterAgentResponse`, `stop`) buffer and queue answer text. The Claude Code panel
also gets a matching `Stop` hook via `~/.claude/settings.json`. Existing entries in those files are
left untouched.

## Requirements

- **macOS:** works out of the box.
- **Windows:** works out of the box (System.Speech).
- **Linux:** needs `speech-dispatcher` or `espeak-ng` for the free voice; cloud engines need neither.

## Releasing a new version

**One-time setup:** create an [Open VSX](https://open-vsx.org) account, sign the Eclipse
Foundation Publisher Agreement, create the `larspunx` namespace
(`npx ovsx create-namespace larspunx -p <token>`), generate an access token, and export
it so it sticks: `export OVSX_PAT=…` in your shell profile.

**Each release:**

1. Bump `version` in `package.json` (keep `.cursor-plugin/plugin.json` in sync).
2. Update `CHANGELOG.md`.
3. Commit `dist/`, push `main`, and tag `vX.Y.Z`.
4. Publish in one step — typechecks, builds, packages and uploads:

```bash
npm run release
```

`npm run release` runs the tests, then `ovsx publish` (which reads `OVSX_PAT` from the
environment). To only build a local `.vsix` without publishing, run `npm run package`.

## Development

```bash
npm install
npm run build      # dist/extension.js + dist/hook.js
npm test
npm run package    # coding-voice-<version>.vsix
```

## License

MIT — see [LICENSE](LICENSE).
