
import React, { useMemo } from 'react';
import { Transaction, TransactionType, Category, DashboardPageProps } from '../types';
import { DashboardCard } from '../components/DashboardCard';
import {
    BanknotesIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    ChartPieIcon,
} from '../components/icons';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend, LabelList } from 'recharts';
import { CHART_COLORS, CURRENCY_SYMBOL } from '../constants';

// StatBox for "Earning Statistics" section
const StatBox: React.FC<{ title: string; value: string; icon: React.ReactNode; bgColorClass: string; textColorClass: string }> = ({ title, value, icon, bgColorClass, textColorClass }) => (
    <div className={`p-4 rounded-xl shadow-lg flex items-center space-x-3 ${bgColorClass} ${textColorClass} transition-all hover:shadow-xl`}>
        <div className="p-2.5 bg-white bg-opacity-25 rounded-lg">{icon}</div>
        <div>
            <p className="text-sm opacity-90">{title}</p>
            <p className="text-lg font-bold">{value}</p>
        </div>
    </div>
);

// Helper to check dark mode for chart specific styling if needed
const isDarkMode = () => typeof window !== 'undefined' && document.documentElement.classList.contains('dark');

// Custom label renderer for PieChart
const renderCustomizedPieLabel = (props: any) => {
  const { value, percent, x, y, midAngle, innerRadius, outerRadius } = props; 
  if (value === undefined || typeof percent !== 'number' || isNaN(percent)) {
    return null; 
  }
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5 + (outerRadius-innerRadius)*0.3; // position for text
  const ex = x + (outerRadius - innerRadius + 20) * Math.cos(-midAngle * RADIAN); // line end x
  const ey = y + (outerRadius - innerRadius + 20) * Math.sin(-midAngle * RADIAN); // line end y
  const textAnchor = ex > x ? 'start' : 'end';


  const percentage = (percent * 100).toFixed(0);
  return (
    <g>
      <path d={`M${x},${y}L${ex},${ey}`} stroke={isDarkMode() ? "#4b5563" : "#d1d5db"} fill="none" strokeDasharray="3 3" />
      <circle cx={ex} cy={ey} r={2} fill={isDarkMode() ? "#4b5563" : "#d1d5db"} stroke="none" />
      <text x={ex + (ex > x ? 1 : -1) * 8} y={ey} dy={4} textAnchor={textAnchor} className="text-xs fill-neutral-600 dark:fill-neutral-300">
        {`${value} (${percentage}%)`}
      </text>
    </g>
  );
};


export const DashboardPage: React.FC<DashboardPageProps> = ({ transactions, categories }) => {
  const summary = useMemo(() => {
    let totalIncome = 0;
    let totalExpenses = 0;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    let incomeThisMonth = 0;
    let expensesThisMonth = 0;

    transactions.forEach(t => {
      const transactionDate = new Date(t.date);
      if (t.type === TransactionType.INCOME) {
        totalIncome += t.amount;
        if (transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear) {
          incomeThisMonth += t.amount;
        }
      } else {
        totalExpenses += t.amount;
        if (transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear) {
          expensesThisMonth += t.amount;
        }
      }
    });
    const balance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    return {
      totalIncome,
      totalExpenses,
      balance,
      incomeThisMonth,
      expensesThisMonth,
      savingsRate,
    };
  }, [transactions]);

  const expenseByCategory = useMemo(() => {
    const data: { name: string; value: number }[] = [];
    const expenseCategories = categories.filter(c => c.type === TransactionType.EXPENSE);

    expenseCategories.forEach(category => {
      const categoryTotal = transactions
        .filter(t => t.type === TransactionType.EXPENSE && t.category === category.name)
        .reduce((sum, t) => sum + t.amount, 0);
      if (categoryTotal > 0) {
        data.push({ name: category.name, value: categoryTotal });
      }
    });
    return data.sort((a,b) => b.value - a.value);
  }, [transactions, categories]);

  const monthlyOverviewData = useMemo(() => {
    const dataByMonth: { [key: string]: { month: string; income: number; expenses: number } } = {};

    transactions.forEach(t => {
      const monthYear = new Date(t.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
      if (!dataByMonth[monthYear]) {
        dataByMonth[monthYear] = { month: monthYear, income: 0, expenses: 0 };
      }
      if (t.type === TransactionType.INCOME) {
        dataByMonth[monthYear].income += t.amount;
      } else {
        dataByMonth[monthYear].expenses += t.amount;
      }
    });

    return Object.values(dataByMonth)
      .sort((a,b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-12); 
  }, [transactions]);

  const chartPeriodSummary = useMemo(() => {
    return monthlyOverviewData.reduce((acc, monthData) => {
        acc.income += monthData.income;
        acc.expenses += monthData.expenses;
        return acc;
    }, { income: 0, expenses: 0, net: 0});
  }, [monthlyOverviewData]);
  chartPeriodSummary.net = chartPeriodSummary.income - chartPeriodSummary.expenses;

  const formatCurrency = (value: number) =>
    `${CURRENCY_SYMBOL}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const getRecentTransactionAmounts = (type: TransactionType | null, count: number): number[] => {
    const relevantTransactions = transactions
        .filter(t => type === null || t.type === type)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) 
        .slice(0, count)
        .map(t => t.amount);
    return relevantTransactions.reverse(); 
  };

  const incomeSparkline = getRecentTransactionAmounts(TransactionType.INCOME, 10);
  const expenseSparkline = getRecentTransactionAmounts(TransactionType.EXPENSE, 10);
  
  const dailyNetAmounts: { [dateKey: string]: number } = {};
  transactions
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) 
    .forEach(t => {
        const dateKey = new Date(t.date).toISOString().split('T')[0];
        if (!dailyNetAmounts[dateKey]) dailyNetAmounts[dateKey] = 0;
        dailyNetAmounts[dateKey] += (t.type === TransactionType.INCOME ? t.amount : -t.amount);
    });
  const balanceRelatedSparkline = Object.values(dailyNetAmounts).slice(-10);


  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard
          title="Receita Total (Geral)"
          value={formatCurrency(summary.totalIncome)}
          icon={<ArrowTrendingUpIcon className="h-6 w-6 text-primary-dark dark:text-primary-light" />}
          iconContainerClass="bg-primary-light/20 dark:bg-primary-dark/30"
          trendText="Tendência de receitas"
          trendColorClass="text-green-600 dark:text-green-400"
          sparklineData={incomeSparkline}
          sparklineColorClass="stroke-primary"
          gradientBgClass="from-blue-50 via-indigo-50 to-purple-50 dark:from-neutral-850 dark:via-blue-900/30 dark:to-neutral-800"
        />
        <DashboardCard
          title="Receita Este Mês"
          value={formatCurrency(summary.incomeThisMonth)}
          icon={<ArrowTrendingUpIcon className="h-6 w-6 text-secondary-dark dark:text-secondary-light" />}
          iconContainerClass="bg-secondary-light/20 dark:bg-secondary-dark/30"
          trendText="Desempenho mensal"
          trendColorClass="text-green-600 dark:text-green-400"
          sparklineData={transactions.filter(t => t.type === TransactionType.INCOME && new Date(t.date).getMonth() === new Date().getMonth()).slice(-10).map(t => t.amount).reverse()}
          sparklineColorClass="stroke-secondary"
          gradientBgClass="from-emerald-50 via-green-50 to-teal-50 dark:from-neutral-850 dark:via-emerald-900/30 dark:to-neutral-800"
        />
        <DashboardCard
          title="Despesa Total (Geral)"
          value={formatCurrency(summary.totalExpenses)}
          icon={<ArrowTrendingDownIcon className="h-6 w-6 text-accent-dark dark:text-accent-light" />}
          iconContainerClass="bg-accent-light/20 dark:bg-accent-dark/30"
          trendText="Tendência de despesas"
          trendColorClass="text-red-600 dark:text-red-400"
          sparklineData={expenseSparkline}
          sparklineColorClass="stroke-accent"
          gradientBgClass="from-amber-50 via-yellow-50 to-orange-50 dark:from-neutral-850 dark:via-amber-900/30 dark:to-neutral-800"
        />
        <DashboardCard
          title="Despesas Este Mês"
          value={formatCurrency(summary.expensesThisMonth)}
          icon={<ArrowTrendingDownIcon className="h-6 w-6 text-pinkish-dark dark:text-pinkish-light" />}
          iconContainerClass="bg-pinkish-light/20 dark:bg-pinkish-dark/30"
          trendText="Desempenho mensal"
          trendColorClass="text-red-600 dark:text-red-400"
          sparklineData={transactions.filter(t => t.type === TransactionType.EXPENSE && new Date(t.date).getMonth() === new Date().getMonth()).slice(-10).map(t => t.amount).reverse()}
          sparklineColorClass="stroke-pinkish"
          gradientBgClass="from-pink-50 via-rose-50 to-fuchsia-50 dark:from-neutral-850 dark:via-pink-900/30 dark:to-neutral-800"
        />
        <DashboardCard
          title="Taxa de Poupança (Geral)"
          value={`${summary.savingsRate.toFixed(1)}%`}
          icon={<ChartPieIcon className="h-6 w-6 text-purplish-dark dark:text-purplish-light" />}
          iconContainerClass="bg-purplish-light/20 dark:bg-purplish-dark/30"
          trendText="Eficiência financeira"
          trendColorClass={summary.savingsRate >=0 ? "text-green-600 dark:text-green-400":"text-red-600 dark:text-red-400"}
          sparklineData={balanceRelatedSparkline.map(x => Math.max(0, x * summary.savingsRate / 100))} // Simplified sparkline for rate
          sparklineColorClass="stroke-purplish"
          gradientBgClass="from-purple-50 via-violet-50 to-fuchsia-50 dark:from-neutral-850 dark:via-purple-900/30 dark:to-neutral-800"
        />
         <DashboardCard
          title="Saldo Líquido (Geral)"
          value={formatCurrency(summary.balance)}
          icon={<BanknotesIcon className="h-6 w-6 text-skyish-dark dark:text-skyish-light" />}
          iconContainerClass="bg-skyish-light/20 dark:bg-skyish-dark/30"
          trendText={summary.balance >= 0 ? "Resultado positivo" : "Resultado negativo"}
          trendColorClass={summary.balance >=0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}
          sparklineData={balanceRelatedSparkline}
          sparklineColorClass="stroke-skyish"
          gradientBgClass="from-sky-50 via-cyan-50 to-blue-50 dark:from-neutral-850 dark:via-sky-900/30 dark:to-neutral-800"
        />
      </div>

      <div className="bg-white dark:bg-neutral-850 p-5 sm:p-6 rounded-2xl shadow-xl">
        <div className="mb-6">
            <h3 className="text-xl font-semibold text-neutral-700 dark:text-neutral-100">Visão Geral Mensal</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Receitas e despesas dos últimos {monthlyOverviewData.length} meses.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <StatBox
                title="Total Receitas (Período)"
                value={formatCurrency(chartPeriodSummary.income)}
                icon={<ArrowTrendingUpIcon className="h-5 w-5 text-white"/>}
                bgColorClass="bg-gradient-to-br from-secondary to-green-600 dark:from-secondary-dark dark:to-green-700"
                textColorClass="text-white"
            />
            <StatBox
                title="Total Despesas (Período)"
                value={formatCurrency(chartPeriodSummary.expenses)}
                icon={<ArrowTrendingDownIcon className="h-5 w-5 text-white"/>}
                bgColorClass="bg-gradient-to-br from-danger to-red-600 dark:from-danger-dark dark:to-red-700"
                textColorClass="text-white"
            />
            <StatBox
                title="Resultado Líquido (Período)"
                value={formatCurrency(chartPeriodSummary.net)}
                icon={<BanknotesIcon className="h-5 w-5 text-white"/>}
                bgColorClass="bg-gradient-to-br from-primary to-blue-600 dark:from-primary-dark dark:to-blue-700"
                textColorClass="text-white"
            />
        </div>

        {monthlyOverviewData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={monthlyOverviewData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} className="stroke-neutral-300 dark:stroke-neutral-700" />
              <XAxis dataKey="month" tick={{ fill: '#6b7280' }} className="text-xs dark:fill-neutral-400" dy={10} interval="preserveStartEnd" />
              <YAxis
                tickFormatter={(value) => `${CURRENCY_SYMBOL}${value/1000}k`}
                tick={{ fill: '#6b7280' }}
                className="text-xs dark:fill-neutral-400"
                dx={-5}
                axisLine={false}
                tickLine={{ stroke: isDarkMode() ? '#374151' : '#e5e7eb', strokeWidth: 0.5 }}
              />
              <Tooltip
                  formatter={(value: number, name: string) => [formatCurrency(value), name === 'income' ? 'Receita' : 'Despesas']}
                  cursor={{fill: 'rgba(156, 163, 175, 0.08)'}} // neutral-400 with low opacity
                  contentStyle={{
                    backgroundColor: isDarkMode() ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)', 
                    border: `1px solid ${isDarkMode() ? 'rgba(75, 85, 99, 0.6)' : 'rgba(229, 231, 235, 0.8)'}`, 
                    borderRadius: '0.75rem', // rounded-xl
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' // shadow-lg
                  }}
                  labelStyle={{ fontWeight: '600', marginBottom: '6px', color: isDarkMode() ? '#f3f4f6' : '#1f2937' }} 
                  itemStyle={{ color: isDarkMode() ? '#d1d5db' : '#374151' }} 
              />
              <Legend wrapperStyle={{fontSize: '0.8rem', paddingTop: '15px'}}/>
              <Bar dataKey="income" fill="url(#colorIncomePremium)" name="Receita" radius={[6, 6, 0, 0]} barSize={22} />
              <Bar dataKey="expenses" fill="url(#colorExpensesPremium)" name="Despesas" radius={[6, 6, 0, 0]} barSize={22} />
              <defs>
                <linearGradient id="colorIncomePremium" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.9}/>
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.6}/>
                </linearGradient>
                <linearGradient id="colorExpensesPremium" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9}/>
                  <stop offset="100%" stopColor="#dc2626" stopOpacity={0.6}/>
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-neutral-500 dark:text-neutral-400 py-12">Não há dados suficientes para o gráfico de visão geral mensal.</p>
        )}
      </div>

      {expenseByCategory.length > 0 && (
          <div className="bg-white dark:bg-neutral-850 p-5 sm:p-6 rounded-2xl shadow-xl">
            <h3 className="text-xl font-semibold mb-6 text-neutral-700 dark:text-neutral-100">Distribuição de Despesas</h3>
            <ResponsiveContainer width="100%" height={400}>
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Pie
                    data={expenseByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={120} 
                    innerRadius={60}  
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={2}
                    label={renderCustomizedPieLabel}
                >
                    {expenseByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke={isDarkMode() ? "#18212f" : "#ffffff"} strokeWidth={3} />
                    ))}
                </Pie>
                <Tooltip formatter={(value: number, name: string) => [formatCurrency(value), name]}
                     contentStyle={{
                        backgroundColor: isDarkMode() ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)', 
                        border: `1px solid ${isDarkMode() ? 'rgba(75, 85, 99, 0.6)' : 'rgba(229, 231, 235, 0.8)'}`, 
                        borderRadius: '0.75rem', 
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' 
                      }}
                      labelStyle={{ fontWeight: '600', marginBottom: '6px', color: isDarkMode() ? '#f3f4f6' : '#1f2937' }} 
                      itemStyle={{ color: isDarkMode() ? '#d1d5db' : '#374151' }} 
                />
                <Legend iconSize={12} wrapperStyle={{ fontSize: '0.85rem', color: isDarkMode() ? '#9ca3af' : '#4b5563', paddingTop: '20px', paddingBottom: '10px' }} />
                </PieChart>
            </ResponsiveContainer>
          </div>
        )}
    </div>
  );
};