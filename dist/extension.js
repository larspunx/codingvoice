"use strict";var Lt=Object.create;var H=Object.defineProperty;var It=Object.getOwnPropertyDescriptor;var Mt=Object.getOwnPropertyNames;var At=Object.getPrototypeOf,Pt=Object.prototype.hasOwnProperty;var zt=(e,t)=>{for(var n in t)H(e,n,{get:t[n],enumerable:!0})},je=(e,t,n,s)=>{if(t&&typeof t=="object"||typeof t=="function")for(let i of Mt(t))!Pt.call(e,i)&&i!==n&&H(e,i,{get:()=>t[i],enumerable:!(s=It(t,i))||s.enumerable});return e};var v=(e,t,n)=>(n=e!=null?Lt(At(e)):{},je(t||!e||!e.__esModule?H(n,"default",{value:e,enumerable:!0}):n,e)),Ft=e=>je(H({},"__esModule",{value:!0}),e);var ki={};zt(ki,{activate:()=>yi,deactivate:()=>bi});module.exports=Ft(ki);var re=v(require("node:fs")),b=v(require("vscode"));var m=v(require("node:fs")),P=v(require("node:path")),ue=v(require("node:os"));var W=v(require("node:fs")),ae=v(require("node:os")),x=v(require("node:path")),p=x.join(ae.homedir(),".cursor","coding-voice");function Te(){W.mkdirSync(p,{recursive:!0,mode:448});try{W.chmodSync(p,448)}catch{}}var J=x.join(ae.homedir(),".cursor","cursor-voice"),Si=x.join(p,"pending.txt"),xi=x.join(p,"pending-ws.txt"),j=x.join(p,"queue"),ce=x.join(p,"last-spoken.txt"),$i=x.join(p,"last-payload.json"),T=x.join(p,"hook.log"),q=e=>x.join(p,`apikey-${e}`),le=x.join(p,"hook.js");function Be(e){let t=process.platform==="win32"?"cmd":"sh";return x.join(p,`hook-${e}.${t}`)}var C=P.join(ue.homedir(),".cursor","hooks.json"),O=P.join(ue.homedir(),".claude","settings.json"),jt=5,Ve=5;function Tt(e){let t=P.join(e,"dist","hook.js");try{return m.mkdirSync(p,{recursive:!0}),m.copyFileSync(t,le),le}catch{return t}}function de(e,t,n){let s=Be(e),i=process.platform==="win32"?["@echo off",`if not exist "${n}" (`,`  echo launcher: brak "${n}" - hook nie wystartowal>>"${T}"`,"  exit /b 0",")","set ELECTRON_RUN_AS_NODE=1",`"${t}" "${n}" ${e}`,""].join(`\r
`):["#!/bin/sh","# Generowane przez rozszerzenie Coding Voice \u2014 r\u0119czne zmiany zostan\u0105 nadpisane.",`if [ ! -f "${n}" ]; then`,`  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) launcher: brak ${n} \u2014 hook nie wystartowa\u0142" >> "${T}"`,"  exit 0","fi",`ELECTRON_RUN_AS_NODE=1 exec "${t}" "${n}" ${e}`,""].join(`
`);return m.mkdirSync(p,{recursive:!0}),m.writeFileSync(s,i,"utf8"),process.platform!=="win32"&&m.chmodSync(s,493),s}function Bt(){try{let e=JSON.parse(m.readFileSync(C,"utf8"));if(typeof e=="object"&&e!==null&&!Array.isArray(e))return e}catch{if(m.existsSync(C))try{m.copyFileSync(C,`${C}.broken-backup`)}catch{}}return{}}function Vt(e){return typeof e.command!="string"?!1:e.command.includes(p)||e.command.includes(J)}function Nt(){try{m.rmSync(J,{recursive:!0,force:!0})}catch{}}function Ot(e,t){let n=de("claude",e,t),s={};if(m.existsSync(O))try{let l=JSON.parse(m.readFileSync(O,"utf8"));if(typeof l!="object"||l===null||Array.isArray(l))return!1;s=l}catch{return!1}let i={...s.hooks??{}},r=JSON.stringify(i),o=(i.Stop??[]).map(l=>({...l,hooks:(l.hooks??[]).filter(d=>typeof d.command!="string"||!(d.command.includes(p)||d.command.includes(J)))})).filter(l=>(l.hooks??[]).length>0);if(i.Stop=[...o,{hooks:[{type:"command",command:n,timeout:Ve}]}],JSON.stringify(i)===r)return!1;let a={...s,hooks:i};m.mkdirSync(P.dirname(O),{recursive:!0});let c=`${O}.tmp`;return m.writeFileSync(c,`${JSON.stringify(a,null,2)}
`,"utf8"),m.renameSync(c,O),!0}function Ne(e,t=process.execPath){let n=Tt(e),s=de("capture",t,n),i=de("speak",t,n),r=Ot(t,n),o=Bt(),a={...o.hooks??{}},c=JSON.stringify(a),l=S=>(a[S]??[]).filter(u=>!Vt(u));if(a.afterAgentResponse=[...l("afterAgentResponse"),{command:s,timeout:jt}],a.stop=[...l("stop"),{command:i,timeout:Ve}],Nt(),JSON.stringify(a)===c)return{changed:r,hooksFile:C};let d={...o,version:o.version??1,hooks:a};m.mkdirSync(P.dirname(C),{recursive:!0});let g=`${C}.tmp`;return m.writeFileSync(g,`${JSON.stringify(d,null,2)}
`,"utf8"),m.renameSync(g,C),{changed:!0,hooksFile:C}}var k=v(require("node:fs")),pe=v(require("node:path"));var Dt=1e3,De=5*60*1e3,Oe=".claim.";function Rt(e){let t=pe.join(j,e);try{Date.now()-k.statSync(t).mtimeMs>De&&k.rmSync(t,{force:!0})}catch{}}function Gt(e){let t=e.replace(/\.txt$/,"").split("-");return t.length>=3?t[2]??"":""}function Re(e,t=new Set){k.mkdirSync(j,{recursive:!0});let n=!1,s=()=>{if(!n){n=!0;try{for(let o of k.readdirSync(j).sort()){if(o.includes(Oe)){Rt(o);continue}if(!o.endsWith(".txt"))continue;let a=Gt(o);if(a&&!t.has(a))continue;let c=pe.join(j,o),l=`${c}${Oe}${process.pid}`;try{k.renameSync(c,l)}catch{continue}let d="";try{d=k.readFileSync(l,"utf8")}catch{}k.rmSync(l,{force:!0});let g=Number.parseInt(o.split("-")[0]??"",10);Number.isFinite(g)&&Date.now()-g>De||d.trim()&&e(d)}}catch{}finally{n=!1}}},i;try{i=k.watch(j,()=>s())}catch{}let r=setInterval(s,Dt);return s(),{dispose:()=>{i?.close(),clearInterval(r)}}}var D=v(require("vscode")),ge="codingVoice";function h(){let e=D.workspace.getConfiguration(ge);return{enabled:e.get("enabled",!0),engine:e.get("engine","system"),scope:e.get("scope","full"),voice:e.get("voice","female"),elevenLabsVoiceId:e.get("elevenLabsVoiceId",""),elevenLabsStability:e.get("elevenLabsStability",.5),elevenLabsSimilarity:e.get("elevenLabsSimilarity",.75),elevenLabsStyle:e.get("elevenLabsStyle",0),elevenLabsSpeakerBoost:e.get("elevenLabsSpeakerBoost",!0),language:e.get("language","auto"),rate:e.get("rate",1),volume:e.get("volume",100),maxCharacters:e.get("maxCharacters",0),skipCodeBlocks:e.get("skipCodeBlocks",!0),announceProject:e.get("announceProject",!1),duckSystemAudio:e.get("duckSystemAudio",!1),duckLevel:e.get("duckLevel",40),duckFade:e.get("duckFade",600)}}async function L(e,t){await D.workspace.getConfiguration(ge).update(e,t,D.ConfigurationTarget.Global)}function Ge(e,t){return{language:e.language==="auto"?t:e.language,voice:e.voice,rate:e.rate,volume:Math.max(0,Math.min(1,e.volume/100))}}function _e(e){return e.affectsConfiguration(ge)}var I=v(require("node:fs"));var Q=e=>`codingVoice.apiKey.${e}`,Z=class{constructor(t){this.storage=t}async getApiKey(t){let n=await this.storage.get(Q(t));return n?(this.mirrorToDisk(t,n),n):this.refreshFromDisk(t)}async refreshFromDisk(t){try{let n=I.readFileSync(q(t),"utf8").trim();if(n)return await this.storage.store(Q(t),n),n}catch{}}mirrorToDisk(t,n){let s=q(t);try{I.existsSync(s)||I.writeFileSync(s,n,{encoding:"utf8",mode:384})}catch{}}async setApiKey(t,n){let s=q(t);if(n){await this.storage.store(Q(t),n);try{I.writeFileSync(s,n,{encoding:"utf8",mode:384})}catch{}}else{await this.storage.delete(Q(t));try{I.rmSync(s,{force:!0})}catch{}}}};function Ke(e){let t=(e??"").trim().replace(/\/+$/,"");if(!t)return"";let n=5381;for(let s=0;s<t.length;s+=1)n=(n<<5)+n+t.charCodeAt(s)>>>0;return n.toString(36)}var _t=/(?<![A-ZĄĆĘŁŃÓŚŹŻ])(?<!\b(?:np|itp|itd|tzn|tj|dr|inż|mgr|ok|ang|str|nr|vs|etc|e\.g|i\.e))([.!?…])\s+/gu,Ue="\0";function B(e){return e.replace(_t,`$1${Ue}`).split(Ue).map(t=>t.trim()).filter(Boolean)}var Kt=320;function He(e,t=Kt){let n=e.trim();if(!n)return[];let s=B(n),i=[],r="";for(let o of s){if(o.length>=t){r&&(i.push(r),r=""),i.push(o);continue}let a=r?`${r} ${o}`:o;a.length>t?(i.push(r),r=o):r=a}return r&&i.push(r),i}var Y=class{constructor(t){this.deps=t}utterances=[];index=0;currentState="idle";abort;run=0;running;listeners=new Set;get state(){return this.currentState}get canReplay(){return this.utterances.length>0}onChange(t){return this.listeners.add(t),{dispose:()=>this.listeners.delete(t)}}setState(t){if(this.currentState!==t){this.currentState=t;for(let n of this.listeners)n()}}speakNew(t){let n=He(t);n.length!==0&&(this.cancel(),this.utterances=n,this.index=0,this.start())}replay(){this.utterances.length!==0&&(this.cancel(),this.index=0,this.start())}toggle(){this.currentState==="speaking"?this.pause():this.currentState==="paused"?this.start():this.replay()}restartUtterance(){if(this.currentState!=="speaking")return;let t=this.run,n=this.running;this.cancel(),(async()=>(await n,!(this.currentState!=="speaking"||this.run!==t+1)&&this.start()))()}pause(){this.currentState==="speaking"&&(this.abort?.abort(),this.abort=void 0,this.setState("paused"))}stop(){this.cancel(),this.setState("idle")}cancel(){this.run+=1,this.abort?.abort(),this.abort=void 0}start(){this.run+=1,this.setState("speaking"),this.running=this.loop(this.run),this.running}async loop(t){for(;t===this.run&&this.index<this.utterances.length;){let n=this.utterances[this.index];if(n===void 0)break;let s=new AbortController;this.abort=s;let i=this.deps.options(n),r=this.deps.transform?this.deps.transform(n,i):n;try{await this.deps.engine().speak(r,i,s.signal)}catch(o){if(t!==this.run)return;this.setState("idle"),this.deps.onError(o instanceof Error?o:new Error(String(o)));return}if(s.signal.aborted||t!==this.run)return;this.index+=1}t===this.run&&(this.abort=void 0,this.setState("idle"))}};var Qe=require("node:child_process"),w=v(require("node:fs")),G=v(require("node:path"));var Ut=60;function We(e){let t=Math.max(1,Math.round(e/Ut));return{steps:t,delaySec:(e/1e3/t).toFixed(3)}}var Ht=(e,t,n)=>Math.max(t,Math.min(n,e)),me="/usr/bin/osascript";function R(e){try{w.mkdirSync(p,{recursive:!0}),w.appendFileSync(G.join(p,"duck.log"),`${new Date().toISOString()} ${e}
`)}catch{}}function X(e,t,n,s=6e3){return new Promise((i,r)=>{let o=(0,Qe.spawn)(e,t,{stdio:[n===void 0?"ignore":"pipe","pipe","pipe"]}),a="",c="";o.stdout?.on("data",d=>{a+=d.toString()}),o.stderr?.on("data",d=>{c+=d.toString()});let l=setTimeout(()=>{try{o.kill("SIGKILL")}catch{}r(new Error(`${e} przekroczy\u0142 limit czasu`))},s);o.on("error",d=>{clearTimeout(l),r(d)}),o.on("close",d=>{clearTimeout(l),d===0||d===null?i(a):r(new Error(`${e} zako\u0144czy\u0142 si\u0119 kodem ${String(d)}: ${c.trim()}`))}),n!==void 0&&(o.stdin?.on("error",()=>{}),o.stdin?.end(n,"utf8"))})}var ke=G.join(p,"duck-mac.json"),Wt=["Spotify","Music"];function Ze(e,t,n,s,i,r){let o=i?`
      if player state is playing then`:"",a=i?`
      end if`:"",c=i?`
        set out to out & "${e}=" & (startVol as text) & linefeed`:"",l=r?`startVol * ${t} / 100`:`${t}`;return`
if application "${e}" is running then
  tell application "${e}"
    try${o}
        set startVol to sound volume${c}
        set target to ${l}
        repeat with i from 1 to ${n}
          set sound volume to (startVol + (target - startVol) * i / ${n})
          delay ${s}
        end repeat
        set sound volume to target${a}
    end try
  end tell
end if`}function Jt(e,t,n){return`set out to ""${Wt.map(i=>Ze(i,e,t,n,!0,!0)).join("")}
return out`}function qt(e,t,n){return Object.entries(e).map(([i,r])=>Ze(i,Math.round(r),t,n,!1,!1)).join("")||"return"}function Qt(e){return Object.entries(e).map(([n,s])=>`if application "${n}" is running then tell application "${n}" to set sound volume to ${Math.round(s)}`).join(`
`)||"return"}var he=class{async duck(t,n){let{steps:s,delaySec:i}=We(n),r=await X(me,["-e",Jt(t,s,i)],void 0,n+5e3);R(`mac duck level=${t} fade=${n} \u2192 ${JSON.stringify(r.trim())}`);let o={};for(let a of r.split(`
`)){let[c,l]=a.trim().split("=");if(c&&l!==void 0&&l!==""){let d=Number.parseFloat(l);Number.isFinite(d)&&(o[c]=d)}}try{w.writeFileSync(ke,JSON.stringify({apps:o}),"utf8")}catch{}}async restore(t){let n=Je();if(n){if(Object.keys(n.apps).length>0){let{steps:s,delaySec:i}=We(t);R(`mac restore fade=${t} \u2192 ${JSON.stringify(n.apps)}`),await X(me,["-e",qt(n.apps,s,i)],void 0,t+5e3).catch(r=>R(`mac restore FAIL ${String(r)}`))}qe()}}async recover(){let t=Je();t&&(Object.keys(t.apps).length>0&&await X(me,["-e",Qt(t.apps)]).catch(()=>{}),qe())}};function Je(){try{return JSON.parse(w.readFileSync(ke,"utf8"))}catch{return}}function qe(){try{w.rmSync(ke,{force:!0})}catch{}}var Ye=G.join(p,"duck-win.json"),Zt=`param(
  [Parameter(Mandatory=$true)][ValidateSet('duck','restore')][string]$Mode,
  [int]$Level = 10,
  [int]$Fade = 0,
  [Parameter(Mandatory=$true)][string]$State
)
$ErrorActionPreference = 'Stop'
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Collections.Generic;

[ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")]
class MMDeviceEnumerator { }

[ComImport, Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDeviceEnumerator {
  int EnumAudioEndpoints(int dataFlow, int stateMask, out IntPtr devices);
  int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice device);
}

[ComImport, Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDevice {
  int Activate(ref Guid iid, int clsCtx, IntPtr activationParams, [MarshalAs(UnmanagedType.IUnknown)] out object iface);
}

[ComImport, Guid("77AA99A0-1BD6-484F-8BC7-2C654C9A9B6F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IAudioSessionManager2 {
  int GetAudioSessionControl(IntPtr sessionGuid, int flags, out IntPtr ctl);
  int GetSimpleAudioVolume(IntPtr sessionGuid, int flags, out IntPtr vol);
  int GetSessionEnumerator(out IAudioSessionEnumerator e);
}

[ComImport, Guid("E2F5BB11-0570-40CA-ACDD-3AA01277DEE8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IAudioSessionEnumerator {
  int GetCount(out int count);
  int GetSession(int index, out IAudioSessionControl2 session);
}

[ComImport, Guid("BFB7FF88-7239-4FC9-8FA2-07C950BE9C6D"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IAudioSessionControl2 {
  int GetState(out int state);
  int GetDisplayName(out IntPtr name);
  int SetDisplayName([MarshalAs(UnmanagedType.LPWStr)] string name, ref Guid ctx);
  int GetIconPath(out IntPtr path);
  int SetIconPath([MarshalAs(UnmanagedType.LPWStr)] string path, ref Guid ctx);
  int GetGroupingParam(out Guid g);
  int SetGroupingParam(ref Guid g, ref Guid ctx);
  int RegisterAudioSessionNotification(IntPtr n);
  int UnregisterAudioSessionNotification(IntPtr n);
  int GetSessionIdentifier(out IntPtr id);
  int GetSessionInstanceIdentifier(out IntPtr id);
  int GetProcessId(out int pid);
}

[ComImport, Guid("87CE5498-68D6-44E5-9215-6DA47EF883D8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface ISimpleAudioVolume {
  int SetMasterVolume(float level, ref Guid ctx);
  int GetMasterVolume(out float level);
  int SetMute(bool mute, ref Guid ctx);
  int GetMute(out bool mute);
}

public static class CVAudio {
  static IAudioSessionEnumerator Sessions() {
    var en = (IMMDeviceEnumerator)(new MMDeviceEnumerator());
    IMMDevice dev;
    en.GetDefaultAudioEndpoint(0, 1, out dev); // eRender, eMultimedia
    Guid iid = typeof(IAudioSessionManager2).GUID;
    object o;
    dev.Activate(ref iid, 0x17, IntPtr.Zero, out o); // CLSCTX_ALL
    var mgr = (IAudioSessionManager2)o;
    IAudioSessionEnumerator e;
    mgr.GetSessionEnumerator(out e);
    return e;
  }
  // Aktywne sesje (graj\u0105ce) z niezerowym PID.
  public static int[] ActivePids() {
    var e = Sessions();
    int count; e.GetCount(out count);
    var list = new List<int>();
    for (int i = 0; i < count; i++) {
      IAudioSessionControl2 ctl;
      if (e.GetSession(i, out ctl) != 0 || ctl == null) continue;
      int state; ctl.GetState(out state);
      int pid; ctl.GetProcessId(out pid);
      if (pid != 0 && state == 1) list.Add(pid); // AudioSessionStateActive
      Marshal.ReleaseComObject(ctl);
    }
    Marshal.ReleaseComObject(e);
    return list.ToArray();
  }
  static ISimpleAudioVolume VolumeFor(int pid) {
    var e = Sessions();
    int count; e.GetCount(out count);
    ISimpleAudioVolume result = null;
    for (int i = 0; i < count; i++) {
      IAudioSessionControl2 ctl;
      if (e.GetSession(i, out ctl) != 0 || ctl == null) continue;
      int cpid; ctl.GetProcessId(out cpid);
      if (cpid == pid) { result = (ISimpleAudioVolume)ctl; break; }
      Marshal.ReleaseComObject(ctl);
    }
    Marshal.ReleaseComObject(e);
    return result;
  }
  public static float GetVolume(int pid) {
    var v = VolumeFor(pid);
    if (v == null) return -1f;
    float lvl; v.GetMasterVolume(out lvl);
    Marshal.ReleaseComObject(v);
    return lvl;
  }
  public static void SetVolume(int pid, float level) {
    var v = VolumeFor(pid);
    if (v == null) return;
    Guid g = Guid.Empty;
    v.SetMasterVolume(level, ref g);
    Marshal.ReleaseComObject(v);
  }
}
"@

function Get-Steps([int]$fade) { return [Math]::Max(1, [int]($fade / 60)) }

if ($Mode -eq 'duck') {
  $exclude = @('powershell', 'pwsh')
  $saved = @{}
  foreach ($sid in [CVAudio]::ActivePids()) {
    try { $proc = Get-Process -Id $sid -ErrorAction Stop } catch { continue }
    if ($exclude -contains $proc.ProcessName) { continue }
    $vol = [CVAudio]::GetVolume($sid)
    if ($vol -lt 0) { continue }
    $saved[[string]$sid] = $vol
  }
  ($saved | ConvertTo-Json -Compress) | Set-Content -Path $State -Encoding UTF8
  # Ramp ka\u017Cdej sesji od zapami\u0119tanego poziomu do celu przez $Fade ms \u2014 p\u0142ynnie, nie skokowo.
  # $Level to PROCENT bie\u017C\u0105cej g\u0142o\u015Bno\u015Bci sesji, wi\u0119c cel liczy si\u0119 per sesja z jej w\u0142asnego $start
  # (gra\u0142o 0.6, $Level=50 \u2192 cel 0.3). Tak u\u017Cytkownik my\u015Bli o \u015Bciszaniu: \u201Eprzyg\u0142o\u015B o po\u0142ow\u0119".
  $steps = Get-Steps $Fade
  $stepMs = [int]($Fade / $steps)
  for ($i = 1; $i -le $steps; $i++) {
    foreach ($k in $saved.Keys) {
      $start = [float]$saved[$k]
      $target = $start * $Level / 100.0
      $v = $start + ($target - $start) * $i / $steps
      try { [CVAudio]::SetVolume([int]$k, [float]$v) } catch { }
    }
    if ($stepMs -gt 0) { Start-Sleep -Milliseconds $stepMs }
  }
  foreach ($k in $saved.Keys) {
    $start = [float]$saved[$k]
    $target = $start * $Level / 100.0
    try { [CVAudio]::SetVolume([int]$k, [float]$target) } catch { }
  }
}
elseif ($Mode -eq 'restore') {
  if (Test-Path $State) {
    $raw = Get-Content -Path $State -Raw
    if ($raw.Trim()) {
      $saved = $raw | ConvertFrom-Json
      $starts = @{}
      foreach ($p in $saved.PSObject.Properties) { $starts[$p.Name] = [CVAudio]::GetVolume([int]$p.Name) }
      $steps = Get-Steps $Fade
      $stepMs = [int]($Fade / $steps)
      for ($i = 1; $i -le $steps; $i++) {
        foreach ($p in $saved.PSObject.Properties) {
          $s = [float]$starts[$p.Name]
          if ($s -lt 0) { continue }
          $v = $s + ([float]$p.Value - $s) * $i / $steps
          try { [CVAudio]::SetVolume([int]$p.Name, [float]$v) } catch { }
        }
        if ($stepMs -gt 0) { Start-Sleep -Milliseconds $stepMs }
      }
      foreach ($p in $saved.PSObject.Properties) { try { [CVAudio]::SetVolume([int]$p.Name, [float]$p.Value) } catch { } }
    }
    Remove-Item -Path $State -Force -ErrorAction SilentlyContinue
  }
}
`,ve;function Yt(){if(ve)return ve;w.mkdirSync(p,{recursive:!0});let e=G.join(p,"duck.ps1");return w.writeFileSync(e,Zt,"utf8"),ve=e,e}function fe(e,t,n){let s=Yt();return X("powershell",["-NoProfile","-NonInteractive","-ExecutionPolicy","Bypass","-File",s,"-Mode",e,"-Level",String(Math.round(t)),"-Fade",String(Math.round(n)),"-State",Ye],void 0,n+12e3)}var ye=class{async duck(t,n){await fe("duck",t,n)}async restore(t){await fe("restore",0,t)}async recover(){w.existsSync(Ye)&&await fe("restore",0,0).catch(()=>{})}},be=class{async duck(){}async restore(){}async recover(){}};function Xt(){return process.platform==="darwin"?new he:process.platform==="win32"?new ye:new be}var ee=class{constructor(t,n){this.settings=t;this.backend=n??Xt(),this.backend.recover().catch(()=>{})}backend;desired=!1;active=!1;processing=!1;failed=!1;engage(){let t=this.settings().enabled;R(`engage(enabled=${t}, failed=${this.failed})`),!(this.failed||!t)&&(this.desired=!0,this.reconcile())}release(){this.desired=!1,this.reconcile()}async dispose(){this.desired=!1,await this.reconcile()}async reconcile(){if(!this.processing){this.processing=!0;try{for(;this.desired!==this.active;)if(this.desired){let t=this.settings();await this.backend.duck(Ht(t.level,0,100),Math.max(0,t.fadeMs)),this.active=!0}else await this.backend.restore(Math.max(0,this.settings().fadeMs)),this.active=!1}catch(t){this.failed=!0,R(`reconcile FAIL \u2192 wy\u0142\u0105czam do ko\u0144ca sesji: ${String(t)}`)}finally{this.processing=!1}}}};var _=require("node:child_process"),M=v(require("node:fs")),Se=v(require("node:path")),et=require("node:util");var en=(0,et.promisify)(_.execFile);function tn(e){if(process.platform==="win32"&&e.pid!==void 0){(0,_.execFile)("taskkill",["/pid",String(e.pid),"/T","/F"],()=>{});return}e.kill("SIGTERM")}function Xe(e,t,n){return new Promise((s,i)=>{if(n.aborted)return s();let r=(0,_.spawn)(e,t,{stdio:["ignore","ignore","pipe"]}),o="";r.stderr?.on("data",l=>{o+=l.toString()});let a=()=>tn(r);n.addEventListener("abort",a,{once:!0});let c=l=>{n.removeEventListener("abort",a),l()};r.on("error",l=>c(()=>i(l))),r.on("close",l=>{if(n.aborted||l===0||l===null)return c(s);c(()=>i(new Error(`${e} zako\u0144czy\u0142 si\u0119 kodem ${String(l)}: ${o.trim()}`)))})})}async function nn(e){try{return await en("which",[e]),!0}catch{return!1}}var sn=`param([string]$File, [double]$Volume)
Add-Type -AssemblyName PresentationCore
$player = New-Object System.Windows.Media.MediaPlayer
$player.Volume = $Volume
$player.Open([uri]$File)
$deadline = (Get-Date).AddSeconds(5)
while (-not $player.NaturalDuration.HasTimeSpan -and (Get-Date) -lt $deadline) { Start-Sleep -Milliseconds 40 }
$player.Play()
if ($player.NaturalDuration.HasTimeSpan) {
  Start-Sleep -Milliseconds ([int]$player.NaturalDuration.TimeSpan.TotalMilliseconds + 250)
}
$player.Stop()
$player.Close()
`,we;function on(){if(we)return we;let e=Se.join(p,"play.ps1");return M.mkdirSync(p,{recursive:!0}),M.writeFileSync(e,sn,"utf8"),we=e,e}async function rn(e,t){let n=Math.max(0,Math.min(1,t));if(process.platform==="darwin")return["/usr/bin/afplay",["-v",n.toFixed(3),e]];if(await nn("ffplay"))return["ffplay",["-nodisp","-autoexit","-loglevel","quiet","-volume",String(Math.round(n*100)),e]];let s=Math.round(n*32768);return["mpg123",["-q","-f",String(s),e]]}async function tt(e,t,n){M.mkdirSync(p,{recursive:!0});let s=Se.join(p,`clip-${Date.now()}-${Math.random().toString(36).slice(2)}.mp3`);M.writeFileSync(s,e);try{if(process.platform==="win32"){let o=on();await Xe("powershell",["-NoProfile","-NonInteractive","-ExecutionPolicy","Bypass","-File",o,"-File",s,"-Volume",Math.max(0,Math.min(1,t)).toFixed(3)],n);return}let[i,r]=await rn(s,t);await Xe(i,r,n)}finally{M.rm(s,{force:!0},()=>{})}}var an="https://api.elevenlabs.io/v1/text-to-speech",cn="eleven_turbo_v2_5",ln="mp3_44100_128",dn={female:"9BWtsMINqrJLrRacOk9x",male:"nPczCjzI2devNBz1zQrb"};function un(e){return Math.max(.7,Math.min(1.2,e))}var te=class extends Error{constructor(n,s,i){super(n);this.status=s;this.authFailure=i;this.name="ElevenLabsHttpError"}};function pn(e,t){let n="";try{let i=JSON.parse(t);n=i.detail?.code??i.detail?.status??i.detail?.type??""}catch{}return n==="quota_exceeded"||/quota/i.test(t)?{hint:"ElevenLabs is out of credits \u2014 your monthly character quota is used up. Top up or change your ElevenLabs plan, wait for the reset, or switch Coding Voice to the free system voice.",authFailure:!1}:e===401?{hint:"ElevenLabs rejected the API key \u2014 check it in Coding Voice settings.",authFailure:!0}:e===402?{hint:`ElevenLabs' free plan blocks its default voices over the API. In ElevenLabs open Voice Design, create a voice (free, category "generated"), then paste its Voice ID in Coding Voice settings \u2014 or upgrade your ElevenLabs plan.`,authFailure:!1}:e===429?{hint:"ElevenLabs is rate-limiting requests \u2014 try again in a moment.",authFailure:!1}:{hint:`ElevenLabs error ${e}. ${t.slice(0,200)}`.trim(),authFailure:!1}}var gn={stability:.5,similarity:.75,style:0,speakerBoost:!0},xe=e=>Math.max(0,Math.min(1,e)),mn=12;function nt(e){let t=new Map,n=(o,a)=>{if(t.set(o,a),t.size>mn){let c=t.keys().next().value;c!==void 0&&t.delete(c)}},s=o=>e.voiceIdOverride?.()||dn[o],i=async(o,a,c,l,d,g,S)=>{let u=await fetch(`${an}/${a}?output_format=${ln}`,{method:"POST",headers:{"xi-api-key":g,"content-type":"application/json",accept:"audio/mpeg"},body:JSON.stringify({text:o,model_id:cn,language_code:d,voice_settings:{stability:xe(l.stability),similarity_boost:xe(l.similarity),style:xe(l.style),use_speaker_boost:l.speakerBoost,speed:c}}),signal:S});if(!u.ok){let f=await u.text().catch(()=>""),{hint:A,authFailure:U}=pn(u.status,f);throw new te(A,u.status,U)}return Buffer.from(await u.arrayBuffer())},r=async(o,a,c,l,d,g)=>{let S=await e.apiKey();if(!S)throw new Error("Add your ElevenLabs API key in Coding Voice settings to use this voice.");try{return await i(o,a,c,l,d,S,g)}catch(u){if(u instanceof te&&u.authFailure&&e.refreshApiKey&&!g.aborted){let f=await e.refreshApiKey().catch(()=>{});if(f&&f!==S)return await i(o,a,c,l,d,f,g)}throw u}};return{id:"elevenlabs",async isAvailable(){return!!await e.apiKey()},async speak(o,a,c){let l=s(a.voice),d=un(a.rate),g=e.voiceSettings?.()??gn,S=`${l}:${a.language}:${d}:${g.stability}:${g.similarity}:${g.style}:${g.speakerBoost}:${o}`,u=t.get(S);if(!u){if(u=await r(o,l,d,g,a.language,c),c.aborted)return;n(S,u)}await tt(u,a.volume,c)}}}var K=require("node:child_process"),z=v(require("node:fs")),Ce=v(require("node:path")),st=require("node:util");var ot=(0,st.promisify)(K.execFile),it={"pl:female":["Zosia","Ewa"],"pl:male":["Krzysztof","Marek"],"en:female":["Samantha","Ava","Allison","Serena","Karen"],"en:male":["Alex","Daniel","Tom","Fred"]};function vn(e){if(process.platform==="win32"&&e.pid!==void 0){(0,K.execFile)("taskkill",["/pid",String(e.pid),"/T","/F"],()=>{});return}e.kill("SIGTERM")}function $e(e,t,n,s){return new Promise((i,r)=>{if(n.aborted)return i();let o=(0,K.spawn)(e,t,{stdio:[s===void 0?"ignore":"pipe","ignore","pipe"]}),a="";o.stderr?.on("data",d=>{a+=d.toString()});let c=()=>vn(o);n.addEventListener("abort",c,{once:!0});let l=d=>{n.removeEventListener("abort",c),d()};o.on("error",d=>l(()=>r(d))),o.on("close",d=>{if(n.aborted||d===0||d===null)return l(i);l(()=>r(new Error(`${e} zako\u0144czy\u0142 si\u0119 kodem ${String(d)}: ${a.trim()}`)))}),s!==void 0&&(o.stdin?.on("error",()=>{}),o.stdin?.end(s,"utf8"))})}async function ne(e){let t=process.platform==="win32"?"where":"which";try{return await ot(t,[e]),!0}catch{return!1}}var Ee;async function rt(){if(Ee)return Ee;let e=new Map;try{let{stdout:t}=await ot("/usr/bin/say",["-v","?"]);for(let n of t.split(`
`)){let s=/^(.+?)\s{2,}([a-z]{2})[_-]([A-Z]{2})/.exec(n);if(!s)continue;let[,i,r]=s;if(!i||!r)continue;let o=e.get(r)??[];o.push(i.trim()),e.set(r,o)}}catch{}return Ee=e,e}function fn(e){return e.replace(/\[\[/g,"[ [")}async function hn(e){let n=(await rt()).get(e.language)??[],s=e.voice==="male"?"female":"male",i=(it[`${e.language}:${e.voice}`]??[]).find(o=>n.includes(o));if(i)return i;let r=(it[`${e.language}:${s}`]??[]).find(o=>n.includes(o));if(r)return r}var yn=`param([string]$TextPath, [string]$Culture, [string]$Gender, [int]$Rate, [int]$Volume)
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Rate = $Rate
$synth.Volume = $Volume
try {
  $culture = New-Object System.Globalization.CultureInfo($Culture)
  $synth.SelectVoiceByHints([System.Speech.Synthesis.VoiceGender]::$Gender, [System.Speech.Synthesis.VoiceAge]::Adult, 0, $culture)
} catch {
  # Brak g\u0142osu w tej kulturze lub p\u0142ci \u2014 zostaje g\u0142os domy\u015Blny systemu.
}
$text = [System.IO.File]::ReadAllText($TextPath, [System.Text.Encoding]::UTF8)
$synth.Speak($text)
`;function bn(){let e=Ce.join(p,"speak.ps1");return z.mkdirSync(p,{recursive:!0}),z.writeFileSync(e,yn,"utf8"),e}async function kn(e,t){let n=Math.round((t.rate-1)*50);if(await ne("spd-say")){let o=t.voice==="male"?"male1":"female1",a=Math.round((t.volume-1)*100);return["spd-say",["-w","-l",t.language,"-t",o,"-r",String(n),"-i",String(a),"--",e]]}let s=t.voice==="male"?"+m3":"+f3",i=Math.round(175*t.rate),r=Math.round(100*t.volume);return["espeak-ng",["-v",`${t.language}${s}`,"-s",String(i),"-a",String(r),"--stdin"]]}var at={id:"system",async isAvailable(){return process.platform==="darwin"?z.existsSync("/usr/bin/say"):process.platform==="win32"?ne("powershell"):await ne("spd-say")||await ne("espeak-ng")},async speak(e,t,n){if(process.platform==="darwin"){let r=await hn(t),o=["-r",String(Math.round(190*t.rate))];r&&o.push("-v",r),o.push("-f","-");let a=t.volume<1?`[[volm ${t.volume.toFixed(2)}]]`:"";return $e("/usr/bin/say",o,n,a+fn(e))}if(process.platform==="win32"){let r=Ce.join(p,"utterance.txt");z.writeFileSync(r,e,"utf8");let o=Math.max(-10,Math.min(10,Math.round((t.rate-1)*10))),a=t.language==="pl"?"pl-PL":"en-US",c=t.voice==="male"?"Male":"Female";return $e("powershell",["-NoProfile","-NonInteractive","-ExecutionPolicy","Bypass","-File",bn(),"-TextPath",r,"-Culture",a,"-Gender",c,"-Rate",String(o),"-Volume",String(Math.round(t.volume*100))],n)}let[s,i]=await kn(e,t);return $e(s,i,n,s==="espeak-ng"?e:void 0)}};function ct(){process.platform==="darwin"&&rt().catch(()=>{})}var wn=/[ąćęłńóśźż]/i,Sn=/\b(?:jest|nie|sie|się|tak|ale|oraz|zeby|żeby|dla|jak|juz|już|tez|też|czy|bo|na|do|to|z|w|mam|masz|sa|są|byl|był|byla|była|gotowe|gotowa|gotowy|plik|pliki|pliku|plikow|blad|bledy|teraz|wiec|więc|przez|przy|ten|ta|te|tego|tym|tych|linia|linie|linii|zmiana|zmiany|zrobione|port)\b/gi,xn=/\b(?:the|and|is|are|you|for|with|that|this|from|not|can|will|have|it|to|of|test|tests|file|files|line|lines|done|change|changes|fixed|added|error|errors|found|now)\b/gi,$n=/rz|cz|sz|dz|szcz/gi,En=/\w+(?:ono|ano|ęto|eto|uje|ują|uję|liśmy|lismy)\b/gi;function ie(e,t){return e.match(t)?.length??0}function lt(e,t="en"){if(wn.test(e))return"pl";let n=ie(e,Sn)+ie(e,$n)+ie(e,En),s=ie(e,xn);return n===s?t:n>s?"pl":"en"}var V={en:["zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"],pl:["zero","jeden","dwa","trzy","cztery","pi\u0119\u0107","sze\u015B\u0107","siedem","osiem","dziewi\u0119\u0107","dziesi\u0119\u0107","jedena\u015Bcie","dwana\u015Bcie","trzyna\u015Bcie","czterna\u015Bcie","pi\u0119tna\u015Bcie","szesna\u015Bcie","siedemna\u015Bcie","osiemna\u015Bcie","dziewi\u0119tna\u015Bcie"]},Le={en:["","","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"],pl:["","","dwadzie\u015Bcia","trzydzie\u015Bci","czterdzie\u015Bci","pi\u0119\u0107dziesi\u0105t","sze\u015B\u0107dziesi\u0105t","siedemdziesi\u0105t","osiemdziesi\u0105t","dziewi\u0119\u0107dziesi\u0105t"]},Cn=["","sto","dwie\u015Bcie","trzysta","czterysta","pi\u0119\u0107set","sze\u015B\u0107set","siedemset","osiemset","dziewi\u0119\u0107set"],Ln=["","thousand","million","billion","trillion"],In=[null,["tysi\u0105c","tysi\u0105ce","tysi\u0119cy"],["milion","miliony","milion\xF3w"],["miliard","miliardy","miliard\xF3w"],["bilion","biliony","bilion\xF3w"]],Mn={en:"point",pl:"przecinek"},An={en:"dot",pl:"kropka"},Pn={en:"percent",pl:"procent"};function zn(e){if(e===1)return 0;let t=e%10,n=e%100;return t>=2&&t<=4&&!(n>=12&&n<=14)?1:2}function Ie(e,t){let n=[],s=Math.floor(e/100),i=e%100;if(s>0&&(t==="pl"?n.push(Cn[s]??""):n.push(`${V.en[s]} hundred`)),i>0)if(i<20)n.push(V[t][i]??"");else{let r=Math.floor(i/10),o=i%10;t==="en"?n.push(o>0?`${Le.en[r]}-${V.en[o]}`:Le.en[r]??""):(n.push(Le.pl[r]??""),o>0&&n.push(V.pl[o]??""))}return n.filter(Boolean).join(" ")}function Fn(e,t){if(e===0)return V[t][0]??"zero";let n=[],s=e;for(;s>0;)n.push(s%1e3),s=Math.floor(s/1e3);let i=[];for(let r=n.length-1;r>=0;r-=1){let o=n[r];if(o){if(r===0){i.push(Ie(o,t));continue}if(t==="en")i.push(Ie(o,"en"),Ln[r]??"");else{let a=In[r];if(!a)continue;o!==1&&i.push(Ie(o,"pl")),i.push(a[zn(o)])}}}return i.filter(Boolean).join(" ")}var dt=(e,t)=>e.split("").map(n=>V[t][Number(n)]??"").filter(Boolean).join(" ");function Me(e,t){return e.length>15||e.length>1&&e.startsWith("0")?dt(e,t):Fn(Number(e),t)}function jn(e,t,n){return`${Me(e,n)} ${Mn[n]} ${dt(t,n)}`}function Tn(e,t){let n=e.replace(/[ \u00A0\u202F\u2009]/g,"");if(t==="en")n=n.replace(/,/g,"");else if(n.includes(",")){n=n.replace(/\./g,"");let i=n.indexOf(",");n=`${n.slice(0,i)}.${n.slice(i+1).replace(/,/g,"")}`}let s=(n.match(/\./g)??[]).length;if(s===0)return Me(n,t);if(s===1){let[i="",r=""]=n.split(".");return jn(i,r,t)}return n.split(".").map(i=>Me(i,t)).join(` ${An[t]} `)}var Bn=/(?<![A-Za-z0-9_])(?<![A-Za-z0-9_]\.)(\d{1,3}(?:[ \u00A0\u202F\u2009]\d{3})+(?:[.,]\d+)?|\d+(?:[.,]\d+)*)(\s*%)?/g;function ut(e,t){return e.replace(Bn,(n,s,i)=>{let r=Tn(s,t);return i?`${r} ${Pn[t]}`:r})}var se=700,Vn=3,Ae=e=>/^\s{0,3}(?:```|~~~)/.test(e),pt=e=>/^\s{0,3}#{1,6}\s/.test(e),Pe=e=>/^\s*\|.*\|\s*$/.test(e),gt=e=>/^\s{0,3}(?:[-*_]\s*){3,}$/.test(e),Fe=e=>/^\s{0,3}(?:[-*+]|\d+[.)])\s+/.test(e),mt=e=>e.trim()==="";function Nn(e){let t=e.split(`
`),n=[],s=0;for(;s<t.length;){let i=t[s]??"";if(mt(i)){s+=1;continue}if(Ae(i)){let c=[i];for(s+=1;s<t.length&&!Ae(t[s]??"");)c.push(t[s]??""),s+=1;s<t.length&&(c.push(t[s]??""),s+=1),n.push({kind:"code",lines:c});continue}if(gt(i)){n.push({kind:"rule",lines:[i]}),s+=1;continue}if(pt(i)){n.push({kind:"heading",lines:[i]}),s+=1;continue}let r=Pe(i)?"table":Fe(i)?"list":"paragraph",o=c=>mt(c)||Ae(c)||pt(c)||gt(c)?!1:r==="table"?Pe(c):r==="list"?!0:!Pe(c)&&!Fe(c),a=[];for(;s<t.length&&o(t[s]??"");)a.push(t[s]??""),s+=1;n.push({kind:r,lines:a})}return n}var vt=new Set(["heading","list","paragraph"]),F=e=>e.lines.join(`
`).trim();function On(e){let t=e.filter(r=>vt.has(r.kind));if(t.length===0)return"";let n=[],s=0;for(let r=t.length-1;r>=0;r-=1){let o=t[r];if(!o)continue;let a=F(o).length;if(n.length>0&&s+a>se||(n.unshift(o),s+=a,o.kind==="heading"))break}let i=n.map(F).join(`

`);return n.length===1&&i.length>se?Dn(i):i}function Dn(e,t=se){let n=B(e),s=[],i=0;for(let r=n.length-1;r>=0;r-=1){let o=n[r];if(o){if(s.length>0&&i+o.length>t)break;s.unshift(o),i+=o.length}}return s.join(" ")}function ze(e){return/\*\*[^*]+\*\*/.test(e)||/__[^_]+__/.test(e)}function Rn(e){let t=e.filter(r=>vt.has(r.kind)),n=t[t.length-1],s=t.length===1?t[0]:void 0;if(s&&s.kind==="paragraph"&&F(s).length>se){let r=B(F(s).replace(/\n/g," "));return r.filter((o,a)=>a===0||a===r.length-1||ze(o)).join(" ")}let i=[];for(let r of t){if(r.kind==="heading"){i.push(F(r));continue}if(r.kind==="list"){let c=r.lines.filter(d=>Fe(d)),l=c.filter(ze);i.push((l.length>0?l:c.slice(0,Vn)).join(`
`));continue}if(r===n){i.push(F(r));continue}let a=B(F(r).replace(/\n/g," ")).filter((c,l)=>l===0||ze(c));a.length>0&&i.push(a.join(" "))}return i.filter(Boolean).join(`

`)}function ft(e,t){if(t==="full")return e;let n=Nn(e);return t==="ending"?On(n):Rn(n)}var Gn=[["\u2318","command "],["\u2325","option "],["\u21E7","shift "],["\u2303","control "],["\u2423"," "],["\u23CE","enter "],["\u238B","escape "],["\u2192",", "],["\u2190",", "],["\u21D2",", "],["\xB7",", "],["\u2713","ok"],["\u2705","ok"],["\u274C","no"]],_n=/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]/gu,Kn=/\b(?:https?|ftp):\/\/[^\s<>\[\]()]+|\bwww\.[^\s<>\[\]()]+/gi,Un=/<\s*(?:https?|ftp):\/\/[^>\s]+>/gi,Hn=/\bmailto:[^\s<>\[\]()]+/gi,Wn=/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,Jn=/\b(?:[a-z0-9-]+\.)+(?:com|org|net|io|dev|pl|ai|app|co|edu|gov|uk|de|eu|us|info|me|xyz)\/[^\s<>\[\]()]*/gi;function qn(e){let t=e.trim();return!t||/^(?:https?|ftp):\/\//i.test(t)||/^www\./i.test(t)||/^mailto:/i.test(t)?!0:/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(t)}function ht(e){let t=e.replace(/[.,;:!?]+$/u,"");return e.slice(t.length)||" "}function Qn(e){let t=e;return t=t.replace(Un," "),t=t.replace(/\[([^\]]*)\]\([^)]*\)/g,(n,s)=>qn(s)?" ":s),t=t.replace(Kn,ht),t=t.replace(Jn,ht),t=t.replace(Hn," "),t=t.replace(Wn," "),t}function Zn(e){return e.replace(/[\w.~-]*\/(?:[\w.-]+\/)*([\w-]+\.[A-Za-z0-9]{1,5})\b/g,"$1").replace(/(?:~|\.{0,2})?\/(?:[\w.-]+\/){2,}([\w.-]+)/g,"$1")}function Yn(e){let t=e;for(let[n,s]of Gn)t=t.split(n).join(s);return t=t.replace(_n,""),t=t.replace(/\s*,\s*,\s*/g,", "),t.replace(/\s+([,.;:!?])/g,"$1")}function Xn(e,t){if(t<=0||e.length<=t)return e;let n=e.slice(0,t),s=Math.max(n.lastIndexOf(". "),n.lastIndexOf("! "),n.lastIndexOf("? "));return`${s>t*.4?n.slice(0,s+1):n.trimEnd()}\u2026`}function yt(e,t={}){let{maxCharacters:n=0,skipCodeBlocks:s=!0}=t,i=e;s&&(i=i.replace(/```[\s\S]*?```/g," "),i=i.replace(/^[ \t]*\|.*\|[ \t]*$/gm,"")),i=i.replace(/!\[[^\]]*\]\([^)]*\)/g," "),i=Qn(i),i=i.replace(/^[ \t]{0,3}(?:[-*_][ \t]*){3,}$/gm,""),i=i.replace(/`([^`]*)`/g,"$1"),i=i.replace(/^[ \t]{0,3}#{1,6}[ \t]*(.+?)[ \t]*$/gm,(a,c)=>`${c.replace(/[.:]+$/,"")}.`),i=i.replace(/^[ \t]{0,3}[-*+][ \t]+/gm,""),i=i.replace(/^[ \t]{0,3}\d+[.)][ \t]+/gm,""),i=i.replace(/\*\*([^*]+)\*\*/g,"$1"),i=i.replace(/(?<!\w)[*_]([^*_]+)[*_](?!\w)/g,"$1"),i=Zn(i),i=Yn(i),i=i.replace(/[ \t]+/g," ");let r=i.split(/\n\s*\n/).map(a=>a.split(/\s+/).filter(Boolean).join(" ")).filter(a=>a.length>0);if(r.length===0)return"";let o=r.map(a=>/[.!?:…]$/.test(a)?a:`${a}.`).join(" ");return Xn(o,n).trim()}var y=v(require("vscode"));var $=v(require("vscode"));async function bt(e){await $.env.openExternal($.Uri.parse(`${$.env.uriScheme}://settings/${encodeURIComponent(e)}`))||await $.commands.executeCommand("workbench.action.openSettings",e)}var ei=200,ti="https://open.spotify.com/album/0oKFlySlL4IJCb9L1Wz5GY?si=bHh1TGHNSmeRAyXcmaiMyA",ni="https://elevenlabs.io/app/voice-lab",ii="https://ko-fi.com/larspunx",kt="Hi! This is Coding Voice. I read out the summary of every answer as soon as the agent finishes, so you can keep your eyes off the screen. What you are hearing right now is a quick voice test using your current settings. By default I use your computer's built-in system voice, which is free and works offline. In the settings below you can switch the voice, change the language, and adjust the speed and volume. Any change you make applies here and to every answer I read. Enjoy!";function wt(e,t){let n,s,i=(c,l)=>{let d=Math.max(0,Math.min(100,Math.round(c)));if(L("volume",d),s&&clearTimeout(s),l){t.restartUtterance();return}s=setTimeout(()=>t.restartUtterance(),ei)},r=async()=>({...h(),hasElevenLabsKey:!!await e.getApiKey("elevenlabs")}),o=async()=>{n&&await n.webview.postMessage({type:"state",state:await r()})};return{open:()=>{if(n){n.reveal(y.ViewColumn.Active),o();return}n=y.window.createWebviewPanel("codingVoiceSettings","Coding Voice \u2014 Settings",y.ViewColumn.Active,{enableScripts:!0,retainContextWhenHidden:!0}),n.webview.html=li(),n.webview.onDidReceiveMessage(async c=>{let l=c.type;if(l==="ready")await o();else if(l==="set")await L(c.key,c.value);else if(l==="volume")i(Number(c.value),!!c.commit);else if(l==="apiKey"){let d=c.engine,g=String(c.value??"").trim();await e.setApiKey(d,g||void 0),y.window.showInformationMessage(g?"API key saved.":"API key removed."),await o()}else if(l==="playTest")t.speakNew(kt);else if(l==="diagnostics"){let d=await y.workspace.openTextDocument(y.Uri.file(T));await y.window.showTextDocument(d)}else l==="rawSettings"?await bt("@ext:larspunx.coding-voice"):l==="music"?await y.env.openExternal(y.Uri.parse(ti)):l==="voiceDesign"?await y.env.openExternal(y.Uri.parse(ni)):l==="kofi"&&await y.env.openExternal(y.Uri.parse(ii))}),n.onDidDispose(()=>{s&&clearTimeout(s),n=void 0})},refresh:()=>void o(),dispose:()=>{s&&clearTimeout(s),n?.dispose()}}}var si=["full","essentials","ending"],oi=["system","elevenlabs"],ri=["female","male"],ai=["auto","en","pl"];function ci(){let e="",t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";for(let n=0;n<32;n++)e+=t.charAt(Math.floor(Math.random()*t.length));return e}function li(){let e=ci();return`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta http-equiv="Content-Security-Policy"
  content="default-src 'none'; style-src 'nonce-${e}'; script-src 'nonce-${e}';" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style nonce="${e}">
  :root { color-scheme: light dark; }
  body {
    font-family: var(--vscode-font-family);
    color: var(--vscode-foreground);
    background: var(--vscode-editor-background);
    margin: 0;
    padding: 28px;
    font-size: 13px;
  }
  .wrap { max-width: 640px; margin: 0 auto; display: flex; flex-direction: column; gap: 4px; }
  h1 { font-size: 18px; font-weight: 600; margin: 0 0 4px; }
  .sub { opacity: 0.6; margin: 0 0 20px; font-size: 12px; }
  .group {
    font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; opacity: 0.55;
    margin: 22px 0 6px;
  }
  .row {
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
    padding: 10px 0; border-bottom: 1px solid var(--vscode-panel-border, rgba(128,128,128,0.15));
  }
  .row:last-child { border-bottom: none; }
  .label { display: flex; flex-direction: column; gap: 2px; }
  .label .name { font-weight: 500; }
  .label .desc { opacity: 0.55; font-size: 11px; }
  .control { flex: 0 0 auto; display: flex; align-items: center; gap: 10px; }
  select, input[type="text"], input[type="password"] {
    background: var(--vscode-settings-dropdownBackground, var(--vscode-input-background));
    color: var(--vscode-input-foreground);
    border: 1px solid var(--vscode-settings-dropdownBorder, var(--vscode-input-border, transparent));
    border-radius: 4px; padding: 5px 8px; font-family: inherit; font-size: 12px; min-width: 150px;
  }
  input[type="checkbox"] { width: 16px; height: 16px; accent-color: var(--vscode-focusBorder); }
  button {
    background: var(--vscode-button-background); color: var(--vscode-button-foreground);
    border: none; border-radius: 4px; padding: 6px 12px; font-family: inherit; font-size: 12px;
    cursor: pointer;
  }
  button.secondary {
    background: var(--vscode-button-secondaryBackground, transparent);
    color: var(--vscode-button-secondaryForeground, var(--vscode-foreground));
    border: 1px solid var(--vscode-button-border, rgba(128,128,128,0.4));
  }
  button:hover { background: var(--vscode-button-hoverBackground); }
  .slider-row { display: flex; flex-direction: column; gap: 8px; padding: 12px 0; border-bottom: 1px solid var(--vscode-panel-border, rgba(128,128,128,0.15)); }
  .slider-top { display: flex; align-items: baseline; justify-content: space-between; }
  .slider-val { font-size: 20px; font-weight: 600; font-variant-numeric: tabular-nums; }
  .slider-line { display: flex; align-items: center; gap: 12px; }
  .icon { display: inline-flex; align-items: center; opacity: 0.65; user-select: none; }
  .icon svg { width: 16px; height: 16px; display: block; }
  input[type="range"] {
    -webkit-appearance: none; appearance: none; flex: 1; height: 6px; border-radius: 999px;
    background: var(--vscode-scrollbarSlider-background); outline: none; cursor: pointer;
  }
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none; appearance: none; width: 18px; height: 18px; border-radius: 50%;
    background: var(--vscode-button-background, var(--vscode-focusBorder));
    border: 2px solid var(--vscode-editor-background); box-shadow: 0 1px 4px rgba(0,0,0,0.35);
    cursor: grab;
  }
  input[type="range"]:active::-webkit-slider-thumb { cursor: grabbing; }
  input[type="range"]::-moz-range-thumb {
    width: 18px; height: 18px; border-radius: 50%;
    background: var(--vscode-button-background, var(--vscode-focusBorder));
    border: 2px solid var(--vscode-editor-background); cursor: grab;
  }
  .key-line { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; justify-content: flex-end; }
  .key-desc { display: inline-flex; align-items: center; gap: 5px; }
  .key-check { width: 12px; height: 12px; flex: none; }
  .key-check[hidden] { display: none; }
  #apiKey.has-key::placeholder { color: var(--vscode-foreground); opacity: 0.75; letter-spacing: 1px; }
  .key-status { font-size: 11px; opacity: 0.6; }
  .hint { opacity: 0.5; font-size: 11px; line-height: 1.5; margin-top: 4px; }
  .info {
    background: var(--vscode-textBlockQuote-background, rgba(128,128,128,0.08));
    border-left: 3px solid var(--vscode-focusBorder);
    border-radius: 4px; padding: 12px 14px; margin: 8px 0 4px;
    font-size: 12px; line-height: 1.6;
  }
  .test {
    background: var(--vscode-textBlockQuote-background, rgba(128,128,128,0.08));
    border: 1px solid var(--vscode-panel-border, rgba(128,128,128,0.2));
    border-radius: 6px; padding: 14px 16px; margin: 4px 0 8px;
  }
  .test-text { margin: 0 0 12px; font-size: 12.5px; line-height: 1.6; opacity: 0.9; }
  .test-play {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 7px 16px; font-size: 12px; font-weight: 600; border-radius: 999px;
  }
  .test-play svg { width: 12px; height: 12px; flex: none; }
  .info .h { font-weight: 600; display: block; margin-bottom: 6px; }
  .info b { font-weight: 600; }
  .info .tag {
    display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: 0.04em;
    padding: 1px 6px; border-radius: 999px; margin-right: 6px; vertical-align: middle;
  }
  .info .tag.free { background: rgba(29,185,84,0.18); color: #1db954; }
  .info .tag.paid { background: rgba(224,168,0,0.2); color: #e0a800; }
  .info p { margin: 8px 0 0; }
  .info .last { margin-top: 10px; opacity: 0.7; }
  .link-btn {
    margin-top: 10px; background: transparent; color: var(--vscode-textLink-foreground);
    border: 1px solid var(--vscode-textLink-foreground); border-radius: 4px; padding: 5px 12px;
    font-size: 12px; cursor: pointer;
  }
  .link-btn:hover { background: var(--vscode-textLink-foreground); color: var(--vscode-editor-background); }
  .footer {
    margin-top: 28px; padding-top: 18px;
    border-top: 1px solid var(--vscode-panel-border, rgba(128,128,128,0.15));
    display: flex; flex-direction: column; gap: 12px; align-items: flex-start;
  }
  .footer .note { margin: 0; font-size: 12px; line-height: 1.6; opacity: 0.8; }
  .footer .who { font-weight: 600; opacity: 1; }
  .footer .signoff { font-style: italic; opacity: 0.9; }
  .spotify {
    display: inline-flex; align-items: center; gap: 8px;
    background: #1db954; color: #05240f; border: none; border-radius: 999px;
    padding: 7px 16px; font-family: inherit; font-size: 12px; font-weight: 600; cursor: pointer;
  }
  .spotify:hover { background: #1ed760; }
  .spotify svg, .kofi svg { width: 14px; height: 14px; flex: none; }
  .footer .buttons { display: flex; gap: 10px; flex-wrap: wrap; }
  .kofi {
    display: inline-flex; align-items: center; gap: 8px;
    background: #29abe0; color: #04222e; border: none; border-radius: 999px;
    padding: 7px 16px; font-family: inherit; font-size: 12px; font-weight: 600; cursor: pointer;
  }
  .kofi:hover { background: #3dbcef; }
</style>
</head>
<body>
  <div class="wrap">
    <h1>Coding Voice</h1>
    <p class="sub">Every setting in one place. Changes apply immediately.</p>

    <div class="group">Voice test</div>
    <div class="test">
      <p class="test-text">${kt}</p>
      <button id="playTest" class="test-play"><svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M4 3l9 5-9 5z"/></svg>Play voice test</button>
    </div>

    <div class="row">
      <div class="label"><span class="name">Read aloud</span><span class="desc">Speak each finished agent answer</span></div>
      <div class="control"><input type="checkbox" id="enabled" /></div>
    </div>

    <div class="group">Voice</div>

    <div class="row">
      <div class="label"><span class="name">Engine</span><span class="desc">System is free & offline; cloud engines bill your own account</span></div>
      <div class="control">
        <select id="engine">
          <option value="system">System \u2014 free, offline</option>
          <option value="elevenlabs">ElevenLabs \u2014 your API key</option>
        </select>
      </div>
    </div>
    <div class="hint">Changing the voice engine applies to every project. If you're working in several
      Cursor windows at once, reload them (or restart Cursor) so they all switch to the new voice.</div>

    <div class="row">
      <div class="label"><span class="name">Narrator</span></div>
      <div class="control">
        <select id="voice"><option value="female">Female</option><option value="male">Male</option></select>
      </div>
    </div>

    <div class="row">
      <div class="label"><span class="name">Language</span></div>
      <div class="control">
        <select id="language">
          <option value="auto">Auto-detect</option>
          <option value="en">English</option>
          <option value="pl">Polski</option>
        </select>
      </div>
    </div>

    <div class="slider-row">
      <div class="slider-top">
        <span class="name">Speed</span>
        <span class="slider-val"><span id="rateNum">1.00</span>\xD7</span>
      </div>
      <div class="slider-line">
        <span class="icon" title="Slower"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="5.6"/><path d="M8 8 5.2 5.6"/></svg></span>
        <input type="range" id="rate" min="0.5" max="2" step="0.05" />
        <span class="icon" title="Faster"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="5.6"/><path d="M8 8 10.8 5.6"/></svg></span>
      </div>
    </div>

    <div class="slider-row">
      <div class="slider-top">
        <span class="name">Reading volume</span>
        <span class="slider-val"><span id="volNum">100</span>%</span>
      </div>
      <div class="slider-line">
        <span class="icon" title="Quieter"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6h2.5L8 3v10L4.5 10H2z"/><path d="M10.5 6.5c.7.8.7 2.2 0 3"/></svg></span>
        <input type="range" id="volume" min="0" max="100" step="1" />
        <span class="icon" title="Louder"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6h2.5L8 3v10L4.5 10H2z"/><path d="M10.5 6c.9 1 .9 3 0 4"/><path d="M12.3 4.5c1.6 1.7 1.6 5.3 0 7"/></svg></span>
      </div>
      <div class="hint">Grab the dot and drag. Changes only this voice \u2014 your system volume stays put.
        While an answer is playing, the new level takes over the current sentence.</div>
    </div>

    <div class="group">Other apps</div>

    <div class="row">
      <div class="label"><span class="name">Quiet other apps while reading</span><span class="desc">Lower music/video while a summary plays, then restore. Windows: any app (incl. a browser on YouTube). macOS: Apple Music &amp; Spotify.</span></div>
      <div class="control"><input type="checkbox" id="duckSystemAudio" /></div>
    </div>

    <div class="slider-row duck">
      <div class="slider-top">
        <span class="name">Keep at</span>
        <span class="slider-val"><span id="duckLevelNum">40</span>%</span>
      </div>
      <div class="slider-line">
        <span class="icon" title="Quieter"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6h2.5L8 3v10L4.5 10H2z"/><path d="M10.5 6.5c.7.8.7 2.2 0 3"/></svg></span>
        <input type="range" id="duckLevel" min="0" max="100" step="1" />
        <span class="icon" title="Louder"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6h2.5L8 3v10L4.5 10H2z"/><path d="M10.5 6c.9 1 .9 3 0 4"/><path d="M12.3 4.5c1.6 1.7 1.6 5.3 0 7"/></svg></span>
      </div>
      <div class="hint">Share of each app's own volume kept while a summary is read. 100% = untouched, 50% = half as loud. Lower = quieter background.</div>
    </div>

    <div class="slider-row duck">
      <div class="slider-top">
        <span class="name">Fade</span>
        <span class="slider-val"><span id="duckFadeNum">0.6</span>s</span>
      </div>
      <div class="slider-line">
        <span class="icon" title="Instant"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v6l4 2"/><circle cx="8" cy="8" r="6"/></svg></span>
        <input type="range" id="duckFade" min="0" max="5000" step="100" />
        <span class="icon" title="Slower"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6"/><path d="M8 4v4l3 1.5"/></svg></span>
      </div>
      <div class="hint">How smoothly the volume slides down when reading starts and back up when it ends. 0 is instant.</div>
    </div>

    <div class="group">ElevenLabs</div>

    <div class="info">
      <span class="h">How to use ElevenLabs \u2014 free or paid</span>
      <p><span class="tag free">FREE</span>You can use ElevenLabs without paying, but its built-in
        voices are blocked over the API on the free plan. The workaround: create <b>your own</b> voice
        (that one is allowed). Open <b>Voice Design</b> in ElevenLabs, generate a voice, open it, copy
        its <b>Voice ID</b>, and paste it into the field below. Then pick Engine = ElevenLabs and you'll
        hear it.</p>
      <p><span class="tag paid">PAID</span>On any paid plan (Starter and up) the built-in voices work
        too \u2014 just leave the Voice ID field empty and the female/male default is used.</p>
      <p class="last">Either way you bring your own API key and ElevenLabs bills you directly \u2014 there's
        no account or markup on our side.</p>
      <button id="voiceDesign" class="link-btn">Open ElevenLabs Voice Design</button>
    </div>

    <div class="row">
      <div class="label"><span class="name">Voice ID</span><span class="desc">Free plan: paste the ID of a voice you created in Voice Design. Paid plan: leave empty for the default.</span></div>
      <div class="control"><input type="text" id="elevenLabsVoiceId" placeholder="leave empty for default" /></div>
    </div>

    <div class="row">
      <div class="label"><span class="name">API key</span><span class="desc key-desc"><svg class="key-check" id="keyOk" viewBox="0 0 16 16" fill="none" stroke="#3fb950" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" hidden><path d="M3 8.5 6.5 12 13 4.5"/></svg><span id="keyStatus">Not set</span></span></div>
      <div class="control key-line">
        <input type="password" id="apiKey" placeholder="paste key to save" />
        <button id="saveKey">Save</button>
        <button id="clearKey" class="secondary">Remove</button>
      </div>
    </div>

    <div class="slider-row tunable">
      <div class="slider-top"><span class="name">Stability</span><span class="slider-val"><span id="stabNum">50</span>%</span></div>
      <div class="slider-line">
        <span class="icon" title="Expressive"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 8h2l1.5-4.5L8 13l2-8 1.5 3h3"/></svg></span>
        <input type="range" id="elevenLabsStability" min="0" max="100" step="1" />
        <span class="icon" title="Consistent"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 8h13"/></svg></span>
      </div>
      <div class="hint">Lower = more expressive and variable. Higher = calmer and more consistent.</div>
    </div>

    <div class="slider-row tunable">
      <div class="slider-top"><span class="name">Similarity</span><span class="slider-val"><span id="simNum">75</span>%</span></div>
      <div class="slider-line">
        <span class="icon" title="Loose"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 8c1.4-3.2 3.4-3.2 4.8 0s3.4 3.2 4.8 0"/></svg></span>
        <input type="range" id="elevenLabsSimilarity" min="0" max="100" step="1" />
        <span class="icon" title="Precise"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="5.5"/><circle cx="8" cy="8" r="2.3"/></svg></span>
      </div>
      <div class="hint">How closely the output sticks to the original voice.</div>
    </div>

    <div class="slider-row tunable">
      <div class="slider-top"><span class="name">Style</span><span class="slider-val"><span id="styleNum">0</span>%</span></div>
      <div class="slider-line">
        <span class="icon" title="Neutral"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h8"/></svg></span>
        <input type="range" id="elevenLabsStyle" min="0" max="100" step="1" />
        <span class="icon" title="Theatrical"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5l1.5 4.9 4.9 1.6-4.9 1.6L8 14.5 6.5 9.6 1.6 8l4.9-1.6z"/></svg></span>
      </div>
      <div class="hint">Style exaggeration \u2014 higher is more theatrical but slower. 0 is neutral.</div>
    </div>

    <div class="row tunable">
      <div class="label"><span class="name">Speaker boost</span><span class="desc">Strengthen resemblance to the chosen voice</span></div>
      <div class="control"><input type="checkbox" id="elevenLabsSpeakerBoost" /></div>
    </div>

    <div class="group">What gets read</div>

    <div class="row">
      <div class="label"><span class="name">Scope</span><span class="desc">How much of the answer to read</span></div>
      <div class="control">
        <select id="scope">
          <option value="full">Whole answer</option>
          <option value="essentials">Key points only</option>
          <option value="ending">Just the ending</option>
        </select>
      </div>
    </div>

    <div class="row">
      <div class="label"><span class="name">Length limit</span><span class="desc">Cloud engines bill per character</span></div>
      <div class="control">
        <select id="maxCharacters">
          <option value="0">No limit</option>
          <option value="400">~400 characters</option>
          <option value="800">~800 characters</option>
          <option value="1500">~1500 characters</option>
        </select>
      </div>
    </div>

    <div class="row">
      <div class="label"><span class="name">Skip code blocks</span><span class="desc">Drop fenced code and tables \u2014 noise when read aloud</span></div>
      <div class="control"><input type="checkbox" id="skipCodeBlocks" /></div>
    </div>

    <div class="row">
      <div class="label"><span class="name">Announce project name</span><span class="desc">Start each summary with the project name \u2014 handy when several windows read at once</span></div>
      <div class="control"><input type="checkbox" id="announceProject" /></div>
    </div>

    <div class="group">Extension</div>

    <div class="row">
      <div class="label"><span class="name">Diagnostics</span><span class="desc">Open the hook log</span></div>
      <div class="control"><button id="diagnostics" class="secondary">Open log</button></div>
    </div>

    <div class="row">
      <div class="label"><span class="name">Raw settings</span><span class="desc">Open the standard settings editor</span></div>
      <div class="control"><button id="rawSettings" class="secondary">Open</button></div>
    </div>

    <div class="footer">
      <p class="note"><span class="who">Coding Voice by Lars.</span><br />
        Enjoy the extension. I'd love you to hear my music \u2014 recorded analog, no AI.</p>
      <p class="note">If this tool saves you some time, you can buy me a coffee \u2014 anything is
        appreciated, and it keeps the project going :)</p>
      <p class="note signoff">Cheers, Lars :)</p>
      <div class="buttons">
        <button id="music" class="spotify"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 12V4l7 1.6"/><circle cx="4.4" cy="12" r="1.6"/><circle cx="11.4" cy="10.6" r="1.6"/></svg>Listen on Spotify</button>
        <button id="kofi" class="kofi"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h8v3.5a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z"/><path d="M11 7h1.6a1.6 1.6 0 0 1 0 3.2H11"/><path d="M5 2.5v1.6M8 2.5v1.6"/></svg>Buy me a coffee</button>
      </div>
    </div>
  </div>

<script nonce="${e}">
  const vscode = acquireVsCodeApi();
  const $ = (id) => document.getElementById(id);
  const set = (key, value) => vscode.postMessage({ type: 'set', key, value });

  // Zwyk\u0142e kontrolki: prze\u0142\u0105cznik i listy zapisuj\u0105 wprost.
  $('enabled').addEventListener('change', (e) => set('enabled', e.target.checked));
  $('skipCodeBlocks').addEventListener('change', (e) => set('skipCodeBlocks', e.target.checked));
  $('announceProject').addEventListener('change', (e) => set('announceProject', e.target.checked));
  $('duckSystemAudio').addEventListener('change', (e) => set('duckSystemAudio', e.target.checked));

  // \u015Aciszanie innych aplikacji: poziom w %, czas fade pokazujemy w sekundach, zapis po puszczeniu.
  $('duckLevel').addEventListener('input', (e) => { $('duckLevelNum').textContent = e.target.value; });
  $('duckLevel').addEventListener('change', (e) => set('duckLevel', Number(e.target.value)));
  $('duckFade').addEventListener('input', (e) => { $('duckFadeNum').textContent = (Number(e.target.value) / 1000).toFixed(1); });
  $('duckFade').addEventListener('change', (e) => set('duckFade', Number(e.target.value)));
  for (const id of ['engine', 'voice', 'language', 'scope']) {
    $(id).addEventListener('change', (e) => set(id, e.target.value));
  }
  $('maxCharacters').addEventListener('change', (e) => set('maxCharacters', Number(e.target.value)));

  // Tempo: liczba rusza si\u0119 pod suwakiem, warto\u015B\u0107 zapisujemy po puszczeniu.
  $('rate').addEventListener('input', (e) => { $('rateNum').textContent = Number(e.target.value).toFixed(2); });
  $('rate').addEventListener('change', (e) => set('rate', Number(e.target.value)));

  // G\u0142o\u015Bno\u015B\u0107: liczba na \u017Cywo, zapis natychmiast (input), s\u0142yszalny skok po puszczeniu (change).
  $('volume').addEventListener('input', (e) => {
    $('volNum').textContent = e.target.value;
    vscode.postMessage({ type: 'volume', value: Number(e.target.value), commit: false });
  });
  $('volume').addEventListener('change', (e) => {
    vscode.postMessage({ type: 'volume', value: Number(e.target.value), commit: true });
  });

  // ID g\u0142osu ElevenLabs zapisujemy po opuszczeniu pola, \u017Ceby nie strzela\u0107 przy ka\u017Cdym znaku.
  $('elevenLabsVoiceId').addEventListener('change', (e) => set('elevenLabsVoiceId', e.target.value));

  // Pokr\u0119t\u0142a brzmienia ElevenLabs: pokazujemy w procentach, zapisujemy jako 0\u20131 po puszczeniu.
  const tune = (sliderId, numId, key) => {
    $(sliderId).addEventListener('input', (e) => { $(numId).textContent = e.target.value; });
    $(sliderId).addEventListener('change', (e) => set(key, Number(e.target.value) / 100));
  };
  tune('elevenLabsStability', 'stabNum', 'elevenLabsStability');
  tune('elevenLabsSimilarity', 'simNum', 'elevenLabsSimilarity');
  tune('elevenLabsStyle', 'styleNum', 'elevenLabsStyle');
  $('elevenLabsSpeakerBoost').addEventListener('change', (e) => set('elevenLabsSpeakerBoost', e.target.checked));

  // Kontrolki dotycz\u0105ce wy\u0142\u0105cznie ElevenLabs \u2014 przy innym silniku nic nie robi\u0105, wi\u0119c je gasimy.
  const elevenOnly = ['elevenLabsVoiceId', 'elevenLabsStability', 'elevenLabsSimilarity', 'elevenLabsStyle', 'elevenLabsSpeakerBoost'];
  const setElevenEnabled = (on) => {
    for (const id of elevenOnly) {
      const el = $(id);
      el.disabled = !on;
      const box = el.closest('.row, .slider-row');
      if (box) box.style.opacity = on ? '' : '0.4';
    }
  };
  // Reaguj natychmiast na zmian\u0119 silnika, nie czekaj\u0105c na odbicie stanu z hosta.
  $('engine').addEventListener('change', (e) => setElevenEnabled(e.target.value === 'elevenlabs'));

  $('saveKey').addEventListener('click', () => {
    vscode.postMessage({ type: 'apiKey', engine: 'elevenlabs', value: $('apiKey').value });
    $('apiKey').value = '';
  });
  $('clearKey').addEventListener('click', () => {
    vscode.postMessage({ type: 'apiKey', engine: 'elevenlabs', value: '' });
    $('apiKey').value = '';
  });

  $('playTest').addEventListener('click', () => vscode.postMessage({ type: 'playTest' }));
  $('diagnostics').addEventListener('click', () => vscode.postMessage({ type: 'diagnostics' }));
  $('rawSettings').addEventListener('click', () => vscode.postMessage({ type: 'rawSettings' }));
  $('music').addEventListener('click', () => vscode.postMessage({ type: 'music' }));
  $('kofi').addEventListener('click', () => vscode.postMessage({ type: 'kofi' }));
  $('voiceDesign').addEventListener('click', () => vscode.postMessage({ type: 'voiceDesign' }));

  const draggingVolume = () => document.activeElement === $('volume');

  window.addEventListener('message', (event) => {
    const msg = event.data;
    if (!msg || msg.type !== 'state') return;
    const s = msg.state;
    $('enabled').checked = s.enabled;
    $('skipCodeBlocks').checked = s.skipCodeBlocks;
    $('announceProject').checked = s.announceProject;
    $('duckSystemAudio').checked = s.duckSystemAudio;
    $('duckLevel').value = String(Math.round(s.duckLevel)); $('duckLevelNum').textContent = String(Math.round(s.duckLevel));
    $('duckFade').value = String(Math.round(s.duckFade)); $('duckFadeNum').textContent = (Math.round(s.duckFade) / 1000).toFixed(1);
    $('engine').value = s.engine === 'elevenlabs' ? 'elevenlabs' : 'system';
    $('voice').value = s.voice;
    $('language').value = s.language;
    $('scope').value = s.scope;
    $('maxCharacters').value = String(s.maxCharacters);
    $('elevenLabsVoiceId').value = s.elevenLabsVoiceId || '';
    const pct = (v) => String(Math.round(v * 100));
    $('elevenLabsStability').value = pct(s.elevenLabsStability); $('stabNum').textContent = pct(s.elevenLabsStability);
    $('elevenLabsSimilarity').value = pct(s.elevenLabsSimilarity); $('simNum').textContent = pct(s.elevenLabsSimilarity);
    $('elevenLabsStyle').value = pct(s.elevenLabsStyle); $('styleNum').textContent = pct(s.elevenLabsStyle);
    $('elevenLabsSpeakerBoost').checked = s.elevenLabsSpeakerBoost;
    setElevenEnabled(s.engine === 'elevenlabs');
    $('rate').value = String(s.rate);
    $('rateNum').textContent = Number(s.rate).toFixed(2);
    // Nie wyrywamy suwaka g\u0142o\u015Bno\u015Bci spod palca, gdy w\u0142a\u015Bnie go trzymamy.
    if (!draggingVolume()) {
      $('volume').value = String(Math.round(s.volume));
      $('volNum').textContent = String(Math.round(s.volume));
    }
    $('keyStatus').textContent = s.engine === 'elevenlabs'
      ? (s.hasElevenLabsKey ? 'ElevenLabs key saved' : 'ElevenLabs key not set')
      : 'Not needed for the system voice';
    // Klucza NIE odsy\u0142amy z hosta (to sekret) \u2014 ale gdy jest zapisany, dajemy zna\u0107 wizualnie:
    // pole pokazuje w placeholderze gwiazdki \u201Ezaj\u0119to\u015Bci", a przy statusie zapala si\u0119 zielony check.
    const keySaved = s.engine === 'elevenlabs' && s.hasElevenLabsKey;
    const api = $('apiKey');
    api.placeholder = keySaved ? '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022' : 'paste key to save';
    api.classList.toggle('has-key', keySaved);
    $('keyOk').hidden = !keySaved;
  });

  vscode.postMessage({ type: 'ready' });
</script>
</body>
</html>`}var E=v(require("vscode"));var oe={power:1003,playback:1002,volume:1001,settings:1e3},di=new E.ThemeColor("charts.green"),ui=new E.ThemeColor("charts.red"),pi=new E.ThemeColor("statusBarItem.warningBackground"),St=6;function gi(e){let t=Math.max(0,Math.min(100,e)),n=Math.round(t/100*St);return`${"\u2500".repeat(n)}\u25CF${"\u2500".repeat(St-n)}`}function xt(e){let t=(c,l,d)=>{let g=E.window.createStatusBarItem(E.StatusBarAlignment.Left,c);return g.name=l,g.command=d,g},n=t(oe.power,"Coding Voice: reading","codingVoice.toggleEnabled"),s=t(oe.playback,"Coding Voice: playback","codingVoice.playPause"),i=t(oe.volume,"Coding Voice: volume","codingVoice.setVolume"),r=t(oe.settings,"Coding Voice: settings","codingVoice.openSettings");r.text="$(gear)",r.tooltip="Coding Voice settings";function o(){let{enabled:c,volume:l}=h();n.text=c?"$(unmute)":"$(mute)",n.color=c?di:ui,n.tooltip=c?"Reading aloud is on \u2014 click to turn it off":"Reading aloud is off \u2014 click to turn it on",n.show();let d=e.state==="speaking";s.text=d?"$(debug-pause)":"$(play)",s.backgroundColor=d?pi:void 0,s.tooltip=d?"Pause":e.state==="paused"?"Resume":"Play the last answer from the start",s.show(),i.text=`${gi(l)} ${Math.round(l)}%`,i.tooltip="Reading volume \u2014 click to open the slider in the panel",i.show(),r.show()}o();let a=e.onChange(o);return{refresh:o,dispose:()=>E.Disposable.from(n,s,i,r,a).dispose()}}var $t=v(require("vscode"));var mi="codingVoice.volumeView",vi=200;function Et(e){let t,n,s=(o,a)=>{let c=Math.max(0,Math.min(100,Math.round(o)));if(L("volume",c),n&&clearTimeout(n),a){e.restartUtterance();return}n=setTimeout(()=>e.restartUtterance(),vi)};return{provider:{resolveWebviewView(o){t=o,o.webview.options={enableScripts:!0},o.webview.html=hi(h().volume),o.webview.onDidReceiveMessage(a=>{a.type==="input"&&typeof a.value=="number"?s(a.value,!1):a.type==="change"&&typeof a.value=="number"&&s(a.value,!0)}),o.onDidDispose(()=>{t=void 0})}},open:()=>void $t.commands.executeCommand(`${mi}.focus`),refresh:()=>{t?.webview.postMessage({type:"volume",value:Math.round(h().volume)})},dispose:()=>{n&&clearTimeout(n)}}}function fi(){let e="",t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";for(let n=0;n<32;n++)e+=t.charAt(Math.floor(Math.random()*t.length));return e}function hi(e){let t=fi(),n=Math.round(Math.max(0,Math.min(100,e)));return`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta http-equiv="Content-Security-Policy"
  content="default-src 'none'; style-src 'nonce-${t}'; script-src 'nonce-${t}';" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style nonce="${t}">
  :root { color-scheme: light dark; }
  body {
    font-family: var(--vscode-font-family);
    color: var(--vscode-foreground);
    margin: 0;
    padding: 12px 16px;
  }
  .card { display: flex; flex-direction: column; gap: 10px; max-width: 640px; }
  .head { display: flex; align-items: baseline; justify-content: space-between; }
  .title { font-size: 12px; opacity: 0.7; letter-spacing: 0.02em; }
  .value { font-size: 22px; font-variant-numeric: tabular-nums; font-weight: 600; }
  .row { display: flex; align-items: center; gap: 12px; }
  .icon { display: inline-flex; align-items: center; opacity: 0.65; user-select: none; }
  .icon svg { width: 16px; height: 16px; display: block; }
  input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    flex: 1;
    height: 6px;
    border-radius: 999px;
    background: var(--vscode-scrollbarSlider-background);
    outline: none;
    cursor: pointer;
  }
  input[type="range"]:focus-visible {
    outline: 1px solid var(--vscode-focusBorder);
    outline-offset: 4px;
  }
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--vscode-button-background, var(--vscode-focusBorder));
    border: 2px solid var(--vscode-panel-background, var(--vscode-editor-background));
    box-shadow: 0 1px 4px rgba(0,0,0,0.35);
    cursor: grab;
  }
  input[type="range"]:active::-webkit-slider-thumb { cursor: grabbing; }
  input[type="range"]::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--vscode-button-background, var(--vscode-focusBorder));
    border: 2px solid var(--vscode-panel-background, var(--vscode-editor-background));
    cursor: grab;
  }
  .hint { font-size: 11px; opacity: 0.55; line-height: 1.5; }
</style>
</head>
<body>
  <div class="card">
    <div class="head">
      <span class="title">Reading volume</span>
      <span class="value"><span id="num">${n}</span>%</span>
    </div>
    <div class="row">
      <span class="icon" title="Quieter"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6h2.5L8 3v10L4.5 10H2z"/><path d="M10.5 6.5c.7.8.7 2.2 0 3"/></svg></span>
      <input id="slider" type="range" min="0" max="100" step="1" value="${n}"
        aria-label="Reading volume" />
      <span class="icon" title="Louder"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6h2.5L8 3v10L4.5 10H2z"/><path d="M10.5 6c.9 1 .9 3 0 4"/><path d="M12.3 4.5c1.6 1.7 1.6 5.3 0 7"/></svg></span>
    </div>
    <div class="hint">Grab the dot and drag. Changes only this voice \u2014 your system volume stays
      where it is. While an answer is playing, the new level takes over the current sentence.</div>
  </div>
<script nonce="${t}">
  const vscode = acquireVsCodeApi();
  const slider = document.getElementById('slider');
  const num = document.getElementById('num');

  slider.addEventListener('input', () => {
    num.textContent = slider.value;
    vscode.postMessage({ type: 'input', value: Number(slider.value) });
  });
  slider.addEventListener('change', () => {
    vscode.postMessage({ type: 'change', value: Number(slider.value) });
  });

  window.addEventListener('message', (event) => {
    const message = event.data;
    if (message && message.type === 'volume' && typeof message.value === 'number') {
      // Nie nadpisujemy w trakcie chwytania \u2014 inaczej warto\u015B\u0107 odbita z hosta szarpa\u0142aby kropk\u0119
      // spod palca.
      if (document.activeElement !== slider) {
        slider.value = String(message.value);
        num.textContent = String(message.value);
      }
    }
  });
</script>
</body>
</html>`}var N;function yi(e){Te();let t=new Z(e.secrets);ct();let n=nt({apiKey:()=>t.getApiKey("elevenlabs"),refreshApiKey:()=>t.refreshFromDisk("elevenlabs"),voiceIdOverride:()=>h().elevenLabsVoiceId.trim()||void 0,voiceSettings:()=>{let u=h();return{stability:u.elevenLabsStability,similarity:u.elevenLabsSimilarity,style:u.elevenLabsStyle,speakerBoost:u.elevenLabsSpeakerBoost}}}),s=()=>h().engine==="elevenlabs"?n:at,i=new Y({engine:s,options:u=>{let f=h(),A=f.language==="auto"?lt(u,"en"):f.language;return Ge(f,A)},transform:(u,f)=>ut(u,f.language),onError:u=>{b.window.showErrorMessage(`Coding Voice: ${u.message}`)}});N=new ee(()=>{let u=h();return{enabled:u.duckSystemAudio,level:u.duckLevel,fadeMs:u.duckFade}});let r=i.onChange(()=>{i.state==="speaking"?N?.engage():N?.release()}),o=xt(i),a=Et(i),c=wt(t,i);try{Ne(e.extensionPath)}catch(u){b.window.showErrorMessage(`Coding Voice could not register its hooks: ${String(u)}`)}let l=u=>{re.writeFile(ce,u,()=>{}),i.speakNew(u)},d=new Set,g=()=>{d.clear();for(let u of b.workspace.workspaceFolders??[])d.add(Ke(u.uri.fsPath))};g(),e.subscriptions.push(b.workspace.onDidChangeWorkspaceFolders(g));let S=Re(u=>{let f=h();if(!f.enabled)return;let A=yt(ft(u,f.scope),{maxCharacters:f.maxCharacters,skipCodeBlocks:f.skipCodeBlocks});if(!A)return;let U=b.workspace.workspaceFolders?.[0]?.name,Ct=f.announceProject&&U?`${U}. ${A}`:A;l(Ct)},d);e.subscriptions.push(o,a,c,b.window.registerWebviewViewProvider("codingVoice.volumeView",a.provider,{webviewOptions:{retainContextWhenHidden:!0}}),S,b.commands.registerCommand("codingVoice.setVolume",()=>a.open()),b.commands.registerCommand("codingVoice.playPause",async()=>{if(!h().enabled){let u="Turn reading on";await b.window.showInformationMessage("Coding Voice: reading aloud is off, so nothing will be spoken.",u)===u&&await L("enabled",!0);return}if(i.state==="idle"&&!i.canReplay){let u="";try{u=re.readFileSync(ce,"utf8")}catch{}if(u.trim()){l(u);return}b.window.showInformationMessage("Coding Voice: nothing to read yet \u2014 the next agent answer will be read aloud.");return}i.toggle()}),b.commands.registerCommand("codingVoice.stop",()=>i.stop()),b.commands.registerCommand("codingVoice.toggleEnabled",async()=>{let u=!h().enabled;await L("enabled",u),u||i.stop()}),b.commands.registerCommand("codingVoice.openSettings",()=>c.open()),b.commands.registerCommand("codingVoice.setApiKey",()=>c.open()),b.workspace.onDidChangeConfiguration(u=>{_e(u)&&(o.refresh(),a.refresh(),c.refresh(),h().duckSystemAudio||N?.release())}),r,{dispose:()=>void N?.dispose()})}function bi(){return N?.dispose()}0&&(module.exports={activate,deactivate});
