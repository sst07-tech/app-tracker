import React, { useEffect, useState } from 'react'
import { getApps, createApp, updateApp, deleteApp, getStats } from './api'
import ApplicationForm from './components/ApplicationForm'
import ApplicationList from './components/ApplicationList.jsx'


export default function App() {
  const [apps, setApps] = useState([])
  const [stats, setStats] = useState({ Applied: 0, Interview: 0, Offer: 0, Rejected: 0 })
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [filter, setFilter] = useState('All')

  const refresh = async () => {
    const [list, s] = await Promise.all([getApps(), getStats()])
    setApps(list)
    setStats(s)
  }

  useEffect(() => { refresh() }, [])

  const onSubmit = async (payload) => {
    if (editing) {
      await updateApp(editing.appId, payload)
    } else {
      await createApp(payload)
    }
    setShowForm(false)
    setEditing(null)
    refresh()
  }

  const onDelete = async (a) => {
    if (confirm(`Delete ${a.company} — ${a.role}?`)) {
      await deleteApp(a.appId)
      refresh()
    }
  }

  const filtered = filter === 'All' ? apps : apps.filter(a => a.status === filter)

  return (
    <div className="max-w-3xl mx-auto p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">🎯 ApplyTrackr</h1>
        <p className="text-gray-600">Track your applications and show your full‑stack chops.</p>
      </header>

      <section className="grid grid-cols-4 gap-3 mb-6">
        {['Applied', 'Interview', 'Offer', 'Rejected'].map(k => (
          <div key={k} className="rounded-lg border p-3">
            <div className="text-sm text-gray-500">{k}</div>
            <div className="text-2xl font-semibold">{stats[k] || 0}</div>
          </div>
        ))}
      </section>

      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {['All', 'Applied', 'Interview', 'Offer', 'Rejected'].map(k => (
            <button key={k} onClick={() => setFilter(k)}
              className={`px-3 py-1 rounded border ${filter === k ? 'bg-black text-white' : ''}`}>{k}</button>
          ))}
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true) }} className="px-3 py-2 rounded bg-black text-white">+ Add</button>
      </div>

      {showForm && (
        <div className="mb-6 border rounded-lg p-4 bg-white">
          <h2 className="font-semibold mb-3">{editing ? 'Edit' : 'New'} Application</h2>
          <ApplicationForm
            initial={editing}
            onSubmit={onSubmit}
            onCancel={() => { setShowForm(false); setEditing(null) }}
          />
        </div>
      )}

      <div className="rounded-lg border bg-white p-4">
        <h2 className="font-semibold mb-3">Your Applications</h2>
        <hr className="mb-3" />
        {/* Lazy import to keep it simple */}
        <ApplicationList
          data={filtered}
          onEdit={(a) => { setEditing(a); setShowForm(true) }}
          onDelete={onDelete}
        />
      </div>

      <footer className="text-xs text-gray-500 mt-8">
        Backend: NestJS + DynamoDB • Frontend: React + Vite + Tailwind
      </footer>
    </div>
  )
}
