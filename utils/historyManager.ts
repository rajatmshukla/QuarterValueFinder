
import type { AnalysisResult, SavedAnalysisResult, AnalysisSession, DisplayableResult } from '../types';

const HISTORY_KEY = 'coinAnalysisHistory';

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to read file as data URL."));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

export const getSessions = (): AnalysisSession[] => {
  try {
    const saved = localStorage.getItem(HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Failed to retrieve history:", error);
    return [];
  }
};

export const saveSession = async (results: AnalysisResult[]): Promise<void> => {
  try {
    const savedResults: SavedAnalysisResult[] = await Promise.all(
      results.map(async (result) => {
        const { file, imageUrl, ...rest } = result;
        const imageDataUrl = await fileToDataUrl(file);
        return { ...rest, imageDataUrl };
      })
    );
    
    const newSession: AnalysisSession = {
      id: Date.now().toString(),
      date: Date.now(),
      results: savedResults,
    };

    const sessions = getSessions();
    sessions.unshift(newSession); // Add to the beginning
    localStorage.setItem(HISTORY_KEY, JSON.stringify(sessions.slice(0, 50))); // Limit history size
  } catch (error) {
    console.error("Failed to save session:", error);
  }
};

export const clearHistory = (): void => {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.error("Failed to clear history:", error);
  }
};

// Helper to convert saved data for ResultsDisplay
export const mapSessionToDisplayableResults = (session: AnalysisSession): DisplayableResult[] => {
    return session.results.map(r => ({
        ...r,
        imageUrl: r.imageDataUrl,
    }));
}
