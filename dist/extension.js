"use strict";var st=Object.create;var R=Object.defineProperty;var at=Object.getOwnPropertyDescriptor;var rt=Object.getOwnPropertyNames;var ct=Object.getPrototypeOf,lt=Object.prototype.hasOwnProperty;var dt=(e,t)=>{for(var n in t)R(e,n,{get:t[n],enumerable:!0})},be=(e,t,n,i)=>{if(t&&typeof t=="object"||typeof t=="function")for(let o of rt(t))!lt.call(e,o)&&o!==n&&R(e,o,{get:()=>t[o],enumerable:!(i=at(t,o))||i.enumerable});return e};var f=(e,t,n)=>(n=e!=null?st(ct(e)):{},be(t||!e||!e.__esModule?R(n,"default",{value:e,enumerable:!0}):n,e)),pt=e=>be(R({},"__esModule",{value:!0}),e);var Tn={};dt(Tn,{activate:()=>An,deactivate:()=>Bn});module.exports=pt(Tn);var Y=f(require("node:fs")),y=f(require("vscode"));var g=f(require("node:fs")),I=f(require("node:path")),ne=f(require("node:os"));var D=f(require("node:fs")),Z=f(require("node:os")),w=f(require("node:path")),u=w.join(Z.homedir(),".cursor","coding-voice");function ke(){D.mkdirSync(u,{recursive:!0,mode:448});try{D.chmodSync(u,448)}catch{}}var _=w.join(Z.homedir(),".cursor","cursor-voice"),Nn=w.join(u,"pending.txt"),On=w.join(u,"pending-ws.txt"),j=w.join(u,"queue"),X=w.join(u,"last-spoken.txt"),Fn=w.join(u,"last-payload.json"),A=w.join(u,"hook.log"),K=e=>w.join(u,`apikey-${e}`),ee=w.join(u,"hook.js");function we(e){let t=process.platform==="win32"?"cmd":"sh";return w.join(u,`hook-${e}.${t}`)}var E=I.join(ne.homedir(),".cursor","hooks.json"),V=I.join(ne.homedir(),".claude","settings.json"),ut=5,Se=5;function gt(e){let t=I.join(e,"dist","hook.js");try{return g.mkdirSync(u,{recursive:!0}),g.copyFileSync(t,ee),ee}catch{return t}}function te(e,t,n){let i=we(e),o=process.platform==="win32"?["@echo off",`if not exist "${n}" (`,`  echo launcher: brak "${n}" - hook nie wystartowal>>"${A}"`,"  exit /b 0",")","set ELECTRON_RUN_AS_NODE=1",`"${t}" "${n}" ${e}`,""].join(`\r
`):["#!/bin/sh","# Generowane przez rozszerzenie Coding Voice \u2014 r\u0119czne zmiany zostan\u0105 nadpisane.",`if [ ! -f "${n}" ]; then`,`  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) launcher: brak ${n} \u2014 hook nie wystartowa\u0142" >> "${A}"`,"  exit 0","fi",`ELECTRON_RUN_AS_NODE=1 exec "${t}" "${n}" ${e}`,""].join(`
`);return g.mkdirSync(u,{recursive:!0}),g.writeFileSync(i,o,"utf8"),process.platform!=="win32"&&g.chmodSync(i,493),i}function mt(){try{let e=JSON.parse(g.readFileSync(E,"utf8"));if(typeof e=="object"&&e!==null&&!Array.isArray(e))return e}catch{if(g.existsSync(E))try{g.copyFileSync(E,`${E}.broken-backup`)}catch{}}return{}}function vt(e){return typeof e.command!="string"?!1:e.command.includes(u)||e.command.includes(_)}function ft(){try{g.rmSync(_,{recursive:!0,force:!0})}catch{}}function ht(e,t){let n=te("claude",e,t),i={};if(g.existsSync(V))try{let l=JSON.parse(g.readFileSync(V,"utf8"));if(typeof l!="object"||l===null||Array.isArray(l))return!1;i=l}catch{return!1}let o={...i.hooks??{}},a=JSON.stringify(o),s=(o.Stop??[]).map(l=>({...l,hooks:(l.hooks??[]).filter(p=>typeof p.command!="string"||!(p.command.includes(u)||p.command.includes(_)))})).filter(l=>(l.hooks??[]).length>0);if(o.Stop=[...s,{hooks:[{type:"command",command:n,timeout:Se}]}],JSON.stringify(o)===a)return!1;let r={...i,hooks:o};g.mkdirSync(I.dirname(V),{recursive:!0});let c=`${V}.tmp`;return g.writeFileSync(c,`${JSON.stringify(r,null,2)}
`,"utf8"),g.renameSync(c,V),!0}function xe(e,t=process.execPath){let n=gt(e),i=te("capture",t,n),o=te("speak",t,n),a=ht(t,n),s=mt(),r={...s.hooks??{}},c=JSON.stringify(r),l=d=>(r[d]??[]).filter(v=>!vt(v));if(r.afterAgentResponse=[...l("afterAgentResponse"),{command:i,timeout:ut}],r.stop=[...l("stop"),{command:o,timeout:Se}],ft(),JSON.stringify(r)===c)return{changed:a,hooksFile:E};let p={...s,version:s.version??1,hooks:r};g.mkdirSync(I.dirname(E),{recursive:!0});let m=`${E}.tmp`;return g.writeFileSync(m,`${JSON.stringify(p,null,2)}
`,"utf8"),g.renameSync(m,E),{changed:!0,hooksFile:E}}var k=f(require("node:fs")),oe=f(require("node:path"));var yt=1e3,$e=5*60*1e3,Ee=".claim.";function bt(e){let t=oe.join(j,e);try{Date.now()-k.statSync(t).mtimeMs>$e&&k.rmSync(t,{force:!0})}catch{}}function kt(e){let t=e.replace(/\.txt$/,"").split("-");return t.length>=3?t[2]??"":""}function Le(e,t=new Set){k.mkdirSync(j,{recursive:!0});let n=!1,i=()=>{if(!n){n=!0;try{for(let s of k.readdirSync(j).sort()){if(s.includes(Ee)){bt(s);continue}if(!s.endsWith(".txt"))continue;let r=kt(s);if(r&&!t.has(r))continue;let c=oe.join(j,s),l=`${c}${Ee}${process.pid}`;try{k.renameSync(c,l)}catch{continue}let p="";try{p=k.readFileSync(l,"utf8")}catch{}k.rmSync(l,{force:!0});let m=Number.parseInt(s.split("-")[0]??"",10);Number.isFinite(m)&&Date.now()-m>$e||p.trim()&&e(p)}}catch{}finally{n=!1}}},o;try{o=k.watch(j,()=>i())}catch{}let a=setInterval(i,yt);return i(),{dispose:()=>{o?.close(),clearInterval(a)}}}var N=f(require("vscode")),ie="codingVoice";function b(){let e=N.workspace.getConfiguration(ie);return{enabled:e.get("enabled",!0),engine:e.get("engine","system"),scope:e.get("scope","full"),voice:e.get("voice","female"),elevenLabsVoiceId:e.get("elevenLabsVoiceId",""),elevenLabsStability:e.get("elevenLabsStability",.5),elevenLabsSimilarity:e.get("elevenLabsSimilarity",.75),elevenLabsStyle:e.get("elevenLabsStyle",0),elevenLabsSpeakerBoost:e.get("elevenLabsSpeakerBoost",!0),language:e.get("language","auto"),rate:e.get("rate",1),volume:e.get("volume",100),maxCharacters:e.get("maxCharacters",0),skipCodeBlocks:e.get("skipCodeBlocks",!0),announceProject:e.get("announceProject",!1)}}async function $(e,t){await N.workspace.getConfiguration(ie).update(e,t,N.ConfigurationTarget.Global)}function Ce(e,t){return{language:e.language==="auto"?t:e.language,voice:e.voice,rate:e.rate,volume:Math.max(0,Math.min(1,e.volume/100))}}function ze(e){return e.affectsConfiguration(ie)}var L=f(require("node:fs"));var H=e=>`codingVoice.apiKey.${e}`,U=class{constructor(t){this.storage=t}async getApiKey(t){let n=await this.storage.get(H(t));if(n)return this.mirrorToDisk(t,n),n;try{let i=L.readFileSync(K(t),"utf8").trim();if(i)return await this.storage.store(H(t),i),i}catch{}}mirrorToDisk(t,n){let i=K(t);try{let o="";try{o=L.readFileSync(i,"utf8")}catch{}o!==n&&L.writeFileSync(i,n,{encoding:"utf8",mode:384})}catch{}}async setApiKey(t,n){let i=K(t);if(n){await this.storage.store(H(t),n);try{L.writeFileSync(i,n,{encoding:"utf8",mode:384})}catch{}}else{await this.storage.delete(H(t));try{L.rmSync(i,{force:!0})}catch{}}}};function Ie(e){let t=(e??"").trim().replace(/\/+$/,"");if(!t)return"";let n=5381;for(let i=0;i<t.length;i+=1)n=(n<<5)+n+t.charCodeAt(i)>>>0;return n.toString(36)}var wt=/(?<![A-ZĄĆĘŁŃÓŚŹŻ])(?<!\b(?:np|itp|itd|tzn|tj|dr|inż|mgr|ok|ang|str|nr|vs|etc|e\.g|i\.e))([.!?…])\s+/gu,Me="\0";function B(e){return e.replace(wt,`$1${Me}`).split(Me).map(t=>t.trim()).filter(Boolean)}var St=320;function Pe(e,t=St){let n=e.trim();if(!n)return[];let i=B(n),o=[],a="";for(let s of i){if(s.length>=t){a&&(o.push(a),a=""),o.push(s);continue}let r=a?`${a} ${s}`:s;r.length>t?(o.push(a),a=s):a=r}return a&&o.push(a),o}var G=class{constructor(t){this.deps=t}utterances=[];index=0;currentState="idle";abort;run=0;running;listeners=new Set;get state(){return this.currentState}get canReplay(){return this.utterances.length>0}onChange(t){return this.listeners.add(t),{dispose:()=>this.listeners.delete(t)}}setState(t){if(this.currentState!==t){this.currentState=t;for(let n of this.listeners)n()}}speakNew(t){let n=Pe(t);n.length!==0&&(this.cancel(),this.utterances=n,this.index=0,this.start())}replay(){this.utterances.length!==0&&(this.cancel(),this.index=0,this.start())}toggle(){this.currentState==="speaking"?this.pause():this.currentState==="paused"?this.start():this.replay()}restartUtterance(){if(this.currentState!=="speaking")return;let t=this.run,n=this.running;this.cancel(),(async()=>(await n,!(this.currentState!=="speaking"||this.run!==t+1)&&this.start()))()}pause(){this.currentState==="speaking"&&(this.abort?.abort(),this.abort=void 0,this.setState("paused"))}stop(){this.cancel(),this.setState("idle")}cancel(){this.run+=1,this.abort?.abort(),this.abort=void 0}start(){this.run+=1,this.setState("speaking"),this.running=this.loop(this.run),this.running}async loop(t){for(;t===this.run&&this.index<this.utterances.length;){let n=this.utterances[this.index];if(n===void 0)break;let i=new AbortController;this.abort=i;let o=this.deps.options(n),a=this.deps.transform?this.deps.transform(n,o):n;try{await this.deps.engine().speak(a,o,i.signal)}catch(s){if(t!==this.run)return;this.setState("idle"),this.deps.onError(s instanceof Error?s:new Error(String(s)));return}if(i.signal.aborted||t!==this.run)return;this.index+=1}t===this.run&&(this.abort=void 0,this.setState("idle"))}};var O=require("node:child_process"),C=f(require("node:fs")),ae=f(require("node:path")),Ae=require("node:util");var xt=(0,Ae.promisify)(O.execFile);function Et(e){if(process.platform==="win32"&&e.pid!==void 0){(0,O.execFile)("taskkill",["/pid",String(e.pid),"/T","/F"],()=>{});return}e.kill("SIGTERM")}function je(e,t,n){return new Promise((i,o)=>{if(n.aborted)return i();let a=(0,O.spawn)(e,t,{stdio:["ignore","ignore","pipe"]}),s="";a.stderr?.on("data",l=>{s+=l.toString()});let r=()=>Et(a);n.addEventListener("abort",r,{once:!0});let c=l=>{n.removeEventListener("abort",r),l()};a.on("error",l=>c(()=>o(l))),a.on("close",l=>{if(n.aborted||l===0||l===null)return c(i);c(()=>o(new Error(`${e} zako\u0144czy\u0142 si\u0119 kodem ${String(l)}: ${s.trim()}`)))})})}async function $t(e){try{return await xt("which",[e]),!0}catch{return!1}}var Lt=`param([string]$File, [double]$Volume)
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
`,se;function Ct(){if(se)return se;let e=ae.join(u,"play.ps1");return C.mkdirSync(u,{recursive:!0}),C.writeFileSync(e,Lt,"utf8"),se=e,e}async function zt(e,t){let n=Math.max(0,Math.min(1,t));if(process.platform==="darwin")return["/usr/bin/afplay",["-v",n.toFixed(3),e]];if(await $t("ffplay"))return["ffplay",["-nodisp","-autoexit","-loglevel","quiet","-volume",String(Math.round(n*100)),e]];let i=Math.round(n*32768);return["mpg123",["-q","-f",String(i),e]]}async function Be(e,t,n){C.mkdirSync(u,{recursive:!0});let i=ae.join(u,`clip-${Date.now()}-${Math.random().toString(36).slice(2)}.mp3`);C.writeFileSync(i,e);try{if(process.platform==="win32"){let s=Ct();await je("powershell",["-NoProfile","-NonInteractive","-ExecutionPolicy","Bypass","-File",s,"-File",i,"-Volume",Math.max(0,Math.min(1,t)).toFixed(3)],n);return}let[o,a]=await zt(i,t);await je(o,a,n)}finally{C.rm(i,{force:!0},()=>{})}}var It="https://api.elevenlabs.io/v1/text-to-speech",Mt="eleven_turbo_v2_5",Pt="mp3_44100_128",jt={female:"9BWtsMINqrJLrRacOk9x",male:"nPczCjzI2devNBz1zQrb"};function At(e){return Math.max(.7,Math.min(1.2,e))}var Bt={stability:.5,similarity:.75,style:0,speakerBoost:!0},re=e=>Math.max(0,Math.min(1,e)),Tt=12;function Te(e){let t=new Map,n=(a,s)=>{if(t.set(a,s),t.size>Tt){let r=t.keys().next().value;r!==void 0&&t.delete(r)}},i=a=>e.voiceIdOverride?.()||jt[a],o=async(a,s,r,c,l,p,m)=>{let d=await fetch(`${It}/${s}?output_format=${Pt}`,{method:"POST",headers:{"xi-api-key":p,"content-type":"application/json",accept:"audio/mpeg"},body:JSON.stringify({text:a,model_id:Mt,language_code:l,voice_settings:{stability:re(c.stability),similarity_boost:re(c.similarity),style:re(c.style),use_speaker_boost:c.speakerBoost,speed:r}}),signal:m});if(!d.ok){let v=await d.text().catch(()=>""),z=d.status===401?"ElevenLabs rejected the API key \u2014 check it in Coding Voice settings.":d.status===402?`ElevenLabs' free plan blocks its default voices over the API. In ElevenLabs open Voice Design, create a voice (free, category "generated"), then paste its Voice ID in Coding Voice settings \u2014 or upgrade your ElevenLabs plan.`:`ElevenLabs error ${d.status}. ${v.slice(0,200)}`.trim();throw new Error(z)}return Buffer.from(await d.arrayBuffer())};return{id:"elevenlabs",async isAvailable(){return!!await e.apiKey()},async speak(a,s,r){let c=await e.apiKey();if(!c)throw new Error("Add your ElevenLabs API key in Coding Voice settings to use this voice.");let l=i(s.voice),p=At(s.rate),m=e.voiceSettings?.()??Bt,d=`${l}:${s.language}:${p}:${m.stability}:${m.similarity}:${m.style}:${m.speakerBoost}:${a}`,v=t.get(d);if(!v){if(v=await o(a,l,p,m,s.language,c,r),r.aborted)return;n(d,v)}await Be(v,s.volume,r)}}}var F=require("node:child_process"),M=f(require("node:fs")),de=f(require("node:path")),Ne=require("node:util");var Oe=(0,Ne.promisify)(F.execFile),Ve={"pl:female":["Zosia","Ewa"],"pl:male":["Krzysztof","Marek"],"en:female":["Samantha","Ava","Allison","Serena","Karen"],"en:male":["Alex","Daniel","Tom","Fred"]};function Vt(e){if(process.platform==="win32"&&e.pid!==void 0){(0,F.execFile)("taskkill",["/pid",String(e.pid),"/T","/F"],()=>{});return}e.kill("SIGTERM")}function ce(e,t,n,i){return new Promise((o,a)=>{if(n.aborted)return o();let s=(0,F.spawn)(e,t,{stdio:[i===void 0?"ignore":"pipe","ignore","pipe"]}),r="";s.stderr?.on("data",p=>{r+=p.toString()});let c=()=>Vt(s);n.addEventListener("abort",c,{once:!0});let l=p=>{n.removeEventListener("abort",c),p()};s.on("error",p=>l(()=>a(p))),s.on("close",p=>{if(n.aborted||p===0||p===null)return l(o);l(()=>a(new Error(`${e} zako\u0144czy\u0142 si\u0119 kodem ${String(p)}: ${r.trim()}`)))}),i!==void 0&&(s.stdin?.on("error",()=>{}),s.stdin?.end(i,"utf8"))})}async function W(e){let t=process.platform==="win32"?"where":"which";try{return await Oe(t,[e]),!0}catch{return!1}}var le;async function Fe(){if(le)return le;let e=new Map;try{let{stdout:t}=await Oe("/usr/bin/say",["-v","?"]);for(let n of t.split(`
`)){let i=/^(.+?)\s{2,}([a-z]{2})[_-]([A-Z]{2})/.exec(n);if(!i)continue;let[,o,a]=i;if(!o||!a)continue;let s=e.get(a)??[];s.push(o.trim()),e.set(a,s)}}catch{}return le=e,e}function Nt(e){return e.replace(/\[\[/g,"[ [")}async function Ot(e){let n=(await Fe()).get(e.language)??[],i=e.voice==="male"?"female":"male",o=(Ve[`${e.language}:${e.voice}`]??[]).find(s=>n.includes(s));if(o)return o;let a=(Ve[`${e.language}:${i}`]??[]).find(s=>n.includes(s));if(a)return a}var Ft=`param([string]$TextPath, [string]$Culture, [string]$Gender, [int]$Rate, [int]$Volume)
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
`;function Rt(){let e=de.join(u,"speak.ps1");return M.mkdirSync(u,{recursive:!0}),M.writeFileSync(e,Ft,"utf8"),e}async function Dt(e,t){let n=Math.round((t.rate-1)*50);if(await W("spd-say")){let s=t.voice==="male"?"male1":"female1",r=Math.round((t.volume-1)*100);return["spd-say",["-w","-l",t.language,"-t",s,"-r",String(n),"-i",String(r),"--",e]]}let i=t.voice==="male"?"+m3":"+f3",o=Math.round(175*t.rate),a=Math.round(100*t.volume);return["espeak-ng",["-v",`${t.language}${i}`,"-s",String(o),"-a",String(a),"--stdin"]]}var Re={id:"system",async isAvailable(){return process.platform==="darwin"?M.existsSync("/usr/bin/say"):process.platform==="win32"?W("powershell"):await W("spd-say")||await W("espeak-ng")},async speak(e,t,n){if(process.platform==="darwin"){let a=await Ot(t),s=["-r",String(Math.round(190*t.rate))];a&&s.push("-v",a),s.push("-f","-");let r=t.volume<1?`[[volm ${t.volume.toFixed(2)}]]`:"";return ce("/usr/bin/say",s,n,r+Nt(e))}if(process.platform==="win32"){let a=de.join(u,"utterance.txt");M.writeFileSync(a,e,"utf8");let s=Math.max(-10,Math.min(10,Math.round((t.rate-1)*10))),r=t.language==="pl"?"pl-PL":"en-US",c=t.voice==="male"?"Male":"Female";return ce("powershell",["-NoProfile","-NonInteractive","-ExecutionPolicy","Bypass","-File",Rt(),"-TextPath",a,"-Culture",r,"-Gender",c,"-Rate",String(s),"-Volume",String(Math.round(t.volume*100))],n)}let[i,o]=await Dt(e,t);return ce(i,o,n,i==="espeak-ng"?e:void 0)}};function De(){process.platform==="darwin"&&Fe().catch(()=>{})}var _t=/[ąćęłńóśźż]/i,Kt=/\b(?:jest|nie|sie|się|tak|ale|oraz|zeby|żeby|dla|jak|juz|już|tez|też|czy|bo|na|do|to|z|w|mam|masz|sa|są|byl|był|byla|była|gotowe|gotowa|gotowy|plik|pliki|pliku|plikow|blad|bledy|teraz|wiec|więc|przez|przy|ten|ta|te|tego|tym|tych|linia|linie|linii|zmiana|zmiany|zrobione|port)\b/gi,Ht=/\b(?:the|and|is|are|you|for|with|that|this|from|not|can|will|have|it|to|of|test|tests|file|files|line|lines|done|change|changes|fixed|added|error|errors|found|now)\b/gi,Ut=/rz|cz|sz|dz|szcz/gi,Gt=/\w+(?:ono|ano|ęto|eto|uje|ują|uję|liśmy|lismy)\b/gi;function J(e,t){return e.match(t)?.length??0}function _e(e,t="en"){if(_t.test(e))return"pl";let n=J(e,Kt)+J(e,Ut)+J(e,Gt),i=J(e,Ht);return n===i?t:n>i?"pl":"en"}var T={en:["zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"],pl:["zero","jeden","dwa","trzy","cztery","pi\u0119\u0107","sze\u015B\u0107","siedem","osiem","dziewi\u0119\u0107","dziesi\u0119\u0107","jedena\u015Bcie","dwana\u015Bcie","trzyna\u015Bcie","czterna\u015Bcie","pi\u0119tna\u015Bcie","szesna\u015Bcie","siedemna\u015Bcie","osiemna\u015Bcie","dziewi\u0119tna\u015Bcie"]},pe={en:["","","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"],pl:["","","dwadzie\u015Bcia","trzydzie\u015Bci","czterdzie\u015Bci","pi\u0119\u0107dziesi\u0105t","sze\u015B\u0107dziesi\u0105t","siedemdziesi\u0105t","osiemdziesi\u0105t","dziewi\u0119\u0107dziesi\u0105t"]},Wt=["","sto","dwie\u015Bcie","trzysta","czterysta","pi\u0119\u0107set","sze\u015B\u0107set","siedemset","osiemset","dziewi\u0119\u0107set"],Jt=["","thousand","million","billion","trillion"],qt=[null,["tysi\u0105c","tysi\u0105ce","tysi\u0119cy"],["milion","miliony","milion\xF3w"],["miliard","miliardy","miliard\xF3w"],["bilion","biliony","bilion\xF3w"]],Qt={en:"point",pl:"przecinek"},Yt={en:"dot",pl:"kropka"},Zt={en:"percent",pl:"procent"};function Xt(e){if(e===1)return 0;let t=e%10,n=e%100;return t>=2&&t<=4&&!(n>=12&&n<=14)?1:2}function ue(e,t){let n=[],i=Math.floor(e/100),o=e%100;if(i>0&&(t==="pl"?n.push(Wt[i]??""):n.push(`${T.en[i]} hundred`)),o>0)if(o<20)n.push(T[t][o]??"");else{let a=Math.floor(o/10),s=o%10;t==="en"?n.push(s>0?`${pe.en[a]}-${T.en[s]}`:pe.en[a]??""):(n.push(pe.pl[a]??""),s>0&&n.push(T.pl[s]??""))}return n.filter(Boolean).join(" ")}function en(e,t){if(e===0)return T[t][0]??"zero";let n=[],i=e;for(;i>0;)n.push(i%1e3),i=Math.floor(i/1e3);let o=[];for(let a=n.length-1;a>=0;a-=1){let s=n[a];if(s){if(a===0){o.push(ue(s,t));continue}if(t==="en")o.push(ue(s,"en"),Jt[a]??"");else{let r=qt[a];if(!r)continue;s!==1&&o.push(ue(s,"pl")),o.push(r[Xt(s)])}}}return o.filter(Boolean).join(" ")}var Ke=(e,t)=>e.split("").map(n=>T[t][Number(n)]??"").filter(Boolean).join(" ");function ge(e,t){return e.length>15||e.length>1&&e.startsWith("0")?Ke(e,t):en(Number(e),t)}function tn(e,t,n){return`${ge(e,n)} ${Qt[n]} ${Ke(t,n)}`}function nn(e,t){let n=e.replace(/[ \u00A0\u202F\u2009]/g,"");if(t==="en")n=n.replace(/,/g,"");else if(n.includes(",")){n=n.replace(/\./g,"");let o=n.indexOf(",");n=`${n.slice(0,o)}.${n.slice(o+1).replace(/,/g,"")}`}let i=(n.match(/\./g)??[]).length;if(i===0)return ge(n,t);if(i===1){let[o="",a=""]=n.split(".");return tn(o,a,t)}return n.split(".").map(o=>ge(o,t)).join(` ${Yt[t]} `)}var on=/(?<![A-Za-z0-9_])(?<![A-Za-z0-9_]\.)(\d{1,3}(?:[ \u00A0\u202F\u2009]\d{3})+(?:[.,]\d+)?|\d+(?:[.,]\d+)*)(\s*%)?/g;function He(e,t){return e.replace(on,(n,i,o)=>{let a=nn(i,t);return o?`${a} ${Zt[t]}`:a})}var q=700,sn=3,me=e=>/^\s{0,3}(?:```|~~~)/.test(e),Ue=e=>/^\s{0,3}#{1,6}\s/.test(e),ve=e=>/^\s*\|.*\|\s*$/.test(e),Ge=e=>/^\s{0,3}(?:[-*_]\s*){3,}$/.test(e),he=e=>/^\s{0,3}(?:[-*+]|\d+[.)])\s+/.test(e),We=e=>e.trim()==="";function an(e){let t=e.split(`
`),n=[],i=0;for(;i<t.length;){let o=t[i]??"";if(We(o)){i+=1;continue}if(me(o)){let c=[o];for(i+=1;i<t.length&&!me(t[i]??"");)c.push(t[i]??""),i+=1;i<t.length&&(c.push(t[i]??""),i+=1),n.push({kind:"code",lines:c});continue}if(Ge(o)){n.push({kind:"rule",lines:[o]}),i+=1;continue}if(Ue(o)){n.push({kind:"heading",lines:[o]}),i+=1;continue}let a=ve(o)?"table":he(o)?"list":"paragraph",s=c=>We(c)||me(c)||Ue(c)||Ge(c)?!1:a==="table"?ve(c):a==="list"?!0:!ve(c)&&!he(c),r=[];for(;i<t.length&&s(t[i]??"");)r.push(t[i]??""),i+=1;n.push({kind:a,lines:r})}return n}var Je=new Set(["heading","list","paragraph"]),P=e=>e.lines.join(`
`).trim();function rn(e){let t=e.filter(a=>Je.has(a.kind));if(t.length===0)return"";let n=[],i=0;for(let a=t.length-1;a>=0;a-=1){let s=t[a];if(!s)continue;let r=P(s).length;if(n.length>0&&i+r>q||(n.unshift(s),i+=r,s.kind==="heading"))break}let o=n.map(P).join(`

`);return n.length===1&&o.length>q?cn(o):o}function cn(e,t=q){let n=B(e),i=[],o=0;for(let a=n.length-1;a>=0;a-=1){let s=n[a];if(s){if(i.length>0&&o+s.length>t)break;i.unshift(s),o+=s.length}}return i.join(" ")}function fe(e){return/\*\*[^*]+\*\*/.test(e)||/__[^_]+__/.test(e)}function ln(e){let t=e.filter(a=>Je.has(a.kind)),n=t[t.length-1],i=t.length===1?t[0]:void 0;if(i&&i.kind==="paragraph"&&P(i).length>q){let a=B(P(i).replace(/\n/g," "));return a.filter((s,r)=>r===0||r===a.length-1||fe(s)).join(" ")}let o=[];for(let a of t){if(a.kind==="heading"){o.push(P(a));continue}if(a.kind==="list"){let c=a.lines.filter(p=>he(p)),l=c.filter(fe);o.push((l.length>0?l:c.slice(0,sn)).join(`
`));continue}if(a===n){o.push(P(a));continue}let r=B(P(a).replace(/\n/g," ")).filter((c,l)=>l===0||fe(c));r.length>0&&o.push(r.join(" "))}return o.filter(Boolean).join(`

`)}function qe(e,t){if(t==="full")return e;let n=an(e);return t==="ending"?rn(n):ln(n)}var dn=[["\u2318","command "],["\u2325","option "],["\u21E7","shift "],["\u2303","control "],["\u2423"," "],["\u23CE","enter "],["\u238B","escape "],["\u2192",", "],["\u2190",", "],["\u21D2",", "],["\xB7",", "],["\u2713","ok"],["\u2705","ok"],["\u274C","no"]],pn=/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]/gu;function un(e){return e.replace(/[\w.~-]*\/(?:[\w.-]+\/)*([\w-]+\.[A-Za-z0-9]{1,5})\b/g,"$1").replace(/(?:~|\.{0,2})?\/(?:[\w.-]+\/){2,}([\w.-]+)/g,"$1")}function gn(e){let t=e;for(let[n,i]of dn)t=t.split(n).join(i);return t=t.replace(pn,""),t=t.replace(/\s*,\s*,\s*/g,", "),t.replace(/\s+([,.;:!?])/g,"$1")}function mn(e,t){if(t<=0||e.length<=t)return e;let n=e.slice(0,t),i=Math.max(n.lastIndexOf(". "),n.lastIndexOf("! "),n.lastIndexOf("? "));return`${i>t*.4?n.slice(0,i+1):n.trimEnd()}\u2026`}function Qe(e,t={}){let{maxCharacters:n=0,skipCodeBlocks:i=!0}=t,o=e;i&&(o=o.replace(/```[\s\S]*?```/g," "),o=o.replace(/^[ \t]*\|.*\|[ \t]*$/gm,"")),o=o.replace(/!\[[^\]]*\]\([^)]*\)/g," "),o=o.replace(/\[([^\]]+)\]\([^)]*\)/g,"$1"),o=o.replace(/^[ \t]{0,3}(?:[-*_][ \t]*){3,}$/gm,""),o=o.replace(/`([^`]*)`/g,"$1"),o=o.replace(/^[ \t]{0,3}#{1,6}[ \t]*(.+?)[ \t]*$/gm,(r,c)=>`${c.replace(/[.:]+$/,"")}.`),o=o.replace(/^[ \t]{0,3}[-*+][ \t]+/gm,""),o=o.replace(/^[ \t]{0,3}\d+[.)][ \t]+/gm,""),o=o.replace(/\*\*([^*]+)\*\*/g,"$1"),o=o.replace(/(?<!\w)[*_]([^*_]+)[*_](?!\w)/g,"$1"),o=un(o),o=gn(o),o=o.replace(/[ \t]+/g," ");let a=o.split(/\n\s*\n/).map(r=>r.split(/\s+/).filter(Boolean).join(" ")).filter(r=>r.length>0);if(a.length===0)return"";let s=a.map(r=>/[.!?:…]$/.test(r)?r:`${r}.`).join(" ");return mn(s,n).trim()}var h=f(require("vscode"));var S=f(require("vscode"));async function Ye(e){await S.env.openExternal(S.Uri.parse(`${S.env.uriScheme}://settings/${encodeURIComponent(e)}`))||await S.commands.executeCommand("workbench.action.openSettings",e)}var vn=200,fn="https://open.spotify.com/album/0oKFlySlL4IJCb9L1Wz5GY?si=bHh1TGHNSmeRAyXcmaiMyA",hn="https://elevenlabs.io/app/voice-lab",yn="https://ko-fi.com/larspunx",Ze="Hi! This is Coding Voice. I read out the summary of every answer as soon as the agent finishes, so you can keep your eyes off the screen. What you are hearing right now is a quick voice test using your current settings. By default I use your computer's built-in system voice, which is free and works offline. In the settings below you can switch the voice, change the language, and adjust the speed and volume. Any change you make applies here and to every answer I read. Enjoy!";function Xe(e,t){let n,i,o=(c,l)=>{let p=Math.max(0,Math.min(100,Math.round(c)));if($("volume",p),i&&clearTimeout(i),l){t.restartUtterance();return}i=setTimeout(()=>t.restartUtterance(),vn)},a=async()=>({...b(),hasElevenLabsKey:!!await e.getApiKey("elevenlabs")}),s=async()=>{n&&await n.webview.postMessage({type:"state",state:await a()})};return{open:()=>{if(n){n.reveal(h.ViewColumn.Active),s();return}n=h.window.createWebviewPanel("codingVoiceSettings","Coding Voice \u2014 Settings",h.ViewColumn.Active,{enableScripts:!0,retainContextWhenHidden:!0}),n.webview.html=En(),n.webview.onDidReceiveMessage(async c=>{let l=c.type;if(l==="ready")await s();else if(l==="set")await $(c.key,c.value);else if(l==="volume")o(Number(c.value),!!c.commit);else if(l==="apiKey"){let p=c.engine,m=String(c.value??"").trim();await e.setApiKey(p,m||void 0),h.window.showInformationMessage(m?"API key saved.":"API key removed."),await s()}else if(l==="playTest")t.speakNew(Ze);else if(l==="diagnostics"){let p=await h.workspace.openTextDocument(h.Uri.file(A));await h.window.showTextDocument(p)}else l==="rawSettings"?await Ye("@ext:larspunx.coding-voice"):l==="music"?await h.env.openExternal(h.Uri.parse(fn)):l==="voiceDesign"?await h.env.openExternal(h.Uri.parse(hn)):l==="kofi"&&await h.env.openExternal(h.Uri.parse(yn))}),n.onDidDispose(()=>{i&&clearTimeout(i),n=void 0})},refresh:()=>void s(),dispose:()=>{i&&clearTimeout(i),n?.dispose()}}}var bn=["full","essentials","ending"],kn=["system","elevenlabs"],wn=["female","male"],Sn=["auto","en","pl"];function xn(){let e="",t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";for(let n=0;n<32;n++)e+=t.charAt(Math.floor(Math.random()*t.length));return e}function En(){let e=xn();return`<!DOCTYPE html>
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
      <p class="test-text">${Ze}</p>
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
</html>`}var x=f(require("vscode"));var Q={power:1003,playback:1002,volume:1001,settings:1e3},$n=new x.ThemeColor("charts.green"),Ln=new x.ThemeColor("charts.red"),Cn=new x.ThemeColor("statusBarItem.warningBackground"),et=6;function zn(e){let t=Math.max(0,Math.min(100,e)),n=Math.round(t/100*et);return`${"\u2500".repeat(n)}\u25CF${"\u2500".repeat(et-n)}`}function tt(e){let t=(c,l,p)=>{let m=x.window.createStatusBarItem(x.StatusBarAlignment.Left,c);return m.name=l,m.command=p,m},n=t(Q.power,"Coding Voice: reading","codingVoice.toggleEnabled"),i=t(Q.playback,"Coding Voice: playback","codingVoice.playPause"),o=t(Q.volume,"Coding Voice: volume","codingVoice.setVolume"),a=t(Q.settings,"Coding Voice: settings","codingVoice.openSettings");a.text="$(gear)",a.tooltip="Coding Voice settings";function s(){let{enabled:c,volume:l}=b();n.text=c?"$(unmute)":"$(mute)",n.color=c?$n:Ln,n.tooltip=c?"Reading aloud is on \u2014 click to turn it off":"Reading aloud is off \u2014 click to turn it on",n.show();let p=e.state==="speaking";i.text=p?"$(debug-pause)":"$(play)",i.backgroundColor=p?Cn:void 0,i.tooltip=p?"Pause":e.state==="paused"?"Resume":"Play the last answer from the start",i.show(),o.text=`${zn(l)} ${Math.round(l)}%`,o.tooltip="Reading volume \u2014 click to open the slider in the panel",o.show(),a.show()}s();let r=e.onChange(s);return{refresh:s,dispose:()=>x.Disposable.from(n,i,o,a,r).dispose()}}var nt=f(require("vscode"));var In="codingVoice.volumeView",Mn=200;function ot(e){let t,n,i=(s,r)=>{let c=Math.max(0,Math.min(100,Math.round(s)));if($("volume",c),n&&clearTimeout(n),r){e.restartUtterance();return}n=setTimeout(()=>e.restartUtterance(),Mn)};return{provider:{resolveWebviewView(s){t=s,s.webview.options={enableScripts:!0},s.webview.html=jn(b().volume),s.webview.onDidReceiveMessage(r=>{r.type==="input"&&typeof r.value=="number"?i(r.value,!1):r.type==="change"&&typeof r.value=="number"&&i(r.value,!0)}),s.onDidDispose(()=>{t=void 0})}},open:()=>void nt.commands.executeCommand(`${In}.focus`),refresh:()=>{t?.webview.postMessage({type:"volume",value:Math.round(b().volume)})},dispose:()=>{n&&clearTimeout(n)}}}function Pn(){let e="",t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";for(let n=0;n<32;n++)e+=t.charAt(Math.floor(Math.random()*t.length));return e}function jn(e){let t=Pn(),n=Math.round(Math.max(0,Math.min(100,e)));return`<!DOCTYPE html>
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
</html>`}function An(e){ke();let t=new U(e.secrets);De();let n=Te({apiKey:()=>t.getApiKey("elevenlabs"),voiceIdOverride:()=>b().elevenLabsVoiceId.trim()||void 0,voiceSettings:()=>{let d=b();return{stability:d.elevenLabsStability,similarity:d.elevenLabsSimilarity,style:d.elevenLabsStyle,speakerBoost:d.elevenLabsSpeakerBoost}}}),i=()=>b().engine==="elevenlabs"?n:Re,o=new G({engine:i,options:d=>{let v=b(),z=v.language==="auto"?_e(d,"en"):v.language;return Ce(v,z)},transform:(d,v)=>He(d,v.language),onError:d=>{y.window.showErrorMessage(`Coding Voice: ${d.message}`)}}),a=tt(o),s=ot(o),r=Xe(t,o);try{xe(e.extensionPath)}catch(d){y.window.showErrorMessage(`Coding Voice could not register its hooks: ${String(d)}`)}let c=d=>{Y.writeFile(X,d,()=>{}),o.speakNew(d)},l=new Set,p=()=>{l.clear();for(let d of y.workspace.workspaceFolders??[])l.add(Ie(d.uri.fsPath))};p(),e.subscriptions.push(y.workspace.onDidChangeWorkspaceFolders(p));let m=Le(d=>{let v=b();if(!v.enabled)return;let z=Qe(qe(d,v.scope),{maxCharacters:v.maxCharacters,skipCodeBlocks:v.skipCodeBlocks});if(!z)return;let ye=y.workspace.workspaceFolders?.[0]?.name,it=v.announceProject&&ye?`${ye}. ${z}`:z;c(it)},l);e.subscriptions.push(a,s,r,y.window.registerWebviewViewProvider("codingVoice.volumeView",s.provider,{webviewOptions:{retainContextWhenHidden:!0}}),m,y.commands.registerCommand("codingVoice.setVolume",()=>s.open()),y.commands.registerCommand("codingVoice.playPause",async()=>{if(!b().enabled){let d="Turn reading on";await y.window.showInformationMessage("Coding Voice: reading aloud is off, so nothing will be spoken.",d)===d&&await $("enabled",!0);return}if(o.state==="idle"&&!o.canReplay){let d="";try{d=Y.readFileSync(X,"utf8")}catch{}if(d.trim()){c(d);return}y.window.showInformationMessage("Coding Voice: nothing to read yet \u2014 the next agent answer will be read aloud.");return}o.toggle()}),y.commands.registerCommand("codingVoice.stop",()=>o.stop()),y.commands.registerCommand("codingVoice.toggleEnabled",async()=>{let d=!b().enabled;await $("enabled",d),d||o.stop()}),y.commands.registerCommand("codingVoice.openSettings",()=>r.open()),y.commands.registerCommand("codingVoice.setApiKey",()=>r.open()),y.workspace.onDidChangeConfiguration(d=>{ze(d)&&(a.refresh(),s.refresh(),r.refresh())}))}function Bn(){}0&&(module.exports={activate,deactivate});
