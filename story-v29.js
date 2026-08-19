// v30 HD comics + story timing override
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
  const HD_SPECS=[
    {selector:'.portrait-comic[data-scene="0"]',parts:['s1-0.txt','s1-1.txt','s1-2.txt']},
    {selector:'.portrait-comic[data-scene="1"]',parts:['s2-0.txt','s2-1.txt','s2-2.txt']},
    {selector:'.portrait-comic[data-scene="2"]',parts:['s3-0.txt','s3-1.txt','s3-2.txt']},
    {selector:'.ending-scene[data-ending-scene="0"]',parts:['s4-0.txt','s4-1.txt','s4-2.txt','s4-3.txt']},
    {selector:'.ending-scene[data-ending-scene="1"]',parts:['s5-0.txt','s5-1.txt','s5-2.txt']}
  ];
  let introTimer=null,endingTimer=null;

  async function loadHdImage(spec){
    const chunks=await Promise.all(spec.parts.map(async name=>{
      const r=await fetch(`assets/comic/b64/${name}?v=30`,{cache:'no-store'});
      if(!r.ok)throw new Error(`${name}: HTTP ${r.status}`);
      return (await r.text()).trim();
    }));
    const img=document.querySelector(spec.selector);
    if(!img)return;
    const src='data:image/webp;base64,'+chunks.join('');
    await new Promise((resolve,reject)=>{
      const pre=new Image();
      pre.onload=()=>{img.src=src;img.dataset.hd='1';resolve();};
      pre.onerror=()=>reject(new Error(`Invalid HD comic: ${spec.selector}`));
      pre.src=src;
    });
  }

  window.HD_IMAGES_READY=Promise.all(HD_SPECS.map(loadHdImage))
    .then(()=>true)
    .catch(err=>{console.error('HD comic loading failed',err);return false;});

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
    await window.HD_IMAGES_READY;
    let i=0;setIntro(0);
    const next=()=>{
      if(i<2){i++;setIntro(i);introTimer=setTimeout(next,INTRO_DELAY);}
      else if(btn){btn.style.setProperty('display','block','important');btn.disabled=false;btn.textContent='START MISSION';}
    };
    introTimer=setTimeout(next,INTRO_DELAY);
  };

  window.playEndingScenes=async function(){
    clearTimeout(endingTimer);
    await window.HD_IMAGES_READY;
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
