import { CanvasTexture, LinearFilter, SRGBColorSpace } from "three";

/**
 * The dial is drawn, not photographed: a galvanic sunburst, a printed
 * minute track and a recessed running-seconds register. Nothing is
 * signed — the watch carries no name, which is the point.
 */

const SIZE = 1024;

function sunburst(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const spokes = 320;
  ctx.save();
  ctx.globalCompositeOperation = "overlay";
  for (let i = 0; i < spokes; i += 1) {
    const a = (i / spokes) * Math.PI * 2;
    const light = i % 2 === 0 ? 0.05 : 0.02;
    ctx.strokeStyle = `rgba(255, 248, 232, ${light})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    ctx.stroke();
  }
  ctx.restore();
}

function grain(ctx: CanvasRenderingContext2D) {
  const image = ctx.getImageData(0, 0, SIZE, SIZE);
  const { data } = image;
  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.random() - 0.5) * 9;
    data[i] += n;
    data[i + 1] += n;
    data[i + 2] += n;
  }
  ctx.putImageData(image, 0, 0);
}

export function createDialTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new CanvasTexture(canvas);

  const c = SIZE / 2;
  const outer = SIZE * 0.5;

  /*
    A sunburst grey that opens up under the light at the centre and
    falls away to near black at the rehaut. Nothing is printed on it:
    the hour markers and the hands are applied parts, and the watch
    carries no name.
  */
  const base = ctx.createRadialGradient(c, c * 0.88, outer * 0.04, c, c, outer);
  base.addColorStop(0, "#6b6d70");
  base.addColorStop(0.32, "#54565a");
  base.addColorStop(0.66, "#34363a");
  base.addColorStop(0.88, "#212326");
  base.addColorStop(1, "#131415");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, SIZE, SIZE);

  sunburst(ctx, c, c, outer);

  // A soft directional sheen, as if the dial is turned into the key.
  const sheen = ctx.createLinearGradient(0, 0, SIZE, SIZE);
  sheen.addColorStop(0, "rgba(255,252,246,0.10)");
  sheen.addColorStop(0.45, "rgba(255,252,246,0.02)");
  sheen.addColorStop(1, "rgba(0,0,0,0.14)");
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Deepen the outer edge where the dial turns down into the rehaut.
  const edge = ctx.createRadialGradient(c, c, outer * 0.72, c, c, outer);
  edge.addColorStop(0, "rgba(0,0,0,0)");
  edge.addColorStop(1, "rgba(0,0,0,0.6)");
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, SIZE, SIZE);

  grain(ctx);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

/** Alligator scales for the strap: a run of rounded tiles that grow
    toward the lug end, lit from above like polished leather. */
export function createCrocTexture(): CanvasTexture {
  const w = 512;
  const h = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new CanvasTexture(canvas);

  ctx.fillStyle = "#0d0c0b";
  ctx.fillRect(0, 0, w, h);

  const rows = 22;
  for (let row = 0; row < rows; row += 1) {
    const t = row / rows;
    const cols = Math.max(3, Math.round(3 + t * 4));
    const cellH = h / rows;
    const cellW = w / cols;
    for (let col = 0; col < cols; col += 1) {
      const x = col * cellW + cellW * 0.5 + (row % 2 ? cellW * 0.18 : 0);
      const y = row * cellH + cellH * 0.5;
      const rx = cellW * 0.42;
      const ry = cellH * 0.4;

      const tile = ctx.createRadialGradient(
        x - rx * 0.3,
        y - ry * 0.4,
        ry * 0.1,
        x,
        y,
        rx,
      );
      tile.addColorStop(0, "#3a3532");
      tile.addColorStop(0.55, "#211e1c");
      tile.addColorStop(1, "#0b0a09");
      ctx.fillStyle = tile;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(0,0,0,0.85)";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.strokeStyle = "rgba(255,246,232,0.09)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(x, y - ry * 0.18, rx * 0.82, ry * 0.5, 0, Math.PI, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Saddle stitching down both edges.
  ctx.strokeStyle = "rgba(196,180,156,0.42)";
  ctx.lineWidth = 3;
  ctx.setLineDash([9, 11]);
  [w * 0.085, w * 0.915].forEach((x) => {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  });
  ctx.setLineDash([]);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/** Brushed circular grain for the movement plate. */
export function createPlateTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new CanvasTexture(canvas);
  const c = 256;
  ctx.fillStyle = "#8d8a84";
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2600; i += 1) {
    const r = Math.random() * 250;
    const a = Math.random() * Math.PI * 2;
    const len = 0.05 + Math.random() * 0.25;
    ctx.strokeStyle = `rgba(255,255,255,${Math.random() * 0.09})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(c, c, r, a, a + len);
    ctx.stroke();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
