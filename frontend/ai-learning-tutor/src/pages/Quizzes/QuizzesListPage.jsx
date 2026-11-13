import React, { useEffect, useState } from 'react';
import { BrainCircuit, ArrowRight, FileText, Clock3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import documentService from '../../services/documentService';
import quizService from '../../services/quizService';

const QuizzesListPage = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchQuizzes = async () => {
    try {
      const documents = await documentService.getDocuments();
      const combined = [];

      await Promise.all(
        documents.map(async (document) => {
          try {
            const documentQuizzes = await quizService.getQuizzesForDocument(document._id);
            combined.push(
              ...documentQuizzes.map((quiz) => ({
                ...quiz,
                documentTitle: document.title || 'Untitled document',
              }))
            );
          } catch (error) {
            console.error(`Failed to load quizzes for document ${document._id}`, error);
          }
        })
      );

      const sorted = combined.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setQuizzes(sorted);
    } catch (error) {
      toast.error(error.message || 'Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  if (loading) {
    return <div className="p-6 text-slate-600">Loading quizzes...</div>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Quizzes</h1>
          <p className="text-sm text-slate-500">Review and retake your quiz attempts</p>
        </div>
        <button onClick={() => navigate('/documents')} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white">
          <FileText className="h-4 w-4" />
          Browse documents
        </button>
      </div>

      {quizzes.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          No quizzes generated yet. Create one from a document to start practicing.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {quizzes.map((quiz) => (
            <div key={quiz._id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Quiz</p>
                  <h2 className="mt-2 text-lg font-semibold text-slate-900">{quiz.title || 'Untitled quiz'}</h2>
                </div>
                <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
                  <BrainCircuit className="h-4 w-4" />
                </div>
              </div>

              <div className="mb-4 space-y-2 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-500" />
                  {quiz.documentTitle || 'Document'}
                </div>
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-emerald-500" />
                  {quiz.totalQuestions || quiz.questions?.length || 0} questions
                </div>
              </div>

              <button onClick={() => navigate(`/quizzes/${quiz._id}`)} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white">
                Open quiz
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuizzesListPage;
