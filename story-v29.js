// v30 story timing override
(function(){
  const INTRO_DELAY=3000, ENDING_DELAY=3000;
  const INTRO=[
    ['Scene 1','Shipment is on the way, but there is no ASN yet.'],
    ['Scene 2','The shipment has arrived, but Receiving cannot do GR.'],
    ['Scene 3','Receiving seeks help to create the ASN.']
  ];
  const ENDING=[
    ['Scene 4','Great job! The ASN is ready.'],
    ['Scene 5','ASN found — Receiving can continue.']
  ];
  let introTimer=null, endingTimer=null;
  function introImages(){return [...document.querySelectorAll('.portrait-comic')];}
  function endingImages(){return [...document.querySelectorAll('.ending-scene')];}
  function setIntro(i){
    introImages().forEach((img,n)=>img.classList.toggle('active',n===i));
    const c=document.getElementById('storyCaption'),s=document.getElementById('storyStep');
    if(c)c.innerHTML=`<strong>${INTRO[i][0]}</strong><span>${INTRO[i][1]}</span>`;
    if(s)s.textContent=`Scene ${i+1} / 3`;
    window.scrollTo(0,0);
  }
  function setEnding(i){
    endingImages().forEach((img,n)=>img.classList.toggle('active',n===i));
    const c=document.getElementById('endingCaption'),s=document.getElementById('endingStep');
    if(c)c.innerHTML=`<strong>${ENDING[i][0]}</strong><span>${ENDING[i][1]}</span>`;
    if(s)s.textContent=`Scene ${i+4} / 5`;
    window.scrollTo(0,0);
  }
  window.startOpeningAutoPlay=async function(){
    clearTimeout(introTimer);
    const btn=document.getElementById('startMission');
    if(btn){btn.style.setProperty('display','none','important');btn.disabled=true;}
    if(window.HD_IMAGES_READY) await window.HD_IMAGES_READY;
    let i=0; setIntro(0);
    const next=()=>{
      if(i<2){i++;setIntro(i);introTimer=setTimeout(next,INTRO_DELAY);}
      else if(btn){btn.style.setProperty('display','block','important');btn.disabled=false;btn.textContent='START MISSION';}
    };
    introTimer=setTimeout(next,INTRO_DELAY);
  };
  window.playEndingScenes=async function(){
    clearTimeout(endingTimer);
    if(window.HD_IMAGES_READY) await window.HD_IMAGES_READY;
    if(typeof showPage==='function')showPage('endingPage');
    let i=0;setEnding(0);
    const next=()=>{
      if(i<1){i++;setEnding(i);endingTimer=setTimeout(next,ENDING_DELAY);}
      else if(typeof showPage==='function')showPage('donePage');
    };
    endingTimer=setTimeout(next,ENDING_DELAY);
  };
  window.addEventListener('load',()=>{
    const btn=document.getElementById('startMission');
    if(btn)btn.style.setProperty('display','none','important');
  });
})();
