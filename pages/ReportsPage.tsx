
import React, { useState, useMemo } from 'react';
import { Transaction, Category, TransactionType, PeriodOption } from '../types';
import { CURRENCY_SYMBOL } from '../constants';

interface ReportsPageProps {
  transactions: Transaction[];
  categories: Category[];
}

interface DRELine {
  name: string;
  amount: number;
  isSubtotal?: boolean;
  isBold?: boolean;
  indent?: boolean;
  isPositive?: boolean; 
  isHeader?: boolean;
}

const formatCurrency = (value: number, symbol: string = CURRENCY_SYMBOL) => {
  const absValue = Math.abs(value);
  const formatted = `${symbol}${absValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return value < 0 ? `(${formatted.replace(symbol,'')})` : formatted; // Parênteses para negativos, sem duplicar símbolo
};

const getPeriodDates = (period: PeriodOption): { startDate: Date, endDate: Date } => {
  const now = new Date();
  let startDate = new Date();
  let endDate = new Date();

  switch (period) {
    case 'currentMonth':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999); 
      break;
    case 'lastMonth':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    case 'currentQuarter':
      const currentQuarterMonth = Math.floor(now.getMonth() / 3) * 3;
      startDate = new Date(now.getFullYear(), currentQuarterMonth, 1);
      endDate = new Date(now.getFullYear(), currentQuarterMonth + 3, 0, 23, 59, 59, 999);
      break;
    case 'lastQuarter':
      const lastQuarterStartMonth = Math.floor(now.getMonth() / 3) * 3 - 3;
      startDate = new Date(now.getFullYear(), lastQuarterStartMonth, 1);
      endDate = new Date(now.getFullYear(), lastQuarterStartMonth + 3, 0, 23, 59, 59, 999);
      break;
    case 'currentYear':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;
    case 'lastYear':
      startDate = new Date(now.getFullYear() - 1, 0, 1);
      endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      break;
  }
  return { startDate, endDate };
};

export const ReportsPage: React.FC<ReportsPageProps> = ({ transactions, categories }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>('currentMonth');

  const dreData = useMemo(() => {
    const { startDate, endDate } = getPeriodDates(selectedPeriod);
    const periodTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });

    const incomeCategories = categories.filter(c => c.type === TransactionType.INCOME);
    const expenseCategories = categories.filter(c => c.type === TransactionType.EXPENSE);

    const lines: DRELine[] = [];
    let totalIncome = 0;
    let totalExpenses = 0;

    lines.push({ name: 'RECEITAS OPERACIONAIS', amount: NaN, isHeader: true, isBold: true });
    incomeCategories.forEach(cat => {
      const categoryTotal = periodTransactions
        .filter(t => t.type === TransactionType.INCOME && t.category === cat.name)
        .reduce((sum, t) => sum + t.amount, 0);
      if (categoryTotal > 0) {
        lines.push({ name: cat.name, amount: categoryTotal, indent: true, isPositive: true });
        totalIncome += categoryTotal;
      }
    });
    lines.push({ name: 'Total de Receitas Operacionais', amount: totalIncome, isSubtotal: true, isBold: true, isPositive: true });
    lines.push({ name: '', amount: NaN, isSubtotal: false }); // Spacer line


    lines.push({ name: 'DESPESAS OPERACIONAIS', amount: NaN, isHeader: true, isBold: true });
    expenseCategories.forEach(cat => {
      const categoryTotal = periodTransactions
        .filter(t => t.type === TransactionType.EXPENSE && t.category === cat.name)
        .reduce((sum, t) => sum + t.amount, 0);
      if (categoryTotal > 0) {
        lines.push({ name: cat.name, amount: -categoryTotal, indent: true, isPositive: false }); // Store expenses as negative for DRE
        totalExpenses += categoryTotal;
      }
    });
    lines.push({ name: 'Total de Despesas Operacionais', amount: -totalExpenses, isSubtotal: true, isBold: true, isPositive: false });
    lines.push({ name: '', amount: NaN, isSubtotal: false }); // Spacer line

    const netResult = totalIncome - totalExpenses;
    lines.push({
      name: 'RESULTADO LÍQUIDO DO PERÍODO',
      amount: netResult,
      isBold: true,
      isSubtotal: true,
      isPositive: netResult >= 0,
      isHeader: true // Style as a major result line
    });

    return lines;
  }, [transactions, categories, selectedPeriod]);

  const periodOptions: { value: PeriodOption, label: string }[] = [
    { value: 'currentMonth', label: 'Mês Atual' },
    { value: 'lastMonth', label: 'Mês Anterior' },
    { value: 'currentQuarter', label: 'Trimestre Atual' },
    { value: 'lastQuarter', label: 'Trimestre Anterior' },
    { value: 'currentYear', label: 'Ano Atual' },
    { value: 'lastYear', label: 'Ano Anterior' },
  ];

  const { startDate, endDate } = getPeriodDates(selectedPeriod);
  const periodLabel = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-neutral-800 dark:text-neutral-50">Relatórios Financeiros Avançados</h2>
      
      <div className="bg-white dark:bg-neutral-850 p-5 sm:p-6 rounded-2xl shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 border-b border-neutral-200 dark:border-neutral-700/60 pb-5">
          <div>
            <h3 className="text-xl font-semibold text-neutral-700 dark:text-neutral-100">Demonstração do Resultado (DRE)</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Período: {periodLabel}</p>
          </div>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as PeriodOption)}
            className="block w-full sm:w-auto pl-3 pr-10 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg leading-5 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary-light sm:text-sm appearance-none"
          >
            {periodOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <tbody className="bg-white dark:bg-neutral-850">
              {dreData.map((line, index) => (
                <tr key={index} 
                    className={`
                      ${line.isSubtotal ? 'bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100/70 dark:hover:bg-neutral-700/60' : 'hover:bg-neutral-50/50 dark:hover:bg-neutral-700/40'} 
                      ${line.isBold ? 'font-semibold' : ''}
                      ${line.isHeader && !line.isSubtotal ? 'text-primary-dark dark:text-primary-light uppercase tracking-wide text-sm' : ''}
                      transition-colors duration-150
                    `}>
                  <td className={`px-4 py-3 text-sm ${line.indent ? 'pl-8' : ''} ${line.isHeader && !line.isSubtotal ? '' : 'text-neutral-700 dark:text-neutral-200'} whitespace-nowrap border-b border-neutral-200 dark:border-neutral-700/60`}>
                    {line.name}
                  </td>
                  <td className={`px-4 py-3 text-sm text-right whitespace-nowrap border-b border-neutral-200 dark:border-neutral-700/60 ${
                    Number.isNaN(line.amount) ? '' : (
                      line.amount >= 0 && line.isPositive !== false ? 'text-green-600 dark:text-green-400' : 
                      line.amount < 0 || line.isPositive === false ? 'text-red-600 dark:text-red-400' : 'text-neutral-700 dark:text-neutral-200'
                    ) 
                  }`}>
                    {!Number.isNaN(line.amount) ? formatCurrency(line.amount) : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {dreData.filter(line => !Number.isNaN(line.amount)).length <= 2 && ( // Basic check if only totals/headers are there
             <p className="text-center text-neutral-500 dark:text-neutral-400 py-12">
                Nenhuma transação encontrada para o período selecionado.
            </p>
        )}
      </div>
    </div>
  );
};