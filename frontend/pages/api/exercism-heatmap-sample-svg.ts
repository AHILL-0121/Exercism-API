import type { NextApiRequest, NextApiResponse } from 'next';
import { generateSampleHeatmap } from '@/lib/sample-data';
import { generateSVG } from '@/lib/svg-generator';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).end('Method not allowed');
    return;
  }

  const yearParam = req.query.year;
  const year =
    typeof yearParam === 'string' && /^\d{4}$/.test(yearParam)
      ? parseInt(yearParam, 10)
      : new Date().getFullYear();

  const heatmap = generateSampleHeatmap(year);
  const svg = generateSVG(heatmap);

  res.setHeader('Content-Type', 'image/svg+xml');
  // Short cache — it's deterministic but cheap to regenerate
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).end(svg);
}
