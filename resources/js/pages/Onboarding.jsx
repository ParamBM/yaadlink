import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPublicOccasionTypes } from '../store/slices/occasionTypesSlice';

export default function Onboarding() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { publicItems } = useSelector((state) => state.occasionTypes);
    const [selectedCelebrating, setSelectedCelebrating] = useState('');
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
        dispatch(fetchPublicOccasionTypes());
    }, [dispatch]);

    const options = useMemo(() => (
        publicItems.map((item) => ({
            id: String(item.id),
            key: String(item.slug || item.uuid || item.id),
            icon: item.icon || 'celebration',
            title: item.name || 'Occasion',
            description: item.description || 'A moment worth preserving forever.',
        }))
    ), [publicItems]);

    useEffect(() => {
        if (!selectedCelebrating && options.length > 0) {
            setSelectedCelebrating(options[0].id);
        }
    }, [options, selectedCelebrating]);

    const handleContinue = () => {
        if (selectedCelebrating) {
            navigate(`/onboarding/story?occasion=${encodeURIComponent(selectedCelebrating)}`, {
                state: { occasion_type_id: selectedCelebrating },
            });
        }
    };

    return (
        <div className="bg-surface text-on-surface antialiased min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-3xl">

                {/* Main Content Area - Step 1 */}
                <div className={`bg-surface-container-lowest rounded-xl shadow-[0_30px_60px_rgba(183,16,42,0.04)] p-8 sm:p-12 relative overflow-hidden transition-all duration-1000 delay-300 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                    {/* Decorative background element */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-[60px] pointer-events-none"></div>

                    <div className="text-center mb-12 relative z-10">
                        <h1 className="font-headline text-4xl sm:text-5xl font-extrabold tracking-tight text-on-surface mb-4">What are you celebrating?</h1>
                        <p className="font-body text-on-surface-variant text-lg leading-relaxed max-w-xl mx-auto">Every great heirloom starts with a story. Select the occasion you're commemorating today.</p>
                    </div>

                    {/* Bento Grid Selection */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12 relative z-10">
                        {options.map((option) => {
                            const isSelected = selectedCelebrating === option.id;
                            return (
                                <button
                                    key={option.key}
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setSelectedCelebrating(option.id);
                                    }}
                                    className={`relative group flex flex-col items-center justify-center p-8 rounded-lg transition-all duration-300 cursor-pointer select-none ${isSelected
                                            ? 'bg-surface-container-lowest border border-primary/20 shadow-[0_10px_30px_rgba(183,16,42,0.08)] scale-[1.02]'
                                            : 'bg-surface-container-low hover:bg-surface-container-lowest hover:shadow-[0_20px_40px_rgba(27,28,28,0.04)] border border-transparent hover:border-outline-variant/15'
                                        }`}
                                >
                                    {isSelected && (
                                        <>
                                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-lg pointer-events-none"></div>
                                            <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md">
                                                <span className="material-symbols-outlined text-sm font-bold">check</span>
                                            </div>
                                        </>
                                    )}

                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${isSelected
                                            ? 'bg-primary-container/10 text-primary'
                                            : 'bg-surface-container flex text-on-surface-variant group-hover:text-primary'
                                        }`}>
                                        <span className="material-symbols-outlined text-3xl" style={isSelected ? { fontVariationSettings: "'FILL' 1" } : {}}>{option.icon}</span>
                                    </div>
                                    <h3 className={`font-headline font-bold text-xl mb-2 transition-colors ${isSelected ? 'text-primary' : 'text-on-surface group-hover:text-primary'}`}>
                                        {option.title}
                                    </h3>
                                    <p className="font-body text-sm text-on-surface-variant text-center">
                                        {option.description}
                                    </p>
                                </button>
                            );
                        })}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between items-center pt-8 border-t border-outline-variant/10 relative z-10">
                        <Link to="/" className="font-label font-medium text-on-surface-variant hover:text-primary transition-colors px-4 py-2 cursor-pointer">
                            Back
                        </Link>
                        <button onClick={handleContinue} type="button" className="bg-gradient-to-r from-primary to-primary-container text-on-primary font-headline font-bold py-4 px-10 rounded-full shadow-[0_10px_20px_rgba(183,16,42,0.15)] hover:shadow-[0_15px_30px_rgba(183,16,42,0.2)] hover:-translate-y-0.5 active:scale-95 transition-all duration-300 flex items-center gap-2 cursor-pointer">
                            Continue <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
