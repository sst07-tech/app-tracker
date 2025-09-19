import React from 'react';

function Badge({ status }) {
  const color = {
    'Applied': 'bg-blue-100 text-blue-800',
    'Interview': 'bg-yellow-100 text-yellow-800',
    'Offer': 'bg-green-100 text-green-800',
    'Rejected': 'bg-red-100 text-red-800'
  }[status] || 'bg-gray-100 text-gray-800';
  return <span className={`px-2 py-1 rounded text-xs ${color}`}>{status}</span>;
}

export default function ApplicationList({ data, onEdit, onDelete }) {
  if (!data?.length) return <p className="text-gray-500">No applications yet. Add your first one!</p>;
  return (
    <div className="divide-y">
      {data.map((a) => (
        <div key={a.appId} className="py-3 flex items-start justify-between">
          <div>
            <div className="font-medium">{a.company} — {a.role}</div>
            <div className="text-sm text-gray-600">Applied on {a.appliedOn || '—'}</div>
            {a.notes && <div className="text-sm mt-1">{a.notes}</div>}
            {a.resumeUrl && <a href={a.resumeUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600">Resume</a>}
          </div>
          <div className="flex items-center gap-3">
            <Badge status={a.status} />
            <button onClick={() => onEdit(a)} className="text-sm underline">Edit</button>
            <button onClick={() => onDelete(a)} className="text-sm text-red-600 underline">Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}
