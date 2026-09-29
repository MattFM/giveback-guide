export const CONTENT_TYPES = [
  { id: "all", label: "All" },
  { id: "projects", label: "Projects" },
  { id: "stays", label: "Stays" },
] as const;

export const IMPACT_AREA_GROUPS = {
  environmental: {
    label: "Environmental & Conservation",
    areas: [
      "Animal Welfare",
      "Wildlife Rehabilitation",
      "Sustainable Food Systems",
      "Waste and Litter Reduction",
      "Marine Protection",
      "River Health",
      "Reforestation",
      "Habitat Restoration",
    ],
  },
  social: {
    label: "Social Justice & Inclusion",
    areas: [
      "Women's Empowerment",
      "LGBTQ+ Inclusion",
      "Disability Inclusion and Empowerment",
      "Refugee and Migrant Inclusion",
      "Minority Heritage and Empowerment",
    ],
  },
  community: {
    label: "Community & Development",
    areas: [
      "Youth Development",
      "Education and Skills Training",
      "Community Development",
      "Poverty Alleviation",
      "Homelessness Support",
      "Cultural Heritage Preservation",
    ],
  },
} as const;

export const SORT_OPTIONS = [
  { id: "newest", label: "Newest first" },
  { id: "alphabetical", label: "Alphabetical (A-Z)" },
  { id: "relevance", label: "Relevance" },
] as const;

export const RESULTS_PER_PAGE = 12;
