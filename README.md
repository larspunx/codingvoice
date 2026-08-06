# Coding Voice

![Coding Voice](https://raw.githubusercontent.com/larspunx/codingvoice/main/media/banner.png)

Listen to your agent instead of reading it. When a prompt finishes, Coding Voice reads the answer
out loud — and gives you play, pause and a volume slider you can grab, in one small bar at the
bottom of the window.

Built for the moment you fire off a long task, look away, and want to know what came back without
scrolling up.

## Cursor Plugin + VS Code extension

This repository is packaged for [Cursor Marketplace review](https://cursor.com/marketplace/publish)
following the [Cursor plugin template](https://github.com/cursor/plugin-template):

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

## Installation (local test before submit)

### 1. Install the VS Code extension

```bash
npm install
npm run package
```

In Cursor: **Extensions → … → Install from VSIX…** → select `coding-voice-1.0.0.vsix`.

Or load the plugin from a local clone:

```bash
git clone git@github.com:larspunx/codingvoice.git
cp -R codingvoice ~/.cursor/plugins/local/coding-voice
```

### 2. Enable hooks

On first activation the extension registers hooks in `~/.cursor/hooks.json`. The plugin also ships
`hooks/hooks.json` for marketplace discovery — both paths use the same `dist/hook.js` logic.

### 3. Try it

Send a prompt to the agent. When the turn finishes, the answer is read aloud.

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

## Marketplace submission checklist

- [x] `.cursor-plugin/plugin.json` manifest with unique kebab-case name (`coding-voice`)
- [x] Public Git repository (MIT)
- [x] `README.md` with usage and configuration
- [x] Logo committed (`assets/logo.png`)
- [x] Valid hook definitions (`hooks/hooks.json`)
- [x] Extension source and built artifacts for review
- [x] Tested locally

Submit for review: [cursor.com/marketplace/publish](https://cursor.com/marketplace/publish) → paste
`https://github.com/larspunx/codingvoice`.

## Development

```bash
npm install
npm run build      # dist/extension.js + dist/hook.js
npm test
npm run package    # coding-voice-1.0.0.vsix
```

## License

MIT — see [LICENSE](LICENSE).
