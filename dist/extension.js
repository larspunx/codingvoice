"use strict";var Wt=Object.create;var Z=Object.defineProperty;var Jt=Object.getOwnPropertyDescriptor;var qt=Object.getOwnPropertyNames;var Zt=Object.getPrototypeOf,Qt=Object.prototype.hasOwnProperty;var Yt=(e,t)=>{for(var n in t)Z(e,n,{get:t[n],enumerable:!0})},Ue=(e,t,n,s)=>{if(t&&typeof t=="object"||typeof t=="function")for(let i of qt(t))!Qt.call(e,i)&&i!==n&&Z(e,i,{get:()=>t[i],enumerable:!(s=Jt(t,i))||s.enumerable});return e};var f=(e,t,n)=>(n=e!=null?Wt(Zt(e)):{},Ue(t||!e||!e.__esModule?Z(n,"default",{value:e,enumerable:!0}):n,e)),Xt=e=>Ue(Z({},"__esModule",{value:!0}),e);var Ki={};Yt(Ki,{activate:()=>_i,deactivate:()=>Gi});module.exports=Xt(Ki);var ue=f(require("node:fs")),Rt=f(require("node:path")),k=f(require("vscode"));var m=f(require("node:fs")),j=f(require("node:path")),ye=f(require("node:os"));var Q=f(require("node:fs")),me=f(require("node:os")),x=f(require("node:path")),g=x.join(me.homedir(),".cursor","coding-voice");function He(){Q.mkdirSync(g,{recursive:!0,mode:448});try{Q.chmodSync(g,448)}catch{}}var Y=x.join(me.homedir(),".cursor","cursor-voice"),Hi=x.join(g,"pending.txt"),Wi=x.join(g,"pending-ws.txt"),We=x.join(g,"queue"),Je=x.join(g,"ring");var fe=x.join(g,"last-spoken.txt"),qe=x.join(g,"speaking.lock"),Ji=x.join(g,"last-payload.json"),V=x.join(g,"hook.log"),X=e=>x.join(g,`apikey-${e}`),ve=x.join(g,"hook.js");function Ze(e){let t=process.platform==="win32"?"cmd":"sh";return x.join(g,`hook-${e}.${t}`)}var A=j.join(ye.homedir(),".cursor","hooks.json"),R=j.join(ye.homedir(),".claude","settings.json"),en=5,Qe=5;function tn(e){let t=j.join(e,"dist","hook.js");try{return m.mkdirSync(g,{recursive:!0}),m.copyFileSync(t,ve),ve}catch{return t}}function he(e,t,n){let s=Ze(e),i=process.platform==="win32"?["@echo off",`if not exist "${n}" (`,`  echo launcher: brak "${n}" - hook nie wystartowal>>"${V}"`,"  exit /b 0",")","set ELECTRON_RUN_AS_NODE=1",`"${t}" "${n}" ${e}`,""].join(`\r
`):["#!/bin/sh","# Generowane przez rozszerzenie Coding Voice \u2014 r\u0119czne zmiany zostan\u0105 nadpisane.",`if [ ! -f "${n}" ]; then`,`  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) launcher: brak ${n} \u2014 hook nie wystartowa\u0142" >> "${V}"`,"  exit 0","fi",`ELECTRON_RUN_AS_NODE=1 exec "${t}" "${n}" ${e}`,""].join(`
`);return m.mkdirSync(g,{recursive:!0}),m.writeFileSync(s,i,"utf8"),process.platform!=="win32"&&m.chmodSync(s,493),s}function nn(){try{let e=JSON.parse(m.readFileSync(A,"utf8"));if(typeof e=="object"&&e!==null&&!Array.isArray(e))return e}catch{if(m.existsSync(A))try{m.copyFileSync(A,`${A}.broken-backup`)}catch{}}return{}}function sn(e){return typeof e.command!="string"?!1:e.command.includes(g)||e.command.includes(Y)}function on(){try{m.rmSync(Y,{recursive:!0,force:!0})}catch{}}function rn(e,t){let n=he("claude",e,t),s={};if(m.existsSync(R))try{let l=JSON.parse(m.readFileSync(R,"utf8"));if(typeof l!="object"||l===null||Array.isArray(l))return!1;s=l}catch{return!1}let i={...s.hooks??{}},r=JSON.stringify(i),o=(i.Stop??[]).map(l=>({...l,hooks:(l.hooks??[]).filter(d=>typeof d.command!="string"||!(d.command.includes(g)||d.command.includes(Y)))})).filter(l=>(l.hooks??[]).length>0);if(i.Stop=[...o,{hooks:[{type:"command",command:n,timeout:Qe}]}],JSON.stringify(i)===r)return!1;let a={...s,hooks:i};m.mkdirSync(j.dirname(R),{recursive:!0});let c=`${R}.tmp`;return m.writeFileSync(c,`${JSON.stringify(a,null,2)}
`,"utf8"),m.renameSync(c,R),!0}function Ye(e,t=process.execPath){let n=tn(e),s=he("capture",t,n),i=he("speak",t,n),r=rn(t,n),o=nn(),a={...o.hooks??{}},c=JSON.stringify(a),l=v=>(a[v]??[]).filter(b=>!sn(b));if(a.afterAgentResponse=[...l("afterAgentResponse"),{command:s,timeout:en}],a.stop=[...l("stop"),{command:i,timeout:Qe}],on(),JSON.stringify(a)===c)return{changed:r,hooksFile:A};let d={...o,version:o.version??1,hooks:a};m.mkdirSync(j.dirname(A),{recursive:!0});let p=`${A}.tmp`;return m.writeFileSync(p,`${JSON.stringify(d,null,2)}
`,"utf8"),m.renameSync(p,A),{changed:!0,hooksFile:A}}var S=f(require("node:fs")),be=f(require("node:path"));var an=1e3,et=5*60*1e3,Xe=".claim.";function cn(e,t){let n=be.join(e,t);try{Date.now()-S.statSync(n).mtimeMs>et&&S.rmSync(n,{force:!0})}catch{}}function ln(e){let t=e.replace(/\.txt$/,"").split("-");return t.length>=3?t[2]??"":""}function ke(e,t=new Set,n=We){S.mkdirSync(n,{recursive:!0});let s=!1,i=()=>{if(!s){s=!0;try{for(let a of S.readdirSync(n).sort()){if(a.includes(Xe)){cn(n,a);continue}if(!a.endsWith(".txt"))continue;let c=ln(a);if(c&&!t.has(c))continue;let l=be.join(n,a),d=`${l}${Xe}${process.pid}`;try{S.renameSync(l,d)}catch{continue}let p="";try{p=S.readFileSync(d,"utf8")}catch{}S.rmSync(d,{force:!0});let v=Number.parseInt(a.split("-")[0]??"",10);Number.isFinite(v)&&Date.now()-v>et||p.trim()&&e(p)}}catch{}finally{s=!1}}},r;try{r=S.watch(n,()=>i())}catch{}let o=setInterval(i,an);return i(),{dispose:()=>{r?.close(),clearInterval(o)}}}var $=f(require("node:fs"));var dn=250,un=4e3,pn=12e3,gn=e=>new Promise(t=>setTimeout(t,e));function tt(e=qe){let t=`${process.pid}-${Math.random().toString(36).slice(2)}`,n,s=()=>{n&&(clearInterval(n),n=void 0)},i=()=>{s(),n=setInterval(()=>{try{$.writeFileSync(e,JSON.stringify({token:t,at:Date.now()}),"utf8")}catch{}},un),n.unref?.()},r=()=>{try{let a=$.openSync(e,"wx");try{$.writeSync(a,JSON.stringify({token:t,at:Date.now()}))}finally{$.closeSync(a)}return!0}catch{return!1}},o=()=>{try{let{at:a}=JSON.parse($.readFileSync(e,"utf8"));return typeof a!="number"||Date.now()-a>pn}catch{return!0}};return{async acquire(){for(;;){if(r()){i();return}if(o()){try{$.rmSync(e,{force:!0})}catch{}continue}await gn(dn)}},release(){s();try{let{token:a}=JSON.parse($.readFileSync(e,"utf8"));a===t&&$.rmSync(e,{force:!0})}catch{}},dispose(){this.release()}}}var _=f(require("vscode")),we="codingVoice";function h(){let e=_.workspace.getConfiguration(we);return{enabled:e.get("enabled",!0),engine:e.get("engine","system"),scope:e.get("scope","full"),voice:e.get("voice","female"),elevenLabsVoiceId:e.get("elevenLabsVoiceId",""),elevenLabsStability:e.get("elevenLabsStability",.5),elevenLabsSimilarity:e.get("elevenLabsSimilarity",.75),elevenLabsStyle:e.get("elevenLabsStyle",0),elevenLabsSpeakerBoost:e.get("elevenLabsSpeakerBoost",!0),language:e.get("language","auto"),rate:e.get("rate",1),volume:e.get("volume",100),maxCharacters:e.get("maxCharacters",0),skipCodeBlocks:e.get("skipCodeBlocks",!0),announceProject:e.get("announceProject",!1),duckSystemAudio:e.get("duckSystemAudio",!1),duckLevel:e.get("duckLevel",40),duckFade:e.get("duckFade",600),ring:e.get("ring",!0)}}async function P(e,t){await _.workspace.getConfiguration(we).update(e,t,_.ConfigurationTarget.Global)}function nt(e,t){return{language:e.language==="auto"?t:e.language,voice:e.voice,rate:e.rate,volume:Math.max(0,Math.min(1,e.volume/100))}}function it(e){return e.affectsConfiguration(we)}var F=f(require("node:fs"));var ee=e=>`codingVoice.apiKey.${e}`,te=class{constructor(t){this.storage=t}async getApiKey(t){let n=await this.storage.get(ee(t));return n?(this.mirrorToDisk(t,n),n):this.refreshFromDisk(t)}async refreshFromDisk(t){try{let n=F.readFileSync(X(t),"utf8").trim();if(n)return await this.storage.store(ee(t),n),n}catch{}}mirrorToDisk(t,n){let s=X(t);try{F.existsSync(s)||F.writeFileSync(s,n,{encoding:"utf8",mode:384})}catch{}}async setApiKey(t,n){let s=X(t);if(n){await this.storage.store(ee(t),n);try{F.writeFileSync(s,n,{encoding:"utf8",mode:384})}catch{}}else{await this.storage.delete(ee(t));try{F.rmSync(s,{force:!0})}catch{}}}};var G=require("node:child_process"),z=f(require("node:fs")),xe=f(require("node:path")),st=require("node:util");var mn=(0,st.promisify)(G.execFile);function fn(e){if(process.platform==="win32"&&e.pid!==void 0){(0,G.execFile)("taskkill",["/pid",String(e.pid),"/T","/F"],()=>{});return}e.kill("SIGTERM")}function ne(e,t,n){return new Promise((s,i)=>{if(n.aborted)return s();let r=(0,G.spawn)(e,t,{stdio:["ignore","ignore","pipe"]}),o="";r.stderr?.on("data",l=>{o+=l.toString()});let a=()=>fn(r);n.addEventListener("abort",a,{once:!0});let c=l=>{n.removeEventListener("abort",a),l()};r.on("error",l=>c(()=>i(l))),r.on("close",l=>{if(n.aborted||l===0||l===null)return c(s);c(()=>i(new Error(`${e} zako\u0144czy\u0142 si\u0119 kodem ${String(l)}: ${o.trim()}`)))})})}async function vn(e){try{return await mn("which",[e]),!0}catch{return!1}}var hn=`param([string]$File, [double]$Volume)
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
`,Se;function ot(){if(Se)return Se;let e=xe.join(g,"play.ps1");return z.mkdirSync(g,{recursive:!0}),z.writeFileSync(e,hn,"utf8"),Se=e,e}async function rt(e,t){let n=Math.max(0,Math.min(1,t));if(process.platform==="darwin")return["/usr/bin/afplay",["-v",n.toFixed(3),e]];if(await vn("ffplay"))return["ffplay",["-nodisp","-autoexit","-loglevel","quiet","-volume",String(Math.round(n*100)),e]];let s=Math.round(n*32768);return["mpg123",["-q","-f",String(s),e]]}async function at(e,t,n){if(process.platform==="win32"){let r=ot();await ne("powershell",["-NoProfile","-NonInteractive","-ExecutionPolicy","Bypass","-File",r,"-File",e,"-Volume",Math.max(0,Math.min(1,t)).toFixed(3)],n);return}let[s,i]=await rt(e,t);await ne(s,i,n)}async function ct(e,t,n){z.mkdirSync(g,{recursive:!0});let s=xe.join(g,`clip-${Date.now()}-${Math.random().toString(36).slice(2)}.mp3`);z.writeFileSync(s,e);try{if(process.platform==="win32"){let o=ot();await ne("powershell",["-NoProfile","-NonInteractive","-ExecutionPolicy","Bypass","-File",o,"-File",s,"-Volume",Math.max(0,Math.min(1,t)).toFixed(3)],n);return}let[i,r]=await rt(s,t);await ne(i,r,n)}finally{z.rm(s,{force:!0},()=>{})}}function lt(e){let t=(e??"").trim().replace(/\/+$/,"");if(!t)return"";let n=5381;for(let s=0;s<t.length;s+=1)n=(n<<5)+n+t.charCodeAt(s)>>>0;return n.toString(36)}var yn=/(?<![A-ZĄĆĘŁŃÓŚŹŻ])(?<!\b(?:np|itp|itd|tzn|tj|dr|inż|mgr|ok|ang|str|nr|vs|etc|e\.g|i\.e))([.!?…])\s+/gu,dt="\0";function N(e){return e.replace(yn,`$1${dt}`).split(dt).map(t=>t.trim()).filter(Boolean)}var bn=320;function ut(e,t=bn){let n=e.trim();if(!n)return[];let s=N(n),i=[],r="";for(let o of s){if(o.length>=t){r&&(i.push(r),r=""),i.push(o);continue}let a=r?`${r} ${o}`:o;a.length>t?(i.push(r),r=o):r=a}return r&&i.push(r),i}var ie=class{constructor(t){this.deps=t}utterances=[];index=0;currentState="idle";abort;run=0;running;listeners=new Set;get state(){return this.currentState}get canReplay(){return this.utterances.length>0}onChange(t){return this.listeners.add(t),{dispose:()=>this.listeners.delete(t)}}setState(t){if(this.currentState!==t){this.currentState=t;for(let n of this.listeners)n()}}speakNew(t){let n=ut(t);n.length!==0&&(this.cancel(),this.utterances=n,this.index=0,this.start())}replay(){this.utterances.length!==0&&(this.cancel(),this.index=0,this.start())}toggle(){this.currentState==="speaking"?this.pause():this.currentState==="paused"?this.start():this.replay()}restartUtterance(){if(this.currentState!=="speaking")return;let t=this.run,n=this.running;this.cancel(),(async()=>(await n,!(this.currentState!=="speaking"||this.run!==t+1)&&this.start()))()}pause(){this.currentState==="speaking"&&(this.abort?.abort(),this.abort=void 0,this.setState("paused"))}stop(){this.cancel(),this.setState("idle")}cancel(){this.run+=1,this.abort?.abort(),this.abort=void 0}start(){this.run+=1,this.setState("speaking"),this.running=this.loop(this.run),this.running}async loop(t){for(;t===this.run&&this.index<this.utterances.length;){let n=this.utterances[this.index];if(n===void 0)break;let s=new AbortController;this.abort=s;let i=this.deps.options(n),r=this.deps.transform?this.deps.transform(n,i):n;try{await this.deps.engine().speak(r,i,s.signal)}catch(o){if(t!==this.run)return;this.setState("idle"),this.deps.onError(o instanceof Error?o:new Error(String(o)));return}if(s.signal.aborted||t!==this.run)return;this.index+=1}t===this.run&&(this.abort=void 0,this.setState("idle"))}};var ft=require("node:child_process"),E=f(require("node:fs")),H=f(require("node:path"));var kn=60;function pt(e){let t=Math.max(1,Math.round(e/kn));return{steps:t,delaySec:(e/1e3/t).toFixed(3)}}var wn=(e,t,n)=>Math.max(t,Math.min(n,e)),$e="/usr/bin/osascript";function K(e){try{E.mkdirSync(g,{recursive:!0}),E.appendFileSync(H.join(g,"duck.log"),`${new Date().toISOString()} ${e}
`)}catch{}}function U(e,t,n,s=6e3){return new Promise((i,r)=>{let o=(0,ft.spawn)(e,t,{stdio:[n===void 0?"ignore":"pipe","pipe","pipe"]}),a="",c="";o.stdout?.on("data",d=>{a+=d.toString()}),o.stderr?.on("data",d=>{c+=d.toString()});let l=setTimeout(()=>{try{o.kill("SIGKILL")}catch{}r(new Error(`${e} przekroczy\u0142 limit czasu`))},s);o.on("error",d=>{clearTimeout(l),r(d)}),o.on("close",d=>{clearTimeout(l),d===0||d===null?i(a):r(new Error(`${e} zako\u0144czy\u0142 si\u0119 kodem ${String(d)}: ${c.trim()}`))}),n!==void 0&&(o.stdin?.on("error",()=>{}),o.stdin?.end(n,"utf8"))})}var Pe=H.join(g,"duck-mac.json"),Ce=["Spotify","Music","TV","Swinsian"];function Sn(e,t,n,s){return`if application "${e}" is running then
  tell application "${e}"
    try
      if player state is playing then
        set startVol to sound volume
        set target to startVol * ${t} / 100
        repeat with i from 1 to ${n}
          set sound volume to (startVol + (target - startVol) * i / ${n})
          delay ${s}
        end repeat
        set sound volume to target
        return "${e}=" & (startVol as text)
      end if
    end try
  end tell
end if
return ""`}function xn(e,t,n,s){return`if application "${e}" is running then
  tell application "${e}"
    try
      set startVol to sound volume
      set target to ${Math.round(t)}
      repeat with i from 1 to ${n}
        set sound volume to (startVol + (target - startVol) * i / ${n})
        delay ${s}
      end repeat
      set sound volume to target
    end try
  end tell
end if
return ""`}function $n(e,t){return`if application "${e}" is running then tell application "${e}" to set sound volume to ${Math.round(t)}`}async function En(){let e=Ce.map(t=>t.replace(/[^A-Za-z0-9]/g,"")).join("|");try{let t=await U("/usr/bin/pgrep",["-x","-l",e],void 0,3e3),n=new Set;for(let s of t.split(`
`)){let i=s.trim().split(/\s+/)[1];i&&Ce.includes(i)&&n.add(i)}return n}catch{return new Set}}var Ie=class{async duck(t,n){let s=await En(),i=Ce.filter(l=>s.has(l)),{steps:r,delaySec:o}=pt(n),a=await Promise.all(i.map(l=>U($e,["-e",Sn(l,t,r,o)],void 0,n+5e3).catch(()=>""))),c={};for(let l of a){let[d,p]=l.trim().split("=");if(d&&p!==void 0&&p!==""){let v=Number.parseFloat(p);Number.isFinite(v)&&(c[d]=v)}}K(`mac duck level=${t} fade=${n} \u2192 ${JSON.stringify(c)}`);try{E.writeFileSync(Pe,JSON.stringify({apps:c}),"utf8")}catch{}}async restore(t){let n=gt();if(!n)return;let s=Object.entries(n.apps);if(s.length>0){let{steps:i,delaySec:r}=pt(t);K(`mac restore fade=${t} \u2192 ${JSON.stringify(n.apps)}`),await Promise.all(s.map(([o,a])=>U($e,["-e",xn(o,a,i,r)],void 0,t+5e3).catch(c=>(K(`mac restore ${o} FAIL ${String(c)}`),""))))}mt()}async recover(){let t=gt();if(!t)return;let n=Object.entries(t.apps);n.length>0&&await Promise.all(n.map(([s,i])=>U($e,["-e",$n(s,i)]).catch(()=>""))),mt()}};function gt(){try{return JSON.parse(E.readFileSync(Pe,"utf8"))}catch{return}}function mt(){try{E.rmSync(Pe,{force:!0})}catch{}}var vt=H.join(g,"duck-win.json"),Ln=`param(
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
`,Ee;function Cn(){if(Ee)return Ee;E.mkdirSync(g,{recursive:!0});let e=H.join(g,"duck.ps1");return E.writeFileSync(e,Ln,"utf8"),Ee=e,e}function Le(e,t,n){let s=Cn();return U("powershell",["-NoProfile","-NonInteractive","-ExecutionPolicy","Bypass","-File",s,"-Mode",e,"-Level",String(Math.round(t)),"-Fade",String(Math.round(n)),"-State",vt],void 0,n+12e3)}var Me=class{async duck(t,n){await Le("duck",t,n)}async restore(t){await Le("restore",0,t)}async recover(){E.existsSync(vt)&&await Le("restore",0,0).catch(()=>{})}},Ae=class{async duck(){}async restore(){}async recover(){}};function In(){return process.platform==="darwin"?new Ie:process.platform==="win32"?new Me:new Ae}var se=class{constructor(t,n){this.settings=t;this.backend=n??In(),this.backend.recover().catch(()=>{})}backend;desired=!1;active=!1;processing=!1;failed=!1;engage(){let t=this.settings().enabled;K(`engage(enabled=${t}, failed=${this.failed})`),!(this.failed||!t)&&(this.desired=!0,this.reconcile())}release(){this.desired=!1,this.reconcile()}async dispose(){this.desired=!1,await this.reconcile()}async reconcile(){if(!this.processing){this.processing=!0;try{for(;this.desired!==this.active;)if(this.desired){let t=this.settings();await this.backend.duck(wn(t.level,0,100),Math.max(0,t.fadeMs)),this.active=!0}else await this.backend.restore(Math.max(0,this.settings().fadeMs)),this.active=!1}catch(t){this.failed=!0,K(`reconcile FAIL \u2192 wy\u0142\u0105czam do ko\u0144ca sesji: ${String(t)}`)}finally{this.processing=!1}}}};var Mn="https://api.elevenlabs.io/v1/text-to-speech",An="eleven_turbo_v2_5",Pn="mp3_44100_128",Fn={female:"9BWtsMINqrJLrRacOk9x",male:"nPczCjzI2devNBz1zQrb"};function zn(e){return Math.max(.7,Math.min(1.2,e))}var oe=class extends Error{constructor(n,s,i){super(n);this.status=s;this.authFailure=i;this.name="ElevenLabsHttpError"}};function jn(e,t){let n="";try{let i=JSON.parse(t);n=i.detail?.code??i.detail?.status??i.detail?.type??""}catch{}return n==="quota_exceeded"||/quota/i.test(t)?{hint:"ElevenLabs is out of credits \u2014 your monthly character quota is used up. Top up or change your ElevenLabs plan, wait for the reset, or switch Coding Voice to the free system voice.",authFailure:!1}:e===401?{hint:"ElevenLabs rejected the API key \u2014 check it in Coding Voice settings.",authFailure:!0}:e===402?{hint:`ElevenLabs' free plan blocks its default voices over the API. In ElevenLabs open Voice Design, create a voice (free, category "generated"), then paste its Voice ID in Coding Voice settings \u2014 or upgrade your ElevenLabs plan.`,authFailure:!1}:e===429?{hint:"ElevenLabs is rate-limiting requests \u2014 try again in a moment.",authFailure:!1}:{hint:`ElevenLabs error ${e}. ${t.slice(0,200)}`.trim(),authFailure:!1}}var Tn={stability:.5,similarity:.75,style:0,speakerBoost:!0},Fe=e=>Math.max(0,Math.min(1,e)),Bn=12;function ht(e){let t=new Map,n=(o,a)=>{if(t.set(o,a),t.size>Bn){let c=t.keys().next().value;c!==void 0&&t.delete(c)}},s=o=>e.voiceIdOverride?.()||Fn[o],i=async(o,a,c,l,d,p,v)=>{let b=await fetch(`${Mn}/${a}?output_format=${Pn}`,{method:"POST",headers:{"xi-api-key":p,"content-type":"application/json",accept:"audio/mpeg"},body:JSON.stringify({text:o,model_id:An,language_code:d,voice_settings:{stability:Fe(l.stability),similarity_boost:Fe(l.similarity),style:Fe(l.style),use_speaker_boost:l.speakerBoost,speed:c}}),signal:v});if(!b.ok){let L=await b.text().catch(()=>""),{hint:q,authFailure:pe}=jn(b.status,L);throw new oe(q,b.status,pe)}return Buffer.from(await b.arrayBuffer())},r=async(o,a,c,l,d,p)=>{let v=await e.apiKey();if(!v)throw new Error("Add your ElevenLabs API key in Coding Voice settings to use this voice.");try{return await i(o,a,c,l,d,v,p)}catch(b){if(b instanceof oe&&b.authFailure&&e.refreshApiKey&&!p.aborted){let L=await e.refreshApiKey().catch(()=>{});if(L&&L!==v)return await i(o,a,c,l,d,L,p)}throw b}};return{id:"elevenlabs",async isAvailable(){return!!await e.apiKey()},async speak(o,a,c){let l=s(a.voice),d=zn(a.rate),p=e.voiceSettings?.()??Tn,v=`${l}:${a.language}:${d}:${p.stability}:${p.similarity}:${p.style}:${p.speakerBoost}:${o}`,b=t.get(v);if(!b){if(b=await r(o,l,d,p,a.language,c),c.aborted)return;n(v,b)}await ct(b,a.volume,c)}}}var J=require("node:child_process"),C=f(require("node:fs")),ae=f(require("node:path")),bt=require("node:util");var kt=(0,bt.promisify)(J.execFile),yt={"pl:female":["Zosia","Ewa"],"pl:male":["Krzysztof","Marek"],"en:female":["Samantha","Ava","Allison","Serena","Karen"],"en:male":["Alex","Daniel","Tom","Fred"]};function Vn(e){if(process.platform==="win32"&&e.pid!==void 0){(0,J.execFile)("taskkill",["/pid",String(e.pid),"/T","/F"],()=>{});return}e.kill("SIGTERM")}function W(e,t,n,s){return new Promise((i,r)=>{if(n.aborted)return i();let o=(0,J.spawn)(e,t,{stdio:[s===void 0?"ignore":"pipe","ignore","pipe"]}),a="";o.stderr?.on("data",d=>{a+=d.toString()});let c=()=>Vn(o);n.addEventListener("abort",c,{once:!0});let l=d=>{n.removeEventListener("abort",c),d()};o.on("error",d=>l(()=>r(d))),o.on("close",d=>{if(n.aborted||d===0||d===null)return l(i);l(()=>r(new Error(`${e} zako\u0144czy\u0142 si\u0119 kodem ${String(d)}: ${a.trim()}`)))}),s!==void 0&&(o.stdin?.on("error",()=>{}),o.stdin?.end(s,"utf8"))})}async function re(e){let t=process.platform==="win32"?"where":"which";try{return await kt(t,[e]),!0}catch{return!1}}var ze;async function wt(){if(ze)return ze;let e=new Map;try{let{stdout:t}=await kt("/usr/bin/say",["-v","?"]);for(let n of t.split(`
`)){let s=/^(.+?)\s{2,}([a-z]{2})[_-]([A-Z]{2})/.exec(n);if(!s)continue;let[,i,r]=s;if(!i||!r)continue;let o=e.get(r)??[];o.push(i.trim()),e.set(r,o)}}catch{}return ze=e,e}function Nn(e){return e.replace(/\[\[/g,"[ [")}async function Dn(e){let n=(await wt()).get(e.language)??[],s=e.voice==="male"?"female":"male",i=(yt[`${e.language}:${e.voice}`]??[]).find(o=>n.includes(o));if(i)return i;let r=(yt[`${e.language}:${s}`]??[]).find(o=>n.includes(o));if(r)return r}var On=`param([string]$TextPath, [string]$Culture, [string]$Gender, [int]$Rate, [int]$Volume)
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
`;function Rn(){let e=ae.join(g,"speak.ps1");return C.mkdirSync(g,{recursive:!0}),C.writeFileSync(e,On,"utf8"),e}async function _n(e,t){let n=Math.round((t.rate-1)*50);if(await re("spd-say")){let o=t.voice==="male"?"male1":"female1",a=Math.round((t.volume-1)*100);return["spd-say",["-w","-l",t.language,"-t",o,"-r",String(n),"-i",String(a),"--",e]]}let s=t.voice==="male"?"+m3":"+f3",i=Math.round(175*t.rate),r=Math.round(100*t.volume);return["espeak-ng",["-v",`${t.language}${s}`,"-s",String(i),"-a",String(r),"--stdin"]]}var St={id:"system",async isAvailable(){return process.platform==="darwin"?C.existsSync("/usr/bin/say"):process.platform==="win32"?re("powershell"):await re("spd-say")||await re("espeak-ng")},async speak(e,t,n){if(process.platform==="darwin"){let r=await Dn(t),o=["-r",String(Math.round(190*t.rate))];r&&o.push("-v",r),o.push("-f","-");let a=Nn(e);if(t.volume>=1)return W("/usr/bin/say",o,n,a);C.mkdirSync(g,{recursive:!0});let c=ae.join(g,`say-${Date.now()}-${Math.random().toString(36).slice(2)}.aiff`);try{if(await W("/usr/bin/say",[...o,"-o",c],n,a),n.aborted)return;await W("/usr/bin/afplay",["-v",t.volume.toFixed(3),c],n)}finally{C.rm(c,{force:!0},()=>{})}return}if(process.platform==="win32"){let r=ae.join(g,"utterance.txt");C.writeFileSync(r,e,"utf8");let o=Math.max(-10,Math.min(10,Math.round((t.rate-1)*10))),a=t.language==="pl"?"pl-PL":"en-US",c=t.voice==="male"?"Male":"Female";return W("powershell",["-NoProfile","-NonInteractive","-ExecutionPolicy","Bypass","-File",Rn(),"-TextPath",r,"-Culture",a,"-Gender",c,"-Rate",String(o),"-Volume",String(Math.round(t.volume*100))],n)}let[s,i]=await _n(e,t);return W(s,i,n,s==="espeak-ng"?e:void 0)}};function xt(){process.platform==="darwin"&&wt().catch(()=>{})}var Gn=/[ąćęłńóśźż]/i,Kn=/\b(?:jest|nie|sie|się|tak|ale|oraz|zeby|żeby|dla|jak|juz|już|tez|też|czy|bo|na|do|to|z|w|mam|masz|sa|są|byl|był|byla|była|gotowe|gotowa|gotowy|plik|pliki|pliku|plikow|blad|bledy|teraz|wiec|więc|przez|przy|ten|ta|te|tego|tym|tych|linia|linie|linii|zmiana|zmiany|zrobione|port)\b/gi,Un=/\b(?:the|and|is|are|you|for|with|that|this|from|not|can|will|have|it|to|of|test|tests|file|files|line|lines|done|change|changes|fixed|added|error|errors|found|now)\b/gi,Hn=/rz|cz|sz|dz|szcz/gi,Wn=/\w+(?:ono|ano|ęto|eto|uje|ują|uję|liśmy|lismy)\b/gi;function ce(e,t){return e.match(t)?.length??0}function $t(e,t="en"){if(Gn.test(e))return"pl";let n=ce(e,Kn)+ce(e,Hn)+ce(e,Wn),s=ce(e,Un);return n===s?t:n>s?"pl":"en"}var D={en:["zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"],pl:["zero","jeden","dwa","trzy","cztery","pi\u0119\u0107","sze\u015B\u0107","siedem","osiem","dziewi\u0119\u0107","dziesi\u0119\u0107","jedena\u015Bcie","dwana\u015Bcie","trzyna\u015Bcie","czterna\u015Bcie","pi\u0119tna\u015Bcie","szesna\u015Bcie","siedemna\u015Bcie","osiemna\u015Bcie","dziewi\u0119tna\u015Bcie"]},je={en:["","","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"],pl:["","","dwadzie\u015Bcia","trzydzie\u015Bci","czterdzie\u015Bci","pi\u0119\u0107dziesi\u0105t","sze\u015B\u0107dziesi\u0105t","siedemdziesi\u0105t","osiemdziesi\u0105t","dziewi\u0119\u0107dziesi\u0105t"]},Jn=["","sto","dwie\u015Bcie","trzysta","czterysta","pi\u0119\u0107set","sze\u015B\u0107set","siedemset","osiemset","dziewi\u0119\u0107set"],qn=["","thousand","million","billion","trillion"],Zn=[null,["tysi\u0105c","tysi\u0105ce","tysi\u0119cy"],["milion","miliony","milion\xF3w"],["miliard","miliardy","miliard\xF3w"],["bilion","biliony","bilion\xF3w"]],Qn={en:"point",pl:"przecinek"},Yn={en:"dot",pl:"kropka"},Xn={en:"percent",pl:"procent"};function ei(e){if(e===1)return 0;let t=e%10,n=e%100;return t>=2&&t<=4&&!(n>=12&&n<=14)?1:2}function Te(e,t){let n=[],s=Math.floor(e/100),i=e%100;if(s>0&&(t==="pl"?n.push(Jn[s]??""):n.push(`${D.en[s]} hundred`)),i>0)if(i<20)n.push(D[t][i]??"");else{let r=Math.floor(i/10),o=i%10;t==="en"?n.push(o>0?`${je.en[r]}-${D.en[o]}`:je.en[r]??""):(n.push(je.pl[r]??""),o>0&&n.push(D.pl[o]??""))}return n.filter(Boolean).join(" ")}function ti(e,t){if(e===0)return D[t][0]??"zero";let n=[],s=e;for(;s>0;)n.push(s%1e3),s=Math.floor(s/1e3);let i=[];for(let r=n.length-1;r>=0;r-=1){let o=n[r];if(o){if(r===0){i.push(Te(o,t));continue}if(t==="en")i.push(Te(o,"en"),qn[r]??"");else{let a=Zn[r];if(!a)continue;o!==1&&i.push(Te(o,"pl")),i.push(a[ei(o)])}}}return i.filter(Boolean).join(" ")}var Et=(e,t)=>e.split("").map(n=>D[t][Number(n)]??"").filter(Boolean).join(" ");function Be(e,t){return e.length>15||e.length>1&&e.startsWith("0")?Et(e,t):ti(Number(e),t)}function ni(e,t,n){return`${Be(e,n)} ${Qn[n]} ${Et(t,n)}`}function ii(e,t){let n=e.replace(/[ \u00A0\u202F\u2009]/g,"");if(t==="en")n=n.replace(/,/g,"");else if(n.includes(",")){n=n.replace(/\./g,"");let i=n.indexOf(",");n=`${n.slice(0,i)}.${n.slice(i+1).replace(/,/g,"")}`}let s=(n.match(/\./g)??[]).length;if(s===0)return Be(n,t);if(s===1){let[i="",r=""]=n.split(".");return ni(i,r,t)}return n.split(".").map(i=>Be(i,t)).join(` ${Yn[t]} `)}var si=/(?<![A-Za-z0-9_])(?<![A-Za-z0-9_]\.)(\d{1,3}(?:[ \u00A0\u202F\u2009]\d{3})+(?:[.,]\d+)?|\d+(?:[.,]\d+)*)(\s*%)?/g;function Lt(e,t){return e.replace(si,(n,s,i)=>{let r=ii(s,t);return i?`${r} ${Xn[t]}`:r})}var le=700,oi=3,Ve=e=>/^\s{0,3}(?:```|~~~)/.test(e),Ct=e=>/^\s{0,3}#{1,6}\s/.test(e),Ne=e=>/^\s*\|.*\|\s*$/.test(e),It=e=>/^\s{0,3}(?:[-*_]\s*){3,}$/.test(e),Oe=e=>/^\s{0,3}(?:[-*+]|\d+[.)])\s+/.test(e),Mt=e=>e.trim()==="";function ri(e){let t=e.split(`
`),n=[],s=0;for(;s<t.length;){let i=t[s]??"";if(Mt(i)){s+=1;continue}if(Ve(i)){let c=[i];for(s+=1;s<t.length&&!Ve(t[s]??"");)c.push(t[s]??""),s+=1;s<t.length&&(c.push(t[s]??""),s+=1),n.push({kind:"code",lines:c});continue}if(It(i)){n.push({kind:"rule",lines:[i]}),s+=1;continue}if(Ct(i)){n.push({kind:"heading",lines:[i]}),s+=1;continue}let r=Ne(i)?"table":Oe(i)?"list":"paragraph",o=c=>Mt(c)||Ve(c)||Ct(c)||It(c)?!1:r==="table"?Ne(c):r==="list"?!0:!Ne(c)&&!Oe(c),a=[];for(;s<t.length&&o(t[s]??"");)a.push(t[s]??""),s+=1;n.push({kind:r,lines:a})}return n}var At=new Set(["heading","list","paragraph"]),T=e=>e.lines.join(`
`).trim();function ai(e){let t=e.filter(r=>At.has(r.kind));if(t.length===0)return"";let n=[],s=0;for(let r=t.length-1;r>=0;r-=1){let o=t[r];if(!o)continue;let a=T(o).length;if(n.length>0&&s+a>le||(n.unshift(o),s+=a,o.kind==="heading"))break}let i=n.map(T).join(`

`);return n.length===1&&i.length>le?ci(i):i}function ci(e,t=le){let n=N(e),s=[],i=0;for(let r=n.length-1;r>=0;r-=1){let o=n[r];if(o){if(s.length>0&&i+o.length>t)break;s.unshift(o),i+=o.length}}return s.join(" ")}function De(e){return/\*\*[^*]+\*\*/.test(e)||/__[^_]+__/.test(e)}function li(e){let t=e.filter(r=>At.has(r.kind)),n=t[t.length-1],s=t.length===1?t[0]:void 0;if(s&&s.kind==="paragraph"&&T(s).length>le){let r=N(T(s).replace(/\n/g," "));return r.filter((o,a)=>a===0||a===r.length-1||De(o)).join(" ")}let i=[];for(let r of t){if(r.kind==="heading"){i.push(T(r));continue}if(r.kind==="list"){let c=r.lines.filter(d=>Oe(d)),l=c.filter(De);i.push((l.length>0?l:c.slice(0,oi)).join(`
`));continue}if(r===n){i.push(T(r));continue}let a=N(T(r).replace(/\n/g," ")).filter((c,l)=>l===0||De(c));a.length>0&&i.push(a.join(" "))}return i.filter(Boolean).join(`

`)}function Pt(e,t){if(t==="full")return e;let n=ri(e);return t==="ending"?ai(n):li(n)}var di=[["\u2318","command "],["\u2325","option "],["\u21E7","shift "],["\u2303","control "],["\u2423"," "],["\u23CE","enter "],["\u238B","escape "],["\u2192",", "],["\u2190",", "],["\u21D2",", "],["\xB7",", "],["\u2713","ok"],["\u2705","ok"],["\u274C","no"]],ui=/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]/gu,pi=/[\uE000-\uF8FF]|[\u{F0000}-\u{FFFFD}]|[\u{100000}-\u{10FFFD}]/gu,gi=/\b(?:https?|ftp):\/\/[^\s<>\[\]()]+|\bwww\.[^\s<>\[\]()]+/gi,mi=/<\s*(?:https?|ftp):\/\/[^>\s]+>/gi,fi=/\bmailto:[^\s<>\[\]()]+/gi,vi=/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,hi=/\b(?:[a-z0-9-]+\.)+(?:com|org|net|io|dev|pl|ai|app|co|edu|gov|uk|de|eu|us|info|me|xyz)\/[^\s<>\[\]()]*/gi;function yi(e){let t=e.trim();return!t||/^(?:https?|ftp):\/\//i.test(t)||/^www\./i.test(t)||/^mailto:/i.test(t)?!0:/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(t)}function Ft(e){let t=e.replace(/[.,;:!?]+$/u,"");return e.slice(t.length)||" "}function bi(e){let t=e;return t=t.replace(mi," "),t=t.replace(/\[([^\]]*)\]\([^)]*\)/g,(n,s)=>yi(s)?" ":s),t=t.replace(gi,Ft),t=t.replace(hi,Ft),t=t.replace(fi," "),t=t.replace(vi," "),t}function ki(e){return e.replace(/[\w.~-]*\/(?:[\w.-]+\/)*([\w-]+\.[A-Za-z0-9]{1,5})\b/g,"$1").replace(/(?:~|\.{0,2})?\/(?:[\w.-]+\/){2,}([\w.-]+)/g,"$1")}function wi(e){let t=e;for(let[n,s]of di)t=t.split(n).join(s);return t=t.replace(ui,""),t=t.replace(/\s*,\s*,\s*/g,", "),t.replace(/\s+([,.;:!?])/g,"$1")}function Si(e,t){if(t<=0||e.length<=t)return e;let n=e.slice(0,t),s=Math.max(n.lastIndexOf(". "),n.lastIndexOf("! "),n.lastIndexOf("? "));return`${s>t*.4?n.slice(0,s+1):n.trimEnd()}\u2026`}function zt(e,t={}){let{maxCharacters:n=0,skipCodeBlocks:s=!0}=t,i=e.replace(pi,"");s&&(i=i.replace(/```[\s\S]*?```/g," "),i=i.replace(/^[ \t]*\|.*\|[ \t]*$/gm,"")),i=i.replace(/!\[[^\]]*\]\([^)]*\)/g," "),i=bi(i),i=i.replace(/^[ \t]{0,3}(?:[-*_][ \t]*){3,}$/gm,""),i=i.replace(/`([^`]*)`/g,"$1"),i=i.replace(/^[ \t]{0,3}#{1,6}[ \t]*(.+?)[ \t]*$/gm,(a,c)=>`${c.replace(/[.:]+$/,"")}.`),i=i.replace(/^[ \t]{0,3}[-*+][ \t]+/gm,""),i=i.replace(/^[ \t]{0,3}\d+[.)][ \t]+/gm,""),i=i.replace(/\*\*([^*]+)\*\*/g,"$1"),i=i.replace(/(?<!\w)[*_]([^*_]+)[*_](?!\w)/g,"$1"),i=ki(i),i=wi(i),i=i.replace(/[ \t]+/g," ");let r=i.split(/\n\s*\n/).map(a=>a.split(/\s+/).filter(Boolean).join(" ")).filter(a=>a.length>0);if(r.length===0)return"";let o=r.map(a=>/[.!?:…]$/.test(a)?a:`${a}.`).join(" ");return Si(o,n).trim()}var y=f(require("vscode"));var I=f(require("vscode"));async function jt(e){await I.env.openExternal(I.Uri.parse(`${I.env.uriScheme}://settings/${encodeURIComponent(e)}`))||await I.commands.executeCommand("workbench.action.openSettings",e)}var xi=200,$i="https://open.spotify.com/album/0oKFlySlL4IJCb9L1Wz5GY?si=bHh1TGHNSmeRAyXcmaiMyA",Ei="https://elevenlabs.io/app/voice-lab",Li="https://ko-fi.com/larspunx",Ci="chuidaimosdemo@gmail.com",Tt="Hi! This is Coding Voice. I read out the summary of every answer as soon as the agent finishes, so you can keep your eyes off the screen. What you are hearing right now is a quick voice test using your current settings. By default I use your computer's built-in system voice, which is free and works offline. In the settings below you can switch the voice, change the language, and adjust the speed and volume. Any change you make applies here and to every answer I read. Enjoy!";function Bt(e,t){let n,s,i=(c,l)=>{let d=Math.max(0,Math.min(100,Math.round(c)));if(P("volume",d),s&&clearTimeout(s),l){t.restartUtterance();return}s=setTimeout(()=>t.restartUtterance(),xi)},r=async()=>({...h(),hasElevenLabsKey:!!await e.getApiKey("elevenlabs")}),o=async()=>{n&&await n.webview.postMessage({type:"state",state:await r()})};return{open:()=>{if(n){n.reveal(y.ViewColumn.Active),o();return}n=y.window.createWebviewPanel("codingVoiceSettings","Coding Voice \u2014 Settings",y.ViewColumn.Active,{enableScripts:!0,retainContextWhenHidden:!0}),n.webview.html=zi(),n.webview.onDidReceiveMessage(async c=>{let l=c.type;if(l==="ready")await o();else if(l==="set")await P(c.key,c.value);else if(l==="volume")i(Number(c.value),!!c.commit);else if(l==="apiKey"){let d=c.engine,p=String(c.value??"").trim();await e.setApiKey(d,p||void 0),y.window.showInformationMessage(p?"API key saved.":"API key removed."),await o()}else if(l==="playTest")t.speakNew(Tt);else if(l==="diagnostics"){let d=await y.workspace.openTextDocument(y.Uri.file(V));await y.window.showTextDocument(d)}else if(l==="rawSettings")await jt("@ext:larspunx.coding-voice");else if(l==="music")await y.env.openExternal(y.Uri.parse($i));else if(l==="voiceDesign")await y.env.openExternal(y.Uri.parse(Ei));else if(l==="kofi")await y.env.openExternal(y.Uri.parse(Li));else if(l==="feedback"){let d=encodeURIComponent("Coding Voice \u2014 feedback"),p=encodeURIComponent(`A bug, an idea, or just hi \u2014 anything helps.

(If it's a bug, your OS and Coding Voice version make it easier to track down.)
`);await y.env.openExternal(y.Uri.parse(`mailto:${Ci}?subject=${d}&body=${p}`))}}),n.onDidDispose(()=>{s&&clearTimeout(s),n=void 0})},refresh:()=>void o(),dispose:()=>{s&&clearTimeout(s),n?.dispose()}}}var Ii=["full","essentials","ending"],Mi=["system","elevenlabs"],Ai=["female","male"],Pi=["auto","en","pl"];function Fi(){let e="",t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";for(let n=0;n<32;n++)e+=t.charAt(Math.floor(Math.random()*t.length));return e}function zi(){let e=Fi();return`<!DOCTYPE html>
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
  .feedback {
    display: inline-flex; align-items: center; gap: 8px;
    background: transparent; color: var(--vscode-foreground);
    border: 1px solid var(--vscode-button-border, rgba(128,128,128,0.4));
    border-radius: 999px; padding: 7px 16px;
    font-family: inherit; font-size: 12px; font-weight: 600; cursor: pointer;
  }
  .feedback:hover { background: rgba(128,128,128,0.12); }
  .footer .fb-note { margin: 0; font-size: 11px; opacity: 0.55; }
</style>
</head>
<body>
  <div class="wrap">
    <h1>Coding Voice</h1>
    <p class="sub">Every setting in one place. Changes apply immediately.</p>

    <div class="group">Voice test</div>
    <div class="test">
      <p class="test-text">${Tt}</p>
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
      <div class="label"><span class="name">Quiet other apps while reading</span><span class="desc">Lower music/video while a summary plays, then restore it to the exact level it was.</span></div>
      <div class="control"><input type="checkbox" id="duckSystemAudio" /></div>
    </div>
    <div class="hint"><b>Windows:</b> every app is lowered per app \u2014 including a browser playing YouTube.
      <b>macOS:</b> Music, TV, Spotify and Swinsian are lowered automatically. A browser tab (YouTube
      in Chrome/Safari) can't be \u2014 macOS has no public API to control a browser's volume, so that one
      audio source keeps playing at its level.</div>

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

    <div class="group">Notifications</div>

    <div class="row">
      <div class="label"><span class="name">Ring when the agent needs you</span><span class="desc">Play a short chime when a turn ends with nothing to read \u2014 a question, a plan, or just edits. Catches decision points that pass silently.</span></div>
      <div class="control"><input type="checkbox" id="ring" /></div>
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
        Enjoy the extension. Listen to my music.</p>
      <p class="note">And if this tool saves you some time, you can buy me a coffee.</p>
      <p class="note signoff">Cheers, Lars</p>
      <div class="buttons">
        <button id="music" class="spotify"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 12V4l7 1.6"/><circle cx="4.4" cy="12" r="1.6"/><circle cx="11.4" cy="10.6" r="1.6"/></svg>Listen on Spotify</button>
        <button id="kofi" class="kofi"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h8v3.5a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z"/><path d="M11 7h1.6a1.6 1.6 0 0 1 0 3.2H11"/><path d="M5 2.5v1.6M8 2.5v1.6"/></svg>Buy me a coffee</button>
        <button id="feedback" class="feedback"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="3.5" width="12" height="9" rx="1.5"/><path d="M2.5 4.5 8 8.5l5.5-4"/></svg>Send feedback</button>
      </div>
      <p class="note fb-note">Feedback and ideas are always welcome \u2014 it's just me, and I read every one.</p>
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
  $('ring').addEventListener('change', (e) => set('ring', e.target.checked));
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
  $('feedback').addEventListener('click', () => vscode.postMessage({ type: 'feedback' }));
  $('voiceDesign').addEventListener('click', () => vscode.postMessage({ type: 'voiceDesign' }));

  const draggingVolume = () => document.activeElement === $('volume');

  window.addEventListener('message', (event) => {
    const msg = event.data;
    if (!msg || msg.type !== 'state') return;
    const s = msg.state;
    $('enabled').checked = s.enabled;
    $('skipCodeBlocks').checked = s.skipCodeBlocks;
    $('announceProject').checked = s.announceProject;
    $('ring').checked = s.ring;
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
</html>`}var M=f(require("vscode"));var de={power:1003,playback:1002,volume:1001,settings:1e3},ji=new M.ThemeColor("charts.green"),Ti=new M.ThemeColor("charts.red"),Bi=new M.ThemeColor("statusBarItem.warningBackground"),Vt=6;function Vi(e){let t=Math.max(0,Math.min(100,e)),n=Math.round(t/100*Vt);return`${"\u2500".repeat(n)}\u25CF${"\u2500".repeat(Vt-n)}`}function Nt(e){let t=(c,l,d)=>{let p=M.window.createStatusBarItem(M.StatusBarAlignment.Left,c);return p.name=l,p.command=d,p},n=t(de.power,"Coding Voice: reading","codingVoice.toggleEnabled"),s=t(de.playback,"Coding Voice: playback","codingVoice.playPause"),i=t(de.volume,"Coding Voice: volume","codingVoice.setVolume"),r=t(de.settings,"Coding Voice: settings","codingVoice.openSettings");r.text="$(gear)",r.tooltip="Coding Voice settings";function o(){let{enabled:c,volume:l}=h();n.text=c?"$(unmute)":"$(mute)",n.color=c?ji:Ti,n.tooltip=c?"Reading aloud is on \u2014 click to turn it off":"Reading aloud is off \u2014 click to turn it on",n.show();let d=e.state==="speaking";s.text=d?"$(debug-pause)":"$(play)",s.backgroundColor=d?Bi:void 0,s.tooltip=d?"Pause":e.state==="paused"?"Resume":"Play the last answer from the start",s.show(),i.text=`${Vi(l)} ${Math.round(l)}%`,i.tooltip="Reading volume \u2014 click to open the slider in the panel",i.show(),r.show()}o();let a=e.onChange(o);return{refresh:o,dispose:()=>M.Disposable.from(n,s,i,r,a).dispose()}}var Dt=f(require("vscode"));var Ni="codingVoice.volumeView",Di=200;function Ot(e){let t,n,s=(o,a)=>{let c=Math.max(0,Math.min(100,Math.round(o)));if(P("volume",c),n&&clearTimeout(n),a){e.restartUtterance();return}n=setTimeout(()=>e.restartUtterance(),Di)};return{provider:{resolveWebviewView(o){t=o,o.webview.options={enableScripts:!0},o.webview.html=Ri(h().volume),o.webview.onDidReceiveMessage(a=>{a.type==="input"&&typeof a.value=="number"?s(a.value,!1):a.type==="change"&&typeof a.value=="number"&&s(a.value,!0)}),o.onDidDispose(()=>{t=void 0})}},open:()=>void Dt.commands.executeCommand(`${Ni}.focus`),refresh:()=>{t?.webview.postMessage({type:"volume",value:Math.round(h().volume)})},dispose:()=>{n&&clearTimeout(n)}}}function Oi(){let e="",t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";for(let n=0;n<32;n++)e+=t.charAt(Math.floor(Math.random()*t.length));return e}function Ri(e){let t=Oi(),n=Math.round(Math.max(0,Math.min(100,e)));return`<!DOCTYPE html>
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
  .note { font-size: 10.5px; opacity: 0.4; line-height: 1.5; }
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
    <div class="note">If nothing is playing, the new level starts with the next answer.</div>
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
</html>`}var O;function _i(e){He();let t=new te(e.secrets);xt();let n=ht({apiKey:()=>t.getApiKey("elevenlabs"),refreshApiKey:()=>t.refreshFromDisk("elevenlabs"),voiceIdOverride:()=>h().elevenLabsVoiceId.trim()||void 0,voiceSettings:()=>{let u=h();return{stability:u.elevenLabsStability,similarity:u.elevenLabsSimilarity,style:u.elevenLabsStyle,speakerBoost:u.elevenLabsSpeakerBoost}}}),s=()=>h().engine==="elevenlabs"?n:St,i=new ie({engine:s,options:u=>{let w=h(),B=w.language==="auto"?$t(u,"en"):w.language;return nt(w,B)},transform:(u,w)=>Lt(u,w.language),onError:u=>{k.window.showErrorMessage(`Coding Voice: ${u.message}`)}}),r=tt(),o=!1,a=!1,c;O=new se(()=>{let u=h();return{enabled:u.duckSystemAudio,level:u.duckLevel,fadeMs:u.duckFade}});let l=i.onChange(()=>{i.state==="speaking"?O?.engage():O?.release(),i.state!=="speaking"&&o&&(o=!1,r.release())}),d=Nt(i),p=Ot(i),v=Bt(t,i);try{Ye(e.extensionPath)}catch(u){k.window.showErrorMessage(`Coding Voice could not register its hooks: ${String(u)}`)}let b=u=>{if(ue.writeFile(fe,u,()=>{}),o){i.speakNew(u);return}c=u,!a&&(a=!0,r.acquire().then(()=>{a=!1;let w=c;if(c=void 0,w===void 0||!h().enabled){r.release();return}o=!0,i.speakNew(w)}).catch(()=>{a=!1}))},L=new Set,q=()=>{L.clear();for(let u of k.workspace.workspaceFolders??[])L.add(lt(u.uri.fsPath))};q(),e.subscriptions.push(k.workspace.onDidChangeWorkspaceFolders(q));let pe=1e4,ge={key:"",at:0},_t=ke(u=>{let w=h();if(!w.enabled)return;let B=zt(Pt(u,w.scope),{maxCharacters:w.maxCharacters,skipCodeBlocks:w.skipCodeBlocks});if(!B)return;let _e=Date.now(),Ge=B.replace(/\s+/g," ").trim();if(Ge===ge.key&&_e-ge.at<pe)return;ge={key:Ge,at:_e};let Ke=k.workspace.workspaceFolders?.[0]?.name,Ht=w.announceProject&&Ke?`${Ke}. ${B}`:B;b(Ht)},L),Gt=Rt.join(e.extensionPath,"assets","ring.mp3"),Kt=2500,Re=0,Ut=ke(()=>{if(!h().ring)return;let u=Date.now();u-Re<Kt||(Re=u,at(Gt,Math.max(0,Math.min(1,h().volume/100)),new AbortController().signal).catch(()=>{}))},L,Je);e.subscriptions.push(d,p,v,k.window.registerWebviewViewProvider("codingVoice.volumeView",p.provider,{webviewOptions:{retainContextWhenHidden:!0}}),_t,Ut,k.commands.registerCommand("codingVoice.setVolume",()=>p.open()),k.commands.registerCommand("codingVoice.playPause",async()=>{if(!h().enabled){let u="Turn reading on";await k.window.showInformationMessage("Coding Voice: reading aloud is off, so nothing will be spoken.",u)===u&&await P("enabled",!0);return}if(i.state==="idle"&&!i.canReplay){let u="";try{u=ue.readFileSync(fe,"utf8")}catch{}if(u.trim()){b(u);return}k.window.showInformationMessage("Coding Voice: nothing to read yet \u2014 the next agent answer will be read aloud.");return}i.toggle()}),k.commands.registerCommand("codingVoice.stop",()=>i.stop()),k.commands.registerCommand("codingVoice.toggleEnabled",async()=>{let u=!h().enabled;await P("enabled",u),u||i.stop()}),k.commands.registerCommand("codingVoice.openSettings",()=>v.open()),k.commands.registerCommand("codingVoice.setApiKey",()=>v.open()),k.workspace.onDidChangeConfiguration(u=>{it(u)&&(d.refresh(),p.refresh(),v.refresh(),h().duckSystemAudio||O?.release())}),l,{dispose:()=>void O?.dispose()},{dispose:()=>r.dispose()})}function Gi(){return O?.dispose()}0&&(module.exports={activate,deactivate});
