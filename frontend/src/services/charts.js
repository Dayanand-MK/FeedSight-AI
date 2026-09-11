export const componentKeys = ["Dry_Green_g", "Dry_Dead_g", "Dry_Clover_g"];
export function biomassParts(predictions = {}) {
  const values = componentKeys.map((key) => ({ key, value: predictions[key] }));
  if (
    values.some(
      (row) =>
        typeof row.value !== "number" ||
        !Number.isFinite(row.value) ||
        row.value < 0,
    )
  )
    return [];
  const total = values.reduce((sum, row) => sum + row.value, 0);
  return values.map((row) => ({
    ...row,
    percent: total > 0 ? (row.value / total) * 100 : null,
  }));
}
export const trendMetrics = {
  moisture: "%",
  humidity: "%",
  temperature: "°C",
  ph: "pH",
  score: "/ 100",
};
export function trendRows(tests, metric, source) {
  if (!Object.hasOwn(trendMetrics, metric)) return [];
  return tests
    .filter((row) => row.result?.storage?.source === source)
    .map((row) => ({
      id: row.id,
      time: new Date(row.createdAt).getTime(),
      value:
        metric === "score"
          ? row.result.overall?.score
          : row.result.storage.readings?.[metric],
    }))
    .filter((row) => Number.isFinite(row.time))
    .sort((a, b) => a.time - b.time)
    .map((row) => ({
      ...row,
      value:
        typeof row.value === "number" && Number.isFinite(row.value)
          ? row.value
          : null,
    }));
}
