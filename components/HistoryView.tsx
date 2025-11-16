import React, { useState, useEffect } from 'react';
import { getSessions, clearHistory, mapSessionToDisplayableResults } from '../utils/historyManager';
import type { AnalysisSession } from '../types';
import { ResultsDisplay } from './ResultsDisplay';
import { TrashIcon } from './icons/TrashIcon';
import { CoinIcon } from './icons/CoinIcon';
// FIX: Import the missing HistoryIcon component to resolve the 'Cannot find name' error.
import { HistoryIcon } from './icons/HistoryIcon';

interface HistoryViewProps {
    onNavigateBack: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onNavigateBack }) => {
    const [sessions, setSessions] = useState<AnalysisSession[]>([]);
    const [selectedSession, setSelectedSession] = useState<AnalysisSession | null>(null);

    useEffect(() => {
        setSessions(getSessions());
    }, []);
    
    const handleClearHistory = () => {
        if (window.confirm('Are you sure you want to delete all saved analyses? This action cannot be undone.')) {
            clearHistory();
            setSessions([]);
            setSelectedSession(null);
        }
    };
    
    if (selectedSession) {
        return (
            <div className="w-full animate-fade-in">
                <div className="flex justify-start items-center mb-6">
                    <button
                        onClick={() => setSelectedSession(null)}
                        className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-full shadow-md transform hover:scale-105 transition-all duration-300 ease-in-out"
                    >
                        &larr; Back to History
                    </button>
                </div>
                <ResultsDisplay results={mapSessionToDisplayableResults(selectedSession)} />
            </div>
        );
    }
    
    return (
        <div className="w-full animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                 <h2 className="text-3xl font-bold text-slate-300">Analysis History</h2>
                 {sessions.length > 0 && (
                     <button 
                        onClick={handleClearHistory} 
                        className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors"
                        aria-label="Clear all history"
                     >
                         <TrashIcon className="w-5 h-5" />
                         Clear History
                     </button>
                 )}
            </div>
            
            {sessions.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                    <HistoryIcon className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                    <p className="text-xl">No saved analyses yet.</p>
                    <p className="mt-2">Complete an analysis to see it here.</p>
                     <button
                        onClick={onNavigateBack}
                        className="mt-8 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-full shadow-lg transform hover:scale-105 transition-all duration-300 ease-in-out"
                    >
                        Analyze New Coins
                    </button>
                </div>
            ) : (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {sessions.map(session => (
                        <button 
                            key={session.id} 
                            className="w-full text-left bg-gray-900/50 p-4 rounded-lg border border-gray-700 hover:border-indigo-600 transition-all cursor-pointer block" 
                            onClick={() => setSelectedSession(session)}
                            aria-label={`View analysis from ${new Date(session.date).toLocaleString()}`}
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-lg text-slate-200">
                                        Analysis from {new Date(session.date).toLocaleString()}
                                    </p>
                                    <p className="text-sm text-slate-400">
                                        {session.results.length} image{session.results.length > 1 ? 's' : ''} analyzed
                                    </p>
                                </div>
                                <div className="flex -space-x-4">
                                    {session.results.slice(0, 4).map((result, i) => (
                                        <img key={i} src={result.imageDataUrl} alt="coin thumbnail" className="w-12 h-12 rounded-full object-cover border-2 border-gray-700 bg-gray-800" />
                                    ))}
                                    {session.results.length > 4 && (
                                        <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center border-2 border-gray-600">
                                            <span className="text-sm font-bold">+{session.results.length - 4}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};