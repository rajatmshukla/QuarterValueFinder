
import React, { useState } from 'react';
import type { CoinAnalysis, DisplayableResult } from '../types';
import { EbayIcon } from './icons/EbayIcon';
import { HeritageAuctionsIcon } from './icons/HeritageAuctionsIcon';
import { ApmexIcon } from './icons/ApmexIcon';
import { PriceChart } from './PriceChart';
import { ChartIcon } from './icons/ChartIcon';


interface ResultsDisplayProps {
  results: DisplayableResult[];
}

const getMarketplaceIcon = (name: string): React.ReactNode => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('ebay')) return <EbayIcon className="w-full h-8 object-contain" />;
    if (lowerName.includes('heritage')) return <HeritageAuctionsIcon className="w-full h-8 object-contain" />;
    if (lowerName.includes('apmex') || lowerName.includes('jm bullion')) return <ApmexIcon className="w-full h-8 object-contain" />;
    return <span className="font-semibold text-sm">{name}</span>;
};

const ConfidenceBadge: React.FC<{ score: number }> = ({ score }) => {
    const percentage = (score * 100).toFixed(0);
    let colorClasses = 'bg-red-900/50 text-red-300 border-red-700/50';
    if (score >= 0.8) {
        colorClasses = 'bg-green-900/50 text-green-300 border-green-700/50';
    } else if (score >= 0.6) {
        colorClasses = 'bg-yellow-900/50 text-yellow-300 border-yellow-700/50';
    }
    return (
        <div className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${colorClasses}`}>
            {percentage}% Conf.
        </div>
    );
};

const CoinResult: React.FC<{ analysis: CoinAnalysis }> = ({ analysis }) => {
    const [showChart, setShowChart] = useState(false);
    const hasHistoricalData = analysis.historicalValues && analysis.historicalValues.length > 1;

    return (
        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <h2 className="text-xl font-bold text-indigo-400">{analysis.coinType}</h2>
                        {typeof analysis.confidenceScore === 'number' && <ConfidenceBadge score={analysis.confidenceScore} />}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-4 mt-4">
                        <div>
                            <p className="text-sm text-slate-400">Year</p>
                            <p className="font-semibold text-lg">{analysis.year}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Mint Mark</p>
                            <p className="font-semibold text-lg">{analysis.mintMark}</p>
                        </div>
                        <div className='col-span-2 sm:col-span-1 lg:col-span-2'>
                            <p className="text-sm text-slate-400">Condition</p>
                            <p className="font-semibold text-lg">{analysis.condition}</p>
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-2">
                     <p className="text-slate-400 mb-4 text-sm">{analysis.description}</p>
                     <div className="space-y-3">
                        {analysis.marketValues.map((market, index) => (
                            <a 
                                key={index} 
                                href={market.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="block bg-gray-800 hover:bg-gray-700/80 border border-gray-700 hover:border-indigo-600 rounded-lg p-3 transition-all duration-300"
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div className="h-8 w-28 flex items-center justify-start flex-shrink-0">
                                        {getMarketplaceIcon(market.marketplace)}
                                    </div>
                                    <div className="flex items-center gap-3 justify-end flex-grow">
                                        {typeof market.valueConfidence === 'number' && <ConfidenceBadge score={market.valueConfidence} />}
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-indigo-400">{market.value}</p>
                                            <p className="text-xs text-slate-500">View Listings &rarr;</p>
                                        </div>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
             </div>
             {hasHistoricalData && (
                <div className="mt-6 border-t border-gray-700 pt-4">
                    <button
                        onClick={() => setShowChart(!showChart)}
                        className="flex items-center gap-2 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors w-full text-left"
                    >
                        <ChartIcon className="w-5 h-5" />
                        <span>{showChart ? 'Hide' : 'Show'} 12-Month Price Trend</span>
                    </button>
                    {showChart && <PriceChart data={analysis.historicalValues} />}
                </div>
             )}
        </div>
    );
};


export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results }) => {
  return (
    <div className="w-full animate-fade-in space-y-10">
      {results.map((result, index) => (
        <div key={index} className="bg-gray-800/60 p-4 sm:p-6 rounded-xl border border-gray-700 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-1 flex justify-center items-start">
                    <img src={result.imageUrl} alt={`Analyzed coin image ${index + 1}`} className="rounded-lg object-contain w-full max-w-[200px] md:max-w-none shadow-md border-2 border-gray-600" />
                </div>
                <div className="md:col-span-3">
                    {result.error && (
                        <div className="h-full flex flex-col justify-center items-center text-center bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg">
                            <h3 className="font-bold text-lg mb-1">Analysis Failed</h3>
                            <p>{result.error}</p>
                        </div>
                    )}
                    {result.analyses && result.analyses.length > 0 && (
                        <>
                            <h3 className='text-xl font-bold text-slate-300 mb-4'>
                                Found {result.analyses.length} Coin{result.analyses.length > 1 ? 's' : ''} in Image {index + 1}
                            </h3>
                            <div className="space-y-6">
                                {result.analyses.map((analysis, coinIndex) => (
                                    <CoinResult key={coinIndex} analysis={analysis} />
                                ))}
                            </div>
                        </>
                    )}
                    {result.analyses && result.analyses.length === 0 && (
                        <div className="h-full flex flex-col justify-center items-center text-center bg-gray-900/30 p-4 rounded-lg text-slate-400">
                            <p className='text-lg'>No coins were identified in this image.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      ))}
    </div>
  );
};