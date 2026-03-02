import type { ExercismApiResponse, ExercismSolution, FetchOptions, ProfileData, ContributionCategory } from './types';

const EXERCISM_API_BASE = 'https://exercism.org/api/v2';

/**
 * Pick the best available date from a solution.
 * Prefers last_iterated_at → completed_at → submitted_at → updated_at.
 */
export function solutionDate(solution: ExercismSolution): Date {
  const raw =
    solution.last_iterated_at ||
    solution.completed_at ||
    solution.submitted_at ||
    solution.updated_at;
  const d = new Date(raw);
  if (isNaN(d.getTime())) {
    return new Date(solution.updated_at);
  }
  return d;
}
const PAGE_SIZE = 100;
const MAX_PAGES = 100; // safety cap

/**
 * Fetch a single page of solutions from the Exercism API.
 */
async function fetchPage(
  token: string,
  page: number,
): Promise<ExercismApiResponse> {
  const url = `${EXERCISM_API_BASE}/solutions?page=${page}&per_page=${PAGE_SIZE}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    // Next.js fetch cache control — revalidate every 15 minutes
    next: { revalidate: 900 },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Invalid or expired Exercism API token.');
    }
    if (response.status === 429) {
      throw new Error('Exercism API rate limit exceeded. Try again later.');
    }
    throw new Error(
      `Exercism API error: ${response.status} ${response.statusText}`,
    );
  }

  return response.json() as Promise<ExercismApiResponse>;
}

/**
 * Fetch all solutions for a user, handling pagination automatically.
 * When `year` is provided, stops fetching once solutions older than
 * that year are found (only after the target year has been seen).
 */
export async function fetchAllSolutions(
  options: FetchOptions,
): Promise<ExercismSolution[]> {
  const { token, year } = options;

  const allSolutions: ExercismSolution[] = [];
  let page = 1;
  let totalPages = 1;
  // Track whether we have encountered at least one solution from the target year.
  // Without this flag, requesting year=2026 when all solutions are from 2025
  // would cause an immediate early-exit on the very first page.
  let seenTargetYear = false;

  do {
    const data = await fetchPage(token, page);
    totalPages = data.meta.total_pages;

    for (const solution of data.results) {
      if (year !== undefined) {
        const solutionYear = solutionDate(solution).getFullYear();
        if (solutionYear === year) {
          seenTargetYear = true;
          allSolutions.push(solution);
        } else if (solutionYear < year) {
          // Solutions are newest-first. Once we have seen the target year
          // and now find older solutions, we can stop safely.
          if (seenTargetYear) return allSolutions;
          // Otherwise the target year simply has no submissions yet — skip.
        }
        // solutionYear > year → newer than requested year, skip.
      } else {
        allSolutions.push(solution);
      }
    }

    page++;
  } while (page <= totalPages && page <= MAX_PAGES);

  return allSolutions;
}

/**
 * Return the most recent year that has at least one solution,
 * or undefined if the list is empty.
 */
export function getDefaultYear(solutions: ExercismSolution[]): number | undefined {
  if (solutions.length === 0) return undefined;
  return solutions.reduce<number>((max, s) => {
    const y = solutionDate(s).getFullYear();
    return y > max ? y : max;
  }, 0) || undefined;
}

// ─── Profile ─────────────────────────────────────────────────────────────────

/** Strip HTML tags from a string so we can match against plain text. */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/** Map a reputation-token text to one of the six contribution categories. */
function categorizeRepText(text: string): string {
  const t = stripHtml(text).toLowerCase();
  if (t.includes('published')) return 'publishing';
  if (t.includes('mentor')) return 'mentoring';
  if (t.includes('author') || t.includes('created the exercise') || t.includes('wrote an article')) return 'authoring';
  if (t.includes('building') || t.includes('pr accepted') || t.includes('merged a pr')) return 'building';
  if (t.includes('maintain') || t.includes('reviewed a pr')) return 'maintaining';
  return 'other';
}

interface RepToken {
  value: number;
  text: string;
}

interface RepApiResponse {
  results: RepToken[];
  meta: { current_page: number; total_pages: number; total_reputation: string };
}

interface BadgeApiResponse {
  results: Array<{
    uuid: string;
    name: string;
    description: string;
    icon_name: string;
    rarity: string;
    unlocked_at: string;
  }>;
  meta: { total_count: number };
}

export interface FetchProfileOptions {
  token: string;
  username: string;
  display_name?: string;
  location?: string;
  pronouns?: string;
  joined?: string;
  avatar_url?: string;
}

/**
 * Fetch dynamic profile data: total reputation, badges, and a contributions
 * breakdown derived from reputation-token texts.
 */
export async function fetchProfileData(options: FetchProfileOptions): Promise<ProfileData> {
  const { token, username, display_name, location, pronouns, joined, avatar_url } = options;

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  const cacheOpts = { next: { revalidate: 900 } } as RequestInit;

  // Fetch first page of reputation tokens (get total_reputation from meta)
  const firstRepRes = await fetch(
    `${EXERCISM_API_BASE}/reputation?per_page=100`,
    { headers, ...cacheOpts },
  );
  if (!firstRepRes.ok) throw new Error(`Failed to fetch reputation: ${firstRepRes.status}`);
  const firstRepData = (await firstRepRes.json()) as RepApiResponse;

  // Paginate if needed (rare — only matters for users with 100+ rep events)
  let allRepTokens: RepToken[] = [...firstRepData.results];
  const totalRepPages = firstRepData.meta.total_pages;
  for (let page = 2; page <= totalRepPages; page++) {
    const res = await fetch(
      `${EXERCISM_API_BASE}/reputation?per_page=100&page=${page}`,
      { headers, ...cacheOpts },
    );
    if (!res.ok) break;
    const d = (await res.json()) as RepApiResponse;
    allRepTokens = allRepTokens.concat(d.results);
  }

  // Fetch badges from API and scrape image URLs from the public badges page
  const [badgeRes, badgesPageRes] = await Promise.all([
    fetch(`${EXERCISM_API_BASE}/badges`, { headers, ...cacheOpts }),
    fetch(`https://exercism.org/profiles/${username}/badges`, cacheOpts),
  ]);
  if (!badgeRes.ok) throw new Error(`Failed to fetch badges: ${badgeRes.status}`);
  const badgeData = (await badgeRes.json()) as BadgeApiResponse;

  // Build a map of icon_name → full fingerprinted image URL by scraping the badges page HTML
  const badgeImageMap: Record<string, string> = {};
  if (badgesPageRes.ok) {
    const html = await badgesPageRes.text();
    // Match URLs like: https://assets.exercism.org/assets/icons/{icon_name}-{hash}.svg
    const urlRegex = /https:\/\/assets\.exercism\.org\/assets\/icons\/([a-z0-9-]+)-[a-f0-9]+\.svg/g;
    let m: RegExpExecArray | null;
    while ((m = urlRegex.exec(html)) !== null) {
      const iconName = m[1];
      if (!badgeImageMap[iconName]) badgeImageMap[iconName] = m[0];
    }
  }

  // Aggregate reputation by contribution category
  const repMap: Record<string, { count: number; rep: number }> = {
    publishing:  { count: 0, rep: 0 },
    mentoring:   { count: 0, rep: 0 },
    authoring:   { count: 0, rep: 0 },
    building:    { count: 0, rep: 0 },
    maintaining: { count: 0, rep: 0 },
    other:       { count: 0, rep: 0 },
  };
  for (const token of allRepTokens) {
    const cat = categorizeRepText(token.text);
    repMap[cat].count += 1;
    repMap[cat].rep   += token.value;
  }

  const detailOf = (
    cat: string,
    singularLabel: string,
    pluralLabel: string,
    noneLabel: string,
  ): string => {
    const n = repMap[cat].count;
    if (n === 0) return noneLabel;
    return `${n} ${n === 1 ? singularLabel : pluralLabel}`;
  };

  const contributions: ContributionCategory[] = [
    { label: 'Publishing',  detail: detailOf('publishing',  'solution published',   'solutions published',     'No solutions published'),    rep: repMap.publishing.rep  },
    { label: 'Mentoring',   detail: detailOf('mentoring',   'student mentored',     'students mentored',       'No students mentored'),       rep: repMap.mentoring.rep   },
    { label: 'Authoring',   detail: detailOf('authoring',   'exercise/article',     'exercises/articles',      'No exercises/articles contributed'), rep: repMap.authoring.rep   },
    { label: 'Building',    detail: detailOf('building',    'PR accepted',          'PRs accepted',            'No PRs accepted'),            rep: repMap.building.rep    },
    { label: 'Maintaining', detail: detailOf('maintaining', 'PR reviewed',          'PRs reviewed',            'No PRs reviewed'),            rep: repMap.maintaining.rep },
    { label: 'Other',       detail: detailOf('other',       'contribution',         'contributions',           ''),                           rep: repMap.other.rep       },
  ];

  return {
    handle:       username,
    display_name: display_name ?? username,
    location:     location     ?? '',
    pronouns:     pronouns     ?? '',
    joined:       joined       ?? '',
    avatar_url:   avatar_url   ?? '',
    reputation:   parseInt(firstRepData.meta.total_reputation, 10) || 0,
    badge_count:  badgeData.meta.total_count,
    badges:       badgeData.results.slice(0, 3).map((b) => ({
      uuid:        b.uuid,
      name:        b.name,
      description: b.description,
      icon_name:   b.icon_name,
      image_url:   badgeImageMap[b.icon_name] ?? `https://assets.exercism.org/assets/icons/${b.icon_name}.svg`,
      rarity:      b.rarity,
      unlocked_at: b.unlocked_at,
    })),
    contributions,
  };
}
