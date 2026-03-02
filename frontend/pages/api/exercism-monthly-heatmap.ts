import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchAllSolutions, solutionDate } from '@/lib/exercism';
import type { MonthlyHeatmapData } from '@/lib/types';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

type ErrorResponse = { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MonthlyHeatmapData | ErrorResponse>,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token    = process.env.EXERCISM_API_TOKEN;
  const username = process.env.EXERCISM_USERNAME;

  if (!token || !username) {
    return res.status(500).json({
      error: 'Server misconfiguration: EXERCISM_API_TOKEN and EXERCISM_USERNAME must be set.',
    });
  }

  const now = new Date();

  // Optional ?year=YYYY  and  ?month=M (1-12)  query params
  const yearParam  = req.query.year;
  const monthParam = req.query.month;

  const year = (typeof yearParam === 'string' && /^\d{4}$/.test(yearParam))
    ? parseInt(yearParam, 10)
    : now.getFullYear();

  const month = (typeof monthParam === 'string' && /^\d{1,2}$/.test(monthParam))
    ? Math.max(1, Math.min(12, parseInt(monthParam, 10)))
    : now.getMonth() + 1; // 1-based

  const month0       = month - 1;                                  // 0-based for Date
  const daysInMonth  = new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
  const firstDow     = new Date(Date.UTC(year, month0, 1)).getUTCDay(); // 0=Sun

  try {
    // Fetch only solutions within the target year (broad filter — month filtered below)
    const solutions = await fetchAllSolutions({ token, username, year });

    const submissionsByDay = Array<number>(daysInMonth).fill(0);

    for (const solution of solutions) {
      const d = solutionDate(solution);
      if (isNaN(d.getTime())) continue;
      if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month0) continue;
      const dayIdx = d.getUTCDate() - 1; // 0-indexed
      if (dayIdx >= 0 && dayIdx < daysInMonth) {
        submissionsByDay[dayIdx]++;
      }
    }

    const total = submissionsByDay.reduce((a, b) => a + b, 0);

    const result: MonthlyHeatmapData = {
      username,
      year,
      month,
      month_name:         MONTH_NAMES[month0],
      days_in_month:      daysInMonth,
      first_day_of_week:  firstDow,
      total_this_month:   total,
      submissions_by_day: submissionsByDay,
    };

    res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=1800');
    return res.status(200).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[exercism-monthly-heatmap]', message);
    return res.status(502).json({ error: message });
  }
}
