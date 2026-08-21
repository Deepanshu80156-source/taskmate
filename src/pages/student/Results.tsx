import React, { useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { BarChart2, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const PAGE_SIZE = 6;

export default function StudentResults() {
  const { currentUser, getResultsForStudent } = useAuth();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const results = useMemo(() => {
    if (!currentUser) return [];
    return getResultsForStudent(currentUser.id).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [currentUser, getResultsForStudent]);

  const visibleResults = results.slice(0, visibleCount);
  const hasMore = visibleCount < results.length;

  // Chart uses ALL results (oldest → newest) so the trend line is always accurate
  const chartData = useMemo(() => [...results].reverse().map(r => ({
    name: r.examName,
    percentage: Math.round((r.marksObtained / r.totalMarks) * 100),
  })), [results]);

  const getScoreColor = (pct: number) => {
    if (pct >= 80) return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30';
    if (pct >= 60) return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30';
    return 'text-red-600 bg-red-100 dark:bg-red-900/30';
  };

  const getProgressColor = (pct: number) => {
    if (pct >= 80) return 'bg-emerald-500';
    if (pct >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const stats = useMemo(() => {
    if (results.length === 0) return { avg: 0, best: 0, total: 0 };
    const percentages = results.map(r => (r.marksObtained / r.totalMarks) * 100);
    return {
      avg: Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length),
      best: Math.round(Math.max(...percentages)),
      total: results.length,
    };
  }, [results]);

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
          <BarChart2 className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Exam Results</h1>
          <p className="text-muted-foreground mt-1">
            Track your academic performance
            {results.length > 0 && (
              <span className="ml-2 text-xs bg-secondary px-2 py-0.5 rounded-full">
                {results.length} total
              </span>
            )}
          </p>
        </div>
      </header>

      {results.length === 0 ? (
        <div className="glass-card rounded-2xl py-20 flex flex-col items-center gap-3 text-center">
          <span className="text-5xl">📊</span>
          <p className="text-lg font-semibold text-foreground">No Results Yet</p>
          <p className="text-sm text-muted-foreground">Your teacher hasn't published any exam results.</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center text-center">
              <p className="text-sm text-muted-foreground mb-1">Average Score</p>
              <p className="text-4xl font-extrabold text-foreground">{stats.avg}%</p>
            </div>
            <div className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center text-center">
              <p className="text-sm text-muted-foreground mb-1">Best Score</p>
              <p className="text-4xl font-extrabold text-emerald-500">{stats.best}%</p>
            </div>
            <div className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center text-center">
              <p className="text-sm text-muted-foreground mb-1">Total Exams</p>
              <p className="text-4xl font-extrabold text-foreground">{stats.total}</p>
            </div>
          </div>

          {/* Performance Chart — all results */}
          {chartData.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-6 pt-8 h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Line type="monotone" dataKey="percentage" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Result Cards — paginated */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {visibleResults.map((result, i) => {
              const percentage = Math.round((result.marksObtained / result.totalMarks) * 100);
              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i, 5) * 0.08 }}
                  key={result.id}
                  className="glass-card rounded-2xl p-6 relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-foreground">{result.examName}</h3>
                      <p className="text-sm text-muted-foreground">{result.subject} · {new Date(result.date).toLocaleDateString()}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(percentage)}`}>
                      {percentage}%
                    </div>
                  </div>

                  <div className="flex items-end gap-2 mb-4">
                    <span className="text-4xl font-extrabold text-foreground leading-none">{result.marksObtained}</span>
                    <span className="text-muted-foreground mb-1">/ {result.totalMarks} marks</span>
                  </div>

                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-4">
                    <div className={`h-full rounded-full ${getProgressColor(percentage)}`} style={{ width: `${percentage}%` }} />
                  </div>

                  {result.remarks && (
                    <div className="bg-muted p-4 rounded-xl border border-border mt-4">
                      <p className="text-sm font-medium text-foreground mb-1">Teacher's Remarks:</p>
                      <p className="text-sm text-muted-foreground italic">"{result.remarks}"</p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="flex flex-col items-center gap-2 pt-2">
              <p className="text-sm text-muted-foreground">
                Showing {visibleCount} of {results.length} results
              </p>
              <button
                onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-border bg-background hover:bg-secondary/50 transition-colors text-sm font-medium text-foreground"
              >
                <ChevronDown className="w-4 h-4" />
                Load more results
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
