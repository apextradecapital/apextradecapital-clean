import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';

const VoixHaitiCarousel = () => {
    const { testimonials, t } = useAppContext();
    const [currentIndex, setCurrentIndex] = useState(0);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const resetTimeout = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    };

    useEffect(() => {
        resetTimeout();
        timeoutRef.current = setTimeout(
            () => setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length),
            5000 // 5 seconds
        );

        return () => {
            resetTimeout();
        };
    }, [currentIndex, testimonials.length]);

    if (!testimonials || testimonials.length === 0) {
        return <p className="text-center text-gray-500">{t('no_testimonials')}</p>;
    }

    const currentTestimonial = testimonials[currentIndex];
    
    const StarRating = ({ stars }: { stars: number }) => (
        <div className="flex justify-center text-yellow-400">
            {[...Array(5)].map((_, i) => (
                <span key={i} className={i < stars ? 'text-yellow-400' : 'text-gray-300'}>★</span>
            ))}
        </div>
    );

    return (
        <div 
            className="relative w-full max-w-3xl mx-auto overflow-hidden"
            onMouseEnter={resetTimeout}
            onMouseLeave={() => {
                timeoutRef.current = setTimeout(
                    () => setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length),
                    2000
                );
            }}
        >
            <div className="relative h-80 flex items-center justify-center">
                {testimonials.map((testimonial, index) => (
                    <div
                        key={testimonial.id}
                        className={`absolute w-full transition-opacity duration-1000 ease-in-out ${index === currentIndex ? 'opacity-100' : 'opacity-0'}`}
                    >
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center">
                            <img 
                                src={testimonial.photo} 
                                alt={testimonial.name} 
                                className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-brand-gold"
                            />
                            <h3 className="text-xl font-bold text-brand-blue dark:text-blue-300">{testimonial.name}</h3>
                            <p className="text-sm text-gray-500 mb-2">{testimonial.city}</p>
                            <StarRating stars={testimonial.stars} />
                            <blockquote className="mt-4 italic text-gray-600 dark:text-gray-300">
                                "{testimonial.comment}"
                            </blockquote>
                        </div>
                    </div>
                ))}
            </div>
             <div className="flex justify-center mt-4 space-x-2">
                {testimonials.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`w-3 h-3 rounded-full ${currentIndex === index ? 'bg-brand-blue' : 'bg-gray-300'}`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default VoixHaitiCarousel;
