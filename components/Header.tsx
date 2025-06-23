
import React from 'react';
import { BellAlertIcon, UserCircleIcon, PlusCircleIcon, SunIcon, MoonIcon, Bars3Icon } from './icons'; 

interface HeaderProps {
  onAddTransactionClick: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  toggleSidebar: () => void; 
  isSidebarVisible: boolean; 
}

export const Header: React.FC<HeaderProps> = ({ 
  onAddTransactionClick, 
  isDarkMode, 
  toggleDarkMode,
  toggleSidebar,
  isSidebarVisible
}) => {
  return (
    <header className="app-header bg-white/80 dark:bg-neutral-800/80 backdrop-blur-md shadow-lg p-4 flex items-center justify-between border-b border-neutral-200/70 dark:border-neutral-700/50">
      <div className="flex items-center">
        <button
            onClick={toggleSidebar}
            className="p-2 mr-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700/60 hover:text-primary dark:hover:text-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-neutral-800 focus:ring-primary transition-colors"
            aria-label={isSidebarVisible ? "Ocultar menu" : "Mostrar menu"}
        >
            <Bars3Icon className="h-6 w-6" />
        </button>
        {/* Breadcrumbs or page title can go here */}
      </div>

      <div className="flex items-center space-x-2 sm:space-x-3">
        <button
            onClick={onAddTransactionClick}
            className="flex items-center bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary-darker text-white font-semibold py-2.5 px-3 sm:px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-150 ease-in-out text-sm transform hover:scale-105"
          >
            <PlusCircleIcon className="h-5 w-5 mr-0 sm:mr-2" />
            <span className="hidden sm:inline">Adicionar Transação</span>
        </button>
        <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700/60 hover:text-primary dark:hover:text-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-neutral-800 focus:ring-primary transition-colors"
            aria-label={isDarkMode ? "Mudar para modo claro" : "Mudar para modo escuro"}
        >
            {isDarkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
        </button>
        <button className="p-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700/60 hover:text-primary dark:hover:text-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-neutral-800 focus:ring-primary transition-colors" aria-label="Notificações">
          <BellAlertIcon className="h-5 w-5" />
        </button>
        <button className="p-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700/60 hover:text-primary dark:hover:text-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-neutral-800 focus:ring-primary transition-colors" aria-label="Perfil do usuário">
          <UserCircleIcon className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
};