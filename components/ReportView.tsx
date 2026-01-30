import React, { useRef, useState } from 'react';
import { AppraisalReport } from '../types';
import { Download, CheckCircle2, TrendingUp, TrendingDown, Minus, Bookmark, BookmarkCheck, ThumbsUp, ThumbsDown, Loader2, FileText } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface Props {
  report: AppraisalReport;
  onReset: () => void;
  onSave: (report: AppraisalReport) => void;
  isSaved: boolean;
  backLabel?: string;
}

export const ReportView: React.FC<Props> = ({ report, onReset, onSave, isSaved, backLabel }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const profit = report.marketData.averagePrice - report.purchasePrice;
  const isProfit = profit >= 0;
  const roi = report.purchasePrice > 0 ? ((profit / report.purchasePrice) * 100).toFixed(1) : '0.0';

  const formatCurrency = (val: number, currency: string) => {
    return new Intl.NumberFormat('zh-HK', { 
      style: 'currency', 
      currency: currency, 
      maximumFractionDigits: 0 
    }).format(val);
  };

  const generateCanvas = async () => {
    if (!reportRef.current) return null;
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2, // High resolution
        useCORS: true, // Allow loading cross-origin images if any
        backgroundColor: '#ffffff', // Force white background
        logging: false,
        windowWidth: 1200, // Ensure consistent layout width during capture
        onclone: (clonedDoc) => {
           // Fix for potential object-fit issues in some browsers/versions by forcing style on clone if needed
           const images = clonedDoc.getElementsByTagName('img');
           for(let i=0; i<images.length; i++) {
             // force inline styles for crucial images to ensure object-fit: contain is respected
             // html2canvas can sometimes ignore class-based object-fit
             const img = images[i] as HTMLImageElement;
             
             // Check if this is the main watch image by alt text or context
             if (img.alt === "Main Watch" || img.alt.includes("Detail")) {
                 img.style.objectFit = "contain";
                 img.style.width = "100%"; 
                 img.style.height = "100%";
             }
           }
        }
      });
      return canvas;
    } catch (err) {
      console.error("Canvas generation failed:", err);
      alert("生成失敗，請重試。\n(Generation Failed)");
      setIsGenerating(false);
      return null;
    }
  };

  const handleDownloadJPG = async () => {
      const canvas = await generateCanvas();
      if (!canvas) return;
      
      try {
        const image = canvas.toDataURL("image/jpeg", 0.9);
        const link = document.createElement('a');
        link.href = image;
        link.download = `HorologyAI-${report.identity.brand}-${report.id.slice(0, 6)}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error(err);
      } finally {
        setIsGenerating(false);
      }
  };

  const handleDownloadPDF = async () => {
      const canvas = await generateCanvas();
      if (!canvas) return;

      try {
        const imgData = canvas.toDataURL('image/jpeg', 0.9);
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        // If content is taller than A4, use a custom page size to keep it on one page (Digital Certificate style)
        if (pdfHeight > pdf.internal.pageSize.getHeight()) {
            const customPdf = new jsPDF({
               orientation: 'p',
               unit: 'mm',
               format: [pdfWidth, pdfHeight] 
            });
            customPdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            customPdf.save(`HorologyAI-${report.identity.brand}-${report.id.slice(0, 6)}.pdf`);
        } else {
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`HorologyAI-${report.identity.brand}-${report.id.slice(0, 6)}.pdf`);
        }
      } catch (err) {
        console.error("PDF generation failed:", err);
        alert("PDF 生成失敗，請重試。");
      } finally {
        setIsGenerating(false);
      }
  };

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in pb-20">
      {/* Actions Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 no-print relative z-10">
        <button 
          onClick={onReset}
          className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
        >
          {backLabel || '← 開始新鑑賞'}
        </button>
        <div className="flex gap-4">
          <button 
            onClick={() => onSave(report)}
            disabled={isSaved}
            className={`flex items-center gap-2 px-6 py-2 rounded-full transition-all border active:scale-95 ${
              isSaved 
                ? 'bg-green-900/20 border-green-500/50 text-green-500 cursor-default' 
                : 'bg-gray-800 hover:bg-gray-700 border-gray-600 text-white'
            }`}
          >
            {isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
            {isSaved ? '已收藏' : '加入收藏'}
          </button>
          
          <div className="flex gap-2">
            <button 
              onClick={handleDownloadJPG}
              disabled={isGenerating}
              className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-black font-semibold px-4 py-2 rounded-full transition-all active:scale-95 shadow-lg shadow-yellow-500/20 disabled:opacity-70 disabled:cursor-wait"
            >
              {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
              JPG
            </button>
            <button 
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="flex items-center gap-2 bg-gray-100 hover:bg-white text-black font-semibold px-4 py-2 rounded-full transition-all active:scale-95 shadow-lg disabled:opacity-70 disabled:cursor-wait"
            >
              {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* Certificate Container */}
      <div 
        ref={reportRef}
        className="bg-white text-black p-12 shadow-2xl relative overflow-hidden"
      >
        {/* Watermark/Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gray-500/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>

        {/* Header */}
        <header className="border-b border-gray-100 pb-6 mb-8 flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2 mb-2 text-yellow-600">
               <span className="serif text-lg font-bold tracking-wider">HOROLOGY AI</span>
            </div>
            <h1 className="serif text-3xl font-bold text-gray-900">鑑賞評估報告</h1>
            <p className="text-gray-400 uppercase tracking-widest text-xs mt-1">Professional Valuation Certificate</p>
          </div>
          <div className="text-right text-xs">
             <div className="inline-block bg-gray-50 border border-gray-100 px-3 py-2 rounded-lg text-right">
                <p className="text-gray-400 uppercase tracking-wider mb-1">Report ID</p>
                <p className="font-mono text-gray-900 font-bold">{report.id.slice(0, 8).toUpperCase()}</p>
             </div>
             <p className="text-gray-400 mt-2">{report.date}</p>
          </div>
        </header>

        {/* HERO SECTION: Image + Identity + Financial Highlight */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
            
            {/* Primary Image (40% width) */}
            <div className="md:col-span-5">
                 <div className="aspect-[4/5] bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shadow-md relative flex items-center justify-center group">
                    <div 
                        className="absolute inset-0 bg-cover bg-center blur-2xl opacity-40 scale-110"
                        style={{ backgroundImage: `url(${report.imageUrls[0]})` }}
                    ></div>
                    <img 
                        src={report.imageUrls[0]} 
                        alt="Main Watch" 
                        className="relative z-10 w-full h-full object-contain p-2 transition-transform duration-500" 
                    />
                 </div>
            </div>

            {/* Identity & Financials (60% width) */}
            <div className="md:col-span-7 flex flex-col justify-center">
                 {/* Identity Info */}
                 <div className="mb-8">
                    <h2 className="text-sm font-bold text-yellow-600 tracking-[0.2em] uppercase mb-2">{report.identity.brand}</h2>
                    <h1 className="serif text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">{report.identity.model}</h1>
                    <div className="flex flex-wrap gap-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                        <span className="bg-gray-100 border border-gray-200 px-3 py-1 rounded-full">Ref: {report.identity.referenceNumber || 'N/A'}</span>
                        <span className="bg-gray-100 border border-gray-200 px-3 py-1 rounded-full">Era: {report.identity.estimatedYear || 'Unknown'}</span>
                    </div>
                 </div>

                 {/* Financial Card - High Contrast */}
                 <div className="bg-[#1a1c23] text-white p-6 rounded-2xl shadow-xl relative overflow-hidden border border-gray-800">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    
                    <div className="grid grid-cols-3 gap-4 relative z-10 border-b border-gray-700/50 pb-6 mb-6">
                        <div className="col-span-1">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Original Retail (MSRP)</p>
                            <p className="text-sm text-gray-300 font-medium font-mono">
                                {report.marketData.retailPrice ? formatCurrency(report.marketData.retailPrice, report.marketData.currency) : 'N/A'}
                            </p>
                        </div>
                        <div className="col-span-1 border-l border-gray-700/50 pl-4">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Purchase Price</p>
                            <p className="text-lg text-white font-bold font-mono">{formatCurrency(report.purchasePrice, report.marketData.currency)}</p>
                        </div>
                        <div className="col-span-1 border-l border-gray-700/50 pl-4">
                             <p className="text-[10px] text-yellow-500 uppercase tracking-wider mb-2 font-bold">Second Market Price</p>
                             <p className="text-xl text-yellow-400 font-bold serif">{formatCurrency(report.marketData.averagePrice, report.marketData.currency)}</p>
                             <p className="text-[9px] text-gray-500 mt-1 uppercase tracking-tight font-medium">
                                via {report.marketData.priceSource || 'Market Aggregates'} • {report.date}
                             </p>
                        </div>
                    </div>
                    
                    <div className="flex justify-between items-end relative z-10">
                        <div>
                             <p className="text-xs text-gray-400 mb-1">Performance (P/L)</p>
                             <div className={`flex items-baseline gap-2 ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                                <span className="text-3xl font-serif font-bold">{isProfit ? '+' : ''}{formatCurrency(profit, report.marketData.currency)}</span>
                             </div>
                        </div>
                        <div className={`px-4 py-1.5 rounded-lg text-sm font-bold border tracking-wider ${isProfit ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                            ROI {roi}%
                        </div>
                    </div>
                 </div>
            </div>
        </div>

        {/* SECONDARY SECTION: Analysis Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-t border-gray-100 pt-10">
            
            {/* Left Col: Market Insights */}
            <div className="space-y-8">
                {/* Trend Indicator */}
                <div className="flex items-center gap-4 bg-gray-50 p-5 rounded-xl border border-gray-100">
                    <div className={`p-3 rounded-full ${
                        report.marketData.trend === 'rising' ? 'bg-green-100 text-green-600' : 
                        report.marketData.trend === 'falling' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                        {report.marketData.trend === 'rising' && <TrendingUp size={24}/>}
                        {report.marketData.trend === 'falling' && <TrendingDown size={24}/>}
                        {report.marketData.trend === 'stable' && <Minus size={24}/>}
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Market Trend</p>
                        <p className="font-serif font-bold text-gray-900 text-xl capitalize">{report.marketData.trend} Market</p>
                    </div>
                </div>

                {/* Text Content */}
                <div>
                    <h3 className="serif text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-yellow-500 block rounded-full"></span>
                        AI Market Analysis
                    </h3>
                    <div className="space-y-4 text-gray-600 text-sm leading-7 text-justify font-sans">
                        <p className="first-letter:text-2xl first-letter:font-serif first-letter:text-gray-900 first-letter:mr-1 first-letter:float-left">
                            {report.marketData.history}
                        </p>
                        <p>{report.marketData.reviewsSummary}</p>
                    </div>
                </div>
            </div>

            {/* Right Col: Secondary Visuals & Pros/Cons */}
            <div className="space-y-6">
                 {/* Secondary Images Grid */}
                 {report.imageUrls.length > 1 && (
                    <div className="grid grid-cols-3 gap-3 mb-2">
                        {report.imageUrls.slice(1, 4).map((url, i) => (
                             <div key={i} className="aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center relative">
                                <div 
                                    className="absolute inset-0 bg-cover bg-center blur-sm opacity-30"
                                    style={{ backgroundImage: `url(${url})` }}
                                ></div>
                                <img src={url} alt={`Detail ${i}`} className="relative z-10 w-full h-full object-contain p-1" />
                             </div>
                        ))}
                    </div>
                 )}

                 {/* Pros / Cons List */}
                 <div className="space-y-4">
                     {/* Pros */}
                     <div className="bg-green-50/40 p-5 rounded-xl border border-green-100/50">
                        <h4 className="text-green-800 font-bold text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                            <ThumbsUp size={14} className="fill-green-600 text-green-600" /> Key Highlights
                        </h4>
                        <ul className="space-y-2">
                            {report.marketData.pros.map((p, i) => (
                                <li key={i} className="text-sm text-green-900 flex items-start gap-2">
                                    <span className="text-green-500 mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"></span> 
                                    <span className="leading-snug">{p}</span>
                                </li>
                            ))}
                        </ul>
                     </div>
                     
                     {/* Cons */}
                     <div className="bg-red-50/40 p-5 rounded-xl border border-red-100/50">
                        <h4 className="text-red-800 font-bold text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                            <ThumbsDown size={14} className="fill-red-600 text-red-600" /> Market Considerations
                        </h4>
                        <ul className="space-y-2">
                            {report.marketData.cons.map((c, i) => (
                                <li key={i} className="text-sm text-red-900 flex items-start gap-2">
                                    <span className="text-red-500 mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span> 
                                    <span className="leading-snug">{c}</span>
                                </li>
                            ))}
                        </ul>
                     </div>
                 </div>
            </div>
        </div>

        {/* Footer: Sources */}
        <div className="border-t border-gray-100 pt-6 mt-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="max-w-lg">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Data Sources (Google Search Grounding)</h4>
              <ul className="flex flex-wrap gap-x-4 gap-y-1">
                {report.marketData.sources.slice(0, 3).map((source, idx) => (
                  <li key={idx} className="text-[10px] text-gray-500 truncate max-w-[200px]">
                    <a href={source.uri} target="_blank" rel="noreferrer" className="hover:text-blue-600 hover:underline">
                      [{idx + 1}] {source.title}
                    </a>
                  </li>
                ))}
              </ul>
          </div>
          
          <div className="flex items-center gap-2 text-yellow-600/50">
             <CheckCircle2 size={14} />
             <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Verified by Horology AI</span>
          </div>
        </div>
      </div>
    </div>
  );
};