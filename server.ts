import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function generateWithRetry(model: string, contents: string, config: any, maxRetries = 3) {
  let attempt = 0;
  let currentModel = model;
  
  while (attempt < maxRetries) {
    try {
      return await ai.models.generateContent({ model: currentModel, contents, config });
    } catch (error: any) {
      attempt++;
      
      const isUnavailable = error.status === 503 || error.message?.includes('503') || error.message?.includes('UNAVAILABLE');
      const isQuotaExhausted = error.status === 429 || error.status === 'RESOURCE_EXHAUSTED' || error.message?.includes('429');
      
      if (!isQuotaExhausted) {
        console.warn(`[Retry Logic] Attempt ${attempt} failed with model ${currentModel}:`, error.message);
      }
      
      if ((!isUnavailable && !isQuotaExhausted) || attempt === maxRetries) {
        throw error;
      }
      
      // Fallback to a lighter model on 503 or 429 if we were using the default
      if (currentModel === 'gemini-3.6-flash') {
         currentModel = 'gemini-3.1-flash-lite';
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
    }
  }
}

app.post('/api/analyze', async (req, res) => {
  try {
    const { content, type, image } = req.body;

    if (!content && !image) {
      return res.status(400).json({ error: 'Content or image is required' });
    }

    const promptText = `You are "Peraí", an AI assistant that protects young Brazilian adults from scams, bad contracts, and confusion. 
Analyze the following user input and determine its type:
1. "decision": Scam, bad contract, risky proposition (employment, credit, subscription) requiring a risk assessment.
2. "translation": Complex documents (paystubs, fines, INSS letters, terms of use) that just need to be explained simply. If it's a medical document, strictly explain terms without giving medical advice.
3. "calculation": Splitting bills (rateio) or comparing prices/installments. You MUST be highly accurate. ALWAYS use the provided Python code execution tool to perform the math before outputting the final numbers.
4. "post_review": A draft post or image. Check for exposed sensitive data (location, documents, etc.) in a friendly tone without moral judgment.
5. "message_gen": A request to generate a difficult message (e.g., quitting a group, asking for a deadline).
6. "quem_e": A request to research a person or company using publicly available information. Present a brief, factual summary focusing on reputation, public records, and business legitimacy, strictly avoiding illegal or highly sensitive personal data exposure. You MUST use the Google Search tool to gather up-to-date information on the entity.

Input Type: ${type}
Content: ${content || 'User provided an image for analysis.'}

Please provide a detailed analysis based on the schema requested.
- analysisMode: One of "decision", "translation", "calculation", "post_review", "message_gen", "quem_e".
- reasoning: Step-by-step logical and mathematical reasoning. For "calculation", you MUST show the exact math operations here before outputting the final cost.
- riskLevel: Only for "decision" mode. 1 (Safe) to 5 (Danger). Null for others.
- riskLabel: Only for "decision". e.g., "Pode seguir", "Confere antes", "Peraí", "Muito provável golpe", "Perigo agora"
- summary: A one-sentence summary of what this is or what it means.
- financialImpact: Optional. Total cost or split result if applicable.
- signals: A list of signals (e.g., urgency, weird domains, sensitive data exposed) found in the content.
- technique: The manipulation technique used (if any).
- actions: A list of actionable steps for the user (e.g., "Copy this message", "Pay attention to this"). For "message_gen", provide the generated message as a "copy" action.
`;

    let promptContents: any = promptText;

    if (image) {
      const match = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (match) {
        promptContents = {
          parts: [
            { inlineData: { mimeType: match[1], data: match[2] } },
            { text: promptText }
          ]
        };
      }
    }

    const response = await generateWithRetry(
      "gemini-3.6-flash",
      promptContents,
      {
        responseMimeType: "application/json",
        tools: [{ codeExecution: {} }, { googleSearch: {} }],
        toolConfig: { includeServerSideToolInvocations: true },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysisMode: { type: Type.STRING, description: "One of: decision, translation, calculation, post_review, message_gen, quem_e" },
            reasoning: { type: Type.STRING, description: "Step-by-step reasoning and exact math calculations" },
            riskLevel: { type: Type.INTEGER, description: "Risk level from 1 (Safe) to 5 (Danger) (nullable)", nullable: true },
            riskLabel: { type: Type.STRING, description: "Short label for the risk level (nullable)", nullable: true },
            confidence: { type: Type.INTEGER, description: "Confidence percentage (0-100)" },
            summary: { type: Type.STRING, description: "One-sentence summary" },
            financialImpact: {
              type: Type.OBJECT,
              properties: {
                totalCost: { type: Type.NUMBER, description: "Total cost or value in local currency" },
                description: { type: Type.STRING, description: "Description of the cost or split" }
              }
            },
            signals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  quote: { type: Type.STRING, description: "Quote from the content" },
                  explanation: { type: Type.STRING, description: "Explanation of why this is a signal or what it means" }
                },
                required: ["explanation"]
              }
            },
            technique: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Name of the manipulation technique" },
                description: { type: Type.STRING, description: "Description of the technique" }
              }
            },
            actions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING, description: "Button label" },
                  type: { type: Type.STRING, description: "Type of action: 'copy', 'link', 'info'" },
                  content: { type: Type.STRING, description: "Content to copy, link to open, or info to display" }
                },
                required: ["label", "type", "content"]
              }
            }
          },
          required: ["analysisMode", "reasoning", "confidence", "summary", "actions"]
        }
      }
    );

    const result = JSON.parse(response?.text || '{}');
    res.json(result);
  } catch (error: any) {
    const errorMessage = error?.message || '';
    const isRateLimit = error.status === 429 || error.status === 'RESOURCE_EXHAUSTED' || errorMessage.includes('429');
    
    // Only log actual unexpected errors, not standard rate limits.
    if (!isRateLimit) {
      console.error('Error analyzing content:', error);
    }
    
    if (error.status === 503 || errorMessage.includes('503') || errorMessage.includes('UNAVAILABLE')) {
      res.status(503).json({ error: 'Nossos servidores estão com alta demanda no momento. Por favor, tente novamente em alguns instantes.' });
    } else if (isRateLimit) {
      res.status(429).json({ error: 'Atingimos o limite de consultas gratuitas do motor de IA para este minuto. Por favor, aguarde uns instantes e tente novamente.' });
    } else {
      res.status(500).json({ error: 'Falha ao analisar o conteúdo. Tente novamente.' });
    }
  }
});

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
