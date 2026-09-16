import React from 'react';
import { AnalysisResult } from '../types';
import { ShieldCheck, AlertCircle, AlertTriangle, ShieldAlert, CheckCircle2, Copy, ExternalLink, Info, X, Calculator, Eye, MessageSquare, FileText } from 'lucide-react';
import { motion } from 'motion/react';

interface ResultCardProps {
  input: string;
  result: AnalysisResult;
  onReset: () => void;
}

const getRiskConfig = (level: number | null | undefined, mode: string) => {
  if (mode === 'translation') return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: FileText, color: 'text-blue-600', label: 'Decodificador Universal' };
  if (mode === 'calculation') return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', icon: Calculator, color: 'text-emerald-600', label: 'Peraí Resolve' };
  if (mode === 'post_review') return { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-800', icon: Eye, color: 'text-indigo-600', label: 'Antes de postar' };
  if (mode === 'message_gen') return { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', icon: MessageSquare, color: 'text-purple-600', label: 'Gerador de Mensagens' };

  switch (level) {
    case 1:
      return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', icon: CheckCircle2, color: 'text-emerald-600', label: 'Análise de Risco' };
    case 2:
      return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: ShieldCheck, color: 'text-blue-600', label: 'Análise de Risco' };
    case 3:
      return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', icon: AlertCircle, color: 'text-amber-600', label: 'Análise de Risco' };
    case 4:
      return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', icon: AlertTriangle, color: 'text-orange-600', label: 'Análise de Risco' };
    case 5:
      return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: ShieldAlert, color: 'text-red-600', label: 'Análise de Risco' };
    default:
      return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-800', icon: Info, color: 'text-gray-600', label: 'Análise' };
  }
};

export const ResultCard: React.FC<ResultCardProps> = ({ input, result, onReset }) => {
  const config = getRiskConfig(result.riskLevel, result.analysisMode);
  const Icon = config.icon;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto flex flex-col gap-8 pb-16"
    >
      <div className="flex justify-between items-center px-2">
         <span className="text-sm font-semibold tracking-wider text-stone-400 uppercase">{config.label}</span>
         <button onClick={onReset} className="text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors" aria-label="Nova análise">
           Nova Análise
         </button>
      </div>

      {/* Original Input */}
      <div className="w-full max-w-2xl mx-auto px-2">
        <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-2">Você enviou</h3>
        <p className="bg-stone-50 border border-stone-200 text-stone-600 p-4 rounded-xl text-base italic line-clamp-3 hover:line-clamp-none transition-all">
          "{input}"
        </p>
      </div>

      {/* Main Verdict */}
      <div className={`p-8 rounded-2xl ${config.bg} ${config.border} flex flex-col gap-6`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
             <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-6 h-6 ${config.color}`} strokeWidth={2.5} />
                {result.analysisMode === 'decision' && result.riskLevel && (
                  <span className={`font-bold tracking-wide uppercase text-sm ${config.text}`}>Nível {result.riskLevel} de 5</span>
                )}
             </div>
            <h2 className={`text-4xl font-extrabold tracking-tight ${config.text} leading-none`}>
              {result.analysisMode === 'decision' ? result.riskLabel : config.label}
            </h2>
          </div>
        </div>
        
        <p className={`text-xl leading-relaxed ${config.text} font-medium`}>
          {result.summary}
        </p>

        {result.financialImpact && (
          <div className="mt-4 pt-6 border-t border-black/10 flex flex-col">
            <span className={`text-sm font-bold uppercase tracking-widest ${config.text} opacity-70`}>Custo / Valor</span>
            <span className={`text-4xl font-extrabold mt-2 ${config.text}`}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(result.financialImpact.totalCost)}
            </span>
            <span className={`text-base mt-2 ${config.text} opacity-90`}>{result.financialImpact.description}</span>
          </div>
        )}
      </div>

      {/* Signals */}
      {result.signals && result.signals.length > 0 && (
        <section className="flex flex-col gap-4 px-2">
          <h3 className="text-2xl font-bold text-stone-900">Pontos de Atenção</h3>
          <ul className="flex flex-col gap-6 mt-2">
            {result.signals.map((signal, idx) => (
              <li key={idx} className="flex flex-col gap-3">
                {signal.quote && (
                  <blockquote className="pl-4 py-1 border-l-2 border-stone-300 text-stone-600 font-serif text-lg italic">
                    "{signal.quote}"
                  </blockquote>
                )}
                <p className="text-stone-800 text-lg leading-relaxed">{signal.explanation}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Technique */}
      {result.technique && result.technique.name && result.analysisMode === 'decision' && (
        <section className="flex flex-col gap-4 px-2 mt-4">
          <h3 className="text-2xl font-bold text-stone-900">A técnica usada com você</h3>
          <div className="flex flex-col gap-2">
            <h4 className="font-bold text-stone-900 text-xl">{result.technique.name}</h4>
            <p className="text-stone-700 text-lg leading-relaxed">{result.technique.description}</p>
          </div>
        </section>
      )}

      {/* Actions */}
      {result.actions && result.actions.length > 0 && (
        <section className="flex flex-col gap-4 px-2 mt-4">
          <h3 className="text-2xl font-bold text-stone-900">
            {result.analysisMode === 'message_gen' ? 'Sua Mensagem Pronta' : 'O que fazer agora'}
          </h3>
          <div className="flex flex-col gap-4">
            {result.actions.map((action, idx) => {
              if (action.type === 'copy') {
                return (
                  <div key={idx} className="flex flex-col gap-3 p-6 bg-stone-100 rounded-xl">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-stone-900">{action.label}</span>
                      <button 
                        onClick={() => handleCopy(action.content)}
                        className="flex items-center gap-2 text-sm font-bold text-stone-900 hover:bg-stone-200 transition-colors bg-white border border-stone-200 px-4 py-2 rounded-full shadow-sm"
                      >
                        <Copy className="w-4 h-4" /> Copiar texto
                      </button>
                    </div>
                    <p className="text-stone-700 font-mono text-base break-words mt-2">
                      {action.content}
                    </p>
                  </div>
                );
              }
              
              if (action.type === 'link') {
                return (
                  <a 
                    key={idx}
                    href={action.content}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-6 bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition-colors group"
                  >
                    <span className="font-bold text-lg">{action.label}</span>
                    <ExternalLink className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" />
                  </a>
                );
              }

              return (
                <div key={idx} className="flex flex-col gap-2 p-6 border border-stone-200 rounded-xl">
                  <span className="font-bold text-stone-900 text-lg">{action.label}</span>
                  <p className="text-stone-700 text-lg leading-relaxed">{action.content}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}
      
      <div className="mt-12 text-center pt-8">
         <p className="text-xs text-stone-400 uppercase tracking-widest mb-2 font-bold">Análise Informativa</p>
         <p className="text-sm text-stone-500 max-w-sm mx-auto leading-relaxed">
            Gerada automaticamente. Não substitui orientação profissional.
         </p>
      </div>
    </motion.div>
  );
}
