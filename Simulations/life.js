export default function start(api){
  const { pixelGrid, root = document.documentElement } = api;
  const g = pixelGrid && pixelGrid.GRID;
  if(!g) return ()=>{};

  function parseHex(hex){ hex = String(hex||'').trim().replace('#',''); if(hex.length===3) hex=hex.split('').map(c=>c+c).join(''); const r=parseInt(hex.slice(0,2),16)||244; const g_=parseInt(hex.slice(2,4),16)||246; const b=parseInt(hex.slice(4,6),16)||248; return {r,g:g_,b}; }
  function rgbToHsl(r,g,b){ r/=255; g/=255; b/=255; const max=Math.max(r,g,b), min=Math.min(r,g,b); let h=0,s=0,l=(max+min)/2; if(max!==min){ const d=max-min; s=l>0.5?d/(2-max-min):d/(max+min); switch(max){case r: h=(g-b)/d + (g<b?6:0); break; case g: h=(b-r)/d +2; break; case b: h=(r-g)/d +4; break;} h/=6;} return {h:Math.round(h*360), s:Math.round(s*100), l:Math.round(l*100)}; }
  function getBaseHSL(){ try{ const cs=getComputedStyle(root); let bg=cs.getPropertyValue('--bg')||cs.background||'#f4f6f8'; bg=String(bg).trim(); if(bg.startsWith('#')){const c=parseHex(bg); return rgbToHsl(c.r,c.g,c.b);} const m=bg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/); if(m) return rgbToHsl(Number(m[1]),Number(m[2]),Number(m[3])); }catch(e){} return {h:200,s:8,l:94}; }

  const base = getBaseHSL();
  const cols = g.cols, rows = g.rows;
  let grid = new Uint8Array(cols*rows);
  const idx=(x,y)=> y*cols + x;

  for(let i=0;i<grid.length;i++) grid[i] = Math.random()<0.15?1:0;

  let running = true;
  const _next = new Uint8Array(cols*rows);
  function step(){
    const next = _next;
    for(let y=0;y<rows;y++){
      for(let x=0;x<cols;x++){
        let n=0;
        for(let oy=-1;oy<=1;oy++) for(let ox=-1;ox<=1;ox++){ if(ox===0 && oy===0) continue; const nx=x+ox, ny=y+oy; if(nx>=0 && nx<cols && ny>=0 && ny<rows) n += grid[idx(nx,ny)]; }
        const i=idx(x,y);
        if(grid[i]){ next[i] = (n===2 || n===3)?1:0; } else { next[i] = (n===3)?1:0; }
      }
    }
    grid.set(next);

    for(let y=0;y<rows;y++) for(let x=0;x<cols;x++){
      const v = grid[idx(x,y)];
      const L = v? Math.max(2, Math.min(98, base.l - 10)) : base.l + 0;
      pixelGrid.setPixel(x,y, `hsl(${base.h}, ${base.s}%, ${L}%)`);
    }
  }

  const iv = setInterval(()=>{ if(running) step(); }, 120);
  return ()=>{ running=false; clearInterval(iv); };
}
