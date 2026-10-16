import { describe, it, expect } from "vitest";
import { validateImageBuffer } from "../src/utils/fileValidation";

describe("File Validation — Magic Byte Signatures", () => {
  it("recognizes valid JPEG files by magic bytes (FF D8 FF)", () => {
    const fakeJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
    const res = validateImageBuffer(fakeJpeg);
    expect(res.isValid).toBe(true);
    expect(res.detectedMimeType).toBe("image/jpeg");
  });

  it("recognizes valid PNG files by magic bytes (89 50 4E 47)", () => {
    const fakePng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
    const res = validateImageBuffer(fakePng);
    expect(res.isValid).toBe(true);
    expect(res.detectedMimeType).toBe("image/png");
  });

  it("recognizes valid WebP files by RIFF and WEBP markers", () => {
    const fakeWebp = Buffer.alloc(14);
    fakeWebp[0] = 0x52; // R
    fakeWebp[1] = 0x49; // I
    fakeWebp[2] = 0x46; // F
    fakeWebp[3] = 0x46; // F
    fakeWebp[8] = 0x57; // W
    fakeWebp[9] = 0x45; // E
    fakeWebp[10] = 0x42; // B
    fakeWebp[11] = 0x50; // P
    const res = validateImageBuffer(fakeWebp);
    expect(res.isValid).toBe(true);
    expect(res.detectedMimeType).toBe("image/webp");
  });

  it("rejects malicious or invalid file pretending to be an image", () => {
    const fakeExe = Buffer.from("MZThisIsAnExecutableFileNotAnImage");
    const res = validateImageBuffer(fakeExe);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain("Invalid file signature");
  });

  it("rejects undersized buffers", () => {
    const tiny = Buffer.from([0xff, 0xd8]);
    const res = validateImageBuffer(tiny);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain("too small");
  });
});
