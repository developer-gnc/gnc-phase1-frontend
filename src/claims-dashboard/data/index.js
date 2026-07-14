export const CLAIMS = [];

export const TEAM = [
  { id:'nitin',    name:'Nitin Luhadiya',  initials:'NL', color:'#7c3aed', email:'nitin@gncgroup.ca',    role:'admin', permissions:{viewAllTasks:true,  assignTasks:true,  manageUsers:true,  viewAllFiles:true } },
  { id:'rahul',    name:'Rahul Sharma',    initials:'RS', color:'#1e56d9', email:'rahul@gncgroup.ca',    role:'sr',    permissions:{viewAllTasks:true,  assignTasks:true,  manageUsers:false, viewAllFiles:true } },
  { id:'priya',    name:'Priya Mehta',     initials:'PM', color:'#7c3aed', email:'priya@gncgroup.ca',    role:'sr',    permissions:{viewAllTasks:true,  assignTasks:true,  manageUsers:false, viewAllFiles:true } },
  { id:'amir',     name:'Amir Khan',       initials:'AK', color:'#059669', email:'amir@gncgroup.ca',     role:'jr',    permissions:{viewAllTasks:false, assignTasks:false, manageUsers:false, viewAllFiles:false} },
  { id:'sunita',   name:'Sunita Verma',    initials:'SV', color:'#f59e0b', email:'sunita@gncgroup.ca',   role:'jr',    permissions:{viewAllTasks:false, assignTasks:false, manageUsers:false, viewAllFiles:false} },
  { id:'manpreet', name:'Manpreet Gill',   initials:'MG', color:'#ef4444', email:'manpreet@gncgroup.ca', role:'jr',    permissions:{viewAllTasks:false, assignTasks:false, manageUsers:false, viewAllFiles:false} },
];

export const INITIAL_DELIVERABLES = [];

export const DELIVERABLE_TYPES = [
  'Site Visit','Demolition Scope of Work','Demolition Scope','Reconstruction Scope',
  'Building Finishes Report','Bid Tendering','Reconstruction Bid','Engineer Engagement',
  'Request Site Visit','Call to Insured','Call to Client','Submit Report','Insurance Review',
  'Moisture Mapping','Mould Assessment','Remediation Scope','Sign-off / Completion','Custom...'
];

export const DELIVERABLE_STATUSES = ['Not Started','In Progress','Pending Approval','Completed','On Hold'];

export const STATUS_CONFIG = {
  'Not Started':      { pillClass:'pill-gray',   kanbanColor:'#8fa0c0', progressColor:'#8fa0c0' },
  'In Progress':      { pillClass:'pill-blue',   kanbanColor:'#1e56d9', progressColor:'#1e56d9' },
  'Pending Approval': { pillClass:'pill-yellow', kanbanColor:'#f59e0b', progressColor:'#f59e0b' },
  'On Hold':          { pillClass:'pill-red',    kanbanColor:'#ef4444', progressColor:'#ef4444' },
  'Completed':        { pillClass:'pill-green',  kanbanColor:'#00c9a7', progressColor:'#00c9a7' },
};

export const KANBAN_COLS = ['Not Started','In Progress','Pending Approval','On Hold','Completed'];
