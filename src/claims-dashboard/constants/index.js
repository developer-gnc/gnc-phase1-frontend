export const ROLES = {
  DIRECTOR: 'director',
  MANAGER: 'manager',
  CONSULTANT: 'consultant',
};

export const STATUSES = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  PENDING_APPROVAL: 'Pending Approval',
  COMPLETED: 'Completed',
  ON_HOLD: 'On Hold',
};

export const STATUS_CYCLE = [
  'Not Started',
  'In Progress',
  'Pending Approval',
  'Completed',
];

// Hardcoded failsafe — this account ALWAYS has full Director-level access,
// regardless of what's in the Supabase team table. Protects against
// getting locked out if the team table is ever misconfigured or emptied.
export const FAILSAFE_ADMIN_EMAIL = 'database@gncgroup.ca';

export function canEditClaim(role, isOwnFile) {
  return role === ROLES.DIRECTOR || role === ROLES.MANAGER || isOwnFile;
}