
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
const scenes=[...document.querySelectorAll('.portrait-comic')];

function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function norm(v){return String(v||'').trim().replace(/\s+/g,' ').toUpperCase()}
function fmt(s){return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`}
function showPage(id){document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));$(id).classList.add('active');window.scrollTo(0,0);if(id==='huPage')setTimeout(()=>{init3d();},40)}
function setTheme(mode){const light=mode==='light';document.body.classList.toggle('light',light);$('themeIcon').textContent=light?'🌙':'☀️';$('themeLabel').textContent=light?'Dark':'Light';try{localStorage.setItem('asnTheme',light?'light':'dark')}catch{}}
function toggleTheme(){setTheme(document.body.classList.contains('light')?'dark':'light')}

function replaySceneAnimation(scene){const active=scenes[scene];active.querySelectorAll('*').forEach(el=>{el.style.animation='none';void el.offsetWidth;el.style.animation=''})}
function updateScene(i){state.portrait-comic=i;scenes.forEach((s,n)=>s.classList.toggle('active',n===i));$('storyStep').textContent=`Scene ${i+1} / ${scenes.length}`;$('storyBack').disabled=i===0;$('storyNext').textContent=i===scenes.length-1?'Replay Scene':'Next';const [title,text]=CAPTIONS[i];$('storyCaption').innerHTML=`<strong>${title}</strong><span>${text}</span>`;replaySceneAnimation(i)}
function nextScene(){if(state.portrait-comic===scenes.length-1) replaySceneAnimation(state.portrait-comic); else updateScene(state.portrait-comic+1)}
function prevScene(){if(state.portrait-comic>0) updateScene(state.portrait-comic-1)}

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

function renderFields(){
  const host=$('fieldList');host.innerHTML='';
  ORDER.forEach(field=>{
    const el=document.createElement('div');el.className='field-card';
    el.innerHTML=`<div class="field-head"><span>${LABELS[field]}</span><button class="clear-btn" data-clear="${field}">Clear</button></div><button class="answer-slot" data-field="${field}">Tap to choose ${LABELS[field]}</button>`;
    host.appendChild(el);
  })
}
function renderPalletPreview(){
  const box=$('palletPreview');
  if(!state.selectedPallet){box.textContent='No pallet selected yet.';box.classList.remove('filled');return}
  const [name,size,hu]=PALLETS[state.selectedPallet];
  box.innerHTML=`<strong>${name}</strong><span>${size}</span><span>${hu}</span>`;box.classList.add('filled')
}
function clearField(field){const slot=document.querySelector(`.answer-slot[data-field="${field}"]`);if(!slot)return;slot.textContent=`Tap to choose ${LABELS[field]}`;slot.dataset.value='';slot.classList.remove('filled','correct','wrong')}
function resetGame(){state.selectedPallet=null;state.palletAnimationLocked=false;clearMessages();renderFields();renderPalletPreview();resetTimer();closePicker();setTimeout(resetFitTest,0);const b=$('openPalletPicker');if(b){b.textContent='Choose Pallet Option';b.disabled=false;b.classList.remove('testing-button')}}

function openFieldPicker(field){
  const options=shuffle(OPTIONS[field]).map(v=>`<button class="picker-option" data-picker="field" data-field="${field}" data-value="${v}">${v}</button>`).join('');
  openPicker(options,'field',field)
}
function chooseFieldValue(field,value){const slot=document.querySelector(`.answer-slot[data-field="${field}"]`);if(!slot)return;slot.textContent=value;slot.dataset.value=value;slot.classList.add('filled');slot.classList.remove('wrong');closePicker()}
function openPalletPicker(){
  if(state.palletAnimationLocked)return;
  const options=shuffle(Object.keys(PALLETS)).map(key=>{const [name,size,hu]=PALLETS[key];return `<button class="picker-option pallet" data-picker="pallet" data-value="${key}"><strong>${name}</strong><span>${size}</span><span>${hu}</span></button>`}).join('');
  openPicker(options,'pallet')
}
// Offline 3D renderer (no CDN / no Three.js)
