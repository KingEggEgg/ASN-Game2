
const CORRECT={invoice:'INV-001',awb:'1903099900',part:'1267370881',description:'Plastic Moulding; 538X354X28',qty:'200'};
const LABELS={invoice:'Invoice No',awb:'AWB',part:'Part Number',description:'Description',qty:'Qty'};
const ORDER=['invoice','awb','part','description','qty'];
const OPTIONS={invoice:['INV-001','INV-002','INV-003'],awb:['1903099900','1903099901','1903099902'],part:['1267370881','1267370882','1267370883'],description:['Plastic Moulding; 538X354X28','Thermal Conduction Compound','Lc Display; TFT 7inch'],qty:['200','240','120']};
const PALLETS={'6000.115.761':['📦 Pallet A','1200 × 800 × 500 mm','HU E105'],'6000.115.762':['📦 Pallet B','1200 × 800 × 1000 mm','HU E112'],'6000.115.763':['📦 Pallet C','1200 × 800 × 1500 mm','HU E119']};
const CAPTIONS=[
  ['Scene 1','A truck arrives at Receiving.'],
  ['Scene 2','The team is ready, but the ASN is missing.'],
  ['Scene 3','Use the printed Dummy Invoice to match the shipment data.'],
  ['Scene 4','Create the ASN, choose the pallet, and help Receiving move again.']
];
const $=id=>document.getElementById(id);
const state={scene:0,selectedPallet:null,start:null,secs:0,timer:null,pending:null,pickerField:null,pickerMode:null,palletAnimationLocked:false};
const scenes=[...document.querySelectorAll('.scene')];

/* ---------- Audio: looping light music + layered SFX ---------- */
const audioState={ctx:null,musicGain:null,sfxGain:null,masterGain:null,musicTimer:null,musicStarted:false,muted:false};
const NOTE={C3:130.81,D3:146.83,E3:164.81,G3:196,A3:220,C4:261.63,D4:293.66,E4:329.63,G4:392,A4:440,C5:523.25,E5:659.25,G5:783.99,C6:1046.5};
function makeTone(freq,start,duration,{type='sine',gain=.05,destination=null,attack=.025,release=.16}={}){if(!audioState.ctx||audioState.muted)return;const ctx=audioState.ctx,osc=ctx.createOscillator(),g=ctx.createGain();osc.type=type;osc.frequency.setValueAtTime(freq,start);g.gain.setValueAtTime(0,start);g.gain.linearRampToValueAtTime(gain,start+attack);g.gain.setValueAtTime(gain,Math.max(start+attack,start+duration-release));g.gain.exponentialRampToValueAtTime(.0001,start+duration);osc.connect(g);g.connect(destination||audioState.masterGain);osc.start(start);osc.stop(start+duration+.03)}
function scheduleMusicPhrase(){if(!audioState.ctx||audioState.ctx.state!=='running'||audioState.muted)return;const t=audioState.ctx.currentTime+.04;const melody=[NOTE.C4,NOTE.E4,NOTE.G4,NOTE.E4,NOTE.D4,NOTE.G4,NOTE.A4,NOTE.G4,NOTE.E4,NOTE.D4,NOTE.C4,NOTE.E4];melody.forEach((f,i)=>makeTone(f,t+i*.44,.38,{type:'sine',gain:.026,destination:audioState.musicGain,attack:.035,release:.18}));[NOTE.C3,NOTE.G3,NOTE.A3,NOTE.G3].forEach((f,i)=>makeTone(f,t+i*1.32,1.1,{type:'triangle',gain:.018,destination:audioState.musicGain,attack:.08,release:.35}))}
function startMusicLoop(){if(audioState.musicStarted||!audioState.ctx)return;audioState.musicStarted=true;scheduleMusicPhrase();audioState.musicTimer=setInterval(scheduleMusicPhrase,5280)}
async function unlockAudio(){if(!audioState.ctx)initAudio();if(audioState.ctx&&audioState.ctx.state==='suspended'){try{await audioState.ctx.resume()}catch{}}if(audioState.ctx&&audioState.ctx.state==='running')startMusicLoop()}
function initAudio(){if(audioState.ctx)return;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;const ctx=new AC();audioState.ctx=ctx;audioState.masterGain=ctx.createGain();audioState.musicGain=ctx.createGain();audioState.sfxGain=ctx.createGain();audioState.masterGain.gain.value=.85;audioState.musicGain.gain.value=.7;audioState.sfxGain.gain.value=1;audioState.musicGain.connect(audioState.masterGain);audioState.sfxGain.connect(audioState.masterGain);audioState.masterGain.connect(ctx.destination)}
function playCorrectSfx(){unlockAudio();if(!audioState.ctx)return;const t=audioState.ctx.currentTime+.02;[NOTE.C5,NOTE.E5,NOTE.G5,NOTE.C6].forEach((f,i)=>makeTone(f,t+i*.09,.34,{type:'sine',gain:.09,destination:audioState.sfxGain,attack:.008,release:.22}))}
function playWrongSfx(){unlockAudio();if(!audioState.ctx)return;const t=audioState.ctx.currentTime+.02;makeTone(NOTE.E4,t,.22,{type:'triangle',gain:.085,destination:audioState.sfxGain,attack:.005,release:.11});makeTone(NOTE.C4,t+.13,.30,{type:'triangle',gain:.09,destination:audioState.sfxGain,attack:.005,release:.16})}
function addSoundToggle(){const top=document.querySelector('.topbar');if(!top||document.getElementById('soundToggle'))return;const theme=document.getElementById('themeToggle');const wrap=document.createElement('div');wrap.style.cssText='display:flex;gap:8px;align-items:center;flex:0 0 auto';if(theme)theme.parentNode.insertBefore(wrap,theme),wrap.appendChild(theme);else top.appendChild(wrap);const b=document.createElement('button');b.id='soundToggle';b.type='button';b.className='theme-toggle';b.style.cssText='min-width:48px;padding:0 12px';b.innerHTML='<span id="soundIcon">🔊</span>';b.setAttribute('aria-label','Mute game sound');b.onclick=async()=>{await unlockAudio();audioState.muted=!audioState.muted;if(audioState.masterGain)audioState.masterGain.gain.setTargetAtTime(audioState.muted?0:.85,audioState.ctx.currentTime,.03);const icon=document.getElementById('soundIcon');if(icon)icon.textContent=audioState.muted?'🔇':'🔊';b.setAttribute('aria-label',audioState.muted?'Turn game sound on':'Mute game sound')};wrap.appendChild(b)}
initAudio();unlockAudio();['pointerdown','touchstart','keydown'].forEach(ev=>window.addEventListener(ev,unlockAudio,{once:true,passive:true}));

function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function norm(v){return String(v||'').trim().replace(/\s+/g,' ').toUpperCase()}
function fmt(s){return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`}
function showPage(id){document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));$(id).classList.add('active');window.scrollTo(0,0);if(id==='huPage')setTimeout(()=>{init3d();},40)}
function setTheme(mode){const light=mode==='light';document.body.classList.toggle('light',light);$('themeIcon').textContent=light?'🌙':'☀️';$('themeLabel').textContent=light?'Dark':'Light';try{localStorage.setItem('asnTheme',light?'light':'dark')}catch{}}
function toggleTheme(){setTheme(document.body.classList.contains('light')?'dark':'light')}
function replaySceneAnimation(scene){const active=scenes[scene];active.querySelectorAll('*').forEach(el=>{el.style.animation='none';void el.offsetWidth;el.style.animation=''})}
function updateScene(i){state.scene=i;scenes.forEach((s,n)=>s.classList.toggle('active',n===i));$('storyStep').textContent=`Scene ${i+1} / ${scenes.length}`;$('storyBack').disabled=i===0;$('storyNext').textContent=i===scenes.length-1?'Replay Scene':'Next';const [title,text]=CAPTIONS[i];$('storyCaption').innerHTML=`<strong>${title}</strong><span>${text}</span>`;replaySceneAnimation(i)}
function nextScene(){if(state.scene===scenes.length-1) replaySceneAnimation(state.scene); else updateScene(state.scene+1)}
function prevScene(){if(state.scene>0) updateScene(state.scene-1)}
function tick(){state.secs=state.start?Math.floor((Date.now()-state.start)/1000):0;const t=fmt(state.secs);['timer1','timer2'].forEach(id=>{$(id).textContent=t;$(id).classList.toggle('hot',state.secs>=50)})}
function startTimer(){clearInterval(state.timer);state.start=Date.now();state.secs=0;tick();state.timer=setInterval(tick,250)}
function stopTimer(){tick();clearInterval(state.timer);state.timer=null;$('finalTime').textContent=fmt(state.secs)}
function resetTimer(){clearInterval(state.timer);state.timer=null;state.start=null;state.secs=0;['timer1','timer2','finalTime'].forEach(id=>$(id).textContent='00:00')}
function message(id,text){$(id).textContent=text;$(id).classList.add('show')}
function clearMessages(){['asnMessage','huMessage'].forEach(id=>{$(id).textContent='';$(id).classList.remove('show')})}
function overlay(icon,title,text,callback){state.pending=callback;$('transitionIcon').textContent=icon;$('transitionTitle').textContent=title;$('transitionText').textContent=text;$('overlay').classList.add('show');$('overlay').setAttribute('aria-hidden','false')}
function continueOverlay(){$('overlay').classList.remove('show');$('overlay').setAttribute('aria-hidden','true');const cb=state.pending;state.pending=null;if(cb)cb()}
function openPicker(buttonsHtml,mode,field=null){state.pickerMode=mode;state.pickerField=field;$('pickerChoices').innerHTML=buttonsHtml;$('pickerOverlay').classList.add('show');$('pickerOverlay').setAttribute('aria-hidden','false')}
function closePicker(){$('pickerOverlay').classList.remove('show');$('pickerOverlay').setAttribute('aria-hidden','true');state.pickerMode=null;state.pickerField=null}
function renderFields(){const host=$('fieldList');host.innerHTML='';ORDER.forEach(field=>{const el=document.createElement('div');el.className='field-card';el.innerHTML=`<div class="field-head"><span>${LABELS[field]}</span><button class="clear-btn" data-clear="${field}">Clear</button></div><button class="answer-slot" data-field="${field}">Tap to choose ${LABELS[field]}</button>`;host.appendChild(el)})}
function renderPalletPreview(){const box=$('palletPreview');if(!state.selectedPallet){box.textContent='No pallet selected yet.';box.classList.remove('filled');return}const [name,size,hu]=PALLETS[state.selectedPallet];box.innerHTML=`<strong>${name}</strong><span>${size}</span><span>${hu}</span>`;box.classList.add('filled')}
function clearField(field){const slot=document.querySelector(`.answer-slot[data-field="${field}"]`);if(!slot)return;slot.textContent=`Tap to choose ${LABELS[field]}`;slot.dataset.value='';slot.classList.remove('filled','correct','wrong')}
function resetGame(){state.selectedPallet=null;state.palletAnimationLocked=false;clearMessages();renderFields();renderPalletPreview();resetTimer();closePicker();setTimeout(resetFitTest,0);const b=$('openPalletPicker');if(b){b.textContent='Choose Pallet Option';b.disabled=false;b.classList.remove('testing-button')}}
function openFieldPicker(field){const options=shuffle(OPTIONS[field]).map(v=>`<button class="picker-option" data-picker="field" data-field="${field}" data-value="${v}">${v}</button>`).join('');openPicker(options,'field',field)}
function chooseFieldValue(field,value){const slot=document.querySelector(`.answer-slot[data-field="${field}"]`);if(!slot)return;slot.textContent=value;slot.dataset.value=value;slot.classList.add('filled');slot.classList.remove('wrong');closePicker()}
function openPalletPicker(){if(state.palletAnimationLocked)return;const options=shuffle(Object.keys(PALLETS)).map(key=>{const [name,size,hu]=PALLETS[key];return `<button class="picker-option pallet" data-picker="pallet" data-value="${key}"><strong>${name}</strong><span>${size}</span><span>${hu}</span></button>`}).join('');openPicker(options,'pallet')}
