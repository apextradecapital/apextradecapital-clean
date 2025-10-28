import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
// Fix: Import the 'WithdrawalStatus' type to resolve the 'Cannot find name' error.
import type { Withdrawal, Fee, WithdrawalStatus } from '../types';
import { WHATSAPP_NUMBER } from '../constants';

interface WithdrawalStatusTrackerProps {
    withdrawal: Withdrawal;
    fees: Fee[];
}

const statusMap: Record<WithdrawalStatus, { labelKey: string; step: number; color: string }> = {
    requested: { labelKey: 'requested', step: 1, color: 'text-blue-500' },
    fees_required: { labelKey: 'fees_required', step: 2, color: 'text-yellow-500' },
    otp_pending: { labelKey: 'otp_pending', step: 3, color: 'text-orange-500' },
    approved: { labelKey: 'approved', step: 4, color: 'text-teal-500' },
    paid: { labelKey: 'paid', step: 5, color: 'text-green-500' },
    rejected: { labelKey: 'rejected', step: 0, color: 'text-red-500' },
};

const FeeItem: React.FC<{ fee: Fee }> = ({ fee }) => {
    const { t, uploadProof, verifyFeeOtp } = useAppContext();
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
           await uploadProof(fee.id, 'fee', { name: file.name, type: file.type, size: file.size });
        }
    };

    const handleVerifyOtp = () => {
        setError('');
        setMessage('');
        if (verifyFeeOtp(fee.id, otp)) {
            setMessage(t('otp_validé'));
        } else {
            setError(t('otp_invalide'));
        }
    };

    return (
        <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
            <div className="flex justify-between items-center">
                <p className="font-semibold">{fee.label}: {fee.amount.toLocaleString()} HTG</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Statut: <span className="font-semibold">{t(fee.status)}</span></p>
            </div>

            {fee.status === 'pending' && (
                <label className="block text-center mt-2 bg-brand-blue text-white text-xs font-bold py-2 px-3 rounded cursor-pointer hover:bg-blue-700 transition-colors">
                    {t('envoyer_capture')}
                    <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileChange} />
                </label>
            )}

            {fee.status === 'proof_uploaded' && <p className="text-xs text-yellow-500 font-semibold mt-1">Preuve en revue...</p>}
            
            {fee.status === 'otp_sent' && (
                <div className="mt-2 space-y-2">
                    <div className="flex gap-2">
                        <input type="text" placeholder={t("entrer_otp")}
                                value={otp}
                                maxLength={6}
                                onChange={e => setOtp(e.target.value)}
                                className="w-full border p-2 rounded mr-2 text-center tracking-widest dark:bg-gray-800 dark:border-gray-600"/>
                        <button onClick={handleVerifyOtp} className="bg-blue-600 text-white px-4 py-2 rounded">
                            {t("valider")}
                        </button>
                    </div>
                    {error && <p className="text-xs text-red-500">{error}</p>}
                    {message && <p className="text-xs text-green-500">{message}</p>}
                </div>
            )}

            {fee.status === 'verified' && <p className="text-xs text-green-500 font-semibold mt-1">Vérifié ✓</p>}
            {fee.status === 'paid' && <p className="text-xs text-green-500 font-semibold mt-1">Payé ✓</p>}
        </div>
    );
};


const WithdrawalStatusTracker: React.FC<WithdrawalStatusTrackerProps> = ({ withdrawal, fees }) => {
    const { t } = useAppContext();
    const currentStatusInfo = statusMap[withdrawal.status];
    const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}?text=${encodeURIComponent(t("aide_retrait") + " " + withdrawal.id)}`;

    return (
        <div className="border-t pt-4 mt-4">
             <div className="flex justify-between items-center mb-4">
                 <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Suivi du retrait</h4>
                 <span className={`font-bold px-3 py-1 rounded-full text-sm ${currentStatusInfo.color}`}>
                     {t(currentStatusInfo.labelKey)}
                 </span>
            </div>

            <div className="space-y-4">
                {withdrawal.status === 'requested' && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/50 rounded-lg text-center">
                        <p className="text-sm text-blue-800 dark:text-blue-200">Votre demande de retrait a été reçue et est en cours de traitement par notre équipe.</p>
                    </div>
                )}

                 {withdrawal.status === 'fees_required' && (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/50 rounded-lg">
                        <h5 className="font-bold text-yellow-800 dark:text-yellow-200 mb-2">Action Requise: Paiement des Frais</h5>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">Veuillez payer les frais ci-dessous et uploader la preuve de paiement pour chaque transaction.</p>
                        <div className="space-y-2">
                             {fees.map(fee => <FeeItem key={fee.id} fee={fee} />)}
                        </div>
                    </div>
                )}

                 {(withdrawal.status === 'otp_pending' || fees.some(f => f.status === 'otp_sent')) && (
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/50 rounded-lg">
                        <h5 className="font-bold text-orange-800 dark:text-orange-200 mb-2">Étape Finale: Vérification OTP</h5>
                        <p className="text-sm text-orange-700 dark:text-orange-300 mb-4">Un administrateur va vous contacter pour vous fournir un code de sécurité (OTP). Veuillez l'entrer ci-dessous pour finaliser.</p>
                        <div className="space-y-2">
                            {fees.filter(f => f.status === 'otp_sent').map(fee => <FeeItem key={fee.id} fee={fee} />)}
                        </div>
                    </div>
                )}

                {withdrawal.status === 'approved' && (
                     <div className="p-4 bg-teal-50 dark:bg-teal-900/50 rounded-lg text-center">
                        <p className="text-sm text-teal-800 dark:text-teal-200">Votre demande de retrait a été approuvée et sera payée sous peu.</p>
                    </div>
                )}

                {withdrawal.status === 'paid' && (
                     <div className="p-4 bg-green-50 dark:bg-green-900/50 rounded-lg text-center">
                        <p className="text-sm text-green-800 dark:text-green-200">Votre retrait a été payé avec succès !</p>
                    </div>
                )}
            </div>
            
            <a href={whatsappLink}
             className="block mt-4 text-center text-sm text-green-600 font-semibold underline hover:text-green-700">{t("contacter_whatsapp")}</a>
        </div>
    );
};

export default WithdrawalStatusTracker;
