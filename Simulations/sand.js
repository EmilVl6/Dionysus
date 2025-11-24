export default function start(api){
  const { pixelGrid, root = document.documentElement } = api;
  const g = pixelGrid && pixelGrid.GRID;
  if(!g) return ()=>{};

  function parseHex(hex){ hex = String(hex||'').trim().replace('#',''); if(hex.length===3) hex=hex.split('').map(c=>c+c).join(''); const r=parseInt(hex.slice(0,2),16)||244; const g_=parseInt(hex.slice(2,4),16)||246; const b=parseInt(hex.slice(4,6),16)||248; return {r,g:g_,b}; }
  function rgbToHsl(r,g,b){ r/=255; g/=255; b/=255; const max=Math.max(r,g,b), min=Math.min(r,g,b); let h=0,s=0,l=(max+min)/2; if(max!==min){ const d=max-min; s=l>0.5?d/(2-max-min):d/(max+min); switch(max){case r: h=(g-b)/d + (g<b?6:0); break; case g: h=(b-r)/d +2; break; case b: h=(r-g)/d +4; break;} h/=6;} return {h:Math.round(h*360), s:Math.round(s*100), l:Math.round(l*100)}; }
  function getBaseHSL(){ try{ const cs=getComputedStyle(root); let bg=cs.getPropertyValue('--bg')||cs.background||'#f4f6f8'; bg=String(bg).trim(); if(bg.startsWith('#')){const c=parseHex(bg); return rgbToHsl(c.r,c.g,c.b);} const m=bg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/); if(m) return rgbToHsl(Number(m[1]),Number(m[2]),Number(m[3])); }catch(e){} return {h:200,s:8,l:94}; }

  const base = getBaseHSL();
  const cols = g.cols, rows = g.rows;
  const grid = new Uint8Array(cols*rows);
  const idx = (x,y)=> y*cols + x;
  const colsOrder = new Array(cols);
  function neighborCount(x,y){
    let c = 0;
    for(let oy=-1; oy<=1; oy++){
      for(let ox=-1; ox<=1; ox++){
        if(ox===0 && oy===0) continue;
        const nx = x+ox, ny = y+oy;
        if(nx>=0 && nx<cols && ny>=0 && ny<rows){ if(grid[idx(nx,ny)]===1) c++; }
      }
    }
    return c;
  }

  for(let x=0;x<cols;x++) if(Math.random()<0.25) grid[idx(x, Math.floor(rows*0.04))]=1;

  let running = true;
  function step(){
    for(let i=0;i<cols;i++) colsOrder[i]=i;
    for(let i=colsOrder.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); const t=colsOrder[i]; colsOrder[i]=colsOrder[j]; colsOrder[j]=t; }

    for(let y=rows-2;y>=0;y--){
      for(let xi=0; xi<cols; xi++){
        const x = colsOrder[xi];
        const i = idx(x,y);
        if(grid[i]===1){
          const belowY = y+1;
          if(belowY >= rows) continue;

          const curNeighbors = neighborCount(x,y);

          const straightIdx = idx(x, belowY);
          if(grid[straightIdx] === 0){ grid[straightIdx] = 1; grid[i] = 0; continue; }

          const candidates = [];
          if(x-1 >= 0){ const li = idx(x-1, belowY); if(grid[li]===0) candidates.push({x:x-1, y:belowY, cnt: neighborCount(x-1, belowY)}); }
          if(x+1 < cols){ const ri = idx(x+1, belowY); if(grid[ri]===0) candidates.push({x:x+1, y:belowY, cnt: neighborCount(x+1, belowY)}); }

          if(candidates.length === 0) continue;

          if(curNeighbors >= 3 && Math.random() < 0.9){
            const inc = candidates.some(c=>c.cnt > curNeighbors);
            if(!inc) continue;
          }

          candidates.sort((a,b)=> b.cnt - a.cnt);
          const bestCnt = candidates[0].cnt;
          const bestCandidates = candidates.filter(c=>c.cnt === bestCnt);
          const pick = bestCandidates[Math.floor(Math.random()*bestCandidates.length)];

          if(pick.cnt > curNeighbors || Math.random() < 0.35){
            grid[idx(pick.x, pick.y)] = 1;
            grid[i] = 0;
            continue;
          }
        }
      }
    }

    const spawnCount = Math.max(4, Math.floor(cols * 0.12)); 
    for(let s=0;s<spawnCount;s++){
      if(Math.random() < 0.92){
        const sx = Math.floor(Math.random()*cols);
        grid[idx(sx,0)] = 1;
      }
    }

    for(let y=0;y<rows;y++){
      for(let x=0;x<cols;x++){
        const v = grid[idx(x,y)];
        const L = v? Math.max(2, Math.min(98, base.l - 10)) : base.l + 0;
        pixelGrid.setPixel(x,y, `hsl(${base.h}, ${base.s}%, ${L}%)`);
      }
    }
  }

  const stepsPerTick = 2;
  const iv = setInterval(()=>{ if(running){ for(let i=0;i<stepsPerTick;i++) step(); } }, 30);
  return ()=>{ running=false; clearInterval(iv); };
}
