const DATE_SUFFIX = 'T12:00:00';

function parseDateInfo(dateStr) {
  if (!dateStr) return { canadaTime: '—', due: null };
  const d = new Date(dateStr + DATE_SUFFIX);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.round((d - now) / 86400000);
  const canadaTime = d.toLocaleString('en-CA', {
    timeZone: 'America/Edmonton',
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
