/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, 
  Sparkles, 
  Download, 
  RefreshCw, 
  Image as ImageIcon, 
  ArrowRight,
  Loader2,
  CheckCircle2,
  Info,
  Upload,
  X
} from "lucide-react";
import { brainstormLogoConcepts, generateLogoImage, LogoConcept } from "./lib/gemini";

interface GeneratedLogo extends LogoConcept {
  imageUrl?: string;
  status: "idle" | "brainstorming" | "generating" | "ready" | "error";
  error?: string;
}

interface ReferenceImage {
  data: string;
  mimeType: string;
  preview: string;
}

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [referenceImage, setReferenceImage] = useState<ReferenceImage | null>(null);
  const [logos, setLogos] = useState<GeneratedLogo[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewedLogo, setViewedLogo] = useState<GeneratedLogo | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const [header, data] = base64.split(",");
        const mimeType = header.match(/:(.*?);/)?.[1] || "image/png";
        setReferenceImage({
          data,
          mimeType,
          preview: base64
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isProcessing) return;

    setIsProcessing(true);
    setLogos([]); 

    try {
      // Step 1: Brainstorm concepts with optional image
      const concepts = await brainstormLogoConcepts(
        prompt, 
        referenceImage ? { data: referenceImage.data, mimeType: referenceImage.mimeType } : undefined
      );
      
      const initialLogos: GeneratedLogo[] = concepts.map(c => ({
        ...c,
        status: "generating"
      }));
      setLogos(initialLogos);

      await Promise.all(
        initialLogos.map(async (logo) => {
          try {
            const imageUrl = await generateLogoImage(logo.prompt);
            setLogos(prev => 
              prev.map(p => p.id === logo.id ? { ...p, imageUrl, status: "ready" } : p)
            );
          } catch (err) {
            console.error(`Error generating image for ${logo.concept}:`, err);
            setLogos(prev => 
              prev.map(p => p.id === logo.id ? { ...p, status: "error", error: "Generation failed" } : p)
            );
          }
        })
      );
    } catch (err) {
      console.error("Brainstorming failed:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = (imageUrl: string, name: string) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `${name.replace(/\s+/g, "_")}_logo.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/5 bg-black/20 backdrop-blur-md px-6 py-4 flex justify-center items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-orange-500 to-orange-400 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-black" />
          </div>
          <span className="font-bold text-xl tracking-tight">Thùy Trang <span className="text-orange-500">Media</span></span>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Hero & Input */}
          <div className="lg:col-span-4 lg:sticky lg:top-24">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-4xl md:text-5xl font-bold mb-6 tracking-tighter leading-tight"
            >
              Tạo <span className="text-orange-500 italic">bộ logo</span> hàng loạt ngay lập tức
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-white/40 text-base mb-8 leading-relaxed"
            >
              Chỉ cần nhập ý tưởng của bạn, AI sẽ đề xuất nhiều concept logo khác nhau và tạo hình ảnh chất lượng cao cho từng cái.
            </motion.p>

            <motion.form 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onSubmit={handleGenerate}
              className="space-y-4"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
              
              <div className="space-y-4">
                <div className="relative group">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ví dụ: Tiệm cà phê hiện đại phong cách tối giản..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 min-h-[120px] text-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all placeholder:text-white/20 resize-none"
                    disabled={isProcessing}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex-1 h-14 rounded-xl flex items-center justify-center gap-3 transition-all ${referenceImage ? 'bg-orange-500/20 text-orange-500 border border-orange-500/30' : 'bg-white/5 text-white/40 hover:bg-white/10 border border-white/5'}`}
                    disabled={isProcessing}
                  >
                    <Upload className="w-5 h-5" />
                    <span className="text-sm font-bold uppercase tracking-wider">{referenceImage ? 'Đã chọn ảnh' : 'Ảnh mẫu'}</span>
                  </button>
                  
                  <button
                    type="submit"
                    disabled={isProcessing || !prompt.trim()}
                    className="flex-[2] bg-orange-500 hover:bg-orange-400 disabled:bg-white/10 disabled:text-white/30 text-black font-bold h-14 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-orange-500/20"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <span>Tạo logo ngay</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>

                {/* Reference Image Preview */}
                <AnimatePresence>
                  {referenceImage && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-3 bg-orange-500/5 border border-orange-500/10 rounded-xl p-3"
                    >
                      <div className="relative w-12 h-12">
                        <img 
                          src={referenceImage.preview} 
                          alt="Reference" 
                          className="w-full h-full object-cover rounded-lg border border-white/10" 
                        />
                        <button 
                          type="button"
                          onClick={() => setReferenceImage(null)}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center p-1 hover:bg-red-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-orange-500 uppercase tracking-widest">Ảnh mẫu đã chọn</p>
                        <p className="text-[10px] text-white/40">AI sẽ học theo phong cách của ảnh này</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.form>

            <div className="mt-12">
              <h4 className="text-[10px] uppercase font-bold text-white/20 tracking-widest mb-4">Gợi ý chủ đề:</h4>
              <div className="flex flex-wrap gap-2">
                {[
                  "Startup xanh",
                  "Thời trang nam",
                  "App fitness",
                  "Đồ ăn vặt"
                ].map((s) => (
                  <button
                    key={s}
                    onClick={() => setPrompt(s)}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-4 py-2 text-xs text-white/40 hover:text-white transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Experience / Results */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {logos.length > 0 ? (
                <motion.div 
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  {logos.map((logo, index) => (
                    <motion.div
                      key={logo.id}
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="group relative bg-white/5 rounded-3xl border border-white/10 overflow-hidden hover:border-orange-500/30 transition-all hover:bg-white/[0.07]"
                    >
                      <div className="aspect-square relative flex items-center justify-center p-4 min-h-[300px]">
                        {logo.status === "generating" ? (
                          <div className="flex flex-col items-center gap-3">
                            <div className="relative">
                              <div className="w-12 h-12 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                              <ImageIcon className="absolute inset-0 m-auto w-5 h-5 text-white/20" />
                            </div>
                            <span className="text-xs font-mono text-white/40 animate-pulse uppercase tracking-wider">Đang vẽ...</span>
                          </div>
                        ) : logo.status === "error" ? (
                          <div className="text-center p-4">
                            <Info className="w-8 h-8 text-red-500 mx-auto mb-2" />
                            <p className="text-sm text-white/40">Lỗi tạo ảnh</p>
                          </div>
                        ) : (
                          <motion.img
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            src={logo.imageUrl}
                            alt={logo.concept}
                            className="w-full h-full object-cover rounded-xl shadow-2xl"
                            referrerPolicy="no-referrer"
                          />
                        )}

                        {/* Hover Overlay */}
                        {logo.status === "ready" && (
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                            <button 
                              onClick={() => handleDownload(logo.imageUrl!, logo.concept)}
                              className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black hover:scale-110 transition-transform active:scale-95"
                              title="Tải về"
                            >
                              <Download className="w-6 h-6" />
                            </button>
                            <button 
                              onClick={() => setViewedLogo(logo)}
                              className="text-xs font-bold uppercase tracking-widest hover:text-orange-500 transition-colors"
                            >
                              Xem chi tiết
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="p-5 border-t border-white/10 min-h-[110px]">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-lg leading-tight">{logo.concept}</h3>
                          <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-white/60 font-mono uppercase shrink-0">
                            {logo.style}
                          </span>
                        </div>
                        <p className="text-white/40 text-[11px] line-clamp-2 leading-relaxed">
                          {logo.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : isProcessing ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-32 rounded-3xl border border-white/5 bg-white/[0.02]"
                >
                  <div className="relative mb-6">
                    <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
                    <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-white animate-pulse" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Đang liên tưởng ý tưởng...</h3>
                  <p className="text-white/30 max-w-sm text-center">Chúng tôi đang phân tích yêu cầu của bạn để phác thảo các bản nháp logo tuyệt vời nhất.</p>
                </motion.div>
              ) : (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="relative group h-full min-h-[500px] rounded-[3rem] border border-white/5 bg-white/[0.01] flex flex-col items-center justify-center p-12 text-center"
                >
                  <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8 border border-white/5">
                    <ImageIcon className="w-10 h-10 text-white/10" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Sẵn sàng khởi tạo?</h3>
                  <p className="text-white/30 max-w-md mx-auto leading-relaxed">
                    Hãy điền mô tả ở bảng bên trái hoặc tải lên một mẫu ảnh bạn thích. Chúng tôi sẽ xử lý phần còn lại.
                  </p>
                  
                  {/* Visual Hint */}
                  <div className="absolute top-12 right-12 w-32 h-32 bg-orange-500/5 blur-3xl rounded-full" />
                  <div className="absolute bottom-12 left-12 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Detail Modal */}
      <AnimatePresence>
        {viewedLogo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl"
            onClick={() => setViewedLogo(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#111] border border-white/10 rounded-[2.5rem] max-w-4xl w-full p-8 md:p-12 overflow-hidden relative shadow-2xl"
            >
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="relative group cursor-zoom-in">
                  <img 
                    src={viewedLogo.imageUrl} 
                    alt={viewedLogo.concept} 
                    className="w-full h-full object-cover rounded-3xl shadow-2xl"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 right-4 bg-black/50 backdrop-blur px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest text-white/60">
                    Phong cách Vector
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="bg-orange-500/20 text-orange-500 text-[10px] uppercase font-black px-3 py-1 rounded-full tracking-widest">
                      {viewedLogo.style}
                    </span>
                  </div>
                  <h2 className="text-4xl font-bold mb-6 tracking-tight">{viewedLogo.concept}</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[10px] uppercase font-bold text-white/30 tracking-widest mb-2 flex items-center gap-2">
                        <Sparkles className="w-3 h-3" /> Ý tưởng sáng tạo
                      </h4>
                      <p className="text-white/70 leading-relaxed italic bg-white/5 p-4 rounded-2xl border border-white/5">
                        "{viewedLogo.description}"
                      </p>
                    </div>
                    
                    <div className="flex gap-4 pt-4">
                      <button 
                        onClick={() => handleDownload(viewedLogo.imageUrl!, viewedLogo.concept)}
                        className="flex-1 bg-white text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-orange-500 transition-colors"
                      >
                        <Download className="w-5 h-5" />
                        Tải logo bản gốc
                      </button>
                      <button 
                        onClick={() => setViewedLogo(null)}
                        className="bg-white/5 text-white/60 font-bold px-8 py-4 rounded-2xl hover:bg-white/10 hover:text-white transition-colors"
                      >
                        Đóng
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="relative z-10 border-t border-white/5 px-6 py-12 text-center text-white/20 text-sm">
        <p>© 2026 Thùy Trang Media • Powered by Gemini 2.5 Flash</p>
      </footer>
    </div>
  );
}
