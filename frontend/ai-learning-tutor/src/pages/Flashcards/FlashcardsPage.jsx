import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Star, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import flashcardService from '../../services/flashcardService';
import documentService from '../../services/documentService';

const FlashcardsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const flashcardSet = useMemo(() => {
    if (!cards.length) return null;
    return cards[0];
  }, [cards]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const doc = await documentService.getDocumentById(id);
        setDocument(doc);

        const data = await flashcardService.getFlashcardsForDocument(id);
        const sets = Array.isArray(data) ? data : [data];
        const flattened = sets.flatMap((set) => Array.isArray(set?.cards) ? set.cards.map((card) => ({ ...card, setId: set._id })) : []);
        setCards(flattened);
      } catch (error) {
        toast.error(error.message || 'Failed to load flashcards');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  const handleReview = async (cardId) => {
    try {
      await flashcardService.reviewFlashcard(cardId);
      toast.success('Card marked reviewed');
    } catch (error) {
      toast.error(error.message || 'Failed to mark reviewed');
    }
  };

  const handleToggleStar = async (cardId) => {
    try {
      const result = await flashcardService.toggleStar(cardId);
      const updatedSet = result?.data;
      if (updatedSet) {
        setCards((prev) => prev.map((card) => (card._id === cardId ? { ...card, isStarred: updatedSet.cards.find((item) => item._id === cardId)?.isStarred ?? card.isStarred } : card)));
      }
      toast.success('Card updated');
    } catch (error) {
      toast.error(error.message || 'Failed to update card');
    }
  };

  if (loading) return <div className="p-6 text-slate-600">Loading study cards...</div>;

  if (!cards.length) {
    return (
      <div className="mx-auto max-w-3xl p-6 text-center">
        <p className="text-lg font-medium text-slate-700">No flashcards found for this document.</p>
        <button onClick={() => navigate(`/documents/${id}`)} className="mt-4 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white">
          Back to document
        </button>
      </div>
    );
  }

  const currentCard = cards[activeIndex];

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(`/documents/${id}`)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="text-sm text-slate-500">{activeIndex + 1} / {cards.length}</div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">Flashcard review</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">{document?.title || 'Study set'}</h1>
          </div>
          <BookOpen className="h-6 w-6 text-violet-500" />
        </div>

        <div className="rounded-2xl border border-violet-100 bg-violet-50 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">Question</p>
          <p className="mt-3 text-xl font-medium text-slate-900">{currentCard.question}</p>

          {showAnswer && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Answer</p>
              <p className="mt-3 text-base leading-7 text-slate-700">{currentCard.answer}</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={() => setShowAnswer((v) => !v)} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            {showAnswer ? 'Hide answer' : 'Show answer'}
          </button>
          <button onClick={() => handleReview(currentCard._id)} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white">
            <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Mark reviewed</span>
          </button>
          <button onClick={() => handleToggleStar(currentCard._id)} className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
            <span className="inline-flex items-center gap-2"><Star className={`h-4 w-4 ${currentCard.isStarred ? 'fill-current' : ''}`} /> {currentCard.isStarred ? 'Unstar' : 'Star'}</span>
          </button>
        </div>

        <div className="mt-8 flex items-center justify-between gap-3">
          <button onClick={() => setActiveIndex((prev) => Math.max(prev - 1, 0))} disabled={activeIndex === 0} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-40">
            Previous
          </button>
          <button onClick={() => setActiveIndex((prev) => Math.min(prev + 1, cards.length - 1))} disabled={activeIndex === cards.length - 1} className="rounded-xl bg-violet-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlashcardsPage;