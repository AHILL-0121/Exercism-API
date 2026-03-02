import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchAllSolutions, getDefaultYear, solutionDate } from '@/lib/exercism';
import { aggregateSolutions } from '@/lib/aggregator';
import type { HeatmapData } from '@/lib/types';

type ErrorResponse = { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HeatmapData | ErrorResponse>,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.EXERCISM_API_TOKEN;
  const username = process.env.EXERCISM_USERNAME;

  if (!token || !username) {
    return res.status(500).json({
      error:
        'Server misconfiguration: EXERCISM_API_TOKEN and EXERCISM_USERNAME must be set.',
    });
  }

  // Allow optional ?year= query param; if omitted, auto-detect from data.
  const yearParam = req.query.year;
  const requestedYear =
    typeof yearParam === 'string' && /^\d{4}$/.test(yearParam)
      ? parseInt(yearParam, 10)
      : undefined;

  try {
    // Always fetch all solutions and filter by year — avoids the early-exit
    // ordering bug where a stale-ordered solution from a prior year truncates results.
    const solutions = await fetchAllSolutions({ token, username });
    const year = requestedYear ?? getDefaultYear(solutions) ?? new Date().getFullYear();
    const yearSolutions = solutions.filter(s => solutionDate(s).getFullYear() === year);
    const heatmap = aggregateSolutions(yearSolutions, username, year);

    // Cache for 15 minutes
    res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=1800');
    return res.status(200).json(heatmap);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[exercism-heatmap]', message);
    return res.status(502).json({ error: message });
  }
}
