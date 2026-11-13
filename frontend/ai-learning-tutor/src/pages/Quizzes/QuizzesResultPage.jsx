import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Trophy, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import quizService from '../../services/quizService';

const QuizzesResultPage = () => {
  const { quizId, id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [result, setResult] = useState(location.state?.result || null);
  const [quiz, setQuiz] = useState(location.state?.quiz || null);
  const [loading, setLoading] = useState(!location.state?.result);

  const targetId = quizId || id;

  useEffect(() => {
    const fetchResults = async () => {
      if (!targetId) return;

      try {
        const data = await quizService.getQuizResults(targetId);
        setResult(data?.data || data || null);
        setQuiz(data?.data?.quiz || null);
      } catch (error) {
        toast.error(error.message || 'Failed to load quiz results');
      } finally {
        setLoading(false);
      }
    };

    if (!location.state?.result && targetId) fetchResults();
  }, [targetId, location.state]);

  if (loading) return <div className="p-6 text-slate-600">Loading results...</div>;

  const summary = result?.quiz || result;
  const detailedResults = result?.results || [];
  const score = summary?.score ?? result?.score ?? 0;
  const total = summary?.totalQuestions ?? result?.totalQuestions ?? (detailedResults.length || 0);
  const percentage = total ? Math.round((score / total) * 100) : 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/documents')} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
          <ArrowLeft className="h-4 w-4" />
          Documents
        </button>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700"><Trophy className="h-6 w-6" /></div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Quiz results</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">{summary?.title || 'Quiz Summary'}</h1>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Score</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{score}/{total}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Percentage</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{percentage}%</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Status</p>
            <p className="mt-2 text-lg font-semibold text-emerald-700">{percentage >= 70 ? 'Great job' : 'Keep practicing'}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {detailedResults.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">No result details available for this quiz yet.</div>
        ) : (
          detailedResults.map((entry, index) => (
            <div key={`${entry.questionIndex}-${index}`} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <p className="text-lg font-semibold text-slate-900">{index + 1}. {entry.question}</p>
                {entry.isCorrect ? <CheckCircle2 className="mt-1 h-5 w-5 text-emerald-500" /> : <XCircle className="mt-1 h-5 w-5 text-red-500" />}
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-700">
                <p><span className="font-medium">Your answer:</span> {entry.selectedAnswer || 'No answer'}</p>
                <p><span className="font-medium">Correct answer:</span> {entry.correctAnswer}</p>
                {entry.explanation && <p><span className="font-medium">Explanation:</span> {entry.explanation}</p>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default QuizzesResultPage;