import React, { useState, useEffect } from 'react';
import { Plus, FileText, X } from 'lucide-react';
import toast from 'react-hot-toast';

import documentService from '../../services/documentService';
import Spinner from '../../components/common/Spinner';
import DocumentCard from '../../components/documents/DocumentCard';

const DocumentsList = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDocuments = async () => {
    try {
      const data = await documentService.getDocuments();
      setDocuments(data);
    } catch (error) {
      toast.error(error.message || 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadFile(file);
    setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle) {
      toast.error('Please provide both a title and a file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('title', uploadTitle);

    try {
      await documentService.uploadDocument(formData);
      toast.success('Document uploaded successfully');
      setIsUploadModalOpen(false);
      setUploadFile(null);
      setUploadTitle('');
      fetchDocuments();
    } catch (error) {
      toast.error(error.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteRequest = (doc) => {
    setSelectedDoc(doc);
  };

  const handleConfirmDelete = async () => {
    if (!selectedDoc) return;

    setDeleting(true);
    try {
      await documentService.deleteDocument(selectedDoc._id);
      toast.success(`'${selectedDoc.title}' deleted.`);
      setDocuments((prev) => prev.filter((doc) => doc._id !== selectedDoc._id));
      setSelectedDoc(null);
    } catch (error) {
      toast.error(error.message || 'Failed to delete document');
    } finally {
      setDeleting(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex min-h-[400px] items-center justify-center">
          <Spinner />
        </div>
      );
    }

    if (documents.length === 0) {
      return (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="max-w-md text-center">
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 shadow-lg shadow-slate-200/50">
              <FileText className="h-10 w-10 text-slate-400" strokeWidth={1.5} />
            </div>
            <h3 className="mb-2 text-xl font-medium tracking-tight text-slate-900">No documents yet</h3>
            <p className="mb-6 text-sm text-slate-500">Upload your first PDF to begin learning.</p>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:from-emerald-600 hover:to-teal-600 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              Upload Document
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {documents.map((doc) => (
          <DocumentCard key={doc._id} document={doc} onDelete={handleDeleteRequest} />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[16px_16px] opacity-30" />

      <div className="relative mx-auto max-w-7xl">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-2xl font-medium tracking-tight text-slate-900">My Documents</h1>
            <p className="text-sm text-slate-500">Manage and organize your learning materials</p>
          </div>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:from-emerald-600 hover:to-teal-600"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Upload Document
          </button>
        </div>

        {renderContent()}
      </div>

      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Upload Document</h2>
              <button onClick={() => setIsUploadModalOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Document title</label>
                <input
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500"
                  placeholder="e.g. Biology Chapter 3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">PDF file</label>
                <input type="file" accept="application/pdf" onChange={handleFileChange} className="block w-full text-sm text-slate-600" />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsUploadModalOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Cancel</button>
                <button type="submit" disabled={uploading} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-slate-900">Delete document?</h2>
            <p className="mt-2 text-sm text-slate-600">This will permanently remove {selectedDoc.title} and its generated study data.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setSelectedDoc(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Cancel</button>
              <button onClick={handleConfirmDelete} disabled={deleting} className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsList;