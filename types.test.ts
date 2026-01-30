import { describe, it, expect } from 'vitest';
import { AppState, WatchIdentity, MarketData, AppraisalReport } from './types';

describe('Types - Data Models', () => {
  describe('WatchIdentity', () => {
    it('should create a valid watch identity', () => {
      const identity: WatchIdentity = {
        brand: 'Rolex',
        model: 'Submariner',
        referenceNumber: '114060',
        estimatedYear: '2020',
        confidence: 95,
        description: 'A classic stainless steel sports watch',
        bestImageIndex: 0
      };

      expect(identity.brand).toBe('Rolex');
      expect(identity.confidence).toBe(95);
      expect(identity.bestImageIndex).toBe(0);
    });

    it('should allow optional bestImageIndex', () => {
      const identity: WatchIdentity = {
        brand: 'Omega',
        model: 'Speedmaster',
        referenceNumber: '311.32.42.30.04.001',
        estimatedYear: '2015',
        confidence: 88,
        description: 'Professional chronograph'
      };

      expect(identity.bestImageIndex).toBeUndefined();
    });
  });

  describe('MarketData', () => {
    it('should create valid market data', () => {
      const marketData: MarketData = {
        lowPrice: 45000,
        highPrice: 55000,
        averagePrice: 50000,
        retailPrice: 65000,
        currency: 'HKD',
        priceSource: 'Chrono24 & eBay',
        trend: 'rising',
        history: 'Popular luxury sports watch',
        reviewsSummary: 'Highly rated by collectors',
        pros: ['Reliable', 'Good resale value', 'Iconic design'],
        cons: ['Difficult to acquire', 'High price', 'Limited availability'],
        sources: [
          { title: 'Chrono24 Rolex', uri: 'https://chrono24.com' },
          { title: 'eBay Watches', uri: 'https://ebay.com' }
        ]
      };

      expect(marketData.averagePrice).toBe(50000);
      expect(marketData.trend).toBe('rising');
      expect(marketData.pros).toHaveLength(3);
      expect(marketData.cons).toHaveLength(3);
    });

    it('should handle all trend types', () => {
      const trends: Array<'rising' | 'falling' | 'stable'> = ['rising', 'falling', 'stable'];
      
      trends.forEach(trend => {
        const data: MarketData = {
          lowPrice: 1000,
          highPrice: 2000,
          averagePrice: 1500,
          currency: 'USD',
          priceSource: 'Test',
          trend,
          history: 'Test',
          reviewsSummary: 'Test',
          pros: [],
          cons: [],
          sources: []
        };
        expect(data.trend).toBe(trend);
      });
    });
  });

  describe('AppraisalReport', () => {
    it('should create a valid appraisal report', () => {
      const report: AppraisalReport = {
        id: 'report-123',
        date: '2024-01-30',
        imageUrls: ['image1.jpg', 'image2.jpg'],
        purchasePrice: 50000,
        identity: {
          brand: 'Rolex',
          model: 'Submariner',
          referenceNumber: '114060',
          estimatedYear: '2020',
          confidence: 95,
          description: 'Classic sports watch'
        },
        marketData: {
          lowPrice: 45000,
          highPrice: 55000,
          averagePrice: 50000,
          currency: 'HKD',
          priceSource: 'Chrono24',
          trend: 'stable',
          history: 'Popular watch',
          reviewsSummary: 'Well-received',
          pros: ['Quality'],
          cons: ['Price'],
          sources: []
        }
      };

      expect(report.id).toBe('report-123');
      expect(report.imageUrls).toHaveLength(2);
      expect(report.purchasePrice).toBe(50000);
    });

    it('should support multiple images in report', () => {
      const report: AppraisalReport = {
        id: 'report-456',
        date: '2024-01-30',
        imageUrls: ['img1.jpg', 'img2.jpg', 'img3.jpg'],
        purchasePrice: 100000,
        identity: {
          brand: 'Patek Philippe',
          model: 'Nautilus',
          referenceNumber: '5711/1A',
          estimatedYear: '2022',
          confidence: 98,
          description: 'Luxury sports watch'
        },
        marketData: {
          lowPrice: 150000,
          highPrice: 200000,
          averagePrice: 175000,
          currency: 'USD',
          priceSource: 'Chrono24 & eBay',
          trend: 'rising',
          history: 'Iconic design',
          reviewsSummary: 'Highly sought after',
          pros: ['Investment value', 'Timeless design'],
          cons: ['Hard to find', 'Very expensive'],
          sources: []
        }
      };

      expect(report.imageUrls.length).toBeLessThanOrEqual(3);
      expect(report.marketData.averagePrice).toBeGreaterThan(report.purchasePrice);
    });
  });

  describe('AppState', () => {
    it('should have all required states', () => {
      expect(AppState.IDLE).toBe('IDLE');
      expect(AppState.ANALYZING_IMAGE).toBe('ANALYZING_IMAGE');
      expect(AppState.IDENTITY_CONFIRMED).toBe('IDENTITY_CONFIRMED');
      expect(AppState.SEARCHING_MARKET).toBe('SEARCHING_MARKET');
      expect(AppState.REPORT_READY).toBe('REPORT_READY');
      expect(AppState.VIEWING_COLLECTION).toBe('VIEWING_COLLECTION');
      expect(AppState.VIEWING_COLLECTION_DETAIL).toBe('VIEWING_COLLECTION_DETAIL');
      expect(AppState.ERROR).toBe('ERROR');
    });
  });
});
