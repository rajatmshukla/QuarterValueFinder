
export interface MarketplaceValue {
  marketplace: string;
  url: string;
  value: string; // e.g., "$5 - $10", "Approx. $25"
  valueConfidence?: number;
}

export interface HistoricalValue {
  date: string; // Format: "YYYY-MM"
  value: number; // Average estimated value in USD
}

export interface CoinAnalysis {
  coinType: string;
  year: number;
  mintMark: string;
  condition: string;
  description: string;
  marketValues: MarketplaceValue[];
  historicalValues: HistoricalValue[];
  confidenceScore?: number;
}

export interface AnalysisResult {
  imageUrl: string;
  analyses: CoinAnalysis[] | null;
  error?: string;
  file: File;
}

// This is what ResultsDisplay component will use. It doesn't need the file object.
export interface DisplayableResult {
    imageUrl: string;
    analyses: CoinAnalysis[] | null;
    error?: string;
}

// Types for history feature
export interface SavedAnalysisResult extends Omit<AnalysisResult, 'file' | 'imageUrl'> {
    imageDataUrl: string;
}

export interface AnalysisSession {
    id: string;
    date: number; // timestamp
    results: SavedAnalysisResult[];
}