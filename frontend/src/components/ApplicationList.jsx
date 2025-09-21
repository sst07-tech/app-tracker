import React from 'react';

function Badge({ status }) {
  const color = {
    Applied: 'bg-blue-100 text-blue-800',
    Interview: 'bg-amber-100 text-amber-800',
    Offer: 'bg-green-100 text-green-800',
    Rejected: 'bg-red-100 text-red-800',
    'On Hold': 'bg-slate-200 text-slate-800',
  }[status] || 'bg-gray-100 text-gray-800';
  return <span className={`px-2 py-1 rounded text-xs ${color}`}>{status}</span>;
}

function fmtDate(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return d;
  }
}

export default function ApplicationList({ data, onEdit, onDelete }) {
  if (!data?.length) {
    return (
      <div className="text-center py-12 rounded-2xl border bg-white">
        <div className="text-slate-400 mb-2">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-slate-600 font-medium">No applications yet</p>
        <p className="text-slate-500 text-sm">Add your first application above to get started</p>
      </div>
    );
  }

  const onStatusChange = async (item, next) => {
    if (typeof onEdit === 'function') {
      try {
        await onEdit(item, { status: next });
      } catch (err) {
        // Error is handled by parent component
      }
    }
  };

  const handleDelete = async (item) => {
    if (typeof onDelete === 'function' && confirm(`Delete application for ${item.company}?`)) {
      try {
        await onDelete(item);
      } catch (err) {
        // Error is handled by parent component
      }
    }
  };

  return (
    <div className="grid gap-3">
      {data.map((a) => (
        <div
          key={a.appId}
          className="rounded-2xl border bg-white p-4 shadow-sm flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"
        >
          <div>
            <div className="font-medium text-slate-900">
              {a.company} — <span className="text-slate-700">{a.role}</span>
            </div>
            <div className="text-sm text-slate-600">
              Applied on <span className="font-medium">{fmtDate(a.appliedOn)}</span>
            </div>
            {a.notes && <div className="text-sm mt-1 text-slate-700">{a.notes}</div>}
            {a.resumeUrl && (
              <a
                href={a.resumeUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-blue-600 hover:underline mt-1 inline-block"
              >
                Resume
              </a>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Badge status={a.status} />

            <select
              className="border rounded-lg p-1 text-sm bg-white"
              value={a.status}
              onChange={(e) => onStatusChange(a, e.target.value)}
              title="Update status"
            >
              {['Applied', 'Interview', 'Offer', 'Rejected', 'On Hold'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <button
              onClick={() => handleDelete(a)}
              className="text-sm text-red-600 hover:text-red-800 underline transition-colors"
              title="Delete application"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
