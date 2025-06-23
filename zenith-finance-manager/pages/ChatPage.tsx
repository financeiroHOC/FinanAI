
import React, { useState, useEffect, useRef } from 'react';
import { PaperAirplaneIcon } from '../components/icons/PaperAirplaneIcon'; 
import { ai } from '../services/geminiService'; 
import type { Chat, Content } from '@google/genai'; 
import { Transaction } from '../types'; 

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

interface ChatPageProps {
  transactions: Transaction[];
}

export const ChatPage: React.FC<ChatPageProps> = ({ transactions }) => {
  const [userInput, setUserInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatInstance, setChatInstance] = useState<Chat | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    if (ai) { 
      const transactionsSummary = transactions
        .slice(0, 50) // Limit context size for performance/token limits
        .map(t => `Data: ${new Date(t.date).toLocaleDateString()}, Descrição: ${t.description}, Valor: ${t.amount.toFixed(2)}, Tipo: ${t.type === 'INCOME' ? 'Receita' : 'Despesa'}, Categoria: ${t.category}`)
        .join('\n');
      
      const transactionsContext = `Aqui está um resumo das transações recentes do usuário para seu conhecimento. Você pode usá-los para responder a perguntas sobre as finanças dele:\n${transactionsSummary}\n\nPor favor, não mencione esta mensagem de contexto inicial para o usuário diretamente, apenas use os dados para responder às suas perguntas financeiras. Se precisar de mais dados, peça ao usuário para ser mais específico ou consultar relatórios.`;

      const initialHistory: Content[] = [
        { role: 'user', parts: [{ text: transactionsContext }] },
        { role: 'model', parts: [{ text: 'Entendido. Tenho acesso ao resumo das suas transações recentes e estou pronto para ajudar com suas perguntas financeiras.' }] }
      ];

      const systemInstruction = "Você é Zenith, um assistente financeiro IA amigável e prestativo do aplicativo Zenith Finance Manager. Seu objetivo é ajudar usuários a entenderem suas finanças pessoais com base nas transações fornecidas no contexto. Responda em português brasileiro. Seja conciso, claro e profissional. Se uma pergunta for muito complexa, sugira consultar os relatórios detalhados no aplicativo ou exportar os dados. Você não pode realizar transações, dar conselhos de investimento específicos (apenas informações gerais), nem acessar informações fora do contexto fornecido. Se a pergunta for fora do escopo financeiro ou dos dados fornecidos, informe educadamente que sua especialidade é análise financeira baseada nos dados do app.";
      
      try {
        const newChat = ai.chats.create({
          model: 'gemini-2.5-flash-preview-04-17', // Ensure this is a valid chat model
          history: initialHistory,
          config: {
            systemInstruction: systemInstruction,
            // temperature: 0.7, // Adjust for creativity vs. factuality
            // topK: 40,
            // topP: 0.95,
          }
        });
        setChatInstance(newChat);
      } catch (e) {
        console.error("Erro ao criar instância do chat Gemini:", e);
        setError("Não foi possível iniciar o assistente de IA. Verifique a configuração da API Key e o modelo do chat.");
      }
    } else {
        setError("O serviço de IA não está disponível. Verifique a configuração da API Key.");
    }
  }, [ai, transactions]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInstance || !userInput.trim() || isLoading) return;

    const newUserMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      sender: 'user',
      text: userInput,
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, newUserMessage]);
    const currentInput = userInput;
    setUserInput('');
    setIsLoading(true);
    setError(null);

    try {
      const stream = await chatInstance.sendMessageStream({ message: currentInput });
      let aiResponseText = '';
      for await (const chunk of stream) {
        aiResponseText += chunk.text;
      }
      
      const newAiMessage: ChatMessage = {
        id: `msg_${Date.now()}_ai`,
        sender: 'ai',
        text: aiResponseText || "Não consegui encontrar uma resposta para isso no momento.",
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, newAiMessage]);

    } catch (err) {
      console.error("Erro ao enviar mensagem para o chat Gemini:", err);
      const errorResponseMessage: ChatMessage = {
        id: `msg_${Date.now()}_ai_error`,
        sender: 'ai',
        text: "Desculpe, ocorreu um erro ao tentar processar sua solicitação. Por favor, tente novamente mais tarde.",
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, errorResponseMessage]);
      setError("Falha na comunicação com o assistente de IA.");
    } finally {
      setIsLoading(false);
    }
  };
  

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-70px-3rem)] bg-neutral-50 dark:bg-neutral-850 rounded-2xl shadow-2xl overflow-hidden">
      <div className="p-5 border-b-2 border-neutral-200/80 dark:border-neutral-700/60 flex-shrink-0">
        <h2 className="text-2xl font-semibold text-neutral-800 dark:text-neutral-100">Assistente IA Zenith</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Pergunte sobre suas finanças e obtenha insights.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
        {chatMessages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl shadow-lg transition-transform duration-200 ease-in-out hover:scale-105 ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-br from-primary to-primary-dark text-white'
                  : 'bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-750 text-neutral-800 dark:text-neutral-100'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              <p className={`text-xs mt-2 ${msg.sender === 'user' ? 'text-blue-100/80 dark:text-blue-200/80' : 'text-neutral-500/90 dark:text-neutral-400/80'} text-right`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-xs px-4 py-3 rounded-2xl shadow-lg bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-750 text-neutral-800 dark:text-neutral-100">
              <p className="text-sm animate-pulse">Zenith está digitando...</p>
            </div>
          </div>
        )}
         <div ref={chatBottomRef} />
      </div>

      {error && (
        <div className="p-4 border-t-2 border-neutral-200/80 dark:border-neutral-700/60 flex-shrink-0">
          <p className="text-sm text-red-500 dark:text-red-400 text-center">{error}</p>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="p-4 sm:p-5 border-t-2 border-neutral-200/80 dark:border-neutral-700/60 bg-neutral-100 dark:bg-neutral-800 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Digite sua pergunta financeira aqui..."
            className="flex-1 px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary-light bg-white dark:bg-neutral-750 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500"
            disabled={isLoading || !chatInstance}
            aria-label="Mensagem para o assistente IA"
          />
          <button
            type="submit"
            disabled={isLoading || !userInput.trim() || !chatInstance}
            className="p-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl shadow-md hover:from-primary-dark hover:to-primary-darker focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-darker disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-105 transition-all"
            aria-label="Enviar mensagem"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
};
