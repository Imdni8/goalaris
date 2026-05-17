import LandingContent from '@/components/landing/landing-content';
import { getLatestRelease, formatReleaseBadge } from '@/lib/release-notes';

export default async function Home() {
  const latest = await getLatestRelease();
  const latestRelease = latest
    ? { slug: latest.slug, badgeLabel: formatReleaseBadge(latest.date) }
    : null;

  return <LandingContent latestRelease={latestRelease} />;
}
