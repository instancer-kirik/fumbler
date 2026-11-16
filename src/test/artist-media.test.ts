import { describe, expect, it } from "vitest";
import {
  isExternalStreamingPage,
  safeUploadFilename,
  splitCommaValues,
  validateHttpUrl,
  validateMediaFile,
} from "@/lib/artist-media";

const makeFile = (name: string, type: string, size = 100) =>
  new File([new Uint8Array(size)], name, { type });

describe("artist intro media", () => {
  it("accepts only complete HTTP links", () => {
    expect(validateHttpUrl("https://example.com/demo.mp3")).toBeNull();
    expect(validateHttpUrl("javascript:alert(1)")).toContain("http");
    expect(validateHttpUrl("not a url")).toContain("valid URL");
  });

  it("rejects the wrong file kind and oversized files", () => {
    expect(validateMediaFile(makeFile("demo.mp3", "audio/mpeg"), "audio")).toBeNull();
    expect(validateMediaFile(makeFile("demo.mp3", "audio/mpeg"), "image")).toContain("image");
    expect(validateMediaFile(makeFile("large.wav", "audio/wav", 50 * 1024 * 1024 + 1), "audio")).toContain("50 MB");
  });

  it("recognizes streaming pages that need an external player", () => {
    expect(isExternalStreamingPage("https://soundcloud.com/artist/demo")).toBe(true);
    expect(isExternalStreamingPage("https://cdn.example.com/demo.mp3")).toBe(false);
  });

  it("deduplicates style tags and limits file extensions to safe characters", () => {
    expect(splitCommaValues("ambient, drone, ambient, , field recording")).toEqual([
      "ambient",
      "drone",
      "field recording",
    ]);
    expect(safeUploadFilename("My Demo.MP3!")).toBe("mp3");
  });
});
