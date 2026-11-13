import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Sparkles, BrainCircuit, MessageSquareText, BookOpen, Download, Loader2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import documentService from '../../services/documentService';
import aiService from '../../services/aiService';
import flashcardService from '../../services/flashcardService';
import quizService from '../../services/quizService';

const DocumentsDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [document, setDocument] = useState(null);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [flashcards, setFlashcards] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [concept, setConcept] = useState('');
  const [conceptAnswer, setConceptAnswer] = useState('');
  const [explainLoading, setExplainLoading] = useState(false);

  const tabs = useMemo(() => [
    { key: 'overview', label: 'Overview' },
    { key: 'flashcards', label: 'Flashcards' },
    { key: 'quizzes', label: 'Quizzes' },
    { key: 'chat', label: 'AI Chat' },
  ], []);

  const fetchDocument = async () => {
    try {
      const data = await documentService.getDocumentById(id);
      setDocument(data);
    } catch (error) {
      toast.error(error.message || 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const fetchFlashcards = async () => {
    try {
      const data = await flashcardService.getFlashcardsForDocument(id);
      setFlashcards(data || []);
    } catch (error) {
      toast.error(error.message || 'Failed to load flashcards');
    }
  };

  const fetchQuizzes = async () => {
    try {
      const data = await quizService.getQuizzesForDocument(id);
      setQuizzes(data || []);
    } catch (error) {
      toast.error(error.message || 'Failed to load quizzes');
    }
  };

  const fetchChatHistory = async () => {
    try {
      const data = await aiService.getChatHistory(id);
      setChatMessages(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!id) return;
    fetchDocument();
    fetchFlashcards();
    fetchQuizzes();
    fetchChatHistory();
  }, [id]);

  const handleGenerateSummary = async () => {
    setSummaryLoading(true);
    try {
      const result = await aiService.generateSummary(id);
      setSummary(result.summary || '');
      toast.success('Summary generated');
    } catch (error) {
      toast.error(error.message || 'Failed to generate summary');
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    try {
      const result = await aiService.generateFlashcards(id, { count: 10 });
      toast.success('Flashcards generated');
      setFlashcards(result?.data?.cards || []);
      await fetchFlashcards();
    } catch (error) {
      toast.error(error.message || 'Failed to generate flashcards');
    }
  };

  const handleGenerateQuiz = async () => {
    try {
      const result = await aiService.generateQuiz(id, { numQuestions: 5, title: `${document?.title || 'Document'} Quiz` });
      toast.success('Quiz generated');
      await fetchQuizzes();
      if (result?.data?._id) navigate(`/quizzes/${result.data._id}`);
    } catch (error) {
      toast.error(error.message || 'Failed to generate quiz');
    }
  };

  const handleChatSubmit = async (event) => {
    event.preventDefault();
    if (!chatInput.trim()) return;

    setChatLoading(true);
    try {
      const result = await aiService.chat(id, chatInput.trim());
      setChatMessages((prev) => [
        ...prev,
        { role: 'user', content: chatInput.trim() },
        { role: 'assistant', content: result?.data?.answer || '' },
      ]);
      setChatInput('');
    } catch (error) {
      toast.error(error.message || 'Failed to ask question');
    } finally {
      setChatLoading(false);
    }
  };

  const handleExplainConcept = async () => {
    if (!concept.trim()) return;

    setExplainLoading(true);
    try {
      const result = await aiService.explainConcept(id, concept.trim());
      setConceptAnswer(result?.data?.explanation || '');
    } catch (error) {
      toast.error(error.message || 'Failed to explain concept');
    } finally {
      setExplainLoading(false);
    }
  };

  const handleDeleteDocument = async () => {
    try {
      await documentService.deleteDocument(id);
      toast.success('Document deleted');
      navigate('/documents');
    } catch (error) {
      toast.error(error.message || 'Failed to delete document');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <FileText className="h-10 w-10 text-slate-400" />
        <p className="text-slate-600">Document not found.</p>
        <button onClick={() => navigate('/documents')} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white">Back to documents</button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <button onClick={() => navigate('/documents')} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button onClick={handleDeleteDocument} className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Document</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">{document.title}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={document.filePath} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              <Download className="h-4 w-4" />
              Open file
            </a>
            <button onClick={handleGenerateSummary} disabled={summaryLoading} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              <Sparkles className="h-4 w-4" />
              {summaryLoading ? 'Generating...' : 'Generate summary'}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-200/40">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${activeTab === tab.key ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">Summary</h2>
            {summary ? (
              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{summary}</p>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                No summary generated yet. Click “Generate summary” to create one.
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">Quick actions</h2>
            <div className="space-y-3">
              <button onClick={handleGenerateFlashcards} className="flex w-full items-center justify-between rounded-2xl bg-violet-50 p-4 text-left text-sm font-medium text-violet-700">
                <span className="inline-flex items-center gap-2"><BookOpen className="h-4 w-4" /> Generate flashcards</span>
                <span>{flashcards.length}</span>
              </button>
              <button onClick={handleGenerateQuiz} className="flex w-full items-center justify-between rounded-2xl bg-emerald-50 p-4 text-left text-sm font-medium text-emerald-700">
                <span className="inline-flex items-center gap-2"><BrainCircuit className="h-4 w-4" /> Generate quiz</span>
                <span>{quizzes.length}</span>
              </button>
              <div className="rounded-2xl bg-slate-50 p-4">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Explain a concept</label>
                <div className="flex gap-2">
                  <input value={concept} onChange={(e) => setConcept(e.target.value)} placeholder="e.g. recursion" className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm" />
                  <button onClick={handleExplainConcept} disabled={explainLoading} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">
                    {explainLoading ? '...' : 'Explain'}
                  </button>
                </div>
                {conceptAnswer && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{conceptAnswer}</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'flashcards' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Flashcards</h2>
            <button onClick={handleGenerateFlashcards} className="rounded-xl bg-violet-500 px-3 py-2 text-sm font-semibold text-white">Generate</button>
          </div>
          {flashcards.length ? (
            <div className="space-y-3">
              {flashcards.map((card, index) => (
                <div key={card._id || index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">Q{index + 1}: {card.question}</p>
                  <p className="mt-2 text-sm text-slate-700">{card.answer}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">No flashcards generated yet.</div>
          )}
        </div>
      )}

      {activeTab === 'quizzes' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Quizzes</h2>
            <button onClick={handleGenerateQuiz} className="rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-white">Generate</button>
          </div>
          {quizzes.length ? (
            <div className="space-y-3">
              {quizzes.map((quiz) => (
                <button key={quiz._id} onClick={() => navigate(`/quizzes/${quiz._id}`)} className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
                  <span className="font-medium text-slate-900">{quiz.title || 'Quiz'}</span>
                  <span className="text-sm text-slate-500">{quiz.totalQuestions || quiz.questions?.length || 0} questions</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">No quizzes generated yet.</div>
          )}
        </div>
      )}

      {activeTab === 'chat' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">AI Chat</h2>
            <MessageSquareText className="h-5 w-5 text-emerald-500" />
          </div>

          <div className="mb-4 max-h-[360px] space-y-3 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
            {chatMessages.length ? (
              chatMessages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${message.role === 'user' ? 'ml-auto bg-emerald-500 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}>
                  {message.content}
                </div>
              ))
            ) : (
              <div className="text-center text-sm text-slate-500">Ask a question about this document.</div>
            )}
          </div>

          <form onSubmit={handleChatSubmit} className="flex gap-2">
            <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask about this document..." className="h-12 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm" />
            <button type="submit" disabled={chatLoading} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {chatLoading ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default DocumentsDetailsPage;