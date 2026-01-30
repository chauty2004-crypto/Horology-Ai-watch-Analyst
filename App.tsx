import React, { useState, useRef, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Spinner } from './components/Spinner';
import { ReportView } from './components/ReportView';
import { CollectionView } from './components/CollectionView';
import { identifyWatchFromImage, getMarketValuation } from './services/geminiService';
import { AppState, WatchIdentity, MarketData, AppraisalReport } from './types';
import { Upload, Camera, DollarSign, ArrowRight, Search, Sparkles, Images, ChevronDown } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [images, setImages] = useState<string[]>([]);
  const [purchasePrice, setPurchasePrice] = useState<string>('');
  const [currency, setCurrency] = useState<string>('HKD');
  const [identity, setIdentity] = useState<WatchIdentity | null>(null);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [report, setReport] = useState<AppraisalReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Collection State
  const [collection, setCollection] = useState<AppraisalReport[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load collection from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('horology_collection');
    if (saved) {
      try {
        const parsedData = JSON.parse(saved);
        // Migration logic:
        // 1. Convert single imageUrl to imageUrls array
        // 2. Add default pros/cons arrays to marketData if missing
        // 3. Ensure currency exists (default to HKD if missing)
        // 4. Ensure priceSource exists
        const migratedData = parsedData.map((item: any) => ({
          ...item,
          imageUrls: item.imageUrls || (item.imageUrl ? [item.imageUrl] : []),
          marketData: {
            ...item.marketData,
            pros: item.marketData.pros || [],
            cons: item.marketData.cons || [],
            currency: item.marketData.currency || 'HKD',
            priceSource: item.marketData.priceSource || 'Market Data'
          }
        }));
        setCollection(migratedData);
      } catch (e) {
        console.error("Failed to parse collection", e);
      }
    }
  }, []);

  const saveCollection = (newCollection: AppraisalReport[]) => {
    setCollection(newCollection);
    localStorage.setItem('horology_collection', JSON.stringify(newCollection));
  };

  const handleSaveToCollection = (newReport: AppraisalReport) => {
    if (collection.some(item => item.id === newReport.id)) return;
    const updated = [newReport, ...collection];
    saveCollection(updated);
  };

  const handleDeleteFromCollection = (id: string) => {
    const updated = collection.filter(item => item.id !== id);
    saveCollection(updated);
  };

  const handleSelectFromCollection = (selectedReport: AppraisalReport) => {
    setReport(selectedReport);
    setState(AppState.VIEWING_COLLECTION_DETAIL);
  };

  const handleNavigate = (view: 'home' | 'collection') => {
    if (view === 'collection') {
      setState(AppState.VIEWING_COLLECTION);
    } else {
      if (state === AppState.VIEWING_COLLECTION || state === AppState.VIEWING_COLLECTION_DETAIL) {
        // If coming from collection, reset to IDLE, 
        // but if user was in middle of analysis, we might want to preserve?
        // For simplicity, reset to home.
        if (report && state !== AppState.VIEWING_COLLECTION_DETAIL) {
             setState(AppState.REPORT_READY);
        } else if (identity && state !== AppState.VIEWING_COLLECTION_DETAIL) {
             setState(AppState.IDENTITY_CONFIRMED);
        } else {
             resetApp();
        }
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      if (files.length > 3) {
        alert("最多只能上傳 3 張照片 (Max 3 photos allowed)");
        return;
      }

      const fileArray = Array.from(files);
      const promises = fileArray.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file as Blob);
        });
      });

      Promise.all(promises).then(base64Images => {
        setImages(base64Images);
        // Strip the data:image/xyz;base64, prefix for the API call
        const rawBase64s = base64Images.map(img => img.split(',')[1]);
        analyzeImage(rawBase64s, base64Images);
      });
    }
  };

  const analyzeImage = async (base64Images: string[], currentFullImages?: string[]) => {
    setState(AppState.ANALYZING_IMAGE);
    setError(null);
    try {
      const result = await identifyWatchFromImage(base64Images);
      
      // Reorder images if AI suggests a better cover photo (showing the dial)
      if (currentFullImages && typeof result.bestImageIndex === 'number' && result.bestImageIndex >= 0 && result.bestImageIndex < currentFullImages.length) {
         const bestImg = currentFullImages[result.bestImageIndex];
         const otherImages = currentFullImages.filter((_, i) => i !== result.bestImageIndex);
         const sortedImages = [bestImg, ...otherImages];
         setImages(sortedImages);
      }
      
      setIdentity(result);
      setState(AppState.IDENTITY_CONFIRMED);
    } catch (err: any) {
      setError(err.message || "Failed to identify image");
      setState(AppState.ERROR);
    }
  };

  const handleAppraisal = async () => {
    if (!identity || !purchasePrice) return;
    
    setState(AppState.SEARCHING_MARKET);
    try {
      const priceNum = parseFloat(purchasePrice);
      const data = await getMarketValuation(identity, priceNum, currency);
      setMarketData(data);
      
      const newReport: AppraisalReport = {
        id: crypto.randomUUID(),
        date: new Date().toLocaleDateString('zh-HK'),
        imageUrls: images, // Uses the sorted images from state
        purchasePrice: priceNum,
        identity: identity,
        marketData: data
      };
      
      setReport(newReport);
      setState(AppState.REPORT_READY);
    } catch (err: any) {
      setError(err.message || "Failed to fetch market data");
      setState(AppState.ERROR);
    }
  };

  const resetApp = () => {
    setState(AppState.IDLE);
    setImages([]);
    setPurchasePrice('');
    setIdentity(null);
    setMarketData(null);
    setReport(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#0f1115] text-gray-200 pb-12 font-sans selection:bg-yellow-500/30">
      <Navbar onNavigate={handleNavigate} currentState={state} />

      <main className="container mx-auto px-4 pt-32">
        
        {/* State: IDLE - Upload Area */}
        {state === AppState.IDLE && (
          <div className="max-w-2xl mx-auto text-center space-y-12 animate-fade-in-up">
            <div className="space-y-4">
              <h1 className="serif text-4xl md:text-6xl font-bold text-white leading-tight">
                發現您的藏品<br/><span className="text-yellow-500 italic">真實價值</span>
              </h1>
              <p className="text-gray-400 text-lg max-w-lg mx-auto leading-relaxed">
                利用先進的 Gemini AI 視覺識別與實時市場數據，即時獲取您的名錶估值報告 (支援多國貨幣)。
              </p>
            </div>

            <div 
              onClick={() => fileInputRef.current?.click()}
              className="group border-2 border-dashed border-gray-700 hover:border-yellow-500/50 bg-gray-800/30 hover:bg-gray-800/50 rounded-2xl p-16 transition-all cursor-pointer relative overflow-hidden"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                multiple
                onChange={handleImageUpload}
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10 flex flex-col items-center gap-4">
                <div className="p-4 bg-gray-800 rounded-full group-hover:scale-110 transition-transform duration-300 shadow-xl">
                  <Camera className="w-8 h-8 text-yellow-500" />
                </div>
                <div className="space-y-1">
                    <p className="text-xl font-medium text-gray-300">上傳或拍攝手錶照片</p>
                    <p className="text-sm text-yellow-500/70 font-medium">支援最多 3 張照片 (Max 3 Photos)</p>
                </div>
                <p className="text-sm text-gray-500">JPG, PNG 格式</p>
              </div>
            </div>
          </div>
        )}

        {/* State: IDENTITY CONFIRMED - Enter Price */}
        {state === AppState.IDENTITY_CONFIRMED && identity && (
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center animate-fade-in">
            <div className="space-y-6">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-800 bg-gray-900">
                {/* Image Gallery/Carousel Concept */}
                <div className="aspect-square relative">
                    <img src={images[0]} alt="Main Identified Watch" className="w-full h-full object-cover" />
                    {images.length > 1 && (
                        <div className="absolute bottom-4 right-4 bg-black/70 px-3 py-1 rounded-full text-xs text-white flex items-center gap-1">
                            <Images size={12} />
                            +{images.length - 1} more
                        </div>
                    )}
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6">
                   <div className="flex items-center gap-2 text-yellow-500 text-sm font-bold tracking-widest mb-1">
                      <Sparkles size={14} />
                      AI IDENTIFIED
                   </div>
                   <h2 className="serif text-3xl font-bold text-white">{identity.brand}</h2>
                   <p className="text-xl text-gray-300">{identity.model}</p>
                </div>
              </div>
              
              {/* Thumbnails if multiple */}
              {images.length > 1 && (
                 <div className="flex gap-4 overflow-x-auto pb-2">
                    {images.map((img, idx) => (
                        <img key={idx} src={img} className={`w-20 h-20 rounded-lg object-cover border-2 ${idx === 0 ? 'border-yellow-500' : 'border-gray-700'}`} alt="Thumbnail"/>
                    ))}
                 </div>
              )}

              <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                <p className="text-gray-300 italic leading-relaxed">"{identity.description}"</p>
              </div>
            </div>

            <div className="space-y-8 bg-gray-900/50 p-8 rounded-2xl border border-gray-800">
              <div>
                <h3 className="serif text-2xl font-bold text-white mb-2">估價設定</h3>
                <p className="text-gray-400">請輸入您的原始購入價格及幣別以計算投資損益。</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">選擇貨幣 (Currency)</label>
                    <div className="relative">
                        <select 
                            value={currency} 
                            onChange={(e) => setCurrency(e.target.value)}
                            className="w-full bg-gray-950 border border-gray-700 rounded-xl py-4 pl-4 pr-10 text-white text-lg focus:outline-none focus:border-yellow-500 appearance-none transition-colors cursor-pointer"
                        >
                            <option value="HKD">HKD - 港幣 ($)</option>
                            <option value="USD">USD - 美金 ($)</option>
                            <option value="CNY">CNY - 人民幣 (¥)</option>
                            <option value="EUR">EUR - 歐元 (€)</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={20} />
                    </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">購入價格</label>
                  <div className="relative group">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-yellow-500 transition-colors" />
                    <input 
                      type="number" 
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(e.target.value)}
                      placeholder="例如: 85000"
                      className="w-full bg-gray-950 border border-gray-700 rounded-xl py-4 pl-12 pr-4 text-white text-lg focus:outline-none focus:border-yellow-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={handleAppraisal}
                disabled={!purchasePrice}
                className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-yellow-500/20"
              >
                開始市場估價
                <ArrowRight size={20} />
              </button>
              
               <div className="flex items-start gap-3 text-xs text-gray-500 mt-4 bg-gray-950 p-4 rounded-lg">
                  <Search size={14} className="mt-0.5 shrink-0" />
                  <p>系統將使用 Google Search Grounding 實時檢索全球市場數據，並自動轉換為您選擇的貨幣 ({currency})。</p>
               </div>
            </div>
          </div>
        )}

        {/* State: LOADING (Searching Market) */}
        {state === AppState.SEARCHING_MARKET && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6 text-center">
             <div className="w-24 h-24 relative">
                <div className="absolute inset-0 rounded-full border-4 border-gray-800"></div>
                <div className="absolute inset-0 rounded-full border-4 border-t-yellow-500 animate-spin"></div>
                <Search className="absolute inset-0 m-auto text-yellow-500" size={32} />
             </div>
            <div className="space-y-2">
              <h3 className="serif text-2xl text-white">正在搜尋全球市場數據...</h3>
              <p className="text-gray-400">正在分析拍賣紀錄、二手交易平台及專家評論 ({currency})</p>
            </div>
          </div>
        )}

        {/* State: REPORT READY (New Appraisal) */}
        {state === AppState.REPORT_READY && report && (
          <ReportView 
            report={report} 
            onReset={resetApp} 
            onSave={handleSaveToCollection}
            isSaved={collection.some(item => item.id === report.id)}
          />
        )}

        {/* State: VIEWING COLLECTION DETAIL */}
        {state === AppState.VIEWING_COLLECTION_DETAIL && report && (
          <ReportView 
            report={report} 
            onReset={() => setState(AppState.VIEWING_COLLECTION)}
            onSave={() => {}} // Already saved
            isSaved={true}
            backLabel="← 返回收藏夾 (Back to Collection)"
          />
        )}

        {/* State: COLLECTION VIEW */}
        {state === AppState.VIEWING_COLLECTION && (
          <CollectionView 
            collection={collection} 
            onDelete={handleDeleteFromCollection}
            onBack={resetApp}
            onSelect={handleSelectFromCollection}
          />
        )}

        {/* State: ERROR */}
        {state === AppState.ERROR && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6">
            <div className="text-red-500 bg-red-500/10 p-4 rounded-full">
              <Sparkles className="w-12 h-12 rotate-45" />
            </div>
            <h3 className="serif text-2xl text-white">發生錯誤</h3>
            <p className="text-gray-400 max-w-md text-center">{error}</p>
            <button 
              onClick={resetApp}
              className="text-yellow-500 hover:text-yellow-400 underline decoration-yellow-500/50 underline-offset-4"
            >
              重試
            </button>
          </div>
        )}

      </main>
    </div>
  );
};

export default App;