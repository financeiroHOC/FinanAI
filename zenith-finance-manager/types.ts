
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export interface Transaction {
  id: string;
  date: string; // ISO string format
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  imported?: boolean; // Adicionado para rastrear transações importadas
}

export interface Category {
  id:string;
  name: string;
  type: TransactionType;
}

export interface NavSubItem {
  name: string;
  path: string;
  dotColor?: string; // e.g., 'bg-blue-500'
}

export interface NavItem {
  name: string;
  path: string;
  icon: React.FC<{className?: string}>;
  type?: 'link'; // Indicates a clickable navigation link
  subItems?: NavSubItem[];
  exact?: boolean; // For NavLink end prop
}

export interface NavHeader {
  name: string;
  type: 'header';
}

export type SidebarItem = NavItem | NavHeader;


export interface DashboardPageProps {
  transactions: Transaction[];
  categories: Category[];
}

export type PeriodOption = 
  | 'currentMonth' 
  | 'lastMonth' 
  | 'currentQuarter' 
  | 'lastQuarter' 
  | 'currentYear' 
  | 'lastYear';