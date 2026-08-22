import { describe, it, expect } from "vitest";
import { assetUrl } from "./assets";

describe("assetUrl", () => {
  it("percent-encodes CJK filenames so the URL is a valid ByteString", () => {
    const url = assetUrl("generals/国战UI.WEI014.荡然由心.曹丕.webp");
    expect(url).toContain("%E5%9B%BD%E6%88%98UI.WEI014");
    // eslint-disable-next-line no-control-regex
    expect(/^[\x00-\xFF]*$/.test(url), `not latin-1 safe: ${url}`).toBe(true);
  });

  it("encodes the ♠♥♣♦ suit glyphs used by pack card filenames", () => {
    const url = assetUrl("cards/七星宝刀.♠.K.webp");
    expect(url).toContain("%E2%99%A0");
    // eslint-disable-next-line no-control-regex
    expect(/^[\x00-\xFF]*$/.test(url)).toBe(true);
  });

  it("keeps path separators intact", () => {
    expect(assetUrl("tokens/羊祜.webp")).toMatch(/\/assets\/tokens\/[^/]+$/);
  });

  it("strips leading slashes", () => {
    expect(assetUrl("//tokens/羊祜.webp")).toBe(assetUrl("tokens/羊祜.webp"));
  });
});
