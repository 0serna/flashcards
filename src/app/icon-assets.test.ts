import { readFileSync } from "node:fs";
import { join } from "node:path";
import { inflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";

function readPng(path: string) {
  const file = readFileSync(path);
  const chunks: Buffer[] = [];
  let cursor = 8;

  while (cursor < file.length) {
    const length = file.readUInt32BE(cursor);
    const type = file.subarray(cursor + 4, cursor + 8).toString("ascii");
    const data = file.subarray(cursor + 8, cursor + 8 + length);

    if (type === "IDAT") {
      chunks.push(data);
    }

    cursor += length + 12;
  }

  const width = file.readUInt32BE(16);
  const height = file.readUInt32BE(20);
  const pixels = inflateSync(Buffer.concat(chunks));
  const stride = width * 4 + 1;

  return {
    signature: file.subarray(0, 8).toString("hex"),
    width,
    height,
    pixelAt(x: number, y: number) {
      const offset = y * stride + 1 + x * 4;

      return [...pixels.subarray(offset, offset + 4)];
    },
  };
}

function readIco(path: string) {
  const file = readFileSync(path);

  return {
    reserved: file.readUInt16LE(0),
    type: file.readUInt16LE(2),
    count: file.readUInt16LE(4),
    width: file[6] || 256,
    height: file[7] || 256,
    bytes: file,
  };
}

describe("app icon assets", () => {
  it.each([
    ["icon-192.png", 192],
    ["icon-512.png", 512],
  ])("ships a %s Layers2 PNG", (filename, size) => {
    const icon = readPng(join(process.cwd(), "public", filename));
    const scale = size / 192;
    const sample = (x: number, y: number) =>
      icon.pixelAt(Math.floor(x * scale), Math.floor(y * scale));

    expect(icon.signature).toBe("89504e470d0a1a0a");
    expect(icon.width).toBe(size);
    expect(icon.height).toBe(size);
    expect(sample(20, 20)).toEqual([0, 0, 0, 0]);
    expect(sample(56, 28)).toEqual([255, 255, 255, 255]);
    expect(sample(56, 37)).toEqual([10, 10, 10, 255]);
    expect(sample(136, 37)).toEqual([10, 10, 10, 255]);
    expect(sample(136, 144)).toEqual([10, 10, 10, 255]);
  });

  it("ships a visible browser favicon", () => {
    const favicon = readIco(join(process.cwd(), "src/app/favicon.ico"));

    expect(favicon.reserved).toBe(0);
    expect(favicon.type).toBe(1);
    expect(favicon.count).toBe(1);
    expect(favicon.width).toBe(64);
    expect(favicon.height).toBe(64);
    expect(favicon.bytes.length).toBeGreaterThan(300);
  });
});
