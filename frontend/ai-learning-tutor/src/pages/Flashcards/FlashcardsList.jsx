import React, { useEffect, useState } from 'react';
import { BookOpen, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import flashcardService from '../../services/flashcardService';

const FlashcardsList = () => {
  const navigate = useNavigate();
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSets = async () => {
    try {
      const data = await flashcardService.getAllFlashcardSets();
      setFlashcardSets(data || []);
    } catch (error) {
      toast.error(error.message || 'Failed to load flashcards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSets();
  }, []);

  const handleDelete = async (setId) => {
    try {
      await flashcardService.deleteFlashcardSet(setId);
      toast.success('Flashcard set deleted');
      setFlashcardSets((prev) => prev.filter((item) => item._id !== setId));
    } catch (error) {
      toast.error(error.message || 'Failed to delete set');
    }
  };

  if (loading) {
    return <div className="p-6 text-slate-600">Loading flashcards...</div>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Flashcards</h1>
          <p className="text-sm text-slate-500">Review your generated study cards</p>
        </div>
        <button onClick={() => navigate('/documents')} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white">
          <Plus className="h-4 w-4" />
          Add from document
        </button>
      </div>

      {flashcardSets.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          No flashcard sets yet. Generate one from a document to begin.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {flashcardSets.map((set) => {
            const document = set.documentId || {};
            const cards = Array.isArray(set.cards) ? set.cards : [];

            return (
              <div key={set._id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">Study set</p>
                    <h2 className="mt-2 text-lg font-semibold text-slate-900">{document.title || 'Untitled document'}</h2>
                  </div>
                  <button onClick={() => handleDelete(set._id)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
                  <BookOpen className="h-4 w-4 text-violet-500" />
                  {cards.length} cards
                </div>

                <button onClick={() => navigate(`/documents/${document._id}/flashcards`)} className="w-full rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white">
                  Open flashcards
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FlashcardsList;