const DATE_SUFFIX = 'T12:00:00';
const CLAIM_TIMEZONE = 'America/Edmonton';

function timezoneTodayDate(timeZone) {
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone }); // YYYY-MM-DD
  return new Date(todayStr + DATE_SUFFIX);
}

export function canadaTimeZoneAbbr(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: CLAIM_TIMEZONE, timeZoneName: 'short' }).formatToParts(date);
  return parts.find(p => p.type === 'timeZoneName')?.value || 'MT';
}

function parseDateInfo(dateStr) {
  if (!dateStr) return { canadaTime: '—', due: null };
  const d = new Date(dateStr + DATE_SUFFIX);
  const today = timezoneTodayDate(CLAIM_TIMEZONE);
  const diff = Math.round((d - today) / 86400000);
  const canadaTime = d.toLocaleString('en-CA', {
    timeZone: CLAIM_TIMEZONE,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  let due;
  if (diff < 0) due = { text: Math.abs(diff) + 'd overdue', overdue: true };
  else if (diff === 0) due = { text: 'Due today', overdue: true };
  else if (diff === 1) due = { text: 'Due tomorrow', overdue: false };
  else due = {
    text: 'Due ' + d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }),
    overdue: false,
  };
  return { canadaTime, due };
}

export function canadaTimeStr(dateStr) {
  return parseDateInfo(dateStr).canadaTime;
}

export function formatDue(dateStr) {
  return parseDateInfo(dateStr).due;
}

export function getDueInfo(dateStr) {
  return parseDateInfo(dateStr);
}

export function getTeamMember(team, id) {
  return team.find(t => t.id === id);
}

export function getClaim(claims, id) {
  return claims.find(c => c.id === id);
}
