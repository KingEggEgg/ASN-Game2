// v30 HD comic loader: reconstructs WebP images from text chunks on GitHub Pages.
(function(){
  const specs = [
    {selector:'.portrait-comic[data-scene="0"]', parts:['s1-0.txt','s1-1.txt','s1-2.txt']},
    {selector:'.portrait-comic[data-scene="1"]', parts:['s2-0.txt','s2-1.txt','s2-2.txt']},
    {selector:'.portrait-comic[data-scene="2"]', parts:['s3-0.txt','s3-1.txt','s3-2.txt']},
    {selector:'.ending-scene[data-ending-scene="0"]', parts:['s4-0.txt','s4-1.txt','s4-2.txt','s4-3.txt']},
    {selector:'.ending-scene[data-ending-scene="1"]', parts:['s5-0.txt','s5-1.txt','s5-2.txt']}
  ];

  async function loadOne(spec){
    const chunks = await Promise.all(spec.parts.map(async name => {
      const r = await fetch(`assets/comic/b64/${name}?v=30`, {cache:'no-store'});
      if(!r.ok) throw new Error(`${name}: HTTP ${r.status}`);
      return (await r.text()).trim();
    }));
    const img = document.querySelector(spec.selector);
    if(!img) return;
    const dataUrl = 'data:image/webp;base64,' + chunks.join('');
    await new Promise((resolve,reject)=>{
      const pre = new Image();
      pre.onload = ()=>{ img.src=dataUrl; img.dataset.hd='1'; resolve(); };
      pre.onerror = ()=>reject(new Error(`Invalid HD image for ${spec.selector}`));
      pre.src = dataUrl;
    });
  }

  window.HD_IMAGES_READY = Promise.all(specs.map(loadOne))
    .then(()=>{ document.documentElement.dataset.hdComics='ready'; return true; })
    .catch(err=>{ console.error('HD comic load failed:',err); return false; });
})();
