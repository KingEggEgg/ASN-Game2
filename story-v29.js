// v29: 3-second intro scenes, manual Start after Scene 3, 3-second ending Scenes 4-5.
const V29_INTRO = [
  ['Scene 1','Shipment is on the way, but there is no ASN yet.'],
  ['Scene 2','The shipment has arrived, but Receiving cannot do GR.'],
  ['Scene 3','Receiving seeks help to create the ASN.']
];
const V29_ENDING = [
  ['Scene 4','Great job! The ASN is ready.'],
  ['Scene 5','ASN found — Receiving can continue.']
];

(function injectV29Styles(){
  const style=document.createElement('style');
  style.textContent=`
    #startPage .story-controls,
    #endingPage .ending-controls{display:flex!important;justify-content:center;align-items:center;}
    #startPage .story-buttons,
    #endingPage .story-buttons{display:none!important;}
    #startMission{display:block!important;}
    #startMission:disabled{opacity:.5;cursor:default;pointer-events:none;}
  `;
  document.head.appendChild(style);
})();

function updateScene(i){
  state.scene=i;
  const cards=[...document.querySelectorAll('.portrait-comic')];
  cards.forEach((card,n)=>card.classList.toggle('active',n===i));
  const [title,text]=V29_INTRO[i];
  if($('storyStep')) $('storyStep').textContent=`${title} / 3`;
  if($('storyCaption')) $('storyCaption').innerHTML=`<strong>${title}</strong><span>${text}</span>`;
  if($('storyBack')) $('storyBack').disabled=i===0;
}

function startOpeningAutoPlay(){
  clearTimeout(openingSceneTimer);
  updateScene(0);
  const btn=$('startMission');
  if(btn) btn.disabled=true;
  let i=0;
  const advance=()=>{
    if(!$('startPage')?.classList.contains('active')) return;
    if(i<2){
      i+=1;
      updateScene(i);
      openingSceneTimer=setTimeout(advance,3000);
    }else if(btn){
      btn.disabled=false;
    }
  };
  openingSceneTimer=setTimeout(advance,3000);
}

function updateEndingScene(i){
  endingIndex=i;
  const cards=[...document.querySelectorAll('.ending-scene')];
  cards.forEach((card,n)=>card.classList.toggle('active',n===i));
  const [title,text]=V29_ENDING[i];
  if($('endingStep')) $('endingStep').textContent=`${title} / 5`;
  if($('endingCaption')) $('endingCaption').innerHTML=`<strong>${title}</strong><span>${text}</span>`;
  window.scrollTo(0,0);
}

function playEndingScenes(){
  clearTimeout(endingSceneTimer);
  showPage('endingPage');
  updateEndingScene(0);
  endingSceneTimer=setTimeout(()=>{
    updateEndingScene(1);
    endingSceneTimer=setTimeout(()=>showPage('donePage'),3000);
  },3000);
}
