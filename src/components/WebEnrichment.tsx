import React from 'react';
import { WineData } from '../types';
import { motion } from 'motion/react';
import { Globe, MapPin, Star, DollarSign, ExternalLink } from 'lucide-react';

export const WebEnrichment: React.FC<{ data: WineData[] }> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {data.slice(0, 9).map((wine, index) => (
        <motion.div
          key={wine.id || index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-card p-6 rounded-[2rem] border border-border/50 shadow-lg shadow-border/10 hover:shadow-xl hover:shadow-border/20 transition-all group"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="space-y-1">
              <h3 className="font-bold text-foreground group-hover:text-primary transition-colors leading-tight">{wine.name}</h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{wine.region || wine.country}</p>
            </div>
            {wine.rating && (
              <div className="bg-accent px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                <Star className="w-3 h-3 text-primary fill-primary" />
                <span className="text-xs font-black text-primary">{wine.rating}</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <Globe className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">Vinícola</p>
                <p className="text-xs font-semibold text-foreground truncate max-w-[150px]">{wine.winery || 'Não identificada'}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">Preço Global</p>
                  <p className="text-xs font-bold text-foreground">{wine.globalPrice || 'N/A'}</p>
                </div>
              </div>
              
              <button className="p-2 rounded-full bg-muted/50 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all">
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {wine.style && (
            <p className="mt-4 text-[10px] text-muted-foreground italic line-clamp-2 border-t border-border/50 pt-3">
              {wine.style}
            </p>
          )}
        </motion.div>
      ))}
    </div>
  );
};
