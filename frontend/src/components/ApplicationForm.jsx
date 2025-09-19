import React, { useState, useEffect } from 'react';

const empty = { company: '', role: '', status: 'Applied', appliedOn: '', notes: '', resumeUrl: '' };

export default function ApplicationForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    setForm(initial || empty);
  }, [initial]);

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input name="company" value={form.company} onChange={handle} placeholder="Company" className="border rounded p-2" required />
        <input name="role" value={form.role} onChange={handle} placeholder="Role" className="border rounded p-2" required />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <select name="status" value={form.status} onChange={handle} className="border rounded p-2">
          <option>Applied</option>
          <option>Interview</option>
          <option>Offer</option>
          <option>Rejected</option>
        </select>
        <input type="date" name="appliedOn" value={form.appliedOn} onChange={handle} className="border rounded p-2" />
        <input name="resumeUrl" value={form.resumeUrl} onChange={handle} placeholder="Resume URL (optional)" className="border rounded p-2" />
      </div>
      <textarea name="notes" value={form.notes} onChange={handle} rows="3" placeholder="Notes" className="border rounded p-2 w-full"></textarea>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-3 py-2 rounded border">Cancel</button>
        <button type="submit" className="px-3 py-2 rounded bg-black text-white">Save</button>
      </div>
    </form>
  );
}
