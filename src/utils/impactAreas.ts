export interface ImpactAreaData {
  description: string;
  icon: string;
  color: string;
}

export const impactAreaData: Record<string, ImpactAreaData> = {
  "Animal Welfare": {
    description: "Improves the wellbeing, care, or adoption of animals",
    icon: "🐾",
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
  },
  "Wildlife Rehabilitation": {
    description: "Rescues, treats, and releases wild animals where possible",
    icon: "�",
    color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300"
  },
  "Sustainable Food Systems": {
    description: "Champions fully vegan offerings and plant‑based choices that reduce environmental impact",
    icon: "🌱",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
  },
  "Waste and Litter Reduction": {
    description: "Reduces waste and improves local cleanliness",
    icon: "🧹",
    color: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300"
  },
  "Marine Protection": {
    description: "Protects beaches and coastal ecosystems",
    icon: "🌊",
    color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300"
  },
  "River Health": {
    description: "Restores and protects rivers and freshwater habitats",
    icon: "🏞️",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
  },
  "Reforestation": {
    description: "Plants trees and restores forest cover",
    icon: "🌳",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
  },
  "Women's Empowerment": {
    description: "Increases opportunities, income, skills, and leadership for women",
    icon: "💪",
    color: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300"
  },
  "LGBTQ+ Inclusion": {
    description: "Fights inequality, raises awareness, and creates safe, welcoming spaces",
    icon: "�️‍🌈",
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
  },
  "Disability Inclusion and Empowerment": {
    description: "Accessible spaces, jobs, and advancement for disabled people",
    icon: "♿",
    color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300"
  },
  "Youth Development": {
    description: "Skills, safety, and opportunities for young people",
    icon: "🎒",
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
  },
  "Education and Skills Training": {
    description: "Learning that unlocks livelihoods",
    icon: "📚",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
  },
  "Community Development": {
    description: "Strengthens local services, livelihoods, and participation through training, employment, and community spaces",
    icon: "�️",
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
  },
  "Poverty Alleviation": {
    description: "Direct support that lifts living standards and reduces hardship",
    icon: "🤝",
    color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
  },
  "Cultural Heritage Preservation": {
    description: "Protects languages, crafts, and traditions",
    icon: "🏛️",
    color: "bg-stone-100 text-stone-800 dark:bg-stone-900 dark:text-stone-300"
  },
  "Minority Heritage and Empowerment": {
    description: "Sustains and uplifts ethnic minority communities through culture, enterprise, and services",
    icon: "🧵",
    color: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300"
  },
  "Homelessness Support": {
    description: "Supporting people experiencing homelessness and working to end homelessness",
    icon: "🏠",
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
  },
  "Refugee and Migrant Inclusion": {
    description: "Creates livelihoods, skills, and representation for refugees, migrants and asylum seekers",
    icon: "🧳",
    color: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300"
  },
  "Habitat Restoration": {
    description: "Repairs damaged ecosystems and biodiversity",
    icon: "🌿",
    color: "bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-300"
  }
};

export function getImpactAreaData(name: string): ImpactAreaData | null {
  return impactAreaData[name] || null;
}

export function enrichImpactAreas(areas: string[]): Array<{ name: string; data: ImpactAreaData | null }> {
  return areas.map(area => ({
    name: area,
    data: getImpactAreaData(area)
  }));
}