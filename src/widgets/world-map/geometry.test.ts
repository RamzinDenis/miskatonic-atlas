import { describe, expect, it } from "vitest";
import { chartPath, latLngToPixel, pixelToLatLng, type AtlasMap } from "./geometry";

/* Content stores map positions in image pixels (y down); leaflet CRS.Simple
   grows lat upward. Every pin, route point and inset crop crosses this pair
   of converters — a sign slip here silently mirrors the whole chart. */

const chart = { width: 1448, height: 1086 } as AtlasMap;

describe("pixelToLatLng", () => {
  it("maps the top-left corner to [height, 0]", () => {
    expect(pixelToLatLng({ x: 0, y: 0 }, chart)).toEqual([1086, 0]);
  });

  it("maps the bottom-right corner to [0, width]", () => {
    expect(pixelToLatLng({ x: 1448, y: 1086 }, chart)).toEqual([0, 1448]);
  });
});

describe("latLngToPixel", () => {
  it("inverts pixelToLatLng for whole-pixel points", () => {
    const point = { x: 851, y: 729 };
    const [lat, lng] = pixelToLatLng(point, chart);
    expect(latLngToPixel(lat, lng, chart)).toEqual(point);
  });

  it("rounds fractional map coordinates to whole image pixels", () => {
    expect(latLngToPixel(1085.6, 20.4, chart)).toEqual({ x: 20, y: 0 });
  });
});

describe("chartPath", () => {
  it("routes the front chart to the site root and the rest to /maps", () => {
    expect(chartPath("pacific")).toBe("/");
    expect(chartPath("new-england")).toBe("/maps/new-england");
  });
});
