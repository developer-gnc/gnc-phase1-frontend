import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';

// The cost audit runs on its own server (the GNC-Audit-Automation project, audit_api.py). This page
// sends it the contractor's bill and backup with the user's gnctools.ca sign-in token; the server
// checks that token with gnctools.ca (@gncgroup.ca accounts only) and sends back GNC's audit workbook.
const AUDIT_URL = (import.meta.env.VITE_AUDIT_URL || 'https://audit.gnctools.ca').replace(/\/$/, '');

const money = (v) =>
  v == null
    ? '–'
    : `${v < 0 ? '−' : ''}$${Math.abs(v).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function DropZone({ label, hint, accept, multiple = true, files, setFiles }) {
  const input = useRef(null);
  const [over, setOver] = useState(false);
  const add = (list) => {
    const picked = Array.from(list || []);
    setFiles(multiple ? [...files, ...picked] : picked.slice(0, 1));
  };
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <p className="text-white font-semibold">{label}</p>
      <p className="text-gray-400 text-sm mb-4">{hint}</p>
      <div
        role="button"
        tabIndex={0}
        onClick={() => input.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); add(e.dataTransfer.files); }}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          over ? 'border-sky-400 bg-zinc-800 text-sky-300' : 'border-zinc-700 text-gray-400 hover:border-zinc-500'
        }`}
      >
        Drag and drop {multiple ? 'files' : 'a file'} here, or click to choose
        <input
          ref={input}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => { add(e.target.files); e.target.value = ''; }}
        />
      </div>
      {files.length > 0 && (
        <ul className="mt-4 divide-y divide-zinc-800 text-sm">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex justify-between items-center py-2 gap-4">
              <span className="text-gray-200 truncate">
                {f.name} <span className="text-gray-500">({(f.size / 1048576).toFixed(1)} MB)</span>
              </span>
              <button
                type="button"
                onClick={() => setFiles(files.filter((_, j) => j !== i))}
                className="text-red-400 hover:text-red-300 shrink-0"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CostAudit({ user, onLogout }) {
  const [bill, setBill] = useState([]);
  const [backup, setBackup] = useState([]);
  const [control, setControl] = useState([]);
  const [claim, setClaim] = useState('');
  const [title, setTitle] = useState('');
  const [emergencyEnd, setEmergencyEnd] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);

  const call = async (path, options = {}) => {
    const token = localStorage.getItem('authToken');
    const res = await fetch(`${AUDIT_URL}${path}`, {
      ...options,
      headers: { ...(options.headers || {}), Authorization: `Bearer ${token || ''}` },
    });
    if (res.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login?error=session_expired';
      throw new Error('Your sign-in has expired.');
    }
    return res;
  };

  const run = async (e) => {
    e.preventDefault();
    setError('');
    setResults([]);
    if (!bill.length) {
      setError("Add the contractor's estimate or invoice first.");
      return;
    }
    const fd = new FormData();
    bill.forEach((f) => fd.append('bill', f, f.name));
    backup.forEach((f) => fd.append('backup', f, f.name));
    control.forEach((f) => fd.append('control', f, f.name));
    fd.append('claim', claim);
    fd.append('title', title);
    fd.append('emergency_end', emergencyEnd);
    setBusy(true);
    try {
      const res = await call('/api/audit', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `The audit server answered ${res.status}.`);
      if (!data.results?.length) throw new Error('Nothing could be audited from these files.');
      setResults(data.results);
    } catch (err) {
      setError(err.message || 'Could not reach the audit server.');
    } finally {
      setBusy(false);
    }
  };

  const download = async (r) => {
    try {
      const res = await call(r.download);
      if (!res.ok) throw new Error((await res.json()).error || 'The workbook could not be downloaded.');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = r.output || 'GNC Audit DRAFT.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Navbar */}
      <nav className="bg-black border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <Link to="/dashboard">
                <img
                  src="https://gncgroup.ca/wp-content/uploads/2025/02/gnc-logo.png"
                  alt="GNC Group Logo"
                  className="h-10 sm:h-12 w-auto"
                />
              </Link>
              <div className="hidden md:flex gap-4">
                <Link to="/dashboard" className="text-gray-400 hover:text-white font-medium transition-colors">
                  Dashboard
                </Link>
                <span className="text-white font-medium">Cost Audit</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400 hidden sm:block">{user.email}</span>
              <button
                onClick={onLogout}
                className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg font-medium transition-colors border border-zinc-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold text-white mb-2">Cost Audit</h1>
        <p className="text-gray-400 mb-8">
          Drop in the contractor&apos;s bill and its backup, and get GNC&apos;s audit workbook to review.
          Every result is a draft for the consultant.
        </p>

        <form onSubmit={run} className="space-y-5">
          <DropZone
            label="1. Contractor's estimate or invoice (required)"
            hint="Xactimate estimate PDF, or a T&M invoice PDF. The tool works out which."
            accept=".pdf"
            files={bill}
            setFiles={setBill}
          />
          <DropZone
            label="2. Backup (optional)"
            hint="Subtrade invoices, the labour log or timesheets, an .esx sketch."
            accept=".pdf,.esx"
            files={backup}
            setFiles={setBackup}
          />
          <DropZone
            label="3. GNC control estimate (optional)"
            hint="GNC's own estimate for the same job, used to check hours and lump sums."
            accept=".pdf"
            multiple={false}
            files={control}
            setFiles={setControl}
          />

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 grid gap-5 sm:grid-cols-3">
            <label className="block">
              <span className="text-white font-semibold text-sm">Claim name</span>
              <input
                value={claim}
                onChange={(e) => setClaim(e.target.value)}
                placeholder="e.g. Jerome Wilson - GNC 2621BA"
                className="mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-gray-500"
              />
            </label>
            <label className="block">
              <span className="text-white font-semibold text-sm">Sheet title (optional)</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Name - Audit - Claim # - GNC File #"
                className="mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-gray-500"
              />
            </label>
            <label className="block">
              <span className="text-white font-semibold text-sm">Emergency end date (T&amp;M)</span>
              <input
                type="date"
                value={emergencyEnd}
                onChange={(e) => setEmergencyEnd(e.target.value)}
                className="mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
              />
            </label>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={busy}
              className="bg-white text-black font-semibold px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-60 disabled:cursor-wait"
            >
              {busy ? 'Auditing…' : 'Run audit'}
            </button>
            {busy && <span className="text-gray-400 text-sm">Large invoices can take a minute.</span>}
          </div>
        </form>

        {error && (
          <div className="mt-6 bg-red-950 border border-red-800 text-red-200 rounded-xl p-4">{error}</div>
        )}

        {results.map((r, i) => (
          <div key={i} className="mt-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-bold text-white">{r.contractor || r.file || 'Result'}</h2>
              <span className="text-xs text-gray-300 border border-zinc-700 rounded-full px-3 py-0.5">{r.kind}</span>
            </div>
            <p className="text-gray-500 text-sm mt-1">
              {r.file} · {r.lines} lines
            </p>
            <div className="grid sm:grid-cols-3 gap-3 my-5">
              {[
                ['Claimed', r.claimed, 'text-white'],
                ['GNC recommendation', r.recommended, 'text-white'],
                ['Variance', r.variance, r.variance < -0.005 ? 'text-red-400' : 'text-emerald-400'],
              ].map(([k, v, cls]) => (
                <div key={k} className="bg-zinc-800 rounded-xl p-4">
                  <p className="text-gray-400 text-xs">{k}</p>
                  <p className={`text-lg font-semibold ${cls}`}>{money(v)}</p>
                </div>
              ))}
            </div>
            <p className="text-gray-500 text-xs mb-4">Amounts before O&amp;P and tax.</p>
            {r.needs?.length > 0 && (
              <div className="bg-amber-950 border border-amber-800 rounded-xl p-4 mb-4">
                <p className="text-amber-200 font-semibold text-sm">Needs a person</p>
                <ul className="list-disc pl-5 text-amber-100 text-sm mt-1 space-y-1">
                  {r.needs.map((n, j) => <li key={j}>{n}</li>)}
                </ul>
              </div>
            )}
            {r.download ? (
              <button
                onClick={() => download(r)}
                className="bg-sky-500 hover:bg-sky-400 text-black font-semibold px-5 py-2.5 rounded-lg transition-colors"
              >
                Download audit workbook
              </button>
            ) : (
              <p className="text-gray-500 text-sm">No workbook was written.</p>
            )}
          </div>
        ))}

        <p className="text-gray-600 text-xs mt-10">
          Uploaded files are deleted as soon as the audit is done. Workbooks can be downloaded for an hour.
        </p>
      </main>
    </div>
  );
}

export default CostAudit;
