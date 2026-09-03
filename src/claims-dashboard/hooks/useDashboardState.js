  import { useState, useEffect } from "react";
  import { supabase } from "../lib/supabaseClient.js";
  import { FAILSAFE_ADMIN_EMAIL } from "../constants/index.js";

  export function useDashboardState(loggedInUser) {
    const [team, setTeam] = useState([]);
    const [currentRole, setCurrentRole] = useState(null);
    const [claims, setClaims] = useState([]);
    const [deliverables, setDeliverables] = useState([]);
    const [activePage, setActivePage] = useState("dashboard");
    const [modalClaim, setModalClaim] = useState(null);
    const [showNewClaimModal, setShowNewClaimModal] = useState(false);
    const [loading, setLoading] = useState(true);

    // Load everything from Supabase on mount
    useEffect(() => {
      async function loadAll() {
        const { data: teamData, error: teamErr } = await supabase.from('team').select('*');
        if (teamErr) console.error('Failed to load team:', teamErr);
        else setTeam(teamData);

        const { data: claimsData, error: claimsErr } = await supabase
          .from('claims')
          .select('*')
          .order('created_at', { ascending: false });
        if (claimsErr) console.error('Failed to load claims:', claimsErr);
        else setClaims(claimsData);

        const { data: delData, error: delErr } = await supabase.from('deliverables').select('*');
        if (delErr) console.error('Failed to load deliverables:', delErr);
        else setDeliverables(delData);

        setLoading(false);
      }
      loadAll();
    }, []);

  const currentUser = team.find(m => m.email === loggedInUser?.email);

  useEffect(() => {
    if (loggedInUser?.email === FAILSAFE_ADMIN_EMAIL) {
      setCurrentRole('director');
    } else if (currentUser) {
      setCurrentRole(currentUser.role);
    }
  }, [currentUser, loggedInUser]);

    const taskBadgeCount = deliverables.filter(
      (d) => d.assignee_email === loggedInUser?.email && d.status !== "Completed"
    ).length;

    function getTimestamp() {
      return new Date().toLocaleString('en-CA', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    }

    async function handleAddClaim(formData) {
      const { data, error } = await supabase
        .from('claims')
        .insert([{ ...formData, last_updated: getTimestamp(), flagged: false }])
        .select();

      if (error) { console.error('Failed to add claim:', error); return; }
      setClaims((prev) => [data[0], ...prev]);
      setShowNewClaimModal(false);
    }

    async function handleDeleteClaim(claimId) {
      // deliverables auto-delete via "on delete cascade" in the schema
      const { error } = await supabase.from('claims').delete().eq('id', claimId);
      if (error) { console.error('Failed to delete claim:', error); return; }

      setClaims((prev) => prev.filter((c) => c.id !== claimId));
      setDeliverables((prev) => prev.filter((d) => d.claim_id !== claimId));
      setModalClaim(null);
    }

    async function handleToggleFlag(claimId) {
      const claim = claims.find(c => c.id === claimId);
      if (!claim) return;
      const newFlagged = !claim.flagged;
      const timestamp = getTimestamp();

      const { error } = await supabase
        .from('claims')
        .update({ flagged: newFlagged, last_updated: timestamp })
        .eq('id', claimId);

      if (error) { console.error('Failed to toggle flag:', error); return; }

      setClaims((prev) => prev.map((c) => c.id === claimId ? { ...c, flagged: newFlagged, last_updated: timestamp } : c));
      setModalClaim((prev) => prev && prev.id === claimId ? { ...prev, flagged: newFlagged, last_updated: timestamp } : prev);
    }

    async function handleUpdateClaimStatus(claimId, newStatus) {
      const timestamp = getTimestamp();
      const { error } = await supabase
        .from('claims')
        .update({ status: newStatus, last_updated: timestamp })
        .eq('id', claimId);

      if (error) { console.error('Failed to update claim status:', error); return; }

      setClaims((prev) => prev.map((c) => c.id === claimId ? { ...c, status: newStatus, last_updated: timestamp } : c));
      setModalClaim((prev) => prev && prev.id === claimId ? { ...prev, status: newStatus, last_updated: timestamp } : prev);
    }

  async function handleAddDeliverable(claimId, data) {
  const timestamp = getTimestamp();
  const payload = {
    claim_id: claimId,
    name: data.name,
    note: data.note,
    assignee_email: data.assigneeEmail,
    status: data.status,
    due: data.due,
    priority: data.priority,
    section_id: data.sectionId || null,
    is_calling_task: !!data.isCallingTask,
  };
  
    const { data: inserted, error } = await supabase.from('deliverables').insert([payload]).select();
    if (error) {
      console.error('Failed to add deliverable:', error);
      return false;
    }

    setDeliverables((prev) => [...prev, inserted[0]]);

    await supabase.from('claims').update({ last_updated: timestamp }).eq('id', claimId);
    setClaims((prev) => prev.map((c) => c.id === claimId ? { ...c, last_updated: timestamp } : c));
    setModalClaim((prev) => prev && prev.id === claimId ? { ...prev, last_updated: timestamp } : prev);
    return true;
  }

    async function handleUpdateDeliverable(id, field, value) {
      const { error } = await supabase.from('deliverables').update({ [field]: value }).eq('id', id);
      if (error) { console.error('Failed to update deliverable:', error); return false; }

      setDeliverables((prev) => prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)));

      const del = deliverables.find(d => d.id === id);
      if (del) {
        const timestamp = getTimestamp();
        await supabase.from('claims').update({ last_updated: timestamp }).eq('id', del.claim_id);
        setClaims((prev) => prev.map((c) => c.id === del.claim_id ? { ...c, last_updated: timestamp } : c));
        setModalClaim((prev) => prev && prev.id === del.claim_id ? { ...prev, last_updated: timestamp } : prev);
      }
      return true;
    }

    async function handleDeleteDeliverable(id) {
      const del = deliverables.find(d => d.id === id);
      const { error } = await supabase.from('deliverables').delete().eq('id', id);
      if (error) { console.error('Failed to delete deliverable:', error); return; }

      setDeliverables((prev) => prev.filter((d) => d.id !== id));

      if (del) {
        const timestamp = getTimestamp();
        await supabase.from('claims').update({ last_updated: timestamp }).eq('id', del.claim_id);
        setClaims((prev) => prev.map((c) => c.id === del.claim_id ? { ...c, last_updated: timestamp } : c));
        setModalClaim((prev) => prev && prev.id === del.claim_id ? { ...prev, last_updated: timestamp } : prev);
      }
    }

    async function handleCycleStatus(id) {
      const del = deliverables.find(d => d.id === id);
      if (!del) return;
      const STATUS_CYCLE_LOCAL = ['Not Started', 'In Progress', 'Pending Approval', 'Completed'];
      const idx = STATUS_CYCLE_LOCAL.indexOf(del.status);
      const newStatus = STATUS_CYCLE_LOCAL[(idx + 1) % STATUS_CYCLE_LOCAL.length];

      const { error } = await supabase.from('deliverables').update({ status: newStatus }).eq('id', id);
      if (error) { console.error('Failed to cycle status:', error); return; }

      setDeliverables((prev) => prev.map((d) => d.id === id ? { ...d, status: newStatus } : d));
    }

async function handleRoleChangeAdmin(email, newRole) {
    const { error } = await supabase.from('team').update({ role: newRole }).eq('email', email);
    if (error) { console.error('Failed to update role:', error); return; }
    setTeam((prev) => prev.map((m) => m.email === email ? { ...m, role: newRole } : m));
  }

  async function handleOperationsToggleAdmin(email, isOperations) {
    const { error } = await supabase.from('team').update({ is_operations: isOperations }).eq('email', email);
    if (error) { console.error('Failed to update operations tag:', error); return; }
    setTeam((prev) => prev.map((m) => m.email === email ? { ...m, is_operations: isOperations } : m));
  }

    async function handleUpdateClaim(claimId, updatedFields) {
    const timestamp = getTimestamp();
    // drop id/created_at — Supabase rejects writes to identity columns
    const { id: _id, created_at: _created_at, ...safeFields } = updatedFields;
    const payload = { ...safeFields, last_updated: timestamp };

    const { error } = await supabase.from('claims').update(payload).eq('id', claimId);
    if (error) { console.error('Failed to update claim:', error); return false; }

    setClaims((prev) => prev.map((c) => c.id === claimId ? { ...c, ...payload } : c));
    setModalClaim((prev) => prev && prev.id === claimId ? { ...prev, ...payload } : prev);
    return true;
  }

    return {
      loading,
      currentRole,
      currentUser,
      activePage,
      setActivePage,
      claims,
      deliverables,
      team,
      modalClaim,
      setModalClaim,
      showNewClaimModal,
      setShowNewClaimModal,
      taskBadgeCount,
      handleAddClaim,
      handleDeleteClaim,
      handleToggleFlag,
      handleUpdateClaimStatus,
      handleAddDeliverable,
      handleUpdateDeliverable,
      handleDeleteDeliverable,
      handleCycleStatus,
      handleRoleChangeAdmin,
      handleOperationsToggleAdmin,
      handleUpdateClaim,
    };
  }