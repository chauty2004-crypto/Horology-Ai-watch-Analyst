export interface WatchIdentity {
  brand: string;
  model: string;
  referenceNumber: string;
  estimatedYear: string;
  confidence: number;
  description: string;
  bestImageIndex?: number;
}

export interface MarketData {
  lowPrice: number;
  highPrice: number;
  averagePrice: number;
  retailPrice?: number;
  currency: string;
  priceSource: string;
  trend: 'rising' | 'falling' | 'stable';
  history: string;
  reviewsSummary: string;
  pros: string[];
  cons: string[];
  sources: Array<{ title: string; uri: string }>;
}

export interface AppraisalReport {
  id: string;
  date: string;
  imageUrls: string[]; // Changed from imageUrl to imageUrls array
  purchasePrice: number;
  identity: WatchIdentity;
  marketData: MarketData;
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING_IMAGE = 'ANALYZING_IMAGE',
  IDENTITY_CONFIRMED = 'IDENTITY_CONFIRMED',
  SEARCHING_MARKET = 'SEARCHING_MARKET',
  REPORT_READY = 'REPORT_READY',
  VIEWING_COLLECTION = 'VIEWING_COLLECTION',
  VIEWING_COLLECTION_DETAIL = 'VIEWING_COLLECTION_DETAIL',
  ERROR = 'ERROR'
}