import { useState, useCallback, useEffect, useMemo } from 'react';
import Image from 'next/image';
import type { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import type { HeatmapData, ProfileData } from '@/lib/types';
import { generateSVG } from '@/lib/svg-generator';
import { generateSampleHeatmap } from '@/lib/sample-data';
import s from '@/styles/Home.module.css';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
  initialData: HeatmapData | null;
  initialError: string | null;
  currentYear: number;
  baseUrl: string;
  profileData: ProfileData | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);
  return (
    <button
      onClick={copy}
      className={`${s.copyBtn} ${copied ? s.copyBtnDone : ''}`}
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  return (
    <div className={s.codeBlock}>
      <div className={s.codeBlockHeader}>
        <span className={s.codeBlockLang}>{lang}</span>
        <CopyButton text={code} />
      </div>
      <div className={s.codeBlockBody}>
        <pre>{code}</pre>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR - 1, CURRENT_YEAR];

const Home: NextPage<Props> = ({ initialData, initialError, currentYear, baseUrl, profileData }) => {
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedData, setSelectedData] = useState<HeatmapData | null>(initialData);
  const [dataLoading, setDataLoading] = useState(false);

  // Re-fetch stats whenever the selected year changes (if a token is configured).
  useEffect(() => {
    if (!initialData) return; // no token configured, nothing to fetch
    if (selectedYear === initialData.year && selectedData?.year === selectedYear) return;
    setDataLoading(true);
    fetch(`/api/exercism-heatmap?year=${selectedYear}`)
      .then((r) => r.json())
      .then((json: HeatmapData) => { setSelectedData(json); })
      .catch(() => { /* keep previous data on error */ })
      .finally(() => setDataLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, initialData]);

  const data = selectedData;
  const error = initialError;

  const svgContent = useMemo(() => {
    if (data) return generateSVG(data);
    return generateSVG(generateSampleHeatmap(selectedYear));
  }, [data, selectedYear]);

  const jsonUrl = `${baseUrl}/api/exercism-heatmap?year=${selectedYear}`;
  const svgUrl  = `${baseUrl}/api/exercism-heatmap.svg?year=${selectedYear}`;

  const embedHtml = `<img
  src="${svgUrl}"
  alt="Exercism Heatmap"
  loading="lazy"
/>`;

  const embedMarkdown = `![Exercism Heatmap](${svgUrl})`;

  return (
    <>
      <Head>
        <title>Exercism Heatmap API</title>
        <meta
          name="description"
          content="Serverless activity heatmap for your Exercism profile. Embed a GitHub-style contribution graph anywhere."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={s.page}>
        {/* ── Header ── */}
        <header className={s.header}>
          <div className={s.headerInner}>
            <div className={s.logo}>
              <div className={s.logoMark}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="1" y="7" width="3" height="3" rx="0.5" fill="white" opacity="0.5" />
                  <rect x="5" y="4" width="3" height="6" rx="0.5" fill="white" opacity="0.7" />
                  <rect x="9" y="2" width="3" height="8" rx="0.5" fill="white" />
                  <rect x="13" y="5" width="3" height="5" rx="0.5" fill="white" opacity="0.8" />
                </svg>
              </div>
              <span className={s.logoText}>Exercism Heatmap API</span>
            </div>
            <div className={s.headerLinks}>
              <span className={s.headerBadge}>Serverless</span>
              <a
                href="https://exercism.org/settings/api-cli"
                target="_blank"
                rel="noopener noreferrer"
                className={s.headerLink}
              >
                Get API Token
              </a>
            </div>
          </div>
        </header>

        {/* ── Main content ── */}
        <main className={s.main}>
          {/* ── Profile card ── */}
          {profileData && (
          <div className={s.profileCard}>
            <div className={s.profileAvatarWrap}>
              {profileData.avatar_url ? (
                <Image
                  src={profileData.avatar_url}
                  alt={`${profileData.handle} avatar`}
                  width={88}
                  height={88}
                  className={s.profileAvatar}
                  unoptimized
                />
              ) : (
                <div className={s.profileAvatarPlaceholder}>
                  {profileData.handle[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div className={s.profileInfo}>
              <div className={s.profileHandleRow}>
                <span className={s.profileHandle}>{profileData.handle}</span>
                <span className={s.repBadge}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" fill="#604FCD" />
                    <text x="12" y="16" textAnchor="middle" fill="white" fontSize="11" fontWeight="700" fontFamily="sans-serif">R</text>
                  </svg>
                  {profileData.reputation}
                </span>
              </div>
              {profileData.display_name && profileData.display_name !== profileData.handle && (
                <div className={s.profileName}>{profileData.display_name}</div>
              )}
              <div className={s.profileMeta}>
                {profileData.location && (
                  <span className={s.profileMetaItem}>
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 1.5A4.5 4.5 0 0 0 3.5 6c0 3.5 4.5 8.5 4.5 8.5S12.5 9.5 12.5 6A4.5 4.5 0 0 0 8 1.5Zm0 6a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" fill="#57606a"/></svg>
                    {profileData.location}
                  </span>
                )}
                {profileData.pronouns && (
                  <span className={s.profileMetaItem}>
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm0 1.5a5.5 5.5 0 1 1 0 11A5.5 5.5 0 0 1 8 2.5Zm-.5 3v3.22l2.15 2.15.7-.7L8.5 8.28V5.5h-1Z" fill="#57606a"/></svg>
                    {profileData.pronouns}
                  </span>
                )}
                {profileData.joined && (
                  <span className={s.profileMetaItem}>
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4.75 0a.75.75 0 0 1 .75.75V2h5V.75a.75.75 0 0 1 1.5 0V2h1.25c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 13.25 16H2.75A1.75 1.75 0 0 1 1 14.25V3.75C1 2.784 1.784 2 2.75 2H4V.75A.75.75 0 0 1 4.75 0Zm0 3.5h-2a.25.25 0 0 0-.25.25V6h11V3.75a.25.25 0 0 0-.25-.25h-2V5a.75.75 0 0 1-1.5 0V3.5h-5V5a.75.75 0 0 1-1.5 0V3.5Z" fill="#57606a"/></svg>
                    Joined {profileData.joined}
                  </span>
                )}
              </div>
              <a
                href={`https://exercism.org/profiles/${profileData.handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className={s.profileLink}
              >
                View on Exercism
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3.75 2h3.5a.75.75 0 0 1 0 1.5h-3.5a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-3.5a.75.75 0 0 1 1.5 0v3.5A1.75 1.75 0 0 1 12.25 14h-8.5A1.75 1.75 0 0 1 2 12.25v-8.5C2 2.784 2.784 2 3.75 2Zm6.854-1h4.146a.25.25 0 0 1 .25.25v4.146a.25.25 0 0 1-.427.177L13.03 4.03 9.28 7.78a.75.75 0 0 1-1.06-1.06l3.75-3.75-1.543-1.543A.25.25 0 0 1 10.604 1Z" fill="currentColor"/></svg>
              </a>
            </div>
            {profileData.badge_count > 0 && (
              <div className={s.profileBadgesCol}>
                <span className={s.profileBadgesLabel}>{profileData.badge_count} badge{profileData.badge_count !== 1 ? 's' : ''} collected</span>
                <div className={s.profileBadgeRow}>
                  {profileData.badges.map((badge) => (
                    <span
                      key={badge.uuid}
                      className={s.profileBadgeIcon}
                      title={`${badge.name}: ${badge.description}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={badge.image_url}
                        alt={badge.name}
                        width={28}
                        height={28}
                      />
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          )}

          {/* ── Contributions card ── */}
          {profileData && (
          <div className={s.card} style={{ '--card-delay': '0.12s' } as React.CSSProperties}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}>Contributions</span>
            </div>
            <div className={s.cardBody}>
              <div className={s.contribRepBanner}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" fill="#604FCD" />
                  <text x="12" y="16" textAnchor="middle" fill="white" fontSize="11" fontWeight="700" fontFamily="sans-serif">R</text>
                </svg>
                {profileData.handle} has {profileData.reputation} Reputation
              </div>
              <div className={s.contribList}>
                {profileData.contributions.map((c, i) => (
                  <div key={c.label} className={s.contribRow} style={{ '--row-delay': `${0.05 + i * 0.07}s` } as React.CSSProperties}>
                    <span className={s.contribLabel}>{c.label}</span>
                    {c.detail ? <span className={s.contribDetail}>{c.detail}</span> : null}
                    <span className={`${s.contribRep} ${c.rep > 0 ? s.contribRepActive : ''}`}>
                      {c.rep > 0 ? `${c.rep} rep` : 'No rep'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          )}

          {/* Setup notice */}
          {!data && !error && (
            <div className={s.notice}>
              <span className={s.noticeIcon}>i</span>
              <span>
                Configure <code>EXERCISM_API_TOKEN</code> and{' '}
                <code>EXERCISM_USERNAME</code> in <code>.env.local</code> to see
                live data. Copy <code>.env.local.example</code> to get started.
              </span>
            </div>
          )}

          {/* Error notice */}
          {error && (
            <div className={s.errorState}>
              <strong>API Error:</strong> {error}
            </div>
          )}

          {/* Stats row */}
          {data && (
            <div className={s.statsGrid}>
              <div className={s.statCard} style={{ '--stat-delay': '0.15s' } as React.CSSProperties}>
                <span className={s.statLabel}>Total Submissions</span>
                <span className={s.statValue}>{data.total_submissions}</span>
              </div>
              <div className={s.statCard} style={{ '--stat-delay': '0.25s' } as React.CSSProperties}>
                <span className={s.statLabel}>Current Streak</span>
                <span className={`${s.statValue} ${s.statValueGreen}`}>
                  {data.streak}
                  <span className={s.statUnit}>{' '}days</span>
                </span>
              </div>
              <div className={s.statCard} style={{ '--stat-delay': '0.35s' } as React.CSSProperties}>
                <span className={s.statLabel}>Longest Streak</span>
                <span className={s.statValue}>
                  {data.longest_streak}
                  <span className={s.statUnit}>{' '}days</span>
                </span>
              </div>
              <div className={s.statCard} style={{ '--stat-delay': '0.45s' } as React.CSSProperties}>
                <span className={s.statLabel}>Year</span>
                <span className={s.statValue}>{data.year}</span>
              </div>
            </div>
          )}

          {/* Heatmap preview */}
          <div className={s.card} style={{ '--card-delay': '0.2s' } as React.CSSProperties}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}>Heatmap Preview</span>
              <div className={s.yearSelector}>
                {dataLoading && <div className={s.spinner} />}
                {YEAR_OPTIONS.map((y) => (
                  <button
                    key={y}
                    className={`${s.yearBtn} ${selectedYear === y ? s.yearBtnActive : ''}`}
                    onClick={() => setSelectedYear(y)}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>
            <div className={s.cardBody}>
              <div className={s.heatmapWrap}>
                <div
                  className={`${s.heatmapImage}${dataLoading ? ` ${s.heatmapLoading}` : ''}`}
                  dangerouslySetInnerHTML={{ __html: svgContent }}
                />
                {!data && (
                  <p className={s.sampleLabel}>Sample data — configure your API token to see real activity</p>
                )}
              </div>
            </div>
          </div>

          {/* API Reference */}
          <div className={s.card} style={{ '--card-delay': '0.3s' } as React.CSSProperties}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}>API Reference</span>
            </div>
            <div className={s.cardBody}>
              <table className={s.paramTable}>
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Endpoint</th>
                    <th>Params</th>
                    <th>Returns</th>
                  </tr>
                </thead>
                <tbody>
                  {([
                    { method: 'GET', path: '/api/exercism-heatmap',              params: '?year=YYYY',         returns: 'JSON — annual heatmap'       },
                    { method: 'GET', path: '/api/exercism-heatmap.svg',          params: '?year=YYYY',         returns: 'SVG — annual heatmap'        },
                    { method: 'GET', path: '/api/exercism-heatmap-sample.svg',   params: '—',                  returns: 'SVG — sample (no token)'     },
                    { method: 'GET', path: '/api/exercism-monthly-heatmap',      params: '?year=YYYY&month=M', returns: 'JSON — monthly heatmap'      },
                    { method: 'GET', path: '/api/exercism-monthly-heatmap.svg',  params: '?year=YYYY&month=M', returns: 'SVG — monthly heatmap'       },
                  ] as const).map(({ method, path, params, returns }) => (
                    <tr key={path}>
                      <td><span className={s.methodBadge}>{method}</span></td>
                      <td><span className={s.paramName}>{path}</span></td>
                      <td><span className={s.paramType}>{params}</span></td>
                      <td>{returns}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

            </div>
          </div>

          {/* Embed snippets */}
          <div className={s.card} style={{ '--card-delay': '0.4s' } as React.CSSProperties}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}>Embed Snippets</span>
            </div>
            <div className={s.cardBody}>
              <div className={s.sectionLabel}>HTML</div>
              <CodeBlock lang="HTML" code={embedHtml} />

              <div className={s.sectionLabel}>Markdown (README / Portfolio)</div>
              <CodeBlock lang="Markdown" code={embedMarkdown} />

              <div className={s.notice}>
                <span className={s.noticeIcon}>i</span>
                <span>
                  The SVG is cached for 15 minutes. GitHub README renders{' '}
                  <code>&lt;img&gt;</code> tags — the Markdown embed works in
                  any README file.
                </span>
              </div>
            </div>
          </div>

          {/* Color scale reference */}
          <div className={s.card} style={{ '--card-delay': '0.5s' } as React.CSSProperties}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}>Color Scale</span>
            </div>
            <div className={s.cardBody}>
              <table className={s.paramTable}>
                <thead>
                  <tr>
                    <th>Swatch</th>
                    <th>Submission Count</th>
                    <th>Hex</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: '0 submissions', color: '#ebedf0' },
                    { label: '1 submission', color: '#9be9a8' },
                    { label: '2 – 3 submissions', color: '#40c463' },
                    { label: '4 – 6 submissions', color: '#30a14e' },
                    { label: '7+ submissions', color: '#216e39' },
                  ].map(({ label, color }) => (
                    <tr key={color}>
                      <td>
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 4,
                            background: color,
                            border: '1px solid rgba(0,0,0,0.08)',
                          }}
                        />
                      </td>
                      <td>{label}</td>
                      <td>
                        <span className={s.paramName}>{color}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className={s.footer}>
          <div className={s.footerSocials}>
            {/* GitHub */}
            <a
              href="https://github.com/AHILL-0121"
              target="_blank"
              rel="noopener noreferrer"
              className={s.footerSocialLink}
              aria-label="GitHub"
              style={{ '--pop-delay': '0s' } as React.CSSProperties}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden="true">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
              <span>GitHub</span>
            </a>
            {/* LinkedIn */}
            <a
              href="https://www.linkedin.com/in/ahill-selvaraj"
              target="_blank"
              rel="noopener noreferrer"
              className={s.footerSocialLink}
              aria-label="LinkedIn"
              style={{ '--pop-delay': '0.08s' } as React.CSSProperties}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden="true">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              <span>LinkedIn</span>
            </a>
            {/* Portfolio */}
            <a
              href="https://sa-portfolio-psi.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className={s.footerSocialLink}
              aria-label="Portfolio"
              style={{ '--pop-delay': '0.16s' } as React.CSSProperties}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span>Portfolio</span>
            </a>
          </div>
        </footer>
      </div>
    </>
  );
};

// ─── SSR ─────────────────────────────────────────────────────────────────────

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const year = CURRENT_YEAR;
  const protocol = ctx.req.headers['x-forwarded-proto'] ?? 'http';
  const host = ctx.req.headers.host ?? 'localhost:3000';
  const baseUrl = `${protocol}://${host}`;

  const token    = process.env.EXERCISM_API_TOKEN;
  const username = process.env.EXERCISM_USERNAME;

  if (!token || !username) {
    return {
      props: {
        initialData:  null,
        initialError: null,
        currentYear:  year,
        baseUrl,
        profileData:  null,
      },
    };
  }

  try {
    const { fetchAllSolutions, getDefaultYear, solutionDate, fetchProfileData } = await import('@/lib/exercism');
    const { aggregateSolutions } = await import('@/lib/aggregator');

    // Run both fetches concurrently
    const [allSolutions, profileData] = await Promise.all([
      fetchAllSolutions({ token, username }),
      fetchProfileData({
        token,
        username,
        display_name: process.env.EXERCISM_DISPLAY_NAME,
        location:     process.env.EXERCISM_LOCATION,
        pronouns:     process.env.EXERCISM_PRONOUNS,
        joined:       process.env.EXERCISM_JOINED,
        avatar_url:   process.env.EXERCISM_AVATAR_URL,
      }),
    ]);

    const detectedYear  = getDefaultYear(allSolutions) ?? year;
    const yearSolutions = allSolutions.filter(
      (s) => solutionDate(s).getFullYear() === detectedYear,
    );
    const data = aggregateSolutions(yearSolutions, username, detectedYear);

    return {
      props: {
        initialData:  data,
        initialError: null,
        currentYear:  detectedYear,
        baseUrl,
        profileData,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return {
      props: {
        initialData:  null,
        initialError: message,
        currentYear:  year,
        baseUrl,
        profileData:  null,
      },
    };
  }
};

export default Home;
