export interface CountryAlias {
  name: string;
  type?: 'indigenous' | 'endonym' | 'historic';
  notes?: string;
}

export const COUNTRY_ALIASES: Record<string, {
  english: string;
  aliases: CountryAlias[];
}> = {
  "New Zealand": {
    english: "New Zealand",
    aliases: [{ name: "Aotearoa", type: "indigenous" }]
  },
  "Canada": {
    english: "Canada",
    aliases: [
      { name: "Turtle Island", type: "indigenous", notes: "Used by many Indigenous peoples" },
      { name: "Kanata", type: "indigenous", notes: "Iroquoian origin of the name" }
    ]
  },
  "Scotland": {
    english: "Scotland",
    aliases: [{ name: "Alba", type: "endonym" }]
  },
  "Wales": {
    english: "Wales",
    aliases: [{ name: "Cymru", type: "endonym" }]
  }
};

// Helper: Get all searchable terms for a country
export function getAllSearchTerms(country: string): string[] {
  const data = COUNTRY_ALIASES[country];
  if (!data) return [country];
  return [country, ...data.aliases.map(a => a.name)];
}

// Helper: Format alias acknowledgment for display
// Returns: "We acknowledge that [country] is also known as [alias], [alias] or [alias]"
export function getAliasAcknowledgment(country: string): string | null {
  const data = COUNTRY_ALIASES[country];
  if (!data || data.aliases.length === 0) return null;
  
  const aliases = data.aliases.map(a => a.name);
  
  if (aliases.length === 1) {
    return `We acknowledge that ${country} is also known as ${aliases[0]}`;
  } else if (aliases.length === 2) {
    return `We acknowledge that ${country} is also known as ${aliases[0]} or ${aliases[1]}`;
  } else {
    // 3+ aliases: comma separate all but last, then "or" before last
    const allButLast = aliases.slice(0, -1).join(', ');
    const last = aliases[aliases.length - 1];
    return `We acknowledge that ${country} is also known as ${allButLast} or ${last}`;
  }
}
