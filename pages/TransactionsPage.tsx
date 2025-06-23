
import React, { useState, useMemo, useRef, ChangeEvent } from 'react';
import * as XLSX from 'xlsx'; 
import { Transaction, TransactionType, Category } from '../types';
import { TransactionItem } from '../components/TransactionItem';
import { FunnelIcon, MagnifyingGlassIcon, CalendarDaysIcon, CloudArrowUpIcon } from '../components/icons';
import { DEFAULT_CATEGORIES } from '../constants';

interface TransactionsPageProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
  onImportTransactions: (transactions: Omit<Transaction, 'id'>[]) => void; 
}

export const TransactionsPage: React.FC<TransactionsPageProps> = ({ transactions, onDelete, onEdit, onImportTransactions }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | 'ALL'>('ALL');
  const [startDate, setStartDate] = useState(''); 
  const [endDate, setEndDate] = useState('');   
  const [isLoadingImport, setIsLoadingImport] = useState(false);
  const [importFeedbackMessages, setImportFeedbackMessages] = useState<string[]>([]); // Consolidated feedback
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        const typeMatch = filterType === 'ALL' || t.type === filterType;

        const searchMatch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            t.category.toLowerCase().includes(searchTerm.toLowerCase());

        let dateMatch = true;
        const transactionDate = new Date(t.date);
        transactionDate.setHours(0,0,0,0); 

        if (startDate) {
            const start = new Date(startDate);
            start.setHours(0,0,0,0); 
            dateMatch = dateMatch && transactionDate >= start;
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(0,0,0,0); 
            dateMatch = dateMatch && transactionDate <= end;
        }

        return typeMatch && searchMatch && dateMatch;
      })
      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()); 
  }, [transactions, searchTerm, filterType, startDate, endDate]);

  const handleFileImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoadingImport(true);
    setImportFeedbackMessages([]);
    setImportSuccessMessage(null);
    
    const feedback: string[] = [];

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) throw new Error("Falha ao ler o arquivo.");
          const workbook = XLSX.read(data, { type: 'array', cellDates: true }); 
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, {raw: false, defval:null}); 

          const imported: Omit<Transaction, 'id'>[] = [];
          
          const headerKeyConfig = {
              date: ['Vencimento', 'Data'],
              description: ['Sacado', 'Descrição'],
              amount: ['Valor do Título', 'Valor'],
              category: ['Plano de Contas', 'Categoria'], // "Plano de Contas" prioritized
              type: ['Tipo'],
              nContas: ['Nº de Contas']
          };

          jsonData.forEach((row, index) => {
            const rowNumber = index + 2; 
            let rowFeedback = "";

            const getRowValue = (fieldKeys: string[]): any => {
                for (const key of fieldKeys) {
                    if (row[key] !== undefined && row[key] !== null) {
                        return row[key];
                    }
                }
                return null;
            };
            
            const rawDateValue = getRowValue(headerKeyConfig.date);
            let rawDescriptionValue = getRowValue(headerKeyConfig.description);
            const rawAmountValue = getRowValue(headerKeyConfig.amount);
            const rawCategoryValue = getRowValue(headerKeyConfig.category);
            const rawTypeValue = getRowValue(headerKeyConfig.type);
            const nContasContent = getRowValue(headerKeyConfig.nContas);

            if (rawDateValue === null || rawDescriptionValue === null || rawAmountValue === null || rawCategoryValue === null) {
                feedback.push(`Linha ${rowNumber}: Ignorada. Dados essenciais (Data/Vencimento, Descrição/Sacado, Valor/Valor do Título, Categoria/Plano de Contas) não encontrados ou vazios.`);
                return;
            }
            rawDescriptionValue = String(rawDescriptionValue); // Ensure string
            
            if (nContasContent !== null && String(nContasContent).trim() !== '') {
                rawDescriptionValue += ` (Nº Contas: ${String(nContasContent).trim()})`;
            }

            let transactionDate: Date;
            if (rawDateValue instanceof Date) {
                transactionDate = rawDateValue;
            } else if (typeof rawDateValue === 'string' || typeof rawDateValue === 'number') {
                let parsedDateAttempt: Date;
                if (typeof rawDateValue === 'number') { 
                    const excelDateParts = XLSX.SSF.parse_date_code(rawDateValue);
                    if (excelDateParts) {
                        transactionDate = new Date(excelDateParts.y, excelDateParts.m - 1, excelDateParts.d, excelDateParts.H || 0, excelDateParts.M || 0, excelDateParts.S || 0);
                    } else { 
                        parsedDateAttempt = new Date(String(rawDateValue));
                        if(isNaN(parsedDateAttempt.getTime())) {
                            feedback.push(`Linha ${rowNumber}: Ignorada. Data (número Excel) inválida ('${rawDateValue}').`); return;
                        }
                        transactionDate = parsedDateAttempt;
                    }
                } else { 
                    parsedDateAttempt = new Date(rawDateValue);
                    if (isNaN(parsedDateAttempt.getTime())) {
                        const parts = rawDateValue.split(/[\/\-]/);
                        if (parts.length === 3) {
                            let d = parseInt(parts[0], 10); let m = parseInt(parts[1], 10) -1; let y = parseInt(parts[2], 10);
                            if (y < 100) y += (y < 70 ? 2000 : 1900); // 2-digit year heuristic
                            parsedDateAttempt = new Date(y, m, d);
                            if (isNaN(parsedDateAttempt.getTime())) {
                                d = parseInt(parts[1], 10); m = parseInt(parts[0], 10) -1;
                                parsedDateAttempt = new Date(y,m,d);
                            }
                        }
                    }
                    if (isNaN(parsedDateAttempt.getTime())) { 
                        feedback.push(`Linha ${rowNumber}: Ignorada. Data (string) inválida ('${rawDateValue}'). Formatos comuns como AAAA-MM-DD, DD/MM/AAAA, MM/DD/AAAA são tentados.`); return;
                    }
                    transactionDate = parsedDateAttempt;
                }
            } else {
                 feedback.push(`Linha ${rowNumber}: Ignorada. Data em formato não reconhecido ('${typeof rawDateValue}').`); return;
            }
            if (isNaN(transactionDate.getTime())) {
                feedback.push(`Linha ${rowNumber}: Ignorada. Data inválida após tentativas de parse ('${rawDateValue}').`); return;
            }

            const amount = parseFloat(String(rawAmountValue).replace(',', '.'));
            if (isNaN(amount) || amount <= 0) {
              feedback.push(`Linha ${rowNumber}: Ignorada. Valor inválido ou não positivo ('${rawAmountValue}').`); return;
            }

            let type: TransactionType;
            if (rawTypeValue !== null) {
                const typeLower = String(rawTypeValue).toLowerCase().trim();
                if (typeLower === 'receita' || typeLower === 'income') type = TransactionType.INCOME;
                else if (typeLower === 'despesa' || typeLower === 'expense') type = TransactionType.EXPENSE;
                else {
                    type = TransactionType.EXPENSE; // Default to expense if type is present but unrecognized
                    rowFeedback += ` Tipo '${rawTypeValue}' inválido, padronizado para Despesa.`;
                }
            } else {
                type = TransactionType.EXPENSE; // Default to Expense if 'Tipo' column/value is missing
                rowFeedback += ` Coluna 'Tipo' não encontrada/vazia, transação padronizada para Despesa.`;
            }

            let category = String(rawCategoryValue).trim();
            const categoryExists = DEFAULT_CATEGORIES.find(c => c.name.toLowerCase() === category.toLowerCase() && c.type === type);
            if (!categoryExists) {
              const originalCategory = category;
              category = type === TransactionType.INCOME ? 'Outras Receitas' : 'Outras Despesas';
              rowFeedback += ` Categoria '${originalCategory}' não encontrada para o tipo ${type === TransactionType.INCOME ? 'Receita':'Despesa'}, atribuída a '${category}'.`;
            }
            
            if (rowFeedback) {
                feedback.push(`Linha ${rowNumber}: Importada com ajustes:${rowFeedback}`);
            }

            imported.push({
              date: transactionDate.toISOString(),
              description: rawDescriptionValue,
              amount: amount,
              type: type,
              category: category,
            });
          });

          if (imported.length > 0) {
            onImportTransactions(imported);
            setImportSuccessMessage(`${imported.length} transações importadas com sucesso!`);
          } else if (feedback.length === 0) { // No transactions, no errors either (empty file perhaps)
            feedback.push("Nenhuma transação encontrada no arquivo ou o arquivo está vazio.");
          }
          
          if(feedback.length > 0) {
            setImportFeedbackMessages(feedback);
          }

        } catch (err: any) {
          console.error("Erro ao processar arquivo XLSX:", err);
          setImportFeedbackMessages([`Erro crítico ao processar arquivo: ${err.message || 'Formato inválido.'}`]);
        } finally {
          setIsLoadingImport(false);
          if(fileInputRef.current) fileInputRef.current.value = ""; 
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err: any) {
      console.error("Erro ao ler arquivo:", err);
      setImportFeedbackMessages([`Erro ao ler arquivo: ${err.message}`]);
      setIsLoadingImport(false);
      if(fileInputRef.current) fileInputRef.current.value = ""; 
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center">
        <h2 className="text-3xl font-bold text-neutral-800 dark:text-neutral-50">Registro de Transações</h2>
        <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileImport} 
            accept=".xlsx, .xls" 
            className="hidden" 
            id="xlsx-importer"
        />
        <button
            onClick={() => {
                setImportFeedbackMessages([]); 
                setImportSuccessMessage(null);
                fileInputRef.current?.click();
            }}
            disabled={isLoadingImport}
            className="mt-4 sm:mt-0 flex items-center bg-gradient-to-r from-secondary to-secondary-dark hover:from-secondary-dark hover:to-secondary-darker text-white font-semibold py-2.5 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-150 ease-in-out text-sm disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-105"
        >
            <CloudArrowUpIcon className="h-5 w-5 mr-2" />
            {isLoadingImport ? 'Importando...' : 'Importar Planilha XLSX'}
        </button>
      </div>
      {importSuccessMessage && <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-700/20 p-3.5 rounded-lg shadow">{importSuccessMessage}</div>}
      {importFeedbackMessages.length > 0 && (
        <div className="text-sm text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-700/30 p-3.5 rounded-lg shadow space-y-1">
            <p className="font-semibold mb-1">Detalhes da importação:</p>
            {importFeedbackMessages.map((msg, idx) => (
                <p key={idx} className={`whitespace-pre-line ${msg.toLowerCase().includes("ignorada") ? 'text-red-600 dark:text-red-400' : (msg.toLowerCase().includes("ajustes") ? 'text-amber-600 dark:text-amber-400' : '') }`}>
                    - {msg}
                </p>
            ))}
        </div>
      )}


      <div className="bg-white dark:bg-neutral-850 p-5 rounded-2xl shadow-xl flex flex-col xl:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-grow xl:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
          </div>
          <input
            type="text"
            placeholder="Buscar por descrição ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-11 pr-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg leading-5 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary-light sm:text-sm"
          />
        </div>

        {/* Type Filter */}
        <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <FunnelIcon className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
            </div>
            <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as TransactionType | 'ALL')}
                className="block w-full sm:w-auto pl-11 pr-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg leading-5 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary-light sm:text-sm appearance-none"
                aria-label="Filtrar por tipo de transação"
            >
                <option value="ALL">Todos os Tipos</option>
                <option value={TransactionType.INCOME}>Receitas</option>
                <option value={TransactionType.EXPENSE}>Despesas</option>
            </select>
        </div>

        {/* Date Filters */}
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <CalendarDaysIcon className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
            </div>
            <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="block w-full sm:w-auto pl-11 pr-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg leading-5 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary-light sm:text-sm"
                aria-label="Data de início para filtro"
            />
        </div>
         <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                 <CalendarDaysIcon className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
            </div>
            <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate} 
                className="block w-full sm:w-auto pl-11 pr-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg leading-5 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary-light sm:text-sm"
                aria-label="Data de fim para filtro"
            />
        </div>

      </div>

      {filteredTransactions.length > 0 ? (
        <div className="space-y-4">
          {filteredTransactions.map(transaction => (
            <TransactionItem key={transaction.id} transaction={transaction} onDelete={onDelete} onEdit={onEdit}/>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-neutral-850 rounded-2xl shadow-xl mt-6">
          <MagnifyingGlassIcon className="h-16 w-16 text-neutral-400 dark:text-neutral-500 mx-auto mb-4" />
          <p className="text-xl font-semibold text-neutral-600 dark:text-neutral-300">Nenhuma transação encontrada.</p>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">Tente ajustar seus filtros ou adicione uma nova transação.</p>
        </div>
      )}
    </div>
  );
};
