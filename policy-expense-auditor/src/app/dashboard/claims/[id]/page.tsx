'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, CheckCircle2, XCircle, AlertTriangle, ExternalLink, ShieldAlert } from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import VerdictBadge from '@/components/claims/verdict-badge';

export default function ClaimDetailsPage({ params }: { params: { id: string } }) {
  const [claim, setClaim] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchClaim() {
      try {
        const res = await fetch(`/api/claims/${params.id}`);
        const data = await res.json();
        setClaim(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchClaim();
  }, [params.id]);

  const handleOverride = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      claim_id: params.id,
      new_status: formData.get('new_status'),
      justification: formData.get('justification'),
      manager_id: '00000000-0000-0000-0000-000000000000',
    };

    setSubmitting(true);
    try {
      const res = await fetch('/api/overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        // Refresh claim data
        const updated = await fetch(`/api/claims/${params.id}`).then(r => r.json());
        setClaim(updated);
        alert('Override applied successfully');
      }
    } catch (err) {
      alert('Failed to apply override');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
    </div>
  );

  if (!claim) return <div className="p-8 text-center">Claim not found.</div>;

  return (
    <div className="h-full flex flex-col">
      <div className="border-b bg-white p-4 flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Queue
        </button>
        <div className="flex items-center gap-4">
          <span className="text-sm font-mono text-slate-400">ID: {claim.id}</span>
          <VerdictBadge status={claim.status.toLowerCase() as any} />
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        {/* Left Panel: Receipt */}
        <div className="lg:w-1/3 border-r bg-slate-100 p-6 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden p-2">
            <img 
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/receipts/${claim.receipt_storage_path}`} 
              alt="Receipt" 
              className="w-full h-auto rounded-lg"
              onError={(e) => (e.currentTarget.src = 'https://placehold.co/400x600?text=Receipt+Not+Found')}
            />
          </div>
        </div>

        {/* Middle Panel: Claim Data */}
        <div className="lg:w-1/3 border-r bg-white p-8 overflow-y-auto">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            Claim Details
          </h2>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase">Merchant</p>
                <p className="font-bold text-slate-900">{claim.merchant}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase">Amount</p>
                <p className="font-bold text-slate-900 text-lg">{formatCurrency(claim.amount)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase">Category</p>
                <p className="font-medium text-slate-700">{claim.category}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase">Date</p>
                <p className="font-medium text-slate-700">{formatDate(claim.expense_date)}</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase">Business Purpose</p>
              <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-lg leading-relaxed border border-slate-100">
                {claim.business_purpose || "No purpose provided."}
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel: AI Verdict & Override */}
        <div className="lg:w-1/3 bg-slate-50 p-8 overflow-y-auto space-y-8">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">AI Audit Verdict</h2>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase">Confidence</p>
                <p className={cn(
                  "text-lg font-bold",
                  (claim.audit_logs?.[0]?.confidence_score || 0) < 50 ? "text-rose-600" : "text-emerald-600"
                )}>{claim.audit_logs?.[0]?.confidence_score || 0}%</p>
              </div>
            </div>
            
            <div className={cn(
              "p-4 rounded-xl border flex gap-3",
              claim.status === 'rejected' ? "bg-rose-100/50 border-rose-200" : "bg-emerald-100/50 border-emerald-200"
            )}>
              {claim.status === 'rejected' ? <ShieldAlert className="w-5 h-5 text-rose-600" /> : <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              <p className="text-sm font-medium text-slate-800">{claim.audit_logs?.[0]?.reason || "Audit complete."}</p>
            </div>

            {claim.audit_logs?.[0]?.policy_excerpt && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase">Referenced Policy</p>
                <blockquote className="text-sm italic text-slate-600 border-l-4 border-slate-200 pl-4 py-1">
                  "{claim.audit_logs?.[0]?.policy_excerpt}"
                </blockquote>
              </div>
            )}
          </section>

          <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900">Manual Override</h3>
            <form onSubmit={handleOverride} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">New Status</label>
                <select 
                  name="new_status"
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                  defaultValue={claim.status}
                >
                  <option value="approved">Approve</option>
                  <option value="flagged">Flag for Review</option>
                  <option value="rejected">Reject</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Justification</label>
                <textarea 
                  name="justification"
                  rows={3}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm resize-none"
                  placeholder="Explain why you are overriding the AI verdict..."
                  required
                />
              </div>
              <button 
                type="submit"
                disabled={submitting}
                className="w-full py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 disabled:opacity-50 transition-all"
              >
                {submitting ? "Applying..." : "Confirm Override"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
