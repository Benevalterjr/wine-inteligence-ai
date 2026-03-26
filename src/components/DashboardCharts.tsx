import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis 
} from 'recharts';
import { WineData } from '../types';

const COLORS = ['#8b435c', '#b07d7d', '#d4a5a5', '#e8d5d5', '#f3e9e9'];

export const DashboardCharts: React.FC<{ data: WineData[], modelUsed?: string }> = ({ data, modelUsed }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Volume by Country
  const countryData = data.reduce((acc: any[], curr) => {
    const existing = acc.find(item => item.name === curr.country);
    if (existing) {
      existing.volume += curr.volume9L;
    } else {
      acc.push({ name: curr.country, volume: curr.volume9L });
    }
    return acc;
  }, []).sort((a, b) => b.volume - a.volume);

  // Segment Distribution
  const segmentData = data.reduce((acc: any[], curr) => {
    const existing = acc.find(item => item.name === curr.segment);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: curr.segment, value: 1 });
    }
    return acc;
  }, []);

  // Price vs Volume Scatter
  const scatterData = data.map(w => ({
    x: w.fobUnit,
    y: w.volume9L,
    name: w.name,
    z: 10
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card p-8 rounded-[2rem] border border-border/50 shadow-xl shadow-border/20 min-w-0"
      >
        <h3 className="text-[10px] font-bold text-muted-foreground mb-6 uppercase tracking-[0.2em]">Volume por País</h3>
        <div className="h-[250px] w-full relative">
          {isMounted && (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={countryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e1da" vertical={false} />
                <XAxis dataKey="name" stroke="#7c6a6a" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#7c6a6a" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e8e1da', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#2d2424', fontSize: '12px' }}
                />
                <Bar dataKey="volume" fill="#8b435c" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card p-8 rounded-[2rem] border border-border/50 shadow-xl shadow-border/20 min-w-0"
      >
        <h3 className="text-[10px] font-bold text-muted-foreground mb-6 uppercase tracking-[0.2em]">Distribuição de Segmento</h3>
        <div className="h-[250px] w-full relative">
          {isMounted && (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <Pie
                  data={segmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {segmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e8e1da', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card p-8 rounded-[2rem] border border-border/50 shadow-xl shadow-border/20 min-w-0"
      >
        <h3 className="text-[10px] font-bold text-muted-foreground mb-6 uppercase tracking-[0.2em]">Preço vs Volume</h3>
        <div className="h-[250px] w-full relative">
          {isMounted && (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e1da" />
                <XAxis type="number" dataKey="x" name="Preço FOB" unit="$" stroke="#7c6a6a" fontSize={10} />
                <YAxis type="number" dataKey="y" name="Volume" unit="cx" stroke="#7c6a6a" fontSize={10} />
                <ZAxis type="number" dataKey="z" range={[50, 400]} />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e8e1da', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Scatter name="Vinhos" data={scatterData} fill="#8b435c" />
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      {modelUsed && (
        <div className="col-span-full flex justify-end">
          <span className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-medium">
            Análise processada por: {modelUsed}
          </span>
        </div>
      )}
    </div>
  );
};
