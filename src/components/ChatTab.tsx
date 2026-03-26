import React, { useState, useRef, useEffect } from 'react';
import { WineData, ChatMessage } from '../types';
import { chatWithWineData } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Bot, Loader2, BarChart as BarChartIcon, Table as TableIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Treemap
} from 'recharts';
import { D3Visualizations } from './D3Visualizations';

const COLORS = ['#FF6321', '#5A5A40', '#E4E3E0', '#141414', '#8E9299'];

interface ChatTabProps {
  wineData: WineData[];
}

export const ChatTab: React.FC<ChatTabProps> = ({ wineData }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatWithWineData(input, wineData, messages);
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content || 'Não foi possível gerar uma resposta.',
        tableData: response.tableData,
        chartData: response.chartData,
        timestamp: Date.now(),
        modelUsed: response.modelUsed,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error: any) {
      console.error(error);
      
      let errorMessage = 'Desculpe, ocorreu um erro ao processar sua pergunta.';
      
      if (error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
        errorMessage = 'Limite de uso atingido. Por favor, aguarde alguns instantes ou verifique sua cota da API.';
      }

      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorMessage,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-card rounded-[2rem] border border-border/50 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-bottom border-border/50 bg-muted/20 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <Bot className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Assistente de Inteligência</h2>
          <p className="text-xs text-muted-foreground">Pergunte sobre tendências, rankings ou detalhes do portfólio</p>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
            <Bot className="w-12 h-12 text-primary" />
            <div className="max-w-xs">
              <p className="text-sm font-medium">Olá! Sou seu analista de dados.</p>
              <p className="text-xs">Tente perguntar: "Quais são os 5 vinhos mais caros?" ou "Qual a distribuição por país?"</p>
            </div>
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                msg.role === 'user' ? 'bg-primary text-white' : 'bg-muted border border-border/50'
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-primary" />}
              </div>

              <div className={`max-w-[80%] space-y-4 ${msg.role === 'user' ? 'text-right' : ''}`}>
                <div className={`inline-block p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-primary text-white rounded-tr-none' 
                    : 'bg-muted/30 border border-border/30 rounded-tl-none'
                }`}>
                  <div className="markdown-body">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>

                {msg.role === 'assistant' && msg.modelUsed && (
                  <div className="px-2 flex justify-start">
                    <span className="text-[9px] text-muted-foreground/40 uppercase tracking-widest font-medium">
                      {msg.modelUsed}
                    </span>
                  </div>
                )}

                {/* Table Data */}
                {msg.tableData && msg.tableData.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-2xl border border-border/50 overflow-hidden shadow-sm"
                  >
                    <div className="p-3 bg-muted/20 border-bottom border-border/50 flex items-center gap-2">
                      <TableIcon className="w-3 h-3 text-primary" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Dados Detalhados</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-muted/10">
                            {Object.keys(msg.tableData[0]).map(key => (
                              <th key={key} className="px-4 py-2 font-bold uppercase tracking-tighter opacity-50">{key}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {msg.tableData.map((row, i) => (
                            <tr key={i} className="border-top border-border/30">
                              {Object.values(row).map((val: any, j) => (
                                <td key={j} className="px-4 py-2 font-medium">{val}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}

                {/* Chart Data */}
                {msg.chartData && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white p-6 rounded-2xl border border-border/50 shadow-sm space-y-4"
                  >
                    <div className="h-[400px] w-full relative bg-[#f8f9fa] rounded-2xl overflow-hidden shadow-inner border border-border/30">
                      {isMounted && (
                        <>
                          {msg.chartData.type === 'bar' && (
                            <div className="p-4 w-full h-full flex flex-col">
                              {msg.chartData.title && (
                                <div className="px-1 pb-2">
                                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                                    {msg.chartData.title}
                                  </span>
                                </div>
                              )}
                              <div className="flex-1">
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                  <BarChart data={msg.chartData.data}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8e1da" />
                                    <XAxis 
                                      dataKey={msg.chartData.nameKey} 
                                      fontSize={10} 
                                      tickLine={false} 
                                      axisLine={false}
                                      stroke="#7c6a6a"
                                    />
                                    <YAxis fontSize={10} tickLine={false} axisLine={false} stroke="#7c6a6a" />
                                    <Tooltip 
                                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar 
                                      dataKey={msg.chartData.dataKey} 
                                      fill="#FF6321" 
                                      radius={[4, 4, 0, 0]} 
                                    />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          )}
                          {msg.chartData.type === 'pie' && (
                            <div className="p-4 w-full h-full flex flex-col">
                              {msg.chartData.title && (
                                <div className="px-1 pb-2">
                                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                                    {msg.chartData.title}
                                  </span>
                                </div>
                              )}
                              <div className="flex-1">
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                  <PieChart>
                                    <Pie
                                      data={msg.chartData.data}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={60}
                                      outerRadius={80}
                                      paddingAngle={5}
                                      dataKey={msg.chartData.dataKey}
                                      nameKey={msg.chartData.nameKey}
                                    >
                                      {msg.chartData.data.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                      ))}
                                    </Pie>
                                    <Tooltip />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          )}
                          {msg.chartData.type === 'treemap' && (
                            <div className="w-full h-full flex flex-col">
                              {msg.chartData.title && (
                                <div className="px-5 pt-4 pb-0">
                                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                                    {msg.chartData.title}
                                  </span>
                                </div>
                              )}
                              <div className="flex-1">
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                  <Treemap
                                    data={msg.chartData.data}
                                    dataKey={msg.chartData.dataKey}
                                    nameKey={msg.chartData.nameKey}
                                    aspectRatio={4 / 3}
                                    stroke="#fff"
                                    fill="#FF6321"
                                  >
                                    <Tooltip />
                                  </Treemap>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          )}
                          {(msg.chartData.type === 'chord' || msg.chartData.type === 'map') && (
                            <div className="w-full h-full flex flex-col">
                              {msg.chartData.title && (
                                <div className="px-5 pt-4 pb-0">
                                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                                    {msg.chartData.title}
                                  </span>
                                </div>
                              )}
                              <div className="flex-1 p-4">
                                <D3Visualizations 
                                  type={msg.chartData.type} 
                                  data={msg.chartData.data} 
                                  title={msg.chartData.title} 
                                />
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-lg bg-muted border border-border/50 flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
            </div>
            <div className="bg-muted/30 border border-border/30 p-4 rounded-2xl rounded-tl-none">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-6 border-top border-border/50 bg-muted/10">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Pergunte algo sobre os dados..."
            className="w-full bg-white border border-border/50 rounded-2xl px-6 py-4 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
