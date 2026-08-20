import React, { useState } from 'react';
import { Check, Clock3, ShieldCheck, UserRound, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function TeacherApprovals() {
  const { currentUser, approvalRequests, approveTeacher, denyTeacher } = useAuth();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  if (currentUser?.username !== 'deepanshu') {
    return <div className="p-8 text-center text-muted-foreground">Administrator access only.</div>;
  }

  const pending = approvalRequests.filter((request) => request.status === 'pending');

  const review = async (teacherId: string, action: 'approve' | 'deny') => {
    setBusyId(teacherId);
    setError('');
    try {
      if (action === 'approve') await approveTeacher(teacherId);
      else await denyTeacher(teacherId);
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'The request could not be updated.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <header className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Teacher approvals</h1>
          <p className="text-muted-foreground mt-1">Only your administrator account can approve new teachers.</p>
        </div>
      </header>

      {error && <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

      <section className="space-y-3">
        {pending.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <Check className="w-10 h-10 text-primary mx-auto mb-3" />
            <h2 className="font-semibold text-lg">No pending requests</h2>
            <p className="text-sm text-muted-foreground mt-1">New teacher registrations will appear here.</p>
          </div>
        ) : pending.map((request) => (
          <div key={request.id} className="glass-card rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <UserRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">{request.teacherName}</h2>
                <p className="text-sm text-muted-foreground">@{request.username}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock3 className="w-3 h-3" /> {new Date(request.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                disabled={busyId === request.teacherId}
                onClick={() => void review(request.teacherId, 'deny')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 disabled:opacity-50"
              >
                <X className="w-4 h-4" /> Deny
              </button>
              <button
                disabled={busyId === request.teacherId}
                onClick={() => void review(request.teacherId, 'approve')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <Check className="w-4 h-4" /> Allow
              </button>
            </div>
          </div>
        ))}
      </section>

      {approvalRequests.some((request) => request.status !== 'pending') && (
        <p className="text-xs text-muted-foreground">
          Approved and denied requests remain in the database for an audit trail.
        </p>
      )}
    </div>
  );
}