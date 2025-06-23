

import React, { useState, useCallback } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { ReportsPage } from './pages/ReportsPage';
import { ChatPage } from './pages/ChatPage'; // Importar a nova página de Chat
import { TransactionModal } from './components/TransactionModal';
import { Transaction, TransactionType, Category } from './types';
import { DEFAULT_CATEGORIES, INITIAL_TRANSACTIONS } from './constants';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useDarkMode } from './hooks/useDarkMode';
import { useSidebarVisibility } from './hooks/useSidebarVisibility'; // Importar o novo hook

const App: React.FC = () => {
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);
  const [isDarkMode, toggleDarkMode] = useDarkMode();
  const [isSidebarVisible, toggleSidebarVisibility] = useSidebarVisibility(true); // Usar o novo hook

  const availableCategories = DEFAULT_CATEGORIES;

  const handleOpenModal = useCallback((transactionToEdit?: Transaction) => {
    setEditingTransaction(transactionToEdit);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingTransaction(undefined);
  }, []);

  const handleSaveTransaction = useCallback((transactionData: Omit<Transaction, 'id'> & { id?: string }) => {
    if (transactionData.id) {
      setTransactions(prev => prev.map(t => t.id === transactionData.id ? { ...t, ...transactionData } as Transaction : t));
    } else {
      const newTransaction: Transaction = {
        ...transactionData,
        id: `txn_${new Date().getTime()}_${Math.random().toString(36).substring(2, 9)}`,
      };
      setTransactions(prev => [newTransaction, ...prev]);
    }
    handleCloseModal();
  }, [setTransactions, handleCloseModal]);

  const handleDeleteTransaction = useCallback((id: string) => {
    if (window.confirm('Você tem certeza que deseja excluir esta transação?')) {
        setTransactions(prev => prev.filter(t => t.id !== id));
    }
  }, [setTransactions]);

  const handleImportTransactions = useCallback((importedTransactions: Omit<Transaction, 'id'>[]) => {
    const newTransactionsWithIds: Transaction[] = importedTransactions.map(t => ({
      ...t,
      id: `txn_imported_${new Date().getTime()}_${Math.random().toString(36).substring(2, 9)}`,
      imported: true,
    }));
    setTransactions(prev => [...newTransactionsWithIds, ...prev]);
    // Optionally, provide feedback to the user, e.g., a toast notification
    alert(`${newTransactionsWithIds.length} transações importadas com sucesso!`);
  }, [setTransactions]);

  const PlaceholderPage: React.FC<{title: string}> = ({title}) => (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-neutral-800 dark:text-neutral-50 mb-4">{title}</h1>
      <div className="bg-white dark:bg-neutral-850 p-6 rounded-2xl shadow-xl">
        <p className="text-neutral-600 dark:text-neutral-300">Esta página é um placeholder para conteúdo futuro. Explore outras seções para funcionalidades completas.</p>
      </div>
    </div>
  );

  return (
    <HashRouter>
      <div className={`flex h-screen bg-transparent text-neutral-800 ${isDarkMode ? 'dark dark:text-neutral-200' : 'light'}`}>
        <Sidebar isSidebarVisible={isSidebarVisible} /> {/* Passar a prop */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            onAddTransactionClick={() => handleOpenModal()}
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
            toggleSidebar={toggleSidebarVisibility} // Passar a função de toggle
            isSidebarVisible={isSidebarVisible} // Passar o estado da sidebar
          />
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-6"> {/* Main content padding */}
            <Routes>
              <Route path="/" element={<DashboardPage transactions={transactions} categories={availableCategories} />} />
              <Route path="/dashboard/health" element={<PlaceholderPage title="Painel de Saúde Financeira" />} />
              <Route path="/dashboard/analytics" element={<PlaceholderPage title="Análises Detalhadas" />} />
              <Route 
                path="/transactions" 
                element={<TransactionsPage 
                            transactions={transactions} 
                            onDelete={handleDeleteTransaction} 
                            onEdit={handleOpenModal}
                            onImportTransactions={handleImportTransactions} // Passar nova prop
                          />} 
              />
              <Route path="/reports" element={<ReportsPage transactions={transactions} categories={availableCategories} />} />
              <Route path="/chat" element={<ChatPage transactions={transactions} />} />
              <Route path="/settings/preferences" element={<PlaceholderPage title="Configurações e Preferências" />} />
            </Routes>
          </main>
        </div>
      </div>
      {isModalOpen && (
        <TransactionModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveTransaction}
          categories={availableCategories}
          transactionToEdit={editingTransaction}
        />
      )}
    </HashRouter>
  );
};

export default App;