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
  if(wrong){playWrongSfx();message('asnMessage',`Almost there! ${wrong} field(s) do not match the Dummy Invoice. Tap the field again and choose another answer.`);return}
  playCorrectSfx();overlay('📦','Step 1 Complete','Great! Now choose the pallet that fits the rack.',()=>showPage('huPage'))
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
addSoundToggle();
resetGame();updateScene(0);showPage('startPage');
