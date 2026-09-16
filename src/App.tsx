import React, { useState, useEffect, useRef } from 'react';
import { AnalysisResult, HistoryItem } from './types';
import { ResultCard } from './components/ResultCard';
import { PWAInstallButton } from './components/PWAInstallButton';
import { Shield, ArrowRight, AlertTriangle, Loader2, Sparkles, MessageSquare, Calculator, Eye, FileText, ChevronRight, History, Camera, Search, ScanFace } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const quemEFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('perai_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse history');
      }
    }
  }, []);

  const saveToHistory = (text: string, res: AnalysisResult) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      input: text,
      result: res
    };
    const updatedHistory = [newItem, ...history].slice(0, 50); // Keep last 50
    setHistory(updatedHistory);
    localStorage.setItem('perai_history', JSON.stringify(updatedHistory));
  };

  const handleAnalyze = async (overrideInput?: string, overrideImage?: string) => {
    const textToAnalyze = overrideInput || input;
    if (!textToAnalyze.trim() && !overrideImage) return;
    
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: textToAnalyze || 'Analise a imagem em anexo.', type: 'text', image: overrideImage }),
      });

      if (!response.ok) {
        let errorMessage = 'Falha na análise. Tente novamente.';
        try {
          const errData = await response.json();
          if (errData.error) {
            errorMessage = errData.error;
          }
        } catch (e) {
          // ignore parse error
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setResult(data);
      saveToHistory(textToAnalyze, data);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro inesperado.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleQuickAction = (template: string) => {
    setInput(template);
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const handleGolpeDoDia = (isScam: boolean) => {
    // For now, simulate analyzing the "Golpe do Dia" directly
    const text = `Este é o desafio do dia: "Vaga de emprego pagando R$ 4.000 para trabalhar 2h por dia curtindo vídeos." O usuário acha que é ${isScam ? 'Golpe' : 'Real'}. Por favor analise e explique o truque.`;
    handleAnalyze(text);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const prompt = 'Por favor, traduza e explique o conteúdo desta imagem para português de forma clara e simples. Se for um documento médico, explique os termos técnicos.';
        setInput(prompt);
        handleAnalyze(prompt, base64String);
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleQuemEImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const prompt = 'Pesquise na internet as informações públicas sobre a pessoa ou empresa cujos dados constam neste documento/foto. Faça um resumo da reputação, focando em segurança e legitimidade.';
        setInput(prompt);
        handleAnalyze(prompt, base64String);
      };
      reader.readAsDataURL(file);
    }
    if (quemEFileInputRef.current) quemEFileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-stone-900 font-sans selection:bg-blue-200">
      <input 
        type="file" 
        ref={fileInputRef} 
        accept="image/*" 
        capture="environment"
        className="hidden" 
        onChange={handleImageUpload} 
      />
      <input 
        type="file" 
        ref={quemEFileInputRef} 
        accept="image/*" 
        capture="environment"
        className="hidden" 
        onChange={handleQuemEImageUpload} 
      />
      <header className="bg-[#FDFCFB]/80 backdrop-blur-md sticky top-0 w-full z-20 border-b border-stone-100">
        <div className="max-w-3xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => { setShowHistory(false); setResult(null); setInput(''); }}>
            <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center group-hover:scale-105 transition-transform shadow-md">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-black">Peraí</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => { setShowHistory(!showHistory); setResult(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-colors ${showHistory ? 'bg-stone-200 text-stone-900' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
            >
              <History className="w-4 h-4" /> Histórico
            </button>
            <PWAInstallButton />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 pt-10 pb-20">
        <AnimatePresence mode="wait">
          {showHistory ? (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-6 w-full"
            >
              <h2 className="text-3xl font-extrabold text-stone-900 tracking-tight">Histórico de Análises</h2>
              {history.length === 0 ? (
                <div className="text-center py-20 text-stone-500">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="font-medium text-lg">Nenhum histórico salvo ainda.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {history.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => {
                        setResult(item.result);
                        setInput(item.input);
                        setShowHistory(false);
                      }}
                      className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="bg-stone-100 text-stone-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                          {item.result.analysisMode === 'decision' ? 'Golpe/Decisão' :
                           item.result.analysisMode === 'translation' ? 'Tradução' :
                           item.result.analysisMode === 'calculation' ? 'Cálculo' :
                           item.result.analysisMode === 'post_review' ? 'Antes de Postar' : 'Mensagem'}
                        </span>
                        <span className="text-xs font-medium text-stone-400">
                          {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <h3 className="font-bold text-stone-800 text-lg line-clamp-1 mb-1">{item.result.summary}</h3>
                      <p className="text-stone-500 text-sm line-clamp-2">"{item.input}"</p>
                    </div>
                  ))}
                  
                  <button 
                    onClick={() => {
                      localStorage.removeItem('perai_history');
                      setHistory([]);
                    }}
                    className="mt-6 text-sm font-bold text-stone-400 hover:text-red-500 transition-colors mx-auto"
                  >
                    Limpar Histórico
                  </button>
                </div>
              )}
            </motion.div>
          ) : !result && !isAnalyzing ? (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-10 w-full"
            >
              {/* Daily Challenge */}
              <section className="relative overflow-hidden bg-gradient-to-br from-indigo-900 to-indigo-950 rounded-[2rem] p-8 shadow-xl text-white">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Sparkles className="w-32 h-32" />
                </div>
                <div className="relative z-10 flex flex-col items-start gap-4">
                  <span className="bg-indigo-500/30 text-indigo-100 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-sm border border-indigo-400/30">
                    O Golpe do Dia
                  </span>
                  <div>
                    <h2 className="text-3xl font-extrabold tracking-tight mb-2">Golpe ou Real?</h2>
                    <p className="text-indigo-200 text-lg max-w-md leading-relaxed">
                      "Vaga de emprego pagando R$ 4.000 para trabalhar 2h por dia curtindo vídeos."
                    </p>
                  </div>
                  <div className="flex gap-3 mt-2">
                    <button onClick={() => handleGolpeDoDia(true)} className="bg-white text-indigo-950 px-6 py-3 rounded-full font-bold hover:bg-indigo-50 transition-colors shadow-lg">É Golpe</button>
                    <button onClick={() => handleGolpeDoDia(false)} className="bg-indigo-800 text-white border border-indigo-600 px-6 py-3 rounded-full font-bold hover:bg-indigo-700 transition-colors">É Real</button>
                  </div>
                </div>
              </section>

              {/* Quick Actions Grid */}
              <section>
                <h3 className="text-xl font-bold text-stone-900 mb-4 px-2">O que você precisa resolver hoje?</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  <button onClick={() => fileInputRef.current?.click()} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm hover:border-orange-300 hover:shadow-md transition-all flex flex-col items-center gap-3 text-center group">
                    <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Camera className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-stone-800 text-sm leading-tight">Traduzir<br/>Imagem</span>
                  </button>

                  <button onClick={() => handleQuickAction('Preciso que você traduza o seguinte documento/contrato:\n\n')} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all flex flex-col items-center gap-3 text-center group">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FileText className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-stone-800 text-sm leading-tight">Traduzir<br/>Documento</span>
                  </button>
                  
                  <button onClick={() => handleQuickAction('Gere uma mensagem difícil para a seguinte situação:\n\n')} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm hover:border-purple-300 hover:shadow-md transition-all flex flex-col items-center gap-3 text-center group">
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-stone-800 text-sm leading-tight">Escrever<br/>Mensagem</span>
                  </button>

                  <button onClick={() => handleQuickAction('Calcule o rateio desta conta com base nas seguintes regras:\n\n')} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all flex flex-col items-center gap-3 text-center group">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Calculator className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-stone-800 text-sm leading-tight">Dividir<br/>Conta</span>
                  </button>

                  <button onClick={() => handleQuickAction('Revise o rascunho deste post antes de eu publicar para ver se tem dados sensíveis expostos:\n\n')} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all flex flex-col items-center gap-3 text-center group">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Eye className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-stone-800 text-sm leading-tight">Antes de<br/>Postar</span>
                  </button>

                  <button onClick={() => handleQuickAction('Pesquise na internet as informações públicas sobre a seguinte pessoa ou empresa (nome/documento) e faça um resumo da sua reputação, focando em segurança e legitimidade:\n\n')} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm hover:border-rose-300 hover:shadow-md transition-all flex flex-col items-center gap-3 text-center group">
                    <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Search className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-stone-800 text-sm leading-tight">Quem é?<br/>(Texto)</span>
                  </button>

                  <button onClick={() => quemEFileInputRef.current?.click()} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm hover:border-rose-300 hover:shadow-md transition-all flex flex-col items-center gap-3 text-center group">
                    <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <ScanFace className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-stone-800 text-sm leading-tight">Quem é?<br/>(Foto)</span>
                  </button>
                </div>
              </section>

              {/* Main Input */}
              <section className="flex flex-col items-center w-full mt-4">
                <div className="w-full bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-stone-200 overflow-hidden focus-within:ring-4 focus-within:ring-black/5 transition-all">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Cole qualquer proposta, conta, texto ou link aqui para análise..."
                    className="w-full min-h-[160px] p-8 text-xl resize-none outline-none placeholder:text-stone-300 font-medium"
                    aria-label="Conteúdo para analisar"
                  />
                  <div className="bg-stone-50 p-4 flex justify-between items-center border-t border-stone-100">
                    <p className="text-sm font-medium text-stone-400 px-4 hidden sm:block">Motor de Análise Peraí ativado.</p>
                    <button
                      onClick={() => handleAnalyze()}
                      disabled={!input.trim()}
                      className="bg-black hover:bg-stone-800 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed text-white px-8 py-3.5 rounded-full font-bold text-base flex items-center gap-2 transition-colors ml-auto shadow-sm"
                    >
                      Analisar <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="mt-8 p-6 bg-[#FFF4F2] text-[#D93025] border border-[#FCE8E6] rounded-2xl flex items-center gap-4 w-full font-medium shadow-sm">
                    <AlertTriangle className="w-6 h-6 shrink-0" />
                    <p className="text-lg">{error}</p>
                  </div>
                )}
              </section>

              {/* Fact of the week */}
              <section className="bg-stone-100 p-6 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-stone-500">Fato da Semana</span>
                  <p className="font-semibold text-stone-800">A técnica mais usada nos últimos 7 dias foi <strong>"Urgência Fabricada"</strong>.</p>
                </div>
                <button className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">Entender <ChevronRight className="w-4 h-4" /></button>
              </section>

            </motion.div>
          ) : isAnalyzing ? (
            <motion.div 
              key="loading-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-40"
            >
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mb-8 animate-pulse shadow-xl">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
              <h2 className="text-3xl font-extrabold text-stone-900 mb-4 tracking-tight">Decodificando...</h2>
              <p className="text-xl text-stone-500 text-center max-w-sm font-medium">Lendo contexto, procurando padrões e gerando resposta.</p>
            </motion.div>
          ) : (
            result && (
              <ResultCard 
                key="result-view" 
                input={input}
                result={result} 
                onReset={() => {
                  setResult(null);
                  setInput('');
                }} 
              />
            )
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
