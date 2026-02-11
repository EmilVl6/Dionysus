// Web Worker for simulation pixel processing
onmessage = function(e) {
  const { frameData, color, cols, rows } = e.data;
  // color: {r,g,b}
  // frameData: { 'x,y': lightness }
  // Output: Uint8ClampedArray for ImageData
  const pixels = new Uint8ClampedArray(cols * rows * 4);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const idx = (y * cols + x) * 4;
      const key = `${x},${y}`;
      const lightness = frameData[key];
      if (typeof lightness === 'number') {
        let r = 0, g = 0, b = 0, a = 0;
        if (lightness > 50) {
          // Highlight: background color - higher threshold for full brightness
          r = color.r; g = color.g; b = color.b;
          a = Math.pow((lightness - 50) / 50, 1.2) * 255;
        } else {
          // Black - lower threshold for darkest dark
          r = 0; g = 0; b = 0;
          a = Math.pow((50 - lightness) / 50, 0.3) * 255;
        }
        pixels[idx] = r;
        pixels[idx+1] = g;
        pixels[idx+2] = b;
        pixels[idx+3] = Math.round(a);
      } else {
        // Transparent
        pixels[idx] = 0;
        pixels[idx+1] = 0;
        pixels[idx+2] = 0;
        pixels[idx+3] = 0;
      }
    }
  }
  postMessage({ pixels });
};
