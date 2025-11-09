import React from "react";

const IncomingOrders = () => {
  return (
    <div className="flex flex-1 flex-col p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
          Incoming Orders
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          View and manage orders from your customers
        </p>
      </div>

      {/* Filter/Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                search
              </span>
              <input
                type="text"
                placeholder="Search orders..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-supplier-accent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-base">
                filter_list
              </span>
              <span className="text-sm font-medium">Filter</span>
            </button>
            <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-base">sort</span>
              <span className="text-sm font-medium">Sort</span>
            </button>
          </div>
        </div>
      </div>

      {/* Order Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                0
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                New Orders
              </p>
            </div>
            <span className="material-symbols-outlined text-4xl text-blue-500">
              new_releases
            </span>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                0
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Processing
              </p>
            </div>
            <span className="material-symbols-outlined text-4xl text-yellow-500">
              pending
            </span>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                0
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Completed
              </p>
            </div>
            <span className="material-symbols-outlined text-4xl text-green-500">
              check_circle
            </span>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                0
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Cancelled
              </p>
            </div>
            <span className="material-symbols-outlined text-4xl text-red-500">
              cancel
            </span>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex-1">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            All Orders
          </h3>
        </div>
        <div className="p-8 text-center">
          <span className="material-symbols-outlined text-6xl text-gray-400 dark:text-gray-600">
            shopping_cart
          </span>
          <p className="mt-4 text-gray-500 dark:text-gray-500 text-lg">
            No orders yet
          </p>
          <p className="mt-2 text-sm text-gray-400 dark:text-gray-600">
            Orders from customers will appear here
          </p>
        </div>
      </div>
    </div>
  );
};

export default IncomingOrders;
