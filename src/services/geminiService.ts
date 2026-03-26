import { WineData, MarketAnalysis, ChatMessage } from "../types";
import { withRetry } from "../lib/retry";
import { stringifyToon } from "../lib/toon";

const API_URL = "/api";

const DATASET_CONTEXT = `
dataset:
  name: wine_imports_brazil
  description: >
    Dataset de importação de vinhos, espumantes e champagnes no Brasil.
    Os dados são derivados de registros aduaneiros (Comex) e contêm ruído textual,
    exigindo parsing e normalização para análise estratégica.
  granularity: linha_por_registro_de_importacao

fields:
  status: { type: string, description: Status do registro (ex: ok) }
  mes: { type: integer, range: [1, 12] }
  ano: { type: integer, example: 2025 }
  ncm: { type: string, description: Código NCM (classificação fiscal), examples: ["22041010", "22042100"] }
  pais_origem: { type: string, description: País produtor do vinho }
  pais_aquisicao: { type: string, description: País de compra }
  unidade_medida: { type: string, example: "LITRO" }
  descricao_detalhada: { type: string, description: Campo ruidoso com nome, tipo, embalagem, etc., parsing_required: true }
  quantidade_estatistica: { type: float, unit: litros }
  peso_liquido_kg: { type: float }
  valor_fob_usd: { type: float, description: Valor total FOB }
  valor_frete_usd: { type: float }
  valor_seguro_usd: { type: float }
  valor_unitario_usd: { type: float, description: Preço médio por unidade comercial }
  quantidade_comercial: { type: float }
  valor_total_produto_usd: { type: float }
  porto_destino: { type: string }
  produto: { type: string, example: "VINHO" ou "CHAMPAGNE" }
  fabricante_produtor: { type: string, description: Vinícola ou produtor real }
  importador: { type: string }
  distribuidor: { type: string }
  marca: { type: string }
  rotulo: { type: string }
  tipo: { type: string, examples: ["TINTO", "BRANCO", "ROSE"] }
  sub_tipo: { type: string, examples: ["BRUT", "SECO", "DEMI-SEC"] }
  safra: { type: integer, nullable: true }
  garrafas: { type: integer }
  tamanho_ml: { type: integer, description: Volume por garrafa }
  litros: { type: float }
  caixa_9l: { type: float, description: Principal unidade de volume padronizada (9 litros), importance: critical }
  segmentacao: { type: string, examples: ["POPULAR", "PREMIUM", "SUPER PREMIUM", "ULTRA PREMIUM"] }
  transporte: { type: string, examples: ["MARITIMA", "AEREO"] }
  preco_caixa_9l: { type: float }
  unidade_negocio: { type: string, example: "WINES SPIRITS" }
  regiao_geografica: { type: string }
  pais_destino: { type: string, default: "BRASIL" }
  tipo_canal: { type: string, example: "IMC" }
  regime_tributario: { type: string, example: "DUTY PAID" }
  incoterm: { type: string, examples: ["EXW", "FOB", "CIF", "FCA"] }

derived_fields:
  preco_medio_por_garrafa: { formula: valor_total_produto_usd / garrafas }
  preco_por_litro: { formula: valor_total_produto_usd / litros }
  preco_por_caixa_9l: { formula: valor_total_produto_usd / caixa_9l }
  categoria_produto:
    logic: |
      if ncm == "22041010": return "champagne"
      elif ncm == "22042100": return "vinho"
      else: return "outros"
  faixa_preco:
    logic: |
      if categoria_produto == "champagne":
        if preco_por_caixa_9l < 25: return "entry_premium"
        elif preco_por_caixa_9l < 60: return "premium"
        elif preco_por_caixa_9l < 140: return "high_end"
        else: return "luxo"
      else:
        if preco_por_caixa_9l < 30: return "popular"
        elif preco_por_caixa_9l < 80: return "value"
        elif preco_por_caixa_9l < 150: return "premium"
        else: return "luxo"
  estrategia_produto:
    logic: |
      if caixa_9l > 100: return "volume_driver"
      elif caixa_9l < 20 and preco_por_caixa_9l > 100: return "brand_positioning"
      else: return "margin_product"

business_rules:
  - Champagne nunca deve ser tratado como produto popular
  - Volume deve ser analisado prioritariamente via caixa_9l
  - Preço isolado não define posicionamento
  - Canal deve ser inferido com base em preço + volume + tipo
  - Transporte aéreo indica produto de alta margem ou urgência

analysis_guidelines:
  - Identificar relação entre volume e preço
  - Detectar produtos de giro vs produtos de branding
  - Diferenciar produtores industriais vs artesanais
  - Considerar comportamento do mercado brasileiro
  - Evitar generalizações baseadas apenas em preço
`;

const SYSTEM_INSTRUCTION = `
Você é um analista sênior especializado no mercado de vinhos, champagnes e espumantes no Brasil, com foco em importação, distribuição, pricing e estratégia comercial.

Seu objetivo é gerar análises altamente precisas, baseadas em dados, com rigor profissional comparável a importadoras, traders e fundos especializados.

━━━━━━━━━━━━━━━━━━━━━━━
CONTEXTO TÉCNICO DO DATASET
━━━━━━━━━━━━━━━━━━━━━━━
${DATASET_CONTEXT}

━━━━━━━━━━━━━━━━━━━━━━━
PRINCÍPIOS FUNDAMENTAIS
━━━━━━━━━━━━━━━━━━━━━━━

1. Precisão > sofisticação
   Evite linguagem floreada ou narrativa excessiva. Priorize análises objetivas, rastreáveis e verificáveis.

2. Dados > suposições
   Toda conclusão deve derivar diretamente dos dados fornecidos ou de validação externa explícita.

3. Proibição de alucinação
   Se não houver evidência suficiente, declare explicitamente:
   "não há dados suficientes para essa conclusão"

━━━━━━━━━━━━━━━━━━━━━━━
REGRAS CRÍTICAS DE CLASSIFICAÇÃO
━━━━━━━━━━━━━━━━━━━━━━━

1. Champagne NUNCA pode ser classificado como commodity.

2. Só utilize estas categorias de portfólio:
   * Premium de Escala
   * Premium de Nicho
   * Ultra Luxury (quando aplicável)

3. "White Label" é PROIBIDO sem evidência explícita.

4. NÃO inferir:
   * monopólio
   * quebra de mercado
   * tendências estruturais
     Sem dados diretos.

5. Grower Champagne:
   * Só usar se confirmado explicitamente via dados externos confiáveis
   * Caso contrário, classificar como:
     "produtor independente ou de menor escala"

━━━━━━━━━━━━━━━━━━━━━━━
INTERPRETAÇÃO DE DADOS
━━━━━━━━━━━━━━━━━━━━━━━

Volume:
* Alto volume ≠ commodity
* Baixo volume ≠ luxo automaticamente

Preço (FOB):
* Deve ser usado como indicador relativo, não absoluto

Logística:
* Transporte marítimo é padrão no Brasil
* NÃO tratar marítimo como diferencial estratégico isolado

━━━━━━━━━━━━━━━━━━━━━━━
USO DE BUSCA EXTERNA (Gemini Search)
━━━━━━━━━━━━━━━━━━━━━━━

A busca externa pode ser usada APENAS para:

1. Identificar:
   * Tipo de produtor (maison, grower, cooperativa)
   * Grupo econômico (ex: LVMH)
   * Posicionamento global da marca

2. Regras obrigatórias:
* Diferenciar claramente:
  → "globalmente"
  → "no Brasil"
* Prioridade de verdade:
  → Dados do usuário (Brasil) > dados da busca (global)
* PROIBIDO usar busca para:
  → criar narrativa
  → inferir tendências de mercado brasileiro
  → extrapolar comportamento de consumo

3. Em caso de dúvida:
   → "não foi possível validar com dados externos"

━━━━━━━━━━━━━━━━━━━━━━━
ESTRUTURA OBRIGATÓRIA DA RESPOSTA
━━━━━━━━━━━━━━━━━━━━━━━

A saída deve seguir EXATAMENTE esta estrutura no JSON:

1. portfolioClassification (Listar marcas classificadas corretamente)
2. objectiveObservations (Volume, Preço, Mix)
3. validInferences (Apenas conclusões suportadas)
4. analysisLimitations (O que não pode ser concluído)

━━━━━━━━━━━━━━━━━━━━━━━
REGRAS DE QUALIDADE
━━━━━━━━━━━━━━━━━━━━━━━

* Nunca inventar contexto
* Nunca extrapolar um dado isolado
* Nunca confundir mercado global com Brasil
* Sempre sinalizar incerteza
* Evitar termos genéricos como:
  → "movimento estratégico"
  → "tendência clara"
  Sem evidência direta

━━━━━━━━━━━━━━━━━━━━━━━
OBJETIVO FINAL
━━━━━━━━━━━━━━━━━━━━━━━

Produzir análises:
* confiáveis
* auditáveis
* reproduzíveis
* úteis para tomada de decisão real

Seu comportamento deve refletir um analista profissional disciplinado, não um gerador de conteúdo.
`;

const CHAT_SYSTEM_INSTRUCTION = `
Você é um assistente analista especializado em dados de importação de vinhos.
Você tem acesso aos dados estruturados de vinhos importados em formato TOON (Token-Oriented Object Notation), que é uma representação compacta e eficiente de dados tabulares.

━━━━━━━━━━━━━━━━━━━━━━━
CONTEXTO TÉCNICO DO DATASET
━━━━━━━━━━━━━━━━━━━━━━━
${DATASET_CONTEXT}

REGRAS DE RESPOSTA:
1. Texto: Sempre forneça uma explicação clara e objetiva em Markdown.
2. Tabelas: Se a resposta envolver listas ou comparações detalhadas, forneça os dados em "tableData".
3. Gráficos: Se a resposta envolver tendências, rankings ou distribuições, forneça os dados em "chartData".

FORMATO DE RESPOSTA (JSON OBRIGATÓRIO):
{
  "content": "Sua resposta em texto (Markdown)",
  "tableData": [ { "col1": "val1", ... }, ... ], // Opcional
  "chartData": { // Opcional
    "type": "bar" | "pie" | "treemap" | "chord" | "map",
    "data": [ 
      // Para bar, pie, treemap, map: { "name": "...", "value": 123 }
      // Para chord: { "from": "...", "to": "...", "value": 123 }
    ],
    "dataKey": "value",
    "nameKey": "name", // Ou "from"/"to" para chord
    "title": "Título do Gráfico"
  }
}

REGRAS PARA GRÁFICOS:
- treemap: Use para dados hierárquicos ou grandes distribuições.
- chord: Use para relações entre entidades (ex: Importador -> País).
- map: Use para distribuição geográfica global. Use nomes de países em inglês (ex: "France", "Italy", "Argentina").
- bar/pie: Use para rankings simples e proporções.

Mantenha o rigor profissional e evite alucinações. Se os dados não permitirem uma resposta conclusiva, informe ao usuário.
`;

export async function chatWithWineData(
  userMessage: string,
  wineData: WineData[],
  history: ChatMessage[]
): Promise<Partial<ChatMessage>> {
  const chatHistory = history.map(msg => ({
    role: msg.role === 'user' ? 'user' as const : 'model' as const,
    parts: [{ text: msg.content }]
  }));

  const prompt = `
    DADOS ATUAIS (TOON):
    ${stringifyToon(wineData.slice(0, 100))}
    
    PERGUNTA DO USUÁRIO:
    ${userMessage}
  `;

  // Tentar Gemini primeiro
  try {
    console.log("Tentando Gemini para o chat...");
    const response = await withRetry(async () => {
      const res = await fetch(`${API_URL}/gemini/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          systemInstruction: CHAT_SYSTEM_INSTRUCTION,
          chatHistory
        })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `HTTP error! status: ${res.status}`);
      }
      
      return data.content;
    }, 1); // Apenas 1 tentativa para Gemini para falhar rápido para o fallback

    const result = JSON.parse(response || "{}");
    return {
      content: result.content,
      tableData: result.tableData,
      chartData: result.chartData,
      modelUsed: "Gemini 3.1 Flash"
    };
  } catch (geminiError: any) {
    console.warn("Gemini falhou no chat (Quota ou Erro), usando fallback OpenRouter:", geminiError.message);
    
    // Fallback para OpenRouter (MiniMax)
    try {
      console.log("Iniciando fallback OpenRouter...");
      const response = await withRetry(async () => {
        const res = await fetch(`${API_URL}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            systemInstruction: CHAT_SYSTEM_INSTRUCTION,
            chatHistory: history.map(msg => ({
              role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
              content: msg.content
            }))
          })
        });
        
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `HTTP error! status: ${res.status}`);
        }
        
        return data.content;
      }, 2);

      try {
        const jsonStr = response || "{}";
        let cleanedJson = jsonStr.replace(/```json\n?|```/g, '').trim();
        
        try {
          const result = JSON.parse(cleanedJson);
          return { ...result, modelUsed: "MiniMax M2.5" };
        } catch (innerError) {
          const start = cleanedJson.indexOf('{');
          const end = cleanedJson.lastIndexOf('}');
          if (start !== -1 && end !== -1) {
            cleanedJson = cleanedJson.substring(start, end + 1);
            const result = JSON.parse(cleanedJson);
            return { ...result, modelUsed: "MiniMax M2.5" };
          }
          throw innerError;
        }
      } catch (e) {
        return { content: response || "Sem resposta do analista.", modelUsed: "MiniMax M2.5" };
      }
    } catch (openRouterError) {
      console.error("Ambos os modelos falharam no chat:", openRouterError);
      throw openRouterError;
    }
  }
}

export async function parseAndAnalyzeWineData(rawData: string): Promise<{ wines: WineData[], analysis: MarketAnalysis }> {
  const prompt = `
    Analise os seguintes dados brutos de importação de vinhos.
    
    DADOS BRUTOS:
    ${rawData}
    
    TAREFAS:
    1. Estruture cada linha em um objeto JSON limpo.
    2. Calcule Volume em "Caixa 9L".
    3. Identifique o Segmento conforme as regras de segmentação realista do Brasil.
    4. Gere a análise estratégica profunda conforme as diretrizes do sistema.

    FORMATO DE RESPOSTA (JSON):
    {
      "wines": [
        {
          "id": "string",
          "name": "string",
          "country": "string",
          "type": "string",
          "volume9L": number,
          "fobTotal": number,
          "fobUnit": number,
          "segment": "Popular/Value/Premium/Super Premium/Luxo/Entry Premium/Alta gama",
          "importer": "string",
          "winery": "string",
          "region": "string",
          "globalPrice": "string",
          "rating": "string",
          "style": "string"
        }
      ],
      "analysis": {
        "portfolioClassification": {
          "premiumScale": ["string"],
          "premiumNiche": ["string"],
          "ultraLuxury": ["string"]
        },
        "objectiveObservations": {
          "volume": "string",
          "price": "string",
          "mix": "string"
        },
        "validInferences": ["string"],
        "analysisLimitations": ["string"]
      }
    }
  `;

  // Tentar Gemini primeiro
  try {
    console.log("Tentando Gemini para análise...");
    const response = await withRetry(async () => {
      const res = await fetch(`${API_URL}/gemini/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          systemInstruction: SYSTEM_INSTRUCTION
        })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `HTTP error! status: ${res.status}`);
      }
      
      return data.content;
    }, 1);

    const result = JSON.parse(response || "{}");
    if (result.analysis) {
      result.analysis.modelUsed = "Gemini 3.1 Flash";
    }
    return result;
  } catch (geminiError: any) {
    console.warn("Gemini falhou na análise, usando fallback OpenRouter:", geminiError.message);
    
    // Fallback para OpenRouter (MiniMax)
    try {
      console.log("Iniciando fallback OpenRouter para análise...");
      const response = await withRetry(async () => {
        const res = await fetch(`${API_URL}/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            systemInstruction: SYSTEM_INSTRUCTION
          })
        });
        
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `HTTP error! status: ${res.status}`);
        }
        
        return data.content;
      }, 2);

      try {
        const jsonStr = response || "{}";
        let cleanedJson = jsonStr.replace(/```json\n?|```/g, '').trim();
        
        try {
          const result = JSON.parse(cleanedJson);
          if (result.analysis) result.analysis.modelUsed = "MiniMax M2.5";
          return result;
        } catch (innerError) {
          const start = cleanedJson.indexOf('{');
          const end = cleanedJson.lastIndexOf('}');
          if (start !== -1 && end !== -1) {
            cleanedJson = cleanedJson.substring(start, end + 1);
            const result = JSON.parse(cleanedJson);
            if (result.analysis) result.analysis.modelUsed = "MiniMax M2.5";
            return result;
          }
          throw innerError;
        }
      } catch (e) {
        console.error("Failed to parse JSON response:", response);
        throw new Error("A resposta da IA não está em um formato válido. Tente reduzir a quantidade de dados.");
      }
    } catch (openRouterError) {
      console.error("Ambos os modelos falharam na análise:", openRouterError);
      throw openRouterError;
    }
  }
}
