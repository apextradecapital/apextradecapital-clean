import type { Language } from '../types';

const notifyTrans = {
  fr: {
    investment_created: "Votre investissement a été enregistré.",
    otp_sent: "Un code OTP vous a été envoyé. Demandez-le à votre administrateur pour valider le retrait.",
    otp_verified: "Votre code OTP est validé.",
    investment_started: "Votre investissement est en cours.",
    investment_completed: "Votre investissement est terminé. Vos gains sont disponibles.",
    fees_required: "Des frais de conversion sont nécessaires pour votre retrait. Veuillez consulter votre dashboard.",
    withdrawal_requested: "Votre demande de retrait a été reçue.",
    withdrawal_paid: "Votre retrait a été payé avec succès !",
  },
  en: {
    investment_created: "Your investment has been recorded.",
    otp_sent: "An OTP code has been sent. Ask your administrator for it to validate the withdrawal.",
    otp_verified: "Your OTP code has been verified.",
    investment_started: "Your investment is now running.",
    investment_completed: "Your investment has been completed. Your earnings are available.",
    fees_required: "Conversion fees are required for your withdrawal. Please check your dashboard.",
    withdrawal_requested: "Your withdrawal request has been received.",
    withdrawal_paid: "Your withdrawal has been paid successfully!",
  },
  ht: {
    investment_created: "Envestisman ou an anrejistre.",
    otp_sent: "Yon kòd OTP voye. Mande administratè w la li pou valide retrè a.",
    otp_verified: "Kòd OTP ou valide.",
    investment_started: "Envestisman ou kòmanse.",
    investment_completed: "Envestisman ou fini. Benefis ou disponib.",
    fees_required: "Fòk ou peye frè konvèsyon pou retrè a. Tanpri tcheke dashboard ou.",
    withdrawal_requested: "Demann retrè ou an resevwa.",
    withdrawal_paid: "Retrè ou an peye ak siksè!",
  },
};

/**
 * Gets the translated notification body for a given type and language.
 * @param type The key for the notification type (e.g., 'investment_completed').
 * @param lang The target language.
 * @returns The translated string.
 */
export const getNotificationBody = (type: string, lang: Language): string => {
    const langKey = lang.toLowerCase() as keyof typeof notifyTrans;
    const translationsForLang = notifyTrans[langKey] || notifyTrans.fr;
    
    return translationsForLang[type as keyof typeof translationsForLang] || `Untranslated notification: ${type}`;
};
