import { describe, it, expect } from "vitest";
import { clusterItems, type ClusterableItem } from "./clustering";

function makeItem(id: string, lat: number, lng: number): ClusterableItem {
  return { id, lat, lng };
}

describe("clusterItems", () => {
  it("returns empty array for empty input", () => {
    expect(clusterItems([])).toEqual([]);
  });

  it("groups two items with same rounded coords into single cluster", () => {
    const items = [
      makeItem("a", -33.4430, -70.6503),
      makeItem("b", -33.4434, -70.6505), // same when rounded to 3 decimals
    ];
    const clusters = clusterItems(items);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].items.map((i) => i.id).sort()).toEqual(["a", "b"]);
  });

  it("keeps items in separate clusters when 3rd decimal differs", () => {
    const items = [
      makeItem("a", -33.443, -70.650),
      makeItem("b", -33.445, -70.650),
    ];
    expect(clusterItems(items)).toHaveLength(2);
  });

  it("skips items with NaN coords", () => {
    const items = [
      makeItem("ok", -33.443, -70.650),
      makeItem("bad", NaN, -70.650),
      makeItem("bad2", -33.443, NaN),
    ];
    const clusters = clusterItems(items);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].items[0].id).toBe("ok");
  });

  it("skips items with non-finite coords (Infinity)", () => {
    const items = [
      makeItem("inf", Infinity, 0),
      makeItem("ok", 1, 1),
    ];
    expect(clusterItems(items)).toHaveLength(1);
    expect(clusterItems(items)[0].items[0].id).toBe("ok");
  });

  it("rounds lat/lng to 3 decimals in the cluster output", () => {
    const [cluster] = clusterItems([makeItem("a", -33.44309, -70.65031)]);
    expect(cluster.lat).toBeCloseTo(-33.443, 5);
    expect(cluster.lng).toBeCloseTo(-70.65, 5);
  });

  it("produces stable keys for matching coords", () => {
    const a = clusterItems([makeItem("a", -33.443, -70.65)]);
    const b = clusterItems([makeItem("b", -33.443, -70.65)]);
    expect(a[0].key).toBe(b[0].key);
  });
});
