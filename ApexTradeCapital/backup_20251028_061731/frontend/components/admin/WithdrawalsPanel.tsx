import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import type { Withdrawal } from '../../types';

const AddFeeModal: React.FC<{ withdrawalId: string; onClose: () => void; }> = ({ withdrawalId, onClose }) => {
    const { addFeeToWithdrawal } = useAppContext();
    const [label, setLabel] = useState('Frais de conversion');
    const [amount, setAmount] = useState('');

    const handleSubmit = () => {
        const numAmount = parseInt(amount, 10);
        if (label && !isNaN(numAmount) && numAmount > 0) {
            addFeeToWithdrawal(withdrawalId, label, numAmount);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-brand-charcoal rounded-lg p-6 w-full max-w-sm">
                <h3 className="text-lg font-semibold mb-4">Ajouter des Frais</h3>
                <div className="space-y-4">
                    <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Label (ex: Frais de conversion)" className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600" />
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Montant (HTG)" className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600" />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                    <button onClick={onClose} className="border px-4 py-2 rounded">Annuler</button>
                    <button onClick={handleSubmit} className="bg-brand-blue text-white px-4 py-2 rounded">Ajouter</button>
                </div>
            </div>
        </div>
    );
};


const WithdrawalsPanel = () => {
    const { t, withdrawals, investments, users, fees, updateWithdrawalStatus } = useAppContext();
    const [isFeeModalOpen, setIsFeeModalOpen] = useState<string | null>(null);

    const getWithdrawalDetails = (w: Withdrawal) => {
        const user = users.find(u => u.id === w.userId);
        const investment = investments.find(i => i.id === w.investmentId);
        const associatedFees = fees.filter(f => f.withdrawalId === w.id);
        return { user, investment, associatedFees };
    };
    
    const statusColor = (status: Withdrawal['status']) => {
        switch(status) {
            case 'requested': return 'bg-blue-500';
            case 'fees_required': return 'bg-yellow-500';
            case 'otp_pending': return 'bg-orange-500';
            case 'approved': return 'bg-teal-500';
            case 'paid': return 'bg-green-500';
            case 'rejected': return 'bg-red-500';
            default: return 'bg-gray-400';
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
            <h2 className="text-xl font-bold mb-4">Demandes de Retrait</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-100 dark:bg-gray-900">
                            <th className="p-3 font-semibold">Utilisateur</th>
                            <th className="p-3 font-semibold">Montant</th>
                            <th className="p-3 font-semibold">Détails</th>
                            <th className="p-3 font-semibold">Statut</th>
                            <th className="p-3 font-semibold">Date</th>
                            <th className="p-3 font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {withdrawals.map(w => {
                             const { user, investment, associatedFees } = getWithdrawalDetails(w);
                             return (
                                <tr key={w.id} className="border-b dark:border-gray-700">
                                    <td className="p-3">{user?.displayName || 'N/A'}</td>
                                    <td className="p-3 font-mono">{w.amount.toLocaleString()} HTG</td>
                                    <td className="p-3 text-xs">
                                        ID: {w.investmentId}
                                        {associatedFees.length > 0 && (
                                            <ul className="list-disc pl-4 mt-1">
                                                {associatedFees.map(f => <li key={f.id}>{f.label} ({t(f.status)})</li>)}
                                            </ul>
                                        )}
                                    </td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 text-xs font-bold text-white rounded-full ${statusColor(w.status)}`}>
                                            {w.status}
                                        </span>
                                    </td>
                                    <td className="p-3">{new Date(w.createdAt).toLocaleDateString()}</td>
                                    <td className="p-3 space-x-2">
                                        {w.status === 'requested' && (
                                            <button onClick={() => setIsFeeModalOpen(w.id)} className="text-xs bg-yellow-500 text-white px-2 py-1 rounded">Appliquer Frais</button>
                                        )}
                                        {w.status === 'approved' && (
                                            <button onClick={() => updateWithdrawalStatus(w.id, 'paid')} className="text-xs bg-green-500 text-white px-2 py-1 rounded">Marquer comme Payé</button>
                                        )}
                                    </td>
                                </tr>
                             );
                        })}
                    </tbody>
                </table>
            </div>

            {isFeeModalOpen && <AddFeeModal withdrawalId={isFeeModalOpen} onClose={() => setIsFeeModalOpen(null)} />}
        </div>
    );
};

export default WithdrawalsPanel;