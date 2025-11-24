export default function start(api){
  const { pixelGrid, root = document.documentElement } = api;
  const g = pixelGrid && pixelGrid.GRID;
  if(!g) return ()=>{};

  function parseHex(hex){
    hex = String(hex || '').trim().replace('#','');
    if(hex.length === 3) hex = hex.split('').map(c=>c+c).join('');
    const r = parseInt(hex.slice(0,2),16) || 244;
    const g = parseInt(hex.slice(2,4),16) || 246;
    const b = parseInt(hex.slice(4,6),16) || 248;
    return {r,g,b};
  }
  function rgbToHsl(r,g,b){
    r/=255; g/=255; b/=255;
    const max = Math.max(r,g,b), min = Math.min(r,g,b);
    let h=0,s=0,l = (max+min)/2;
    if(max!==min){
      const d = max-min;
      s = l > 0.5 ? d/(2-max-min) : d/(max+min);
      switch(max){
        case r: h = (g-b)/d + (g<b?6:0); break;
        case g: h = (b-r)/d + 2; break;
        case b: h = (r-g)/d + 4; break;
      }
      h /= 6;
    }
    return {h: Math.round(h*360), s: Math.round(s*100), l: Math.round(l*100)};
  }
  function getBaseHSL(){
    try{
      const cs = getComputedStyle(root);
      let bg = cs.getPropertyValue('--bg') || cs.background || '#f4f6f8';
      bg = String(bg).trim();
      if(bg.startsWith('#')){ const c = parseHex(bg); return rgbToHsl(c.r,c.g,c.b); }
      const m = bg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if(m) return rgbToHsl(Number(m[1]), Number(m[2]), Number(m[3]));
    }catch(e){}
    return {h:200,s:8,l:94};
  }

  const base = getBaseHSL();
  const cols = g.cols;
  const rows = g.rows;
  const drops = new Array(cols).fill(0).map(()=>Math.floor(Math.random()*rows));
  const speeds = new Array(cols).fill(0).map(()=>1 + Math.floor(Math.random()*3));

  pixelGrid.clear();

  let running = true;

  const sat = Math.min(100, Math.round(base.s * 1.35 + 6));
  const interval = setInterval(()=>{
    if(!running) return;
    for(let x=0;x<cols;x++){
      if(Math.random() < 0.02) drops[x] = 0;
      drops[x] = (drops[x] + speeds[x]) % rows;
      const y = drops[x];

      const hueShift = ((x % 11) - 5) * 2; 
      const h = (base.h + hueShift + 360) % 360;

      const headL = Math.min(88, base.l + 10 + Math.floor(Math.random()*6));
      pixelGrid.setPixel(x, y, `hsl(${h}, ${sat}%, ${headL}%)`);

      for(let t=1;t<9;t++){
        const yy = (y - t + rows) % rows;
        const L = Math.max(2, base.l + Math.round((10 - t) * 1.6));
        pixelGrid.setPixel(x, yy, `hsl(${h}, ${sat}%, ${L}%)`);
      }
    }
  }, 72);

  return function stop(){ running = false; clearInterval(interval); };
}
