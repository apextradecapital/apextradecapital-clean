import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import type { Upload } from '../../types';

const UploadsPanel = () => {
    const { t, uploads, updateUploadStatus } = useAppContext();
    const [note, setNote] = useState('');
    const [reviewingId, setReviewingId] = useState<string | null>(null);

    const pendingUploads = uploads.filter(u => u.status === 'pending');

    const handleReview = (id: string, status: 'approved' | 'rejected') => {
        updateUploadStatus(id, status, note);
        setReviewingId(null);
        setNote('');
    };
    
    const getUploadContext = (upload: Upload): string => {
        try {
            if (upload.adminNote) {
                const noteData = JSON.parse(upload.adminNote);
                if (noteData.linkedTo === 'fee') {
                    return `Frais (ID: ${noteData.id})`;
                }
            }
        } catch (e) { /* ignore parse error */ }
        return `Investissement (ID: ${upload.investmentId || 'N/A'})`;
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
            <h2 className="text-xl font-bold mb-4">{t('uploads')}</h2>
            <div className="space-y-4">
                {pendingUploads.length === 0 && <p>No pending uploads.</p>}
                {pendingUploads.map(upload => (
                    <div key={upload.id} className="p-4 border rounded-lg dark:border-gray-700">
                        <p><strong>Contexte:</strong> {getUploadContext(upload)}</p>
                        <p><strong>Fichier:</strong> <a href={upload.path} target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline">{upload.path.split('/').pop()}</a></p>
                        <p><strong>Taille:</strong> {(upload.size / 1024).toFixed(2)} KB</p>
                        <p><strong>Date:</strong> {new Date(upload.uploadedAt).toLocaleString()}</p>
                        
                        {reviewingId === upload.id ? (
                             <div className="mt-4 space-y-2">
                                <textarea 
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder={`${t('note')} (optionnel)`}
                                    className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-md"
                                />
                                <div className="flex gap-2">
                                    <button onClick={() => handleReview(upload.id, 'approved')} className="bg-green-600 text-white font-bold py-1 px-3 rounded-lg">{t('approve')}</button>
                                    <button onClick={() => handleReview(upload.id, 'rejected')} className="bg-red-600 text-white font-bold py-1 px-3 rounded-lg">{t('reject')}</button>
                                    <button onClick={() => setReviewingId(null)} className="bg-gray-500 text-white font-bold py-1 px-3 rounded-lg">Annuler</button>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-4">
                                <button onClick={() => setReviewingId(upload.id)} className="bg-brand-blue text-white font-bold py-1 px-3 rounded-lg">Review</button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UploadsPanel;