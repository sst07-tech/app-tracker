import React, { useState } from 'react';

export default function ApplicationForm({ onSubmit }) {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('Applied');
  const [appliedOn, setAppliedOn] = useState('');
  const [notes, setNotes] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (typeof onSubmit !== 'function') {
      setError('Form submission error. Please refresh the page.');
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      await onSubmit({
        company: company.trim(),
        role: role.trim(),
        status,
        appliedOn: appliedOn || undefined,
        notes: notes.trim() || undefined,
        resumeUrl: resumeUrl.trim() || undefined,
      });
      
      // Reset form on success
      setCompany('');
      setRole('');
      setStatus('Applied');
      setAppliedOn('');
      setNotes('');
      setResumeUrl('');
    } catch (err) {
      setError('Failed to add application. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-4 p-6 rounded-2xl border shadow-sm bg-white">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Add New Application</h2>
      </div>
      
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-3">
        <input
          className="border rounded-lg p-2"
          placeholder="Company"
          aria-label="Company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          required
        />
        <input
          className="border rounded-lg p-2"
          placeholder="Role"
          aria-label="Role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          required
        />
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <select
          className="border rounded-lg p-2"
          value={status}
          aria-label="Status"
          onChange={(e) => setStatus(e.target.value)}
        >
          {['Applied', 'Interview', 'Offer', 'Rejected', 'On Hold'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <input
          className="border rounded-lg p-2"
          type="date"
          aria-label="Applied on"
          value={appliedOn}
          onChange={(e) => setAppliedOn(e.target.value)}
        />

        <input
          className="border rounded-lg p-2"
          placeholder="Resume URL (optional)"
          aria-label="Resume URL"
          value={resumeUrl}
          onChange={(e) => setResumeUrl(e.target.value)}
        />
      </div>

      <textarea
        className="border rounded-lg p-2"
        placeholder="Notes"
        aria-label="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
      />

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving || !company.trim() || !role.trim()}
          className="px-6 py-2 rounded-xl bg-black text-white disabled:opacity-50 font-medium transition-opacity"
        >
          {saving ? 'Adding…' : 'Add Application'}
        </button>
      </div>
    </form>
  );
}
