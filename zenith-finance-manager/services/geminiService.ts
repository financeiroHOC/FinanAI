
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Category } from '../types';

// Assume process.env.API_KEY is available in the execution environment as per guidelines.
const apiKey = process.env.API_KEY;

export let ai: GoogleGenAI | null = null; // Exportar a instância

if (apiKey) {
  try {
    ai = new GoogleGenAI({ apiKey });
  } catch (error) {
    console.error("Falha ao inicializar GoogleGenAI:", error);
  }
} else {
  console.warn("Chave da API Gemini (process.env.API_KEY) não encontrada. Recursos do Gemini serão desabilitados.");
}

export const suggestCategory = async (description: string, availableCategories: Category[], transactionType: 'INCOME' | 'EXPENSE'): Promise<string | null> => {
  if (!ai) {
    console.warn("API Gemini não inicializada. Não é possível sugerir categoria.");
    return null;
  }
  if (!description.trim()) {
    return null;
  }

  const relevantCategories = availableCategories.filter(cat => cat.type === transactionType);
  if (relevantCategories.length === 0) {
    return null; 
  }

  const categoryNames = relevantCategories.map(c => c.name).join(', ');
  const typeInPortuguese = transactionType === 'INCOME' ? 'Receita' : 'Despesa';
  const otherCategoryName = transactionType === 'INCOME' ? 'Outras Receitas' : 'Outras Despesas';

  const prompt = `Com base na seguinte descrição de transação, sugira a categoria mais apropriada.
Descrição: "${description}"
Categorias disponíveis para o tipo ${typeInPortuguese}: ${categoryNames}.
Responda apenas com o nome da categoria da lista fornecida. Se nenhuma categoria específica parecer adequada, sugira '${otherCategoryName}'.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-04-17',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: "text/plain",
      }
    });

    const suggested = response.text.trim();
    if (relevantCategories.some(cat => cat.name === suggested)) {
      return suggested;
    }
    if (suggested === otherCategoryName && relevantCategories.some(cat => cat.name === otherCategoryName)) {
        return suggested;
    }

    console.warn(`Gemini sugeriu uma categoria ("${suggested}") que não está na lista fornecida ou não é a categoria "Outras" esperada. Usando fallback se disponível.`);
    
    const otherCatExists = relevantCategories.find(cat => cat.name === otherCategoryName);
    if(otherCatExists) return otherCategoryName;

    return null;

  } catch (error) {
    console.error("Erro ao chamar API Gemini para sugestão de categoria:", error);
    return null;
  }
};
