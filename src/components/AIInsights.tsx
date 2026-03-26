import React from 'react';
import { MarketAnalysis } from '../types';
import { motion } from 'motion/react';
import { Brain, TrendingUp, Target, AlertCircle } from 'lucide-react';

export const AIInsights: React.FC<{ analysis: MarketAnalysis }> = ({ analysis }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Coluna 1: Classificação e Observações */}
      <div className="space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card p-8 rounded-[2rem] border border-border/50 shadow-xl shadow-border/20 space-y-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Classificação de Portfólio</h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="p-5 rounded-2xl bg-muted/20 border border-border/30">
              <h4 className="text-[10px] font-black uppercase text-primary mb-3 tracking-widest">Premium de Escala</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.portfolioClassification.premiumScale.map((m, i) => (
                  <span key={i} className="px-3 py-1 bg-white rounded-full text-xs font-medium border border-border/50 shadow-sm">
                    {m}
                  </span>
                ))}
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-muted/20 border border-border/30">
              <h4 className="text-[10px] font-black uppercase text-primary mb-3 tracking-widest">Premium de Nicho</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.portfolioClassification.premiumNiche.map((m, i) => (
                  <span key={i} className="px-3 py-1 bg-white rounded-full text-xs font-medium border border-border/50 shadow-sm">
                    {m}
                  </span>
                ))}
              </div>
            </div>
            {analysis.portfolioClassification.ultraLuxury.length > 0 && (
              <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20">
                <h4 className="text-[10px] font-black uppercase text-primary mb-3 tracking-widest">Ultra Luxury</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.portfolioClassification.ultraLuxury.map((m, i) => (
                    <span key={i} className="px-3 py-1 bg-primary text-white rounded-full text-xs font-medium shadow-sm">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card p-8 rounded-[2rem] border border-border/50 shadow-xl shadow-border/20 space-y-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Observações Objetivas</h2>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
              <h5 className="text-[9px] font-bold uppercase text-muted-foreground mb-1 tracking-widest">Volume</h5>
              <p className="text-sm font-medium text-foreground leading-relaxed">{analysis.objectiveObservations.volume}</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
              <h5 className="text-[9px] font-bold uppercase text-muted-foreground mb-1 tracking-widest">Preço</h5>
              <p className="text-sm font-medium text-foreground leading-relaxed">{analysis.objectiveObservations.price}</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
              <h5 className="text-[9px] font-bold uppercase text-muted-foreground mb-1 tracking-widest">Mix</h5>
              <p className="text-sm font-medium text-foreground leading-relaxed">{analysis.objectiveObservations.mix}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Coluna 2: Inferências e Limitações */}
      <div className="space-y-8">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-card p-8 rounded-[2rem] border border-border/50 shadow-xl shadow-border/20 h-full flex flex-col"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Inferências Válidas</h2>
          </div>

          <div className="flex-1 space-y-4">
            {analysis.validInferences.map((inf, i) => (
              <div key={i} className="flex gap-4 p-5 rounded-2xl bg-muted/30 border border-border/30">
                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <p className="text-sm font-medium text-foreground leading-relaxed">{inf}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-border/50">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Limitações da Análise</h3>
            </div>
            <ul className="space-y-2">
              {analysis.analysisLimitations.map((lim, i) => (
                <li key={i} className="text-xs text-muted-foreground flex gap-2">
                  <span className="opacity-50">•</span>
                  <span>{lim}</span>
                </li>
              ))}
            </ul>
          </div>

          {analysis.modelUsed && (
            <div className="mt-8 pt-4 border-t border-border/30 flex justify-end">
              <span className="text-[9px] text-muted-foreground/40 uppercase tracking-widest font-medium">
                Processado por: {analysis.modelUsed}
              </span>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
