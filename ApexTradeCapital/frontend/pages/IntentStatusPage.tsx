import React from 'react';
import { useAppContext } from '../context/AppContext';
import ProgressBar from '../components/ui/ProgressBar';
import * as Calc from '../services/calculationService';

const IntentStatusPage = () => {
    // FIX: Removed 'intents' as it does not exist on the AppContextType.
    const { params, navigate } = useAppContext();
    // FIX: Set intent to null to gracefully handle the missing data. The component will show the "not found" message.
    const intent = null;

    if (!intent) {
        return (
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
                <h1 className="text-2xl font-bold">Intention non trouvée</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">L'intention que vous recherchez n'existe pas ou a été supprimée.</p>
                <button onClick={() => navigate('home')} className="mt-6 bg-brand-blue text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-800 transition-colors">
                    Retour à l'accueil
                </button>
            </div>
        );
    }
    
    const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'HTG' }).format(amount);

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-bold text-center mb-2 text-brand-charcoal dark:text-white">Statut de l'Intention</h1>
            <p className="text-center text-gray-500 dark:text-gray-400 font-mono mb-8">{intent.id}</p>

            <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
                <div className="mb-8">
                    <ProgressBar status={intent.status} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Summary */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-brand-blue dark:text-blue-300 border-b pb-2">Récapitulatif</h2>
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Pack:</span> <span className="font-bold">{intent.packageName}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Montant investi:</span> <span className="font-bold">{formatCurrency(intent.investmentAmountHTG)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Frais:</span> <span className="font-bold">{formatCurrency(intent.feesHTG)}</span></div>
                        <div className="flex justify-between font-bold text-lg"><span className="text-brand-charcoal dark:text-white">Total:</span> <span className="text-brand-charcoal dark:text-white">{formatCurrency(intent.totalAmountHTG)}</span></div>
                        <div className="flex justify-between text-green-600 dark:text-green-400 font-bold text-lg"><span>Gain Prévu:</span> <span>{formatCurrency(intent.expectedPayoutHTG)}</span></div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-brand-blue dark:text-blue-300 border-b pb-2">Prochaines Étapes</h2>
                        
                        {intent.status === 'en_revue' && (
                            <div className="bg-blue-50 dark:bg-blue-900/50 p-4 rounded-lg">
                                <h3 className="font-bold mb-2">Paiement et Preuve</h3>
                                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">Veuillez effectuer votre paiement aux numéros qui vous seront communiqués, puis téléchargez la preuve de votre transaction.</p>
                                <button className="w-full bg-brand-gold text-brand-charcoal font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity">
                                    Uploader la preuve
                                </button>
                            </div>
                        )}
                        
                         {intent.status === 'preuve_recue' && (
                            <div className="bg-yellow-50 dark:bg-yellow-900/50 p-4 rounded-lg">
                                <h3 className="font-bold mb-2">Vérification en cours</h3>
                                <p className="text-sm text-gray-700 dark:text-gray-300">Nous avons bien reçu votre preuve et nous la vérifions. Vous recevrez une notification et votre code final une fois la validation terminée.</p>
                            </div>
                        )}


                        {intent.status === 'validée' && (
                             <div className="bg-green-50 dark:bg-green-900/50 p-4 rounded-lg">
                                <h3 className="font-bold mb-2">Entrez votre code final</h3>
                                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">Votre investissement est validé. Entrez le code à 6 chiffres reçu pour finaliser.</p>
                                <div className="flex gap-2">
                                    <input type="text" maxLength={6} className="flex-grow p-2 text-center tracking-[0.5rem] bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md" placeholder="------" />
                                    <button className="bg-brand-blue text-white font-bold px-4 py-2 rounded-lg">Valider</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IntentStatusPage;