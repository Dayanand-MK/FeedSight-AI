// Decision-support priorities, not validated animal nutrient requirements.
// Numeric requirement profiles must remain null until independently reviewed.
export const goalProfiles = {
  general: {
    icon: "🌿",
    label: "goalGeneral",
    advice: "goalGeneralAdvice",
    requirements: null,
  },
  milk: {
    icon: "🥛",
    label: "goalMilk",
    advice: "goalMilkAdvice",
    requirements: null,
    animalTypes: ["lactating"],
  },
  health: {
    icon: "❤️",
    label: "goalHealth",
    advice: "goalHealthAdvice",
    requirements: null,
  },
  reproduction: {
    icon: "🐄",
    label: "goalReproduction",
    advice: "goalReproductionAdvice",
    requirements: null,
  },
  profit: {
    icon: "₹",
    label: "goalProfit",
    advice: "goalProfitAdvice",
    requirements: null,
  },
};
export const goalRuleVersion = "goal-support-1";
// Input validation bounds only. These are not feeding recommendations.
export const animalFields = { bodyWeight: [1, 2000], milkYield: [0, 100] };
export const animalStages = ["unknown", "early", "middle", "late"];
export const reproductiveStates = ["unknown", "pregnant", "notPregnant"];
