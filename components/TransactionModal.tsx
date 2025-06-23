
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Transaction, TransactionType, Category } from '../types';
import { XMarkIcon }  from './icons';
import { DEFAULT_CATEGORIES } from '../constants';
import { suggestCategory } from '../services/geminiService'; // Import the service

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id'> & { id?: string }) => void;
  categories: Category[];
  transactionToEdit?: Transaction;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose, onSave, categories: allCategories, transactionToEdit }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [currentCategory, setCurrentCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);
  const [isSuggestionLoading, setIsSuggestionLoading] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  const [internalVisible, setInternalVisible] = useState(false);

  const filteredCategories = useMemo(() => {
    return allCategories.filter(c => c.type === type);
  }, [allCategories, type]);

  useEffect(() => {
    setInternalVisible(isOpen);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) { // Reset state when modal opens
      if (transactionToEdit) {
        setDescription(transactionToEdit.description);
        setAmount(transactionToEdit.amount);
        setType(transactionToEdit.type);
        setCurrentCategory(transactionToEdit.category);
        setDate(new Date(transactionToEdit.date).toISOString().split('T')[0]);
      } else {
        setDescription('');
        setAmount('');
        setType(TransactionType.EXPENSE);
        const defaultCats = allCategories.filter(c => c.type === TransactionType.EXPENSE);
        setCurrentCategory(defaultCats.length > 0 ? defaultCats[0].name : '');
        setDate(new Date().toISOString().split('T')[0]);
      }
      setSuggestedCategory(null);
      setIsSuggestionLoading(false);
      setSuggestionError(null);
    }
  }, [transactionToEdit, isOpen, allCategories]);

  useEffect(() => {
    if (!filteredCategories.find(c => c.name === currentCategory)) {
      setCurrentCategory(filteredCategories.length > 0 ? filteredCategories[0].name : '');
    }
  }, [type, currentCategory, filteredCategories]);


  const handleDescriptionBlur = useCallback(async () => {
    if (description.trim() && !transactionToEdit) { 
      setIsSuggestionLoading(true);
      setSuggestionError(null);
      setSuggestedCategory(null);
      try {
        const suggestion = await suggestCategory(description, allCategories, type);
        setSuggestedCategory(suggestion);
      } catch (err) {
        setSuggestionError("Falha ao obter sugestão da IA.");
        console.error(err);
      } finally {
        setIsSuggestionLoading(false);
      }
    }
  }, [description, allCategories, type, transactionToEdit]);

  const applySuggestedCategory = () => {
    if (suggestedCategory && filteredCategories.some(fc => fc.name === suggestedCategory)) {
        setCurrentCategory(suggestedCategory);
        setSuggestedCategory(null); 
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount === '' || Number(amount) <= 0 || !currentCategory) {
        alert("Por favor, preencha todos os campos corretamente. O valor deve ser positivo e uma categoria deve ser selecionada.");
        return;
    }
    onSave({
      id: transactionToEdit?.id,
      date: new Date(date).toISOString(),
      description,
      amount: Number(amount),
      type,
      category: currentCategory,
    });
  };

  if (!isOpen && !internalVisible) return null; // Keep in DOM for fade-out if isOpen just became false

  return (
    <div className={`fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out ${internalVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className={`bg-white dark:bg-neutral-850 p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-lg transform transition-all duration-300 ease-in-out ${internalVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-neutral-200 dark:border-neutral-700/60">
          <h2 className="text-2xl font-semibold text-neutral-800 dark:text-neutral-100">{transactionToEdit ? 'Editar' : 'Adicionar Nova'} Transação</h2>
          <button onClick={onClose} className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Descrição</label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleDescriptionBlur} 
              className="mt-1 block w-full px-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary-light sm:text-sm bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500"
              required
            />
          </div>
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Valor</label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || '')}
              className="mt-1 block w-full px-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary-light sm:text-sm bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
              required
              min="0.01"
              step="0.01"
            />
          </div>
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Data</label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 block w-full px-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary-light sm:text-sm bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
              required
            />
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Tipo</label>
            <select
              id="type"
              value={type}
              onChange={(e) => {
                setType(e.target.value as TransactionType);
                setSuggestedCategory(null); 
              }}
              className="mt-1 block w-full pl-4 pr-10 py-2.5 text-base border-neutral-300 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary-light sm:text-sm rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
            >
              <option value={TransactionType.INCOME}>Receita</option>
              <option value={TransactionType.EXPENSE}>Despesa</option>
            </select>
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Categoria</label>
            <select
              id="category"
              value={currentCategory}
              onChange={(e) => setCurrentCategory(e.target.value)}
              className="mt-1 block w-full pl-4 pr-10 py-2.5 text-base border-neutral-300 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary-light sm:text-sm rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
              required
            >
              <option value="" disabled>{filteredCategories.length === 0 ? 'Nenhuma categoria para este tipo' : 'Selecione a categoria'}</option>
              {filteredCategories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
            {isSuggestionLoading && <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">Buscando sugestão da IA...</p>}
            {suggestionError && <p className="text-xs text-red-500 dark:text-red-400 mt-2">{suggestionError}</p>}
            {suggestedCategory && (
              <div className="mt-2.5 text-xs">
                <span className="text-neutral-600 dark:text-neutral-300">Sugestão da IA: <strong className="text-primary dark:text-primary-light">{suggestedCategory}</strong></span>
                <button
                  type="button"
                  onClick={applySuggestedCategory}
                  className="ml-2.5 px-2.5 py-1 text-xs font-medium text-primary dark:text-primary-light border border-primary dark:border-primary-light rounded-md hover:bg-primary-light/10 dark:hover:bg-primary-dark/20"
                >
                  Aplicar
                </button>
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-3 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 dark:focus:ring-offset-neutral-850 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary-darker rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark dark:focus:ring-offset-neutral-850 transition-all"
            >
              {transactionToEdit ? 'Salvar Alterações' : 'Adicionar Transação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
