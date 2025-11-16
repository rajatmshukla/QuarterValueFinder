
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { analyzeCoinImage } from './services/geminiService';
import type { AnalysisResult } from './types';
import { saveSession } from './utils/historyManager';
import { ImageUploader } from './components/ImageUploader';
import { ResultsDisplay } from './components/ResultsDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { HistoryView } from './components/HistoryView';
import { CoinIcon } from './components/icons/CoinIcon';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { HistoryIcon } from './components/icons/HistoryIcon';

const App: React.FC = () => {
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [view, setView] = useState<'upload' | 'results' | 'history'>('upload');

  const handleImageSelect = (files: File[]) => {
    resetState(false); // Reset without changing view
    const newResults = files.map(file => ({
        imageUrl: URL.createObjectURL(file),
        analyses: null,
        file: file,
    }));
    setAnalysisResults(newResults);
  };
  
  // Clean up object URLs on unmount or when results change
  useEffect(() => {
    return () => {
      analysisResults.forEach(result => URL.revokeObjectURL(result.imageUrl));
    };
  }, [analysisResults]);

  const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result.split(',')[1]);
        } else {
          reject(new Error("Failed to read file as data URL."));
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
  };

  const handleAnalyze = useCallback(async () => {
    if (analysisResults.length === 0) {
      setGlobalError('Please select one or more images first.');
      return;
    }

    setIsLoading(true);
    setGlobalError(null);

    const analysisPromises = analysisResults.map(async (result) => {
        try {
            const imagePart = await fileToGenerativePart(result.file);
            const analyses = await analyzeCoinImage(imagePart.inlineData.data, imagePart.inlineData.mimeType);
            return { ...result, analyses, error: undefined };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            return { ...result, analyses: null, error: errorMessage };
        }
    });

    const settledResults = await Promise.all(analysisPromises);
    setAnalysisResults(settledResults);

    // Save successful sessions to history
    if (settledResults.length > 0) {
        await saveSession(settledResults);
    }
    
    setIsLoading(false);
    setView('results');
  }, [analysisResults]);

  const resetState = (changeView = true) => {
    analysisResults.forEach(result => URL.revokeObjectURL(result.imageUrl));
    setAnalysisResults([]);
    setGlobalError(null);
    setIsLoading(false);
    if (changeView) {
      setView('upload');
    }
  };
  
  const handleClearSelection = () => {
     analysisResults.forEach(result => URL.revokeObjectURL(result.imageUrl));
     setAnalysisResults([]);
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col items-center p-4 sm:p-6 md:p-8">
      <header className="w-full max-w-6xl text-center mb-8 relative">
        <div className="flex items-center justify-center gap-4 mb-2">
          <CoinIcon className="h-10 w-10 text-indigo-400" />
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-slate-200 to-slate-400 text-transparent bg-clip-text">
            Quarter Value Finder
          </h1>
        </div>
        <p className="text-lg text-slate-400">
          Upload pictures of US quarters to identify them and discover their market value.
        </p>
        <div className="absolute top-0 right-0">
          <button
              onClick={() => setView('history')}
              className="flex items-center gap-2 bg-gray-700/80 hover:bg-gray-600/80 text-slate-300 font-semibold py-2 px-4 rounded-full transition-colors duration-300 backdrop-blur-sm"
              aria-label="View analysis history"
          >
              <HistoryIcon className="w-5 h-5" />
              <span>History</span>
          </button>
        </div>
      </header>

      <main className="w-full max-w-6xl flex-grow flex flex-col items-center justify-center bg-gray-800/50 rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-700 backdrop-blur-sm">
        {isLoading && <LoadingSpinner />}
        {globalError && !isLoading && (
          <div className="text-center bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg">
            <h3 className="font-bold text-lg mb-1">Error</h3>
            <p>{globalError}</p>
          </div>
        )}
        
        {!isLoading && view === 'upload' && (
          <div className="w-full flex flex-col items-center">
            {analysisResults.length === 0 ? (
              <ImageUploader onImageSelect={handleImageSelect} />
            ) : (
              <div className="text-center w-full flex flex-col items-center animate-fade-in">
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6 w-full p-4 bg-gray-900/30 rounded-lg">
                    {analysisResults.map((result, index) => (
                        <div key={index} className="relative aspect-square">
                            <img src={result.imageUrl} alt={`Coin preview ${index + 1}`} className="rounded-lg object-cover w-full h-full shadow-md border-2 border-gray-600" />
                        </div>
                    ))}
                </div>
                <div className='flex flex-col sm:flex-row items-center gap-4'>
                    <button
                      onClick={handleAnalyze}
                      disabled={isLoading}
                      className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:text-gray-400 text-white font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition-all duration-300 ease-in-out text-xl"
                    >
                      <SparklesIcon className="w-6 h-6" />
                      Analyze {analysisResults.length} Image{analysisResults.length > 1 ? 's' : ''}
                    </button>
                    <button onClick={handleClearSelection} className="text-sm text-slate-400 hover:text-white transition-colors">
                        Clear Selection
                    </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {!isLoading && view === 'results' && (
            <div className="w-full flex flex-col items-center">
                <ResultsDisplay results={analysisResults} />
                <button
                    onClick={() => resetState()}
                    className="mt-8 bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-6 rounded-full shadow-md transform hover:scale-105 transition-all duration-300 ease-in-out"
                >
                    Analyze More Coins
                </button>
            </div>
        )}

        {!isLoading && view === 'history' && (
            <HistoryView onNavigateBack={() => setView('upload')} />
        )}

      </main>

      <footer className="w-full max-w-6xl text-center mt-8 text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} Quarter Value Finder. AI analysis may not be 100% accurate. Always consult a professional for certified appraisals.</p>
      </footer>
    </div>
  );
};

export default App;
