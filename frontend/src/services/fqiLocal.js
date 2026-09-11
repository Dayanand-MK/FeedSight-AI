let artifact;
export async function predictLocal(values) {
  artifact ||= fetch("/models/fqi-browser.json")
    .then((r) => {
      if (!r.ok) throw new Error("modelUnavailable");
      return r.json();
    })
    .catch((e) => {
      artifact = null;
      throw e;
    });
  const model = await artifact;
  const x = model.features.map((f) => {
    if (
      values[f] == null ||
      values[f] === "" ||
      !Number.isFinite(Number(values[f]))
    )
      throw new Error("missingLab");
    const v = Number(values[f]);
    if (v < model.ranges[f][0] || v > model.ranges[f][1])
      throw new Error("outsideDomain");
    return Math.fround(v);
  });
  let result = model.initial;
  for (const tree of model.trees) {
    let node = 0;
    while (tree.left[node] !== -1)
      node =
        x[tree.feature[node]] <= tree.threshold[node]
          ? tree.left[node]
          : tree.right[node];
    result += model.learningRate * tree.value[node];
  }
  return { value: result, metadata: model.metadata };
}
