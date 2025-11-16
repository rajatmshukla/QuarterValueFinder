import { GoogleGenAI, Type } from '@google/genai';
import type { CoinAnalysis } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const singleCoinSchema = {
  type: Type.OBJECT,
  properties: {
    coinType: {
      type: Type.STRING,
      description: "The specific type of the quarter (e.g., 'Washington Quarter', 'Standing Liberty Quarter')."
    },
    year: {
      type: Type.INTEGER,
      description: "The year the coin was minted."
    },
    mintMark: {
      type: Type.STRING,
      description: "The mint mark of the coin (e.g., 'P', 'D', 'S', 'W', or 'None')."
    },
    condition: {
        type: Type.STRING,
        description: "An estimated condition or grade of the coin (e.g., 'Good', 'Fine', 'Uncirculated', 'Proof')."
    },
    description: {
      type: Type.STRING,
      description: "A brief, one-paragraph description of the coin, its history, and key identifying features."
    },
    confidenceScore: {
        type: Type.NUMBER,
        description: "A confidence score from 0.0 to 1.0 representing the AI's certainty in the overall identification (type, year, mint mark, condition). 1.0 is highest confidence."
    },
    marketValues: {
      type: Type.ARRAY,
      description: "A list of estimated market values from popular online marketplaces.",
      items: {
        type: Type.OBJECT,
        properties: {
          marketplace: {
            type: Type.STRING,
            description: "The name of the marketplace (e.g., 'eBay', 'Heritage Auctions', 'APMEX')."
          },
          url: {
            type: Type.STRING,
            description: "A direct search link to the marketplace for similar coins."
          },
          value: {
            type: Type.STRING,
            description: "The estimated value or price range on that marketplace (e.g., '$5 - $10', 'Approx. $25')."
          },
          valueConfidence: {
            type: Type.NUMBER,
            description: "A confidence score from 0.0 to 1.0 for the estimated value, based on the availability and consistency of pricing data from that source."
          }
        },
        required: ["marketplace", "url", "value", "valueConfidence"]
      }
    },
    historicalValues: {
        type: Type.ARRAY,
        description: "An array of estimated monthly average market values for the past 12 months.",
        items: {
            type: Type.OBJECT,
            properties: {
                date: {
                    type: Type.STRING,
                    description: "The month and year of the value point, formatted as 'YYYY-MM'."
                },
                value: {
                    type: Type.NUMBER,
                    description: "The average estimated market value in USD for that month."
                }
            },
            required: ["date", "value"]
        }
    }
  },
  required: ["coinType", "year", "mintMark", "condition", "description", "marketValues", "historicalValues", "confidenceScore"]
};

const responseSchema = {
    type: Type.ARRAY,
    description: "An array of all coins identified in the image.",
    items: singleCoinSchema
};


export const analyzeCoinImage = async (base64Image: string, mimeType: string): Promise<CoinAnalysis[]> => {
  const prompt = `Thoroughly analyze the provided image of United States quarter(s). For each coin visible:
1.  Identify its specific type (e.g., 'Washington Quarter'), year, and mint mark ('P', 'D', 'S', 'W', or 'None').
2.  Estimate its condition or grade (e.g., 'Good', 'Fine', 'Uncirculated', 'Proof').
3.  Provide a brief, one-paragraph description of the coin, its history, and key identifying features.
4.  Assign an overall confidence score (from 0.0 to 1.0) for the identification. This score should reflect how clearly the coin's features (date, mint mark, design details) are visible in the image. 1.0 is absolute certainty.
5.  Perform a comprehensive web search to research its current market value. Cross-reference data from multiple sources to improve accuracy. Provide value estimates from at least three distinct sources, prioritizing major auction sites (eBay, Heritage Auctions, GreatCollections), reputable coin dealers (APMEX, JM Bullion), and official price guides (PCGS, NGC). For each source:
    - Provide a direct search URL for similar coins.
    - Provide the estimated value or a realistic price range.
    - Provide a value confidence score (from 0.0 to 1.0). This score should be based on the volume of recent, comparable sales data found and the consistency of the prices across those sales. A high score means many consistent listings were found.
6.  Provide a historical price trend with estimated average market values for each of the past 12 months.
Structure the entire response as an array of objects according to the provided JSON schema. If no coins are found, return an empty array.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { data: base64Image, mimeType: mimeType } }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.2,
      },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    
    if (Array.isArray(result)) {
        return result as CoinAnalysis[];
    } else if (typeof result === 'object' && result !== null && Object.keys(result).length > 0) {
        // Handle cases where the API might ignore the array schema for a single result
        return [result] as CoinAnalysis[];
    }
    // Return empty array if the response is not a valid coin analysis (e.g., empty object)
    return [];
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error && error.message.includes('JSON')) {
        throw new Error("The AI returned an invalid response format. Please try again with a clearer image.");
    }
    throw new Error("Failed to analyze coin image. The AI may be experiencing issues.");
  }
};