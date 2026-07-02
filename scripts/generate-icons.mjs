import { readFileSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const { polylines } = JSON.parse(
  readFileSync("src/brand/logo-geometry.json", "utf8"),
);
const background = [0, 0, 0, 0];
const foreground = [10, 10, 10, 255];
const halo = [255, 255, 255, 255];

function crc32(buffer) {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type);
  const output = Buffer.alloc(12 + data.length);

  output.writeUInt32BE(data.length, 0);
  typeBytes.copy(output, 4);
  data.copy(output, 8);
  output.writeUInt32BE(
    crc32(Buffer.concat([typeBytes, data])),
    8 + data.length,
  );

  return output;
}

function setPixel(pixels, width, x, y, color) {
  if (x < 0 || y < 0 || x >= width || y >= width) {
    return;
  }

  pixels.set(color, (y * width + x) * 4);
}

function drawCircle(pixels, width, x, y, radius, color) {
  const left = Math.floor(x - radius);
  const right = Math.ceil(x + radius);
  const top = Math.floor(y - radius);
  const bottom = Math.ceil(y + radius);

  for (let row = top; row <= bottom; row += 1) {
    for (let column = left; column <= right; column += 1) {
      const dx = column - x;
      const dy = row - y;

      if (dx * dx + dy * dy <= radius * radius) {
        setPixel(pixels, width, column, row, color);
      }
    }
  }
}

function drawLine(pixels, width, scale, from, to, radius, color) {
  const x1 = from[0] * scale;
  const y1 = from[1] * scale;
  const x2 = to[0] * scale;
  const y2 = to[1] * scale;
  const distance = Math.hypot(x2 - x1, y2 - y1);
  const scaledRadius = radius * scale;

  for (let step = 0; step <= distance; step += 0.5) {
    const progress = distance === 0 ? 0 : step / distance;
    drawCircle(
      pixels,
      width,
      x1 + (x2 - x1) * progress,
      y1 + (y2 - y1) * progress,
      scaledRadius,
      color,
    );
  }
}

function drawPolyline(pixels, width, scale, points, radius, color) {
  for (let index = 0; index < points.length - 1; index += 1) {
    drawLine(
      pixels,
      width,
      scale,
      points[index],
      points[index + 1],
      radius,
      color,
    );
  }
}

function createPng(size) {
  const scale = size / 192;
  const pixels = Buffer.alloc(size * size * 4);

  for (let offset = 0; offset < pixels.length; offset += 4) {
    pixels.set(background, offset);
  }

  for (const polyline of polylines) {
    drawPolyline(pixels, size, scale, polyline, 11, halo);
  }
  for (const polyline of polylines) {
    drawPolyline(pixels, size, scale, polyline, 7, foreground);
  }

  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let row = 0; row < size; row += 1) {
    raw[row * (size * 4 + 1)] = 0;
    pixels.copy(
      raw,
      row * (size * 4 + 1) + 1,
      row * size * 4,
      (row + 1) * size * 4,
    );
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  return Buffer.concat([
    Buffer.from("89504e470d0a1a0a", "hex"),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function createIco(png, size) {
  const header = Buffer.alloc(22);

  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  header[6] = size;
  header[7] = size;
  header[8] = 0;
  header[9] = 0;
  header.writeUInt16LE(1, 10);
  header.writeUInt16LE(32, 12);
  header.writeUInt32LE(png.length, 14);
  header.writeUInt32LE(header.length, 18);

  return Buffer.concat([header, png]);
}

writeFileSync("public/icon-192.png", createPng(192));
writeFileSync("public/icon-512.png", createPng(512));
writeFileSync("src/app/favicon.ico", createIco(createPng(64), 64));
