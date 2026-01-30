import { GoogleGenAI, Type } from "@google/genai";
import { WatchIdentity, MarketData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Step 1: Analyze the images to identify the watch using Vision capabilities.
 */
export const identifyWatchFromImage = async (imagesBase64: string[]): Promise<WatchIdentity> => {
  try {
    const prompt = `
      As a luxury horology expert, analyze these images. Identify the watch brand, model, and reference number if visible. 
      Estimate the production era/year. 
      Crucial: Identify which image (by index 0-${imagesBase64.length - 1}) clearly shows the full watch face/dial. This will be used as the cover photo. Set this as 'bestImageIndex'.
      Respond in JSON format with fields: brand, model, referenceNumber, estimatedYear, confidence (0-100), description (in Traditional Chinese), and bestImageIndex (integer).
    `;

    // Create image parts for all uploaded photos
    const imageParts = imagesBase64.map(base64 => ({
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64
      }
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Good for fast multimodal vision
      contents: {
        parts: [
          ...imageParts,
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            brand: { type: Type.STRING },
            model: { type: Type.STRING },
            referenceNumber: { type: Type.STRING },
            estimatedYear: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            description: { type: Type.STRING },
            bestImageIndex: { type: Type.INTEGER, description: "Index of the image showing the watch face/dial" }
          },
          required: ['brand', 'model', 'description', 'bestImageIndex']
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as WatchIdentity;
    }
    throw new Error("No identification data returned.");
  } catch (error) {
    console.error("Vision Analysis Error:", error);
    throw new Error("無法識別圖片中的手錶，請確保圖片清晰。");
  }
};

/**
 * Step 2: Perform deep market research using Search Grounding.
 */
export const getMarketValuation = async (
  identity: WatchIdentity,
  purchasePrice: number,
  currency: string = 'HKD'
): Promise<MarketData> => {
  try {
    // Modified query to strictly target Chrono24 and eBay for pricing
    const query = `
      Perform a specific market search for the watch: ${identity.brand} ${identity.model} ${identity.referenceNumber}.
      Target Currency: ${currency}.
      
      STRICT PRICING RULE: 
      You must ONLY use market data and listings from "Chrono24" and "eBay" to determine the 'lowPrice', 'highPrice', and 'averagePrice'.
      Do not use general retail sites or other auction houses for the numeric valuation unless they are aggregated on Chrono24.
      
      Tasks:
      1. Find the current second-hand market price range on Chrono24 and eBay.
      2. Find the original Retail Price (MSRP) when new (approximate).
      3. Summarize the history and reviews.
      4. Identify at least 3 specific Pros and 3 specific Cons.
      5. Explicitly state which source(s) the price data was derived from (e.g. "Chrono24", "eBay", or "Chrono24 & eBay").
      
      Current Date: ${new Date().toLocaleDateString()}.
    `;

    // We use gemini-3-pro-preview for complex reasoning and search
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: query,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            lowPrice: { type: Type.NUMBER, description: `Lowest found market price on Chrono24/eBay in ${currency}` },
            highPrice: { type: Type.NUMBER, description: `Highest found market price on Chrono24/eBay in ${currency}` },
            averagePrice: { type: Type.NUMBER, description: `Average market price based on Chrono24/eBay listings in ${currency}` },
            retailPrice: { type: Type.NUMBER, description: `Original retail price (MSRP) in ${currency}` },
            currency: { type: Type.STRING, description: `The currency code, must be ${currency}` },
            priceSource: { type: Type.STRING, description: "The platform(s) where the price data was found (e.g., 'Chrono24', 'eBay', or 'Chrono24 & eBay')" },
            trend: { type: Type.STRING, enum: ['rising', 'falling', 'stable'] },
            history: { type: Type.STRING, description: "Brief history in Traditional Chinese" },
            reviewsSummary: { type: Type.STRING, description: "General summary of reviews in Traditional Chinese" },
            pros: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "List of at least 3 pros in Traditional Chinese" 
            },
            cons: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "List of at least 3 cons in Traditional Chinese" 
            }
          },
          required: ['averagePrice', 'currency', 'history', 'reviewsSummary', 'pros', 'cons', 'priceSource']
        }
      }
    });

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => chunk.web ? { title: chunk.web.title, uri: chunk.web.uri } : null)
      .filter((s: any) => s !== null) || [];

    if (response.text) {
      const data = JSON.parse(response.text);
      return {
        ...data,
        currency: currency, // Enforce requested currency
        sources: sources.slice(0, 5) // Limit to top 5 sources
      };
    }
    throw new Error("No market data returned.");

  } catch (error) {
    console.error("Market Research Error:", error);
    // Fallback or mock if search fails completely
    throw new Error("無法獲取市場數據，請稍後再試。");
  }
};