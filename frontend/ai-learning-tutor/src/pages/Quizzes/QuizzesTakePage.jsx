import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CircleCheckBig } from 'lucide-react';
import toast from 'react-hot-toast';
import quizService from '../../services/quizService';

const QuizzesTakePage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const data = await quizService.getQuizById(quizId);
        setQuiz(data);
      } catch (error) {
        toast.error(error.message || 'Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };

    if (quizId) fetchQuiz();
  }, [quizId]);

  const handleSelect = (questionIndex, selectedAnswer) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: selectedAnswer }));
  };

  const handleSubmit = async () => {
    if (!quiz) return;

    const payload = quiz.questions.map((_, index) => ({
      questionIndex: index,
      selectedAnswer: answers[index] || '',
    }));

    if (payload.some((item) => !item.selectedAnswer)) {
      toast.error('Please answer all questions before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await quizService.submitQuiz(quizId, payload);
      const responseData = result?.data || result;
      const resultRoute = `/quizzes/${quizId}/results`;
      navigate(resultRoute, { state: { result: responseData, quiz } });
    } catch (error) {
      toast.error(error.message || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6 text-slate-600">Loading quiz...</div>;

  if (!quiz) {
    return (
      <div className="p-6 text-center">
        <p className="text-lg text-slate-700">Quiz not found.</p>
        <button onClick={() => navigate('/documents')} className="mt-4 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white">Back to documents</button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="text-sm text-slate-500">{quiz.questions.length} questions</div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Quiz</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">{quiz.title}</h1>
      </div>

      <div className="space-y-5">
        {quiz.questions.map((question, qIndex) => (
          <div key={`${question.question}-${qIndex}`} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="mb-4 text-lg font-semibold text-slate-900">{qIndex + 1}. {question.question}</p>
            <div className="space-y-3">
              {question.options.map((option, optIndex) => {
                const selected = answers[qIndex] === option;
                return (
                  <button
                    key={`${option}-${optIndex}`}
                    type="button"
                    onClick={() => handleSelect(qIndex, option)}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition ${selected ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'}`}
                  >
                    <span>{option}</span>
                    {selected && <CircleCheckBig className="h-4 w-4" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button onClick={handleSubmit} disabled={submitting} className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
          {submitting ? 'Submitting...' : 'Submit quiz'}
        </button>
      </div>
    </div>
  );
};

export default QuizzesTakePage;