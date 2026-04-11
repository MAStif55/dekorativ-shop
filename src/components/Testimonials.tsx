'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { useEffect, useState } from 'react';
import { getLatestReviews } from '@/actions/catalog-actions';
import { Review } from '@/types/review';
import ReviewCard from '@/components/ReviewCard';

export default function Testimonials() {
    const { locale } = useLanguage();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const reviewsData = await getLatestReviews(6);
                setReviews(reviewsData);
            } catch (error) {
                console.error('Error fetching reviews:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, []);

    if (loading) {
        return (
            <section className="py-8 sm:py-6 px-4 sm:px-6 bg-white border-t border-secondary/20 relative">
                <div className="max-w-6xl mx-auto text-center text-graphite/60">
                    Loading reviews...
                </div>
            </section>
        );
    }

    if (reviews.length === 0) {
        return null;
    }

    return (
        <section className="py-8 sm:py-6 px-4 sm:px-6 bg-white border-t border-secondary/20 relative">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-5 sm:mb-8">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-ornamental text-graphite mb-4">
                        {locale === 'ru' ? 'Отзывы' : 'Reviews'}
                    </h2>
                    <div className="w-24 h-1 bg-primary mx-auto rounded-full"></div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    {reviews.map((review) => (
                        <ReviewCard key={review.id} review={review} />
                    ))}
                </div>
            </div>
        </section>
    );
}
