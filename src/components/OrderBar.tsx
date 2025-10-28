import React from 'react';
import Link from 'next/link';

interface OrderBarProps {
  orderId: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  price: number;
  deadline: string;
  clientName?: string;
  providerName?: string;
}

const OrderBar: React.FC<OrderBarProps> = ({
  orderId,
  title,
  status,
  price,
  deadline,
  clientName,
  providerName
}) => {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200'
  };

  const statusLabels = {
    pending: 'Pendente',
    in_progress: 'Em Andamento',
    completed: 'Concluído',
    cancelled: 'Cancelado'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
      <div className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {title}
            </h3>
            <div className="flex flex-wrap gap-2 mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
                {statusLabels[status]}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                Prazo: {deadline}
              </span>
            </div>
            {(clientName || providerName) && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {clientName && <span>Cliente: {clientName}</span>}
                {providerName && <span>Profissional: {providerName}</span>}
              </p>
            )}
          </div>
          <div className="mt-4 md:mt-0 flex flex-col items-end">
            <div className="text-xl font-bold text-green-600 dark:text-green-400 mb-2">
              R$ {price.toFixed(2)}
            </div>
            <Link 
              href={`/services/${orderId}`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Ver Detalhes
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderBar;