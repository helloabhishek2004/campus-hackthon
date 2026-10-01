"use client";

import { useState } from 'react';

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const [formData, setFormData] = useState({
    title: 'FIRE ALERT: Library',
    body: 'Evacuate now by the nearest exit. Do not use lifts. Assemble at Main Gate. Need help? Call 112.',
    scope: 'campus_wide',
    severity: 'critical'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-6">Emergency Alert Composer</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Alert Title</label>
          <input 
            type="text"
            className="w-full border border-gray-300 p-2 rounded"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Message Body</label>
          <textarea 
            className="w-full border border-gray-300 p-2 rounded h-24"
            value={formData.body}
            onChange={(e) => setFormData({...formData, body: e.target.value})}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Scope</label>
            <select 
              className="w-full border border-gray-300 p-2 rounded"
              value={formData.scope}
              onChange={(e) => setFormData({...formData, scope: e.target.value})}
            >
              <option value="responders_only">Responders Only</option>
              <option value="audience">Targeted Audience</option>
              <option value="campus_wide">Campus Wide (All Users)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
            <select 
              className="w-full border border-gray-300 p-2 rounded"
              value={formData.severity}
              onChange={(e) => setFormData({...formData, severity: e.target.value})}
            >
              <option value="advisory">Advisory</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded transition-colors"
        >
          {loading ? 'Processing...' : 'BROADCAST ALERT'}
        </button>
      </form>

      {result && (
        <div className={`mt-6 p-4 rounded ${result.error ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
          <h3 className="font-bold">{result.error ? 'Alert Failed' : 'Success!'}</h3>
          <p>{result.error || result.message}</p>
          {result.success && (
            <div className="mt-2 text-sm bg-white p-2 rounded bg-opacity-50">
              <p><strong>Channels:</strong> SMS, Web Push, Email</p>
              <p><strong>Recipients:</strong> 12,403 campus members</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
