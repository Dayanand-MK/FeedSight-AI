// Broad categories have no sufficiently specific, sourced composition profile.
// Nulls are intentional. Never use biomass grams as nutrient concentrations.
export const feedTypes = [
  "maize_silage",
  "dry_feed",
  "green_fodder",
  "concentrate",
  "mixed_ration",
  "other_feed",
];
export const hasStorageProfile = (type) =>
  ["maize_silage", "dry_feed"].includes(type);
export const feedComposition = {
  maize_silage: {
    feedId: "maize_silage",
    source: null,
    sourceType: "UNKNOWN",
    nutrients: { protein: null, fiber: null, energy: null },
  },
  dry_feed: {
    feedId: "dry_feed",
    source: null,
    sourceType: "UNKNOWN",
    nutrients: { protein: null, fiber: null, energy: null },
  },
};
export function referenceComposition(feedType) {
  return structuredClone(
    feedComposition[feedType] || {
      feedId: feedType,
      source: null,
      sourceType: "UNKNOWN",
      nutrients: { protein: null, fiber: null, energy: null },
    },
  );
}
