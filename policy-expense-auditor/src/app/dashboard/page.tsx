'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import VerdictBadge, { VerdictStatus } from '@/components/claims/verdict-badge';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Claim {
  id: string;
  merchant: string;
  category: string;
  expense_date: string;
  amount: number;
  currency: string;
  status: VerdictStatus;
}

export default function DashboardPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClaims() {
      try {
        const response = await fetch('/api/claims');
        const data = await response.json();
        setClaims(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch claims:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchClaims();
  }, []);

  const totalSubmitted = claims.reduce((sum, claim) => sum + (Number(claim.amount) || 0), 0);
  const totalReimbursable = claims
    .filter((c) => c.status === 'approved')
    .reduce((sum, claim) => sum + (Number(claim.amount) || 0), 0);
  const pendingReview = claims
    .filter((c) => c.status === 'flagged')
    .reduce((sum, claim) => sum + (Number(claim.amount) || 0), 0);
  const totalRejected = claims
    .filter((c) => c.status === 'rejected')
    .reduce((sum, claim) => sum + (Number(claim.amount) || 0), 0);

  const stats = [
    { label: 'Total Submitted', value: formatCurrency(totalSubmitted), color: 'text-white' },
    { label: 'Total Reimbursable', value: formatCurrency(totalReimbursable), color: 'text-emerald-600' },
    { label: 'Pending Review', value: formatCurrency(pendingReview), color: 'text-amber-600' },
    { label: 'Total Rejected', value: formatCurrency(totalRejected), color: 'text-rose-600' },
  ];

  return (
    <div className="container mx-auto py-10 px-4 bg-gray-950 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">Expense Dashboard</h1>
        <Link
          href="/submit"
          className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        >
          Submit Expense
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-sm">
            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            <p className={`mt-2 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Recent Expenses</h2>
        </div>
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-800 text-gray-400 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-3">Merchant</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr>
                  <td className="px-6 py-12 text-center text-gray-600" colSpan={5}>
                    Loading expenses...
                  </td>
                </tr>
              ) : claims.length === 0 ? (
                <tr>
                  <td className="px-6 py-12 text-center text-gray-600" colSpan={5}>
                    No expenses submitted yet.
                  </td>
                </tr>
              ) : (
                claims.map((claim) => (
                  <tr key={claim.id}>
                    <td className="px-6 py-4 font-medium text-white">{claim.merchant}</td>
                    <td className="px-6 py-4 text-gray-400">{claim.category}</td>
                    <td className="px-6 py-4 text-gray-400">{formatDate(claim.expense_date)}</td>
                    <td className="px-6 py-4 font-semibold text-white">{formatCurrency(claim.amount, claim.currency)}</td>
                    <td className="px-6 py-4">
                      <VerdictBadge status={claim.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
