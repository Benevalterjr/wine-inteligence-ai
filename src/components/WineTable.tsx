import React from 'react';
import { WineData } from '../types';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export const WineTable: React.FC<{ data: WineData[] }> = ({ data }) => {
  return (
    <div className="overflow-x-auto rounded-[2rem] border border-border/50 bg-card shadow-xl shadow-border/20">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-border/50 bg-muted/30">
            <th className="p-6 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Vinho</th>
            <th className="p-6 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">País</th>
            <th className="p-6 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Tipo</th>
            <th className="p-6 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground text-right">Volume (9L)</th>
            <th className="p-6 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground text-right">FOB Unit</th>
            <th className="p-6 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground text-center">Segmento</th>
            <th className="p-6 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Importador</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {data.map((wine, idx) => (
            <motion.tr 
              key={wine.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="hover:bg-muted/20 transition-colors group"
            >
              <td className="p-6 text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{wine.name}</td>
              <td className="p-6 text-sm text-muted-foreground">{wine.country}</td>
              <td className="p-6 text-sm text-muted-foreground">{wine.type}</td>
              <td className="p-6 text-sm font-mono text-right font-medium">{wine.volume9L.toLocaleString()}</td>
              <td className="p-6 text-sm font-mono text-right font-medium text-primary">${wine.fobUnit.toFixed(2)}</td>
              <td className="p-6 text-center">
                <span className={cn(
                  "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                  wine.segment.includes('Luxo') || wine.segment.includes('Ultra') ? 'bg-primary/10 text-primary border-primary/20' :
                  wine.segment.includes('Premium') ? 'bg-accent text-primary border-primary/10' :
                  'bg-muted text-muted-foreground border-border'
                )}>
                  {wine.segment}
                </span>
              </td>
              <td className="p-6 text-sm text-muted-foreground">{wine.importer}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
