/** Match status values that affect countdown formatting. */
export type CountdownStatus = 'upcoming' | 'running' | 'finished' | 'cancelled';

/** "2h 5min" / "30 sec" until scheduledAt, "LIVE" while running, or "Starting..."
 * once scheduledAt has passed but the match has not flipped to running yet
 * (sync cron lag). */
export function formatCountdown(scheduledAt: string, now: number, status: CountdownStatus): string {
  if (status === 'running') {
    return 'LIVE';
  }
  const target = new Date(scheduledAt).getTime();
  const diffMs = target - now;
  if (Number.isNaN(target) || diffMs <= 0) {
    return 'Starting...';
  }
  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}min`;
  if (minutes > 0) return `${minutes}min`;
  return `${seconds} sec`;
}
