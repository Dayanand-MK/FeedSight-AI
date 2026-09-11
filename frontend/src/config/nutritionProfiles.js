// No universal animal requirement is inferred from a single feed's composition.
// A nutritionist-supplied ingredient minimum is an explicit comparison benchmark,
// not a whole-ration requirement, validated diet or an exact supplement dose.
export const nutritionProfiles = {
  unspecified: { minimums: null, advice: "needAnimalContext" },
  lactating: { minimums: null, advice: "lactatingAdvice" },
  dryCow: { minimums: null, advice: "dryCowAdvice" },
  heifer: { minimums: null, advice: "heiferAdvice" },
  calf: { minimums: null, advice: "calfAdvice" },
};
export const nutrientFields = {
  protein: { unit: "% DM", min: 0, max: 100 },
  fiber: { unit: "% DM (NDF)", min: 0, max: 100 },
  energy: { unit: "MJ/kg DM", min: 0, max: 35 },
};
