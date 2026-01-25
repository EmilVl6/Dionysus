import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const COLS = 80;
const ROWS = 80;
const FRAMES = 120;

class GridCapture {
  constructor() {
    this.GRID = { cols: COLS, rows: ROWS, cellSize: 8 };
    this.frames = [];
    this.current = {};
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
    this.frames.push({ ...this.current });
  }
}

global.document = {
  documentElement: {
    style: { getPropertyValue: () => '#ff6b35' }
  }
};

global.getComputedStyle = () => ({
  getPropertyValue: () => '#ff6b35',
  background: '#ff6b35'
});

global.requestAnimationFrame = (cb) => setTimeout(cb, 16);
global.performance = { now: () => Date.now() };

async function bakeSimulation(name, modulePath) {
  console.log(`Baking ${name}...`);
  
  const grid = new GridCapture();
  const api = {
    pixelGrid: grid,
    root: { style: { getPropertyValue: () => '#ff6b35' } }
  };

  try {
    const mod = await import(modulePath);
    const stopFn = mod.default(api);
    
    await new Promise((resolve) => {
      let frame = 0;
      const interval = setInterval(() => {
        grid.snapshot();
        frame++;
        if (frame >= FRAMES) {
          clearInterval(interval);
          if (stopFn) stopFn();
          resolve();
        }
      }, 50);
    });

    return { cols: COLS, rows: ROWS, frames: grid.frames };
  } catch (error) {
    console.error(`Failed to bake ${name}:`, error);
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
  }
}

console.log('\nBaked');