export default function start(api){
  const { pixelGrid, root = document.documentElement } = api;
  const g = pixelGrid && pixelGrid.GRID;
  if(!g) return ()=>{};

  function parseHex(hex){ hex = String(hex||'').trim().replace('#',''); if(hex.length===3) hex=hex.split('').map(c=>c+c).join(''); const r=parseInt(hex.slice(0,2),16)||244; const g_=parseInt(hex.slice(2,4),16)||246; const b=parseInt(hex.slice(4,6),16)||248; return {r,g:g_,b}; }
  function rgbToHsl(r,g,b){ r/=255; g/=255; b/=255; const max=Math.max(r,g,b), min=Math.min(r,g,b); let h=0,s=0,l=(max+min)/2; if(max!==min){ const d=max-min; s=l>0.5?d/(2-max-min):d/(max+min); switch(max){case r: h=(g-b)/d + (g<b?6:0); break; case g: h=(b-r)/d +2; break; case b: h=(r-g)/d +4; break;} h/=6;} return {h:Math.round(h*360), s:Math.round(s*100), l:Math.round(l*100)}; }
  function getBaseHSL(){ try{ const cs=getComputedStyle(root); let bg=cs.getPropertyValue('--bg')||cs.background||'#f4f6f8'; bg=String(bg).trim(); if(bg.startsWith('#')){const c=parseHex(bg); return rgbToHsl(c.r,c.g,c.b);} const m=bg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/); if(m) return rgbToHsl(Number(m[1]),Number(m[2]),Number(m[3])); }catch(e){} return {h:200,s:8,l:94}; }

  const base=getBaseHSL();
  const cols=g.cols, rows=g.rows;
  const particles = [];

  function noise(x,y){
    return (Math.sin(x*0.12 + y*0.07) + Math.cos(y*0.15 - x*0.05))*0.5;
  }

  for(let i=0;i<200;i++) particles.push({x:Math.random()*cols, y:Math.random()*rows, life: 60+Math.floor(Math.random()*120)});
  let running=true;
  function step(){
    for(let y=0;y<rows;y++) for(let x=0;x<cols;x++) pixelGrid.setPixel(x,y, `hsl(${base.h}, ${base.s}%, ${Math.max(2, base.l-2)}%)`);

    for(let i=particles.length-1;i>=0;i--){
      const p = particles[i];
      const a = noise(p.x*0.6, p.y*0.6) * Math.PI*2;
      p.x += Math.cos(a) * 0.6;
      p.y += Math.sin(a) * 0.6;
      p.life--;
      const xi = Math.floor((p.x%cols+cols)%cols), yi = Math.floor((p.y%rows+rows)%rows);
      const L = Math.max(2, Math.min(98, base.l + Math.round((p.life/180)*30)));
      pixelGrid.setPixel(xi, yi, `hsl(${base.h}, ${base.s}%, ${L}%)`);
      if(p.life<=0) particles.splice(i,1);
    }
    while(particles.length<200) particles.push({x:Math.random()*cols, y:Math.random()*rows, life:60+Math.floor(Math.random()*120)});
  }

  const iv = setInterval(()=>{ if(running) step(); }, 50);
  return ()=>{ running=false; clearInterval(iv); };
}
