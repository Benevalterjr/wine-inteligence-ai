import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wine, 
  Search, 
  BarChart3, 
  Table as TableIcon, 
  BrainCircuit, 
  Globe2, 
  Download, 
  Sparkles,
  Loader2,
  AlertCircle,
  Trash2,
  MessageSquare
} from 'lucide-react';
import { parseAndAnalyzeWineData } from './services/geminiService';
import { WineData, MarketAnalysis } from './types';
import { DashboardCharts } from './components/DashboardCharts';
import { WineTable } from './components/WineTable';
import { AIInsights } from './components/AIInsights';
import { WebEnrichment } from './components/WebEnrichment';
import { ChatTab } from './components/ChatTab';
import { cn } from './lib/utils';

const EXAMPLE_DATA = `2204.21.00 | VINHO TINTO | CHILE | CONCHA Y TORO | CASILLERO DEL DIABLO CABERNET | 750ML | 12 UN | 5000 CASES | 125000.00 FOB | IMPORTADORA VCT
2204.21.00 | VINHO TINTO | ARGENTINA | CATENA ZAPATA | NICOLAS CATENA ZAPATA | 750ML | 6 UN | 200 CASES | 48000.00 FOB | MISTRAL
2204.10.10 | ESPUMANTE | FRANCA | MOET & CHANDON | IMPERIAL BRUT | 750ML | 6 UN | 1000 CASES | 220000.00 FOB | LVMH
2204.21.00 | VINHO BRANCO | ITALIA | ANTINORI | CERVARO DELLA SALA | 750ML | 6 UN | 300 CASES | 45000.00 FOB | WINE.COM
2204.21.00 | VINHO TINTO | PORTUGAL | HERDADE DO ESPORAO | ESPORAO RESERVA | 750ML | 6 UN | 2500 CASES | 150000.00 FOB | QUALIMIMP`;

export default function App() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<{ wines: WineData[], analysis: MarketAnalysis } | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'table' | 'insights' | 'web' | 'chat'>('dashboard');

  const handleAnalyze = async () => {
    if (!input.trim()) {
      setError('Por favor, insira dados para análise.');
      return;
    }

    if (input.length > 50000) {
      setError('O volume de dados é muito grande para uma única análise. Por favor, reduza o texto para menos de 50.000 caracteres.');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const data = await parseAndAnalyzeWineData(input);
      setResults(data);
      setActiveTab('dashboard');
    } catch (err: any) {
      let errorMessage = 'Erro ao processar os dados. Verifique o formato e tente novamente.';
      
      if (err?.message?.includes('429') || err?.message?.includes('RESOURCE_EXHAUSTED')) {
        errorMessage = 'Limite de uso da IA atingido. Por favor, aguarde alguns instantes ou verifique sua cota da API.';
      }
      
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setInput('');
    setResults(null);
    setError(null);
  };

  const handleExport = () => {
    if (!results) return;
    const csv = [
      ['Nome', 'País', 'Tipo', 'Volume (9L)', 'FOB Unit', 'Segmento', 'Importador'],
      ...results.wines.map(w => [w.name, w.country, w.type, w.volume9L, w.fobUnit, w.segment, w.importer])
    ].map(e => e.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wine-intelligence-export.csv';
    a.click();
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 rotate-3">
              <Wine className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight text-foreground">Wine Intelligence <span className="text-primary">AI</span></h1>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Senior Market Analysis</p>
            </div>
          </div>
          
          <div className="hidden sm:flex items-center gap-6">
            <button className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Insights</button>
            <button className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Portfólio</button>
            <button className="bg-primary/10 text-primary px-5 py-2.5 rounded-2xl font-bold text-sm hover:bg-primary hover:text-white transition-all duration-300">
              Acessar Pro
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {/* Hero Section */}
        <section className="relative space-y-8 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-accent text-primary text-[10px] font-bold uppercase tracking-widest mb-2">
              Powered by Gemini 3.1 Pro
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-foreground">
              Decodifique o Mercado de <span className="text-primary italic">Vinhos</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Transforme dados brutos de importação em inteligência estratégica. Análise de canais, pricing e posicionamento em segundos.
            </p>
          </motion.div>

          <div className="relative group max-w-3xl mx-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/50 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-card border border-border/50 rounded-[2rem] p-2 shadow-2xl overflow-hidden">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Cole aqui as linhas de importação (NCM, Descrição, FOB, etc)..."
                className="w-full h-56 bg-transparent border-none rounded-2xl p-6 text-sm font-mono focus:ring-0 outline-none transition-all resize-none"
              />
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-muted/30 rounded-b-[1.8rem] border-t border-border/50">
                <div className="flex gap-2">
                  <button 
                    onClick={() => setInput(EXAMPLE_DATA)}
                    className="text-[10px] uppercase font-bold text-muted-foreground hover:text-primary px-4 py-2 rounded-xl border border-border/50 bg-card transition-all hover:shadow-md"
                  >
                    Exemplo Real
                  </button>
                  {input && (
                    <button 
                      onClick={handleClear}
                      className="flex items-center gap-2 text-[10px] uppercase font-bold text-destructive hover:bg-destructive/10 px-4 py-2 rounded-xl border border-destructive/20 bg-card transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                      Limpar
                    </button>
                  )}
                </div>
                <button 
                  onClick={handleAnalyze}
                  disabled={isLoading}
                  className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-2xl font-bold text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-primary/20 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {isLoading ? 'Analisando...' : 'Gerar Inteligência'}
                </button>
              </div>
            </div>
          </div>

          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-muted-foreground animate-pulse"
            >
              Isso pode levar até 60 segundos dependendo do volume de dados...
            </motion.div>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center gap-2 text-destructive font-medium text-sm"
            >
              <AlertCircle className="w-4 h-4" />
              {error}
            </motion.div>
          )}
        </section>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {results && (
            <motion.section 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {/* Tabs Navigation */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
                <nav className="flex gap-1 bg-muted/30 p-1 rounded-xl border border-border">
                  {[
                    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
                    { id: 'table', label: 'Tabela', icon: TableIcon },
                    { id: 'insights', label: 'Insights AI', icon: BrainCircuit },
                    { id: 'web', label: 'Enriquecimento Web', icon: Globe2 },
                    { id: 'chat', label: 'Chat Analista', icon: MessageSquare },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
                        activeTab === tab.id 
                          ? "bg-card text-primary shadow-sm" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <tab.icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  ))}
                </nav>

                <button 
                  onClick={handleExport}
                  className="flex items-center gap-2 text-xs font-bold border border-border px-4 py-2 rounded-xl hover:bg-muted transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Exportar CSV
                </button>
              </div>

              {/* Content Area */}
              <div className="min-h-[400px]">
                {activeTab === 'dashboard' && <DashboardCharts data={results.wines} modelUsed={results.analysis.modelUsed} />}
                {activeTab === 'table' && <WineTable data={results.wines} />}
                {activeTab === 'insights' && <AIInsights analysis={results.analysis} />}
                {activeTab === 'web' && <WebEnrichment data={results.wines} />}
                {activeTab === 'chat' && <ChatTab wineData={results.wines} />}
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Wine className="text-primary w-5 h-5" />
              <span className="font-bold">Wine Intelligence AI</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              A ferramenta definitiva para importadores e analistas de mercado que buscam excelência em dados.
            </p>
          </div>
          
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-4">Produto</h4>
            <ul className="text-xs text-muted-foreground space-y-2">
              <li>Funcionalidades</li>
              <li>Preços</li>
              <li>API</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-4">Empresa</h4>
            <ul className="text-xs text-muted-foreground space-y-2">
              <li>Sobre</li>
              <li>Blog</li>
              <li>Carreiras</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-4">Legal</h4>
            <ul className="text-xs text-muted-foreground space-y-2">
              <li>Privacidade</li>
              <li>Termos</li>
              <li>Cookies</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-border flex justify-between items-center text-[10px] text-muted-foreground uppercase tracking-widest">
          <span>© 2026 Wine Intelligence AI. Todos os direitos reservados.</span>
          <div className="flex gap-4">
            <span>Status: Online</span>
            <span>v1.0.4</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
