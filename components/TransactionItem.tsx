
import React from 'react';
import { Transaction, TransactionType } from '../types';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, TrashIcon, PencilSquareIcon, CalendarDaysIcon } from './icons';
import { CURRENCY_SYMBOL } from '../constants';

interface TransactionItemProps {
  transaction: Transaction;
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, onDelete, onEdit }) => {
  const isIncome = transaction.type === TransactionType.INCOME;
  const amountColor = isIncome ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400';
  const Icon = isIncome ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;

  return (
    <div className="bg-white dark:bg-neutral-850 p-5 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0 transform hover:scale-[1.01] hover:z-10">
      <div className="flex items-center space-x-4 flex-grow">
        <div className={`p-3 rounded-xl ${isIncome ? 'bg-green-100 dark:bg-green-500/20' : 'bg-red-100 dark:bg-red-500/20'}`}>
          <Icon className={`h-6 w-6 ${isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
        </div>
        <div>
          <p className="text-base font-semibold text-neutral-800 dark:text-neutral-100">{transaction.description}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center mt-1">
            <CalendarDaysIcon className="h-3.5 w-3.5 mr-1.5" />
            {new Date(transaction.date).toLocaleDateString()} - {transaction.category}
          </p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-end sm:items-center sm:space-x-4 w-full sm:w-auto mt-2 sm:mt-0">
         <p className={`text-xl font-semibold ${amountColor} self-start sm:self-center sm:ml-auto whitespace-nowrap`}>
            {isIncome ? '+' : '-'}{CURRENCY_SYMBOL}{transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <div className="flex space-x-2 mt-2 sm:mt-0">
          <button
            onClick={() => onEdit(transaction)}
            className="p-2.5 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700/70 hover:text-primary dark:hover:text-primary-light rounded-lg transition-colors"
            aria-label="Editar transação"
          >
            <PencilSquareIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => onDelete(transaction.id)}
            className="p-2.5 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700/70 hover:text-red-500 dark:hover:text-red-400 rounded-lg transition-colors"
            aria-label="Excluir transação"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};