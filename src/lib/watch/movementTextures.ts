import { CanvasTexture, LinearFilter, RepeatWrapping, SRGBColorSpace } from "three";

/**
 * Finishing, drawn rather than mapped from a photograph, so it survives
 * a close camera: perlage on the main plate, Cotes de Geneve on the
 * bridges, and a brushed gold for the wheels.
 */

function finish(texture: CanvasTexture): CanvasTexture {
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

/** Perlage: overlapping circular graining, struck in rows. */
export function createPerlageTexture(size = 1024): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return finish(new CanvasTexture(canvas));

  ctx.fillStyle = "#a9adb0";
  ctx.fillRect(0, 0, size, size);

  const spot = size * 0.052;
  const pitch = spot * 0.62;
  for (let row = -1; row * pitch < size + spot; row += 1) {
    for (let col = -1; col * pitch < size + spot; col += 1) {
      const cx = col * pitch + (row % 2 ? pitch * 0.5 : 0);
      const cy = row * pitch;
      const grad = ctx.createRadialGradient(
        cx - spot * 0.3,
        cy - spot * 0.3,
        spot * 0.05,
        cx,
        cy,
        spot,
      );
      grad.addColorStop(0, "rgba(255,255,255,0.20)");
      grad.addColorStop(0.55, "rgba(255,255,255,0.03)");
      grad.addColorStop(0.88, "rgba(0,0,0,0.13)");
      grad.addColorStop(1, "rgba(0,0,0,0.02)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, spot, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(0,0,0,0.10)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // Fine tool grain over the whole plate.
  const image = ctx.getImageData(0, 0, size, size);
  const { data } = image;
  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.random() - 0.5) * 12;
    data[i] += n;
    data[i + 1] += n;
    data[i + 2] += n;
  }
  ctx.putImageData(image, 0, 0);

  return finish(new CanvasTexture(canvas));
}

/** Cotes de Geneve: broad parallel bands, each lit across its width. */
export function createCotesTexture(size = 512): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return finish(new CanvasTexture(canvas));

  ctx.fillStyle = "#a4a9ac";
  ctx.fillRect(0, 0, size, size);

  const band = size / 9;
  for (let i = 0; i < 10; i += 1) {
    const y = i * band;
    const grad = ctx.createLinearGradient(0, y, 0, y + band);
    grad.addColorStop(0, "rgba(255,255,255,0.22)");
    grad.addColorStop(0.35, "rgba(255,255,255,0.05)");
    grad.addColorStop(0.75, "rgba(0,0,0,0.10)");
    grad.addColorStop(1, "rgba(0,0,0,0.20)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, y, size, band);
  }

  // Lengthwise tooling within each band.
  for (let i = 0; i < (size >= 512 ? 900 : 380); i += 1) {
    ctx.strokeStyle = `rgba(255,255,255,${Math.random() * 0.05})`;
    ctx.lineWidth = 0.7;
    const y = Math.random() * size;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  return finish(texture);
}

/** Brushed gilt for the wheels, grained around the rim. */
export function createGiltTexture(size = 512): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return finish(new CanvasTexture(canvas));

  const c = size / 2;
  ctx.fillStyle = "#9d8046";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < (size >= 512 ? 2400 : 1000); i += 1) {
    const r = Math.random() * c;
    const a = Math.random() * Math.PI * 2;
    const len = 0.06 + Math.random() * 0.3;
    ctx.strokeStyle = `rgba(248,234,204,${Math.random() * 0.1})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(c, c, r, a, a + len);
    ctx.stroke();
  }
  return finish(new CanvasTexture(canvas));
}
