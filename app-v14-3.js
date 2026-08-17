function animatePalletFit(key){
  init3d();
  const fit=$('fitTest'),result=$('fitResult'),button=$('openPalletPicker');
  const [name,size]=PALLETS[key];
  fit.classList.remove('fit-success','fit-fail');fit.classList.add('testing');result.textContent='';
  sim3d.key=key;sim3d.start=performance.now();sim3d.impact=0;

  const fits=key==='6000.115.761';
  const H=fits?.75:key==='6000.115.762'?1.55:2.25;
  const startX=3.0,startZ=2.35,alignedX=0,baseY=.56;
  const collisionZ=1.98;
  const insideZ=.08;
  sim3d.pallet={x:startX,y:baseY,z:startZ,h:H};

  const duration=fits?3000:2850;

  function step(now){
    const t=Math.min(1,(now-sim3d.start)/duration);

    if(fits){
      if(t<.34){
        const q=ease(t/.34);
        sim3d.pallet.x=mix(startX,alignedX,q);
        sim3d.pallet.z=startZ;
        sim3d.pallet.y=baseY;
      }else{
        const q=ease((t-.34)/.66);
        sim3d.pallet.x=alignedX;
        sim3d.pallet.z=mix(startZ,insideZ,q);
        sim3d.pallet.y=baseY;
      }
    }else{
      if(t<.38){
        const q=ease(t/.38);
        sim3d.pallet.x=mix(startX,alignedX,q);
        sim3d.pallet.z=startZ;
        sim3d.pallet.y=baseY;
      }else if(t<.58){
        const q=ease((t-.38)/.20);
        sim3d.pallet.x=alignedX;
        sim3d.pallet.z=mix(startZ,collisionZ,q);
        sim3d.pallet.y=baseY;
      }else if(t<.74){
        const q=(t-.58)/.16;
        sim3d.impact=1-Math.min(1,Math.abs(q-.5)*1.8);
        sim3d.pallet.x=Math.sin(q*Math.PI*10)*.055;
        sim3d.pallet.z=collisionZ+Math.abs(Math.sin(q*Math.PI*8))*.045;
        sim3d.pallet.y=baseY;
      }else{
        sim3d.impact=0;
        const q=ease((t-.74)/.26);
        sim3d.pallet.x=mix(0,.55,q);
        sim3d.pallet.z=mix(collisionZ,2.55,q);
        sim3d.pallet.y=baseY;
      }
    }

    if(t<1) requestAnimationFrame(step); else finish();
  }

  function finish(){
    sim3d.impact=0;
    fit.classList.remove('testing');
    if(fits){
      fit.classList.add('fit-success');result.textContent='✓ FITS THE RACK';
      stopTimer();
      if(button){button.textContent='Pallet Fits';button.disabled=true}
      setTimeout(()=>overlay('✅','Pallet Fits!','Pallet A fits the rack. ASN creation is complete.',()=>showPage('donePage')),900)
    }else{
      fit.classList.add('fit-fail');result.textContent='OVER SIZED · BLOCKED AT ENTRANCE';
      message('huMessage',`${name.replace('📦 ','')} is over sized. It is blocked at the rack entrance because its height exceeds 500 mm.`);
      state.palletAnimationLocked=false;
      if(button){button.disabled=false;button.classList.remove('testing-button');button.textContent='Choose Another Pallet'}
    }
  }

  requestAnimationFrame(step);
}

function choosePallet(key){
  if(state.palletAnimationLocked)return;
  state.palletAnimationLocked=true;
  state.selectedPallet=key;
  renderPalletPreview();
  closePicker();
  clearMessages();
  const button=$('openPalletPicker');
  if(button){button.disabled=true;button.classList.add('testing-button');button.textContent='Testing Pallet...'}
  setTimeout(()=>animatePalletFit(key),180);
}

function checkAsn(){
  clearMessages();let wrong=0;
  document.querySelectorAll('.answer-slot').forEach(slot=>{const field=slot.dataset.field;if(norm(slot.dataset.value)===norm(CORRECT[field])){slot.classList.add('correct');slot.classList.remove('wrong')}else{wrong++;clearField(field);slot.classList.add('wrong')}});
  if(wrong){message('asnMessage',`Almost there! ${wrong} field(s) do not match the Dummy Invoice. Tap the field again and choose another answer.`);return}
  overlay('📦','Step 1 Complete','Great! Now choose the pallet that fits the rack.',()=>showPage('huPage'))
}
function checkHu(){
  clearMessages();
  if(!state.selectedPallet){message('huMessage','Tap "Choose Pallet Option" first.');return}
  if(state.selectedPallet!=='6000.115.761'){message('huMessage','Not quite — this pallet is too tall for the rack. Open the options again and try another one.');return}
  stopTimer();overlay('✅','ASN Created','Receiving can continue. Nice work!',()=>showPage('donePage'))
}

$('themeToggle').onclick=toggleTheme;
$('storyBack').onclick=prevScene;
$('storyNext').onclick=nextScene;
$('startMission').onclick=()=>{resetGame();showPage('asnPage');startTimer()};
$('checkAsn').onclick=checkAsn;
$('openPalletPicker').onclick=openPalletPicker;
$('restartAsn').onclick=$('restartHu').onclick=$('playAgain').onclick=()=>{resetGame();showPage('startPage');updateScene(0)};
$('transitionContinue').onclick=continueOverlay;
$('pickerOverlay').addEventListener('click',e=>{if(e.target===e.currentTarget)closePicker()});

document.addEventListener('click',e=>{
  const slot=e.target.closest('.answer-slot');
  if(slot){openFieldPicker(slot.dataset.field);return}
  const clr=e.target.closest('.clear-btn');
  if(clr){clearField(clr.dataset.clear);return}
  const pick=e.target.closest('.picker-option');
  if(pick){if(pick.dataset.picker==='field')chooseFieldValue(pick.dataset.field,pick.dataset.value);else if(pick.dataset.picker==='pallet')choosePallet(pick.dataset.value)}
});

document.addEventListener('keydown',e=>{if(e.key==='Escape')closePicker()});

try{setTheme(localStorage.getItem('asnTheme')||'dark')}catch{setTheme('dark')}
resetGame();updateScene(0);showPage('startPage');
