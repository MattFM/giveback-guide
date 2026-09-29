const CANONICAL_COUNTRIES = new Set([
  "New Zealand", "Canada", "Scotland", "Wales", "Australia",
  "United Kingdom", "UK", "England", "Northern Ireland",
  "USA", "United States", "Türkiye",
]);

function formatLocales(locales: string[]): string {
  if (locales.length === 0) return "";
  if (locales.length === 1) return locales[0];
  if (locales.length === 2) return `${locales[0]} & ${locales[1]}`;
  if (locales.length === 3) return `${locales[0]}, ${locales[1]} & ${locales[2]}`;
  const remaining = locales.length - 2;
  return `${locales[0]}, ${locales[1]} & ${remaining} more`;
}

function getCountryArray(countries: string): string[] {
  const all = countries.split(",").map((c) => c.trim()).filter(Boolean);
  return all.filter(
    (c) => CANONICAL_COUNTRIES.has(c) || !["Aotearoa", "Alba", "Cymru", "Turtle Island", "Kanata", "Turkey"].includes(c)
  );
}

export function createProjectCard(data: any): string {
  const title = data.meta?.title || "Untitled";
  const image = data.meta?.image || data.meta?.thumbnail || "/giveback-guide-placeholder.jpg";
  const countries = data.meta?.countries || "";
  const locale = data.meta?.locale || "";
  const organiser = data.meta?.name || "";
  const url = data.url || "#";

  const countryArray = getCountryArray(countries);
  const localeArray = locale ? locale.split(",").map((l) => l.trim()).filter(Boolean) : [];

  let badgesHtml = "";
  if (countryArray.length > 0) {
    badgesHtml = `
      <div class="mb-2 flex items-center flex-wrap gap-1.5">
        ${countryArray.map((country) => `
          <div class="inline-flex items-center gap-1.5">
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300">
              ${country}
            </span>
            ${localeArray.length > 0 ? `<span class="text-xs font-medium text-gray-700 dark:text-gray-300">|&nbsp; ${formatLocales(localeArray)}</span>` : ""}
          </div>
        `).join("")}
      </div>
    `;
  }

  return `
    <article class="rounded-lg">
      <div class="relative">
        <a href="${url}">
          <img
            class="w-full rounded-lg h-64 mb-3 object-cover"
            src="${image}"
            alt="${title}"
            loading="lazy"
            onerror="this.src='/giveback-guide-placeholder.jpg'"
          />
        </a>
        <span class="absolute top-2 left-2 inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium text-white bg-gray-800 dark:bg-gray-700">
          Project
        </span>
      </div>
      ${badgesHtml}
      <h2 class="mb-2 text-2xl font-medium tracking-tight text-gray-900 dark:text-white">
        <a href="${url}">${title}</a>
      </h2>
      ${organiser ? `<p class="mt-2 text-sm font-normal text-gray-400 dark:text-gray-400">${organiser}</p>` : ""}
    </article>
  `;
}

export function createStayCard(data: any): string {
  const title = data.meta?.title || "Untitled";
  const image = data.meta?.image || data.meta?.thumbnail || "/giveback-guide-placeholder.jpg";
  const countries = data.meta?.countries || "";
  const locale = data.meta?.locale || "";
  const organiser = data.meta?.organiser || "";
  const stayType = data.meta?.stayType || "stay";
  const url = data.url || "#";

  const countryArray = getCountryArray(countries);
  const localeArray = locale ? locale.split(",").map((l) => l.trim()).filter(Boolean) : [];

  let badgesHtml = "";
  if (countryArray.length > 0) {
    badgesHtml = `
      <div class="mb-2 flex items-center flex-wrap gap-1.5">
        ${countryArray.map((country) => `
          <div class="inline-flex items-center gap-1.5">
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300">
              ${country}
            </span>
            ${localeArray.length > 0 ? `<span class="text-xs font-medium text-gray-700 dark:text-gray-300">|&nbsp; ${formatLocales(localeArray)}</span>` : ""}
          </div>
        `).join("")}
      </div>
    `;
  }

  return `
    <article class="rounded-lg">
      <div class="relative">
        <a href="${url}">
          <img
            class="w-full rounded-lg h-64 mb-3 object-cover"
            src="${image}"
            alt="${title}"
            loading="lazy"
            onerror="this.src='/giveback-guide-placeholder.jpg'"
          />
        </a>
        <span class="absolute top-2 left-2 inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium text-white bg-gray-800 dark:bg-gray-700">
          Stay
        </span>
      </div>
      ${badgesHtml}
      <h2 class="mb-2 text-2xl font-medium tracking-tight text-gray-900 dark:text-white">
        <a href="${url}">${title}</a>
      </h2>
      ${organiser ? `<p class="mt-2 text-sm font-normal text-gray-400 dark:text-gray-400">${organiser} is a ${stayType}</p>` : ""}
    </article>
  `;
}

export function createBlogCard(data: any): string {
  const title = data.meta?.title || "Untitled";
  const image = data.meta?.image || data.meta?.thumbnail || "/giveback-guide-placeholder.jpg";
  const categories = data.meta?.categories || "";
  const url = data.url || "#";

  const categoryArray = categories ? categories.split(",").map((c) => c.trim()).filter(Boolean) : [];

  let badgesHtml = "";
  if (categoryArray.length > 0) {
    badgesHtml = `
      <div class="mb-2">
        ${categoryArray.map((category) => `
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300 mr-1.5">
            ${category}
          </span>
        `).join("")}
      </div>
    `;
  }

  return `
    <article class="rounded-lg">
      <div class="relative">
        <a href="${url}">
          <img
            class="w-full rounded-lg h-64 mb-3 object-cover"
            src="${image}"
            alt="${title}"
            loading="lazy"
            onerror="this.src='/giveback-guide-placeholder.jpg'"
          />
        </a>
        <span class="absolute top-2 left-2 inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium text-white bg-gray-800 dark:bg-gray-700">
          Blog Post
        </span>
      </div>
      ${badgesHtml}
      <h2 class="mb-2 text-2xl font-medium tracking-tight text-gray-900 dark:text-white">
        <a href="${url}">${title}</a>
      </h2>
    </article>
  `;
}

export function createCard(data: any, contentType: string): string {
  switch (contentType) {
    case "projects":
      return createProjectCard(data);
    case "stays":
      return createStayCard(data);
    case "posts":
      return createBlogCard(data);
    default:
      return createPageCard(data);
  }
}

function createPageCard(data: any): string {
  const title = data.title || "Untitled";
  const url = data.url || "#";

  return `
    <article class="rounded-lg">
      <h2 class="mb-2 text-2xl font-medium tracking-tight text-gray-900 dark:text-white">
        <a href="${url}">${title}</a>
      </h2>
    </article>
  `;
}

export function getContentType(data: any): string {
  if (data.filters && data.filters.type) {
    const type = data.filters.type[0];
    if (type === "project") return "projects";
    if (type === "stay") return "stays";
    if (type === "post") return "posts";
  }

  if (data.url.includes("/projects/")) return "projects";
  if (data.url.includes("/blog/")) return "posts";
  if (data.url.includes("/stays/")) return "stays";
  return "page";
}
