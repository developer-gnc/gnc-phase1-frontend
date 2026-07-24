export const ROLES = {
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

// No more per-permission toggles, behavior is now just Manager vs Consultant.
// Kept as a helper in case any file still checks permissions directly.
export function canEditClaim(role, isOwnFile) {
  return role === ROLES.MANAGER || isOwnFile;
}