import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import type { Testimonial } from '../../types';

const TestimonialsPanel = () => {
    const { testimonials, addTestimonial, updateTestimonial, deleteTestimonial, t } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentTestimonial, setCurrentTestimonial] = useState<Partial<Testimonial>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [testimonialToDelete, setTestimonialToDelete] = useState<Testimonial | null>(null);

    const openModal = (testimonial: Testimonial | null = null) => {
        if (testimonial) {
            setCurrentTestimonial(testimonial);
            setIsEditing(true);
        } else {
            setCurrentTestimonial({ name: '', city: '', photo: '', comment: '', stars: 5 });
            setIsEditing(false);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentTestimonial({});
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCurrentTestimonial(prev => ({ ...prev, [name]: name === 'stars' ? parseInt(value, 10) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEditing) {
            updateTestimonial(currentTestimonial as Testimonial);
        } else {
            addTestimonial(currentTestimonial as Omit<Testimonial, 'id' | 'createdAt'>);
        }
        closeModal();
    };

    const confirmDelete = () => {
        if (testimonialToDelete) {
            deleteTestimonial(testimonialToDelete.id);
            setTestimonialToDelete(null);
        }
    };
    
    const StarRating = ({ stars, setStars }: { stars: number, setStars?: (stars: number) => void }) => (
        <div className="flex">
            {[1, 2, 3, 4, 5].map(star => (
                <span 
                    key={star} 
                    className={`cursor-pointer text-3xl ${star <= stars ? 'text-yellow-400' : 'text-gray-300'}`}
                    onClick={() => setStars && setStars(star)}
                >
                    ★
                </span>
            ))}
        </div>
    );

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{t('manage_testimonials')}</h2>
                <button onClick={() => openModal()} className="bg-brand-blue text-white font-bold py-2 px-4 rounded-lg">
                    + {t('add')}
                </button>
            </div>
            
            <div className="space-y-4">
                {/* FIX: Renamed map variable from `t` to `testimonial` to avoid shadowing the `t` translation function. */}
                {testimonials.map(testimonial => (
                    <div key={testimonial.id} className="flex items-start gap-4 p-4 border rounded-lg dark:border-gray-700">
                        <img src={testimonial.photo} alt={testimonial.name} className="w-16 h-16 rounded-full object-cover"/>
                        <div className="flex-grow">
                            <h3 className="font-bold">{testimonial.name} <span className="font-normal text-sm text-gray-500">- {testimonial.city}</span></h3>
                            <StarRating stars={testimonial.stars} />
                            <p className="text-sm mt-2 text-gray-600 dark:text-gray-300">{testimonial.comment}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                            <button onClick={() => openModal(testimonial)} className="bg-gray-200 dark:bg-gray-600 text-xs px-3 py-1 rounded">{t('edit_testimonial')}</button>
                            <button onClick={() => setTestimonialToDelete(testimonial)} className="bg-red-500 text-white text-xs px-3 py-1 rounded">{t('reject')}</button>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
                    <div className="bg-white dark:bg-brand-charcoal rounded-lg p-6 w-full max-w-lg">
                        <h3 className="text-lg font-semibold mb-4">{isEditing ? t('edit_testimonial') : t('add_testimonial')}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input name="name" value={currentTestimonial.name} onChange={handleChange} placeholder={t('name_placeholder')} required className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600" />
                            <input name="city" value={currentTestimonial.city} onChange={handleChange} placeholder={t('city_placeholder')} required className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600" />
                            <input name="photo" value={currentTestimonial.photo} onChange={handleChange} placeholder={t('photo_url_placeholder')} required className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600" />
                            <textarea name="comment" value={currentTestimonial.comment} onChange={handleChange} placeholder={t('comment_placeholder')} required className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600" />
                            <div>
                                <label className="block text-sm">{t('rating_label')}</label>
                                <StarRating stars={currentTestimonial.stars ?? 5} setStars={(s) => setCurrentTestimonial(p => ({...p, stars: s}))} />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={closeModal} className="border px-4 py-2 rounded">{t('cancel')}</button>
                                <button type="submit" className="bg-brand-blue text-white px-4 py-2 rounded">{t('save')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {testimonialToDelete && (
                <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-[60]">
                    <div className="bg-white dark:bg-brand-charcoal rounded-lg shadow-xl p-6 w-full max-w-md text-center">
                        <h3 className="text-lg font-bold text-brand-blue dark:text-brand-gold mb-6">{t('delete_testimonial_confirm')}</h3>
                        <div className="flex justify-center gap-3 mt-4">
                            <button
                                onClick={() => setTestimonialToDelete(null)}
                                className="border dark:border-gray-600 px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                {t('cancel')}
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
                            >
                                {t('confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TestimonialsPanel;