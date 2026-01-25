export default function playBaked(data, api) {
  const { pixelGrid } = api;
  if (!pixelGrid || !data || !data.frames) return null;

  let frame = 0;
  let running = true;

  function render() {
    if (!running) return;
    
    const frameData = data.frames[frame % data.frames.length];
    
    pixelGrid.clear();
    
    for (const [key, color] of Object.entries(frameData)) {
      const [x, y] = key.split(',').map(Number);
      pixelGrid.setPixel(x, y, color);
    }
    
    frame++;
    
    setTimeout(() => {
      if (running) requestAnimationFrame(render);
    }, 50);
  }

  requestAnimationFrame(render);

  return () => {
    running = false;
  };
}
