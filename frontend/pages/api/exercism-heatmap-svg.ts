import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchAllSolutions, getDefaultYear, solutionDate } from '@/lib/exercism';
import { aggregateSolutions } from '@/lib/aggregator';
import { generateSVG } from '@/lib/svg-generator';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    res.status(405).end('Method not allowed');
    return;
  }

  const token = process.env.EXERCISM_API_TOKEN;
  const username = process.env.EXERCISM_USERNAME;
  const avatarUrl = process.env.EXERCISM_AVATAR_URL;

  if (!token || !username) {
    res.status(500).setHeader('Content-Type', 'text/plain').end(
      'Server misconfiguration: EXERCISM_API_TOKEN and EXERCISM_USERNAME must be set.',
    );
    return;
  }

  // Allow optional ?year= query param; if omitted, auto-detect from data.
  const yearParam = req.query.year;
  const requestedYear =
    typeof yearParam === 'string' && /^\d{4}$/.test(yearParam)
      ? parseInt(yearParam, 10)
      : undefined;

  const theme = req.query.theme === 'dark' ? 'dark' : 'light' as const;

  try {
    // Always fetch all solutions and filter by year — avoids the early-exit
    // ordering bug where a stale-ordered solution from a prior year truncates results.
    const solutions = await fetchAllSolutions({ token, username });
    const year = requestedYear ?? getDefaultYear(solutions) ?? new Date().getFullYear();
    const yearSolutions = solutions.filter(s => solutionDate(s).getFullYear() === year);
    const heatmap = aggregateSolutions(yearSolutions, username, year, avatarUrl);
    const svg = generateSVG(heatmap, theme);

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=1800');
    res.status(200).end(svg);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[exercism-heatmap-svg]', message);

    // Return a minimal error SVG so <img> tags don't silently break
    const errorSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="60" viewBox="0 0 400 60">
  <rect width="400" height="60" rx="6" fill="#fff8c5" />
  <text x="12" y="34" font-size="13" fill="#9a6700" font-family="system-ui, sans-serif">${escapeXml(message)}</text>
</svg>`;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.status(502).end(errorSvg);
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
