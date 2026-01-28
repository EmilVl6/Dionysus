import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const COLS = 64;
const ROWS = 64;
const FRAMES = 40;

class GridCapture {
  constructor() {
    this.GRID = { cols: COLS, rows: ROWS, cellSize: 8 };
    this.frames = [];
    this.current = {};
  }

  extractLightness(color) {
    const hslMatch = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if(hslMatch) return parseInt(hslMatch[3]);
    
    const hex = color.replace('#', '');
    if(hex.length === 6) {
      const r = parseInt(hex.slice(0,2), 16) / 255;
      const g = parseInt(hex.slice(2,4), 16) / 255;
      const b = parseInt(hex.slice(4,6), 16) / 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      return Math.round(((max + min) / 2) * 100);
    }
    return 50;
  }

  setPixel(x, y, color) {
    if (x >= 0 && y >= 0 && x < COLS && y < ROWS) {
      this.current[`${x},${y}`] = color;
    }
  }

  getPixel(x, y) {
    return this.current[`${x},${y}`] || null;
  }

  clear() {
    this.current = {};
  }

  snapshot() {
    const compressed = {};
    for(const [key, color] of Object.entries(this.current)) {
      const lightness = this.extractLightness(color);
      if(lightness < 95) {
        compressed[key] = lightness;
      }
    }
    this.frames.push(compressed);
  }
}

global.document = {
  documentElement: {
    style: { getPropertyValue: (prop) => {
      if (prop === '--bg') return '#333333';
      return '#333333';
    }}
  }
};

global.getComputedStyle = (element) => ({
  getPropertyValue: (prop) => {
    if (prop === '--bg') return '#333333';
    return '#333333';
  },
  background: '#333333'
});

global.requestAnimationFrame = (cb) => setTimeout(cb, 16);
global.performance = { now: () => Date.now() };

async function bakeSimulation(name, modulePath) {
  console.log(`Baking ${name}...`);
  
  const grid = new GridCapture();
  const api = {
    pixelGrid: grid,
    root: { 
      style: { 
        getPropertyValue: (prop) => {
          if (prop === '--bg') return 'hsl(0, 0%, 50%)';
          return '#808080';
        }
      } 
    }
  };

  try {
    const fullPath = new URL(modulePath, import.meta.url).href;
    console.log(`  Loading: ${fullPath}`);
    const mod = await import(fullPath);
    
    if (!mod.default || typeof mod.default !== 'function') {
      throw new Error('No default export found');
    }
    
    const stopFn = mod.default(api);
    
    await new Promise((resolve) => {
      let frame = 0;
      const interval = setInterval(() => {
        grid.snapshot();
        frame++;
        if (frame >= FRAMES) {
          clearInterval(interval);
          if (stopFn && typeof stopFn === 'function') {
            try { stopFn(); } catch(e) {}
          }
          resolve();
        }
      }, 50);
    });

    console.log(`${name}: ${grid.frames.length} frames captured`);
    return { cols: COLS, rows: ROWS, frames: grid.frames };
  } catch (error) {
    console.error(`Failed to bake ${name}:`, error.message);
    console.error(error.stack);
    return null;
  }
}

const sims = [
  ['plasma', './Simulations/plasma.js'],
  ['life', './Simulations/life.js'],
  ['waves', './Simulations/waves.js'],
  ['flow', './Simulations/flow.js'],
  ['rain', './Simulations/rain.js'],
  ['sand', './Simulations/sand.js'],
  ['bars-radix', './Simulations/bars-radix.js']
];

const bakedDir = path.join(__dirname, 'Baked');
if (!fs.existsSync(bakedDir)) {
  fs.mkdirSync(bakedDir);
}

for (const [name, file] of sims) {
  const data = await bakeSimulation(name, file);
  if (data) {
    const outputPath = path.join(bakedDir, `${name}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(data));
    console.log(`Saved ${name}.json (${data.frames.length} frames)`);
  } else {
    console.log(`Skipped ${name}.json (baking failed)`);
  }
}

console.log('\nBaking complete');
process.exit(0);