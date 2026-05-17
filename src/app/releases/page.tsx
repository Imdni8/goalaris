import Link from 'next/link';
import type { Metadata } from 'next';
import { getAllReleases, formatStampDate } from '@/lib/release-notes';

export const metadata: Metadata = {
  title: 'Release notes — Goalaris',
  description: 'Skim what changed, newest first.',
};

const releasesCss = `
  .rn-page {
    --bg:        oklch(0.99 0.004 250);
    --paper:    #ffffff;
    --ink:       oklch(0.20 0.025 250);
    --ink-soft:  oklch(0.42 0.015 250);
    --muted:     oklch(0.58 0.012 250);
    --rule:      oklch(0.92 0.008 250);
    --rule-soft: oklch(0.95 0.006 250);
    --accent:    #3b82f6;
    --accent-ink: #2563eb;
    --accent-wash: #eff6ff;

    --tag-new:    oklch(0.55 0.16 150);
    --tag-new-bg: oklch(0.96 0.04 150);
    --tag-imp:    oklch(0.55 0.16 250);
    --tag-imp-bg: oklch(0.96 0.04 250);
    --tag-fix:    oklch(0.55 0.10 60);
    --tag-fix-bg: oklch(0.96 0.03 70);

    --rn-font-sans: "Helvetica Neue", Helvetica, system-ui, -apple-system, sans-serif;
    --rn-font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;

    background: var(--bg);
    color: var(--ink);
    font-family: var(--rn-font-sans);
    min-height: 100vh;
  }
  .rn-page .mono { font-family: var(--rn-font-mono); }
  .rn-page h1, .rn-page h2, .rn-page h3, .rn-page h4, .rn-page p { margin: 0; }

  .rn-page .page {
    max-width: 1080px; margin: 0 auto;
    background: var(--bg);
    min-height: 100vh;
    border-left: 1px solid var(--rule);
    border-right: 1px solid var(--rule);
  }

  .rn-page .chip {
    display: inline-flex; align-items: center; gap: 6px;
    font-family: var(--rn-font-mono); font-size: 10.5px; letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 3px 8px; border-radius: 999px;
    background: var(--tag-imp-bg); color: var(--tag-imp);
  }
  .rn-page .chip[data-kind="new"]      { background: var(--tag-new-bg); color: var(--tag-new); }
  .rn-page .chip[data-kind="improved"] { background: var(--tag-imp-bg); color: var(--tag-imp); }
  .rn-page .chip[data-kind="fixed"]    { background: var(--tag-fix-bg); color: var(--tag-fix); }
  .rn-page .chip .dot {
    width: 6px; height: 6px; border-radius: 999px;
    background: currentColor; opacity: 0.85;
  }

  .rn-page .nav-d {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 56px; border-bottom: 1px solid var(--rule);
    background: var(--paper);
  }
  .rn-page .nav-d .brand {
    font-weight: 700; color: var(--accent); letter-spacing: -0.01em; font-size: 18px;
  }
  .rn-page .nav-d .auth { display: flex; align-items: center; gap: 6px; }
  .rn-page .nav-d .auth a {
    font-size: 13.5px; text-decoration: none;
    padding: 8px 14px; border-radius: 8px;
    color: var(--ink-soft);
  }
  .rn-page .nav-d .auth a.login:hover { color: var(--ink); background: var(--rule-soft); }
  .rn-page .nav-d .auth a.signup {
    color: #fff; background: var(--accent);
    font-weight: 500;
  }
  .rn-page .nav-d .auth a.signup:hover { background: var(--accent-ink); }

  .rn-page .hero {
    padding: 56px 56px 32px;
  }
  .rn-page .hero .back {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 13.5px; color: var(--ink-soft); text-decoration: none;
    margin-bottom: 28px;
  }
  .rn-page .hero .back:hover { color: var(--ink); }
  .rn-page .hero h1 {
    font-size: 44px; letter-spacing: -0.025em; font-weight: 600;
    line-height: 1.05;
  }
  .rn-page .hero p {
    margin-top: 12px; color: var(--ink-soft); font-size: 15px;
  }

  .rn-page .stream {
    padding: 0 56px 80px;
    border-top: 1px solid var(--rule);
  }

  .rn-page .release {
    display: grid; grid-template-columns: 120px 1fr;
    gap: 32px;
    padding: 32px 0;
    border-bottom: 1px solid var(--rule);
  }
  .rn-page .release:last-child { border-bottom: none; }
  .rn-page .release .stamp {
    position: sticky; top: 24px; align-self: start;
  }
  .rn-page .release .stamp .date {
    font-family: var(--rn-font-mono); font-size: 20px; font-weight: 500;
    color: var(--ink); letter-spacing: 0.04em; text-transform: uppercase;
    line-height: 1.1;
  }
  .rn-page .release .stamp .year {
    margin-top: 4px;
    font-family: var(--rn-font-mono); font-size: 18px; font-weight: 400;
    color: var(--muted); letter-spacing: 0.04em;
    line-height: 1.1;
  }

  .rn-page .release .lines {
    display: flex; flex-direction: column; gap: 16px;
  }
  .rn-page .release .line {
    display: grid; grid-template-columns: 96px 1fr;
    gap: 16px; align-items: baseline;
  }
  .rn-page .release .line .title {
    font-size: 15px; font-weight: 500; color: var(--ink);
    letter-spacing: -0.005em;
  }
  .rn-page .release .line .desc {
    font-size: 13.5px; color: var(--muted); line-height: 1.55;
    margin-top: 2px;
  }
  .rn-page .empty {
    color: var(--muted); font-size: 14px;
  }

  @media (max-width: 720px) {
    .rn-page .nav-d { padding: 14px 20px; }
    .rn-page .hero { padding: 36px 20px 24px; }
    .rn-page .hero h1 { font-size: 32px; }
    .rn-page .stream { padding: 0 20px 56px; }
    .rn-page .release {
      grid-template-columns: 1fr;
      gap: 16px;
      padding: 24px 0;
    }
    .rn-page .release .stamp { position: static; }
    .rn-page .release .line {
      grid-template-columns: 1fr;
      gap: 6px;
    }
  }
`;

export default async function ReleasesPage() {
  const releases = await getAllReleases();

  return (
    <div className="rn-page">
      <style dangerouslySetInnerHTML={{ __html: releasesCss }} />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap"
      />

      <div className="page">
        <header className="nav-d">
          <Link href="/" className="brand">
            goalaris
          </Link>
          <div className="auth">
            <Link className="login" href="/login">
              Log in
            </Link>
            <Link className="signup" href="/signup">
              Sign up
            </Link>
          </div>
        </header>

        <section className="hero">
          <Link className="back" href="/">
            ← Back
          </Link>
          <h1>Release notes</h1>
          <p>Read about the latest updates to goalaris. Newest first.</p>
        </section>

        <div className="stream">
          {releases.length === 0 ? (
            <article className="release">
              <div className="stamp" />
              <div className="lines">
                <p className="empty">No releases yet — check back soon.</p>
              </div>
            </article>
          ) : (
            releases.map((release) => {
              const { head, year } = formatStampDate(release.date);
              return (
                <article className="release" key={release.slug} id={release.slug}>
                  <div className="stamp">
                    <div className="date">{head}</div>
                    {year && <div className="year">{year}</div>}
                  </div>
                  <div className="lines">
                    {release.items.map((item, i) => (
                      <div className="line" key={i}>
                        <div>
                          <span className="chip" data-kind={item.kind}>
                            <span className="dot"></span>
                            {item.kind}
                          </span>
                        </div>
                        <div>
                          <div className="title">{item.title}</div>
                          {item.body && <div className="desc">{item.body}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
