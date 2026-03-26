export interface WineData {
  id: string;
  name: string;
  country: string;
  type: string;
  volume9L: number;
  fobTotal: number;
  fobUnit: number;
  segment: 'Popular' | 'Low' | 'Super Premium' | 'Ultra Premium';
  importer: string;
  winery?: string;
  region?: string;
  globalPrice?: string;
  rating?: string;
  style?: string;
}

export interface MarketAnalysis {
  portfolioClassification: {
    premiumScale: string[];
    premiumNiche: string[];
    ultraLuxury: string[];
  };
  objectiveObservations: {
    volume: string;
    price: string;
    mix: string;
  };
  validInferences: string[];
  analysisLimitations: string[];
  modelUsed?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tableData?: any[];
  chartData?: {
    type: 'bar' | 'pie' | 'treemap' | 'chord' | 'map';
    data: any[];
    dataKey: string;
    nameKey: string;
    title?: string;
  };
  timestamp: number;
  modelUsed?: string;
}
