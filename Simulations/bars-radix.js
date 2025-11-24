export default function start(api){
  const { pixelGrid, root = document.documentElement } = api;
  const g = pixelGrid && pixelGrid.GRID;
  if(!g) return ()=>{};

  function parseHex(hex){ hex = String(hex||'').trim().replace('#',''); if(hex.length===3) hex = hex.split('').map(c=>c+c).join(''); const r=parseInt(hex.slice(0,2),16)||244; const g_=parseInt(hex.slice(2,4),16)||246; const b=parseInt(hex.slice(4,6),16)||248; return {r,g:g_,b}; }
  function rgbToHsl(r,g,b){ r/=255; g/=255; b/=255; const max=Math.max(r,g,b), min=Math.min(r,g,b); let h=0,s=0,l=(max+min)/2; if(max!==min){ const d=max-min; s=l>0.5?d/(2-max-min):d/(max+min); switch(max){case r: h=(g-b)/d + (g<b?6:0); break; case g: h=(b-r)/d +2; break; case b: h=(r-g)/d +4; break;} h/=6;} return {h:Math.round(h*360), s:Math.round(s*100), l:Math.round(l*100)}; }
  function getBaseHSL(){ try{ const cs=getComputedStyle(root); let bg=cs.getPropertyValue('--bg')||cs.background||'#f4f6f8'; bg=String(bg).trim(); if(bg.startsWith('#')){const c=parseHex(bg); return rgbToHsl(c.r,c.g,c.b);} const m=bg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/); if(m) return rgbToHsl(Number(m[1]),Number(m[2]),Number(m[3])); }catch(e){} return {h:200,s:8,l:94}; }

  const base = getBaseHSL();
  const cols = g.cols, rows = g.rows;
  
  const arr = new Array(cols).fill(0).map(()=> Math.floor(Math.random()*rows));
  const opQueue = [];
  let width = 1;
  let pairIndex = 0;
  let running = true;
  const opsPerFrame = 4; 
  let sorted = false;

  function render(){
    const maxVal = Math.max(1, rows - 1);
    for(let x=0;x<cols;x++){
      const v = Math.max(0, Math.min(rows, Math.round(arr[x])));
      const L = Math.max(2, Math.min(96, base.l + Math.round((v / maxVal) * 48) - 8));
      for(let y=0;y<rows;y++){
        const shade = (y >= rows - v) ? Math.min(96, L + 6) : L;
        pixelGrid.setPixel(x, y, `hsl(${base.h}, ${base.s}%, ${shade}%)`);
      }
    }
  }

  function enqueueNextPairOps(){
    while(pairIndex < cols){
      const leftStart = pairIndex;
      const leftLen = Math.min(width, cols - leftStart);
      const rightStart = leftStart + width;
      const rightLen = Math.max(0, Math.min(width, cols - rightStart));
      pairIndex += 2 * width;
      if(rightLen <= 0) continue;

      let l = 0, r = 0;
      const merged = [];
      while(l < leftLen && r < rightLen){
        merged.push(arr[leftStart + l] <= arr[rightStart + r] ? arr[leftStart + l++] : arr[rightStart + r++]);
      }
      while(l < leftLen) merged.push(arr[leftStart + l++]);
      while(r < rightLen) merged.push(arr[rightStart + r++]);

      for(let k=0;k<merged.length;k++){
        opQueue.push({ idx: leftStart + k, val: merged[k] });
      }
      return;
    }

    if(pairIndex >= cols){
      width *= 2;
      pairIndex = 0;
      if(width >= cols){
        sorted = true;
        pairIndex = cols;
        return;
      }
    }
  }

  function step(){
    if(opQueue.length === 0) enqueueNextPairOps();

    let processed = 0;
    while(processed < opsPerFrame && opQueue.length > 0){
      const op = opQueue.shift();
      arr[op.idx] = op.val;
      processed++;
    }

    render();
    if(running) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);

  return function stop(){ running = false; };
}
