export interface ImpactAreaData {
  description: string;
  code: string;
  color: string;
}

export const impactAreaData: Record<string, ImpactAreaData> = {
  // Environmental & Conservation (E01-E08)
  "Animal Welfare": {
    description: "Improves the wellbeing, care, or adoption of animals",
    code: "E01",
    color: "text-green-700 dark:text-green-400"
  },
  "Wildlife Rehabilitation": {
    description: "Rescues, treats, and releases wild animals where possible",
    code: "E02",
    color: "text-green-700 dark:text-green-400"
  },
  "Sustainable Food Systems": {
    description: "Champions fully vegan offerings and plant‑based choices that reduce environmental impact",
    code: "E03",
    color: "text-green-700 dark:text-green-400"
  },
  "Waste and Litter Reduction": {
    description: "Reduces waste and improves local cleanliness",
    code: "E04",
    color: "text-green-700 dark:text-green-400"
  },
  "Marine Protection": {
    description: "Protects beaches and coastal ecosystems",
    code: "E05",
    color: "text-green-700 dark:text-green-400"
  },
  "River Health": {
    description: "Restores and protects rivers and freshwater habitats",
    code: "E06",
    color: "text-green-700 dark:text-green-400"
  },
  "Reforestation": {
    description: "Plants trees and restores forest cover",
    code: "E07",
    color: "text-green-700 dark:text-green-400"
  },
  "Habitat Restoration": {
    description: "Repairs damaged ecosystems and biodiversity",
    code: "E08",
    color: "text-green-700 dark:text-green-400"
  },
  // Social Justice & Inclusion (S01-S05)
  "Women's Empowerment": {
    description: "Increases opportunities, income, skills, and leadership for women",
    code: "S01",
    color: "text-purple-700 dark:text-purple-400"
  },
  "Women's Economic Empowerment": {
    description: "Increases opportunities, income, skills, and leadership for women",
    code: "S01",
    color: "text-purple-700 dark:text-purple-400"
  },
  "LGBTQ+ Inclusion": {
    description: "Fights inequality, raises awareness, and creates safe, welcoming spaces",
    code: "S02",
    color: "text-purple-700 dark:text-purple-400"
  },
  "Disability Inclusion and Empowerment": {
    description: "Accessible spaces, jobs, and advancement for disabled people",
    code: "S03",
    color: "text-purple-700 dark:text-purple-400"
  },
  "Refugee and Migrant Inclusion": {
    description: "Creates livelihoods, skills, and representation for refugees, migrants and asylum seekers",
    code: "S04",
    color: "text-purple-700 dark:text-purple-400"
  },
  "Minority Heritage and Empowerment": {
    description: "Sustains and uplifts ethnic minority communities through culture, enterprise, and services",
    code: "S05",
    color: "text-purple-700 dark:text-purple-400"
  },
  // Community & Development (C01-C06)
  "Youth Development": {
    description: "Skills, safety, and opportunities for young people",
    code: "C01",
    color: "text-blue-700 dark:text-blue-400"
  },
  "Education and Skills Training": {
    description: "Learning that unlocks livelihoods",
    code: "C02",
    color: "text-blue-700 dark:text-blue-400"
  },
  "Community Development": {
    description: "Strengthens local services, livelihoods, and participation through training, employment, and community spaces",
    code: "C03",
    color: "text-blue-700 dark:text-blue-400"
  },
  "Poverty Alleviation": {
    description: "Direct support that lifts living standards and reduces hardship",
    code: "C04",
    color: "text-blue-700 dark:text-blue-400"
  },
  "Homelessness Support": {
    description: "Supporting people experiencing homelessness and working to end homelessness",
    code: "C05",
    color: "text-blue-700 dark:text-blue-400"
  },
  "Cultural Heritage Preservation": {
    description: "Protects languages, crafts, and traditions",
    code: "C06",
    color: "text-blue-700 dark:text-blue-400"
  }
};

export function getImpactAreaData(name: string): ImpactAreaData | null {
  // Try exact match first
  if (impactAreaData[name]) {
    return impactAreaData[name];
  }
  
  // Handle different apostrophe characters (curly vs straight quotes)
  // Convert Unicode characters like 8217 (') to standard apostrophe (')
  const normalizedName = name.replace(/[\u2018\u2019\u201B]/g, "'");
  if (impactAreaData[normalizedName]) {
    return impactAreaData[normalizedName];
  }
  
  return null;
}

export function enrichImpactAreas(areas: string[]): Array<{ name: string; data: ImpactAreaData | null }> {
  return areas.map(area => ({
    name: area,
    data: getImpactAreaData(area)
  }));
}
