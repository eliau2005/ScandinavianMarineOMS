import React from "react";

const PriceListManagement = () => {
  return (
    <div className="flex flex-1 flex-col p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
          Price List Management
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Manage your product pricing and update price lists
        </p>
      </div>

      {/* Placeholder Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Price Lists Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Current Price Lists
            </h3>
            <button className="px-4 py-2 bg-supplier-accent text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors">
              + New Price List
            </button>
          </div>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
            <span className="material-symbols-outlined text-5xl text-gray-400 dark:text-gray-600">
              description
            </span>
            <p className="mt-2 text-gray-500 dark:text-gray-500">
              Price lists will appear here
            </p>
          </div>
        </div>

        {/* Recent Updates Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Recent Price Updates
          </h3>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
            <span className="material-symbols-outlined text-5xl text-gray-400 dark:text-gray-600">
              update
            </span>
            <p className="mt-2 text-gray-500 dark:text-gray-500">
              Recent updates will appear here
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Quick Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-3xl text-supplier-accent">
                  list_alt
                </span>
                <div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                    0
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Active Price Lists
                  </p>
                </div>
              </div>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-3xl text-supplier-accent">
                  inventory_2
                </span>
                <div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                    0
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total Products
                  </p>
                </div>
              </div>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-3xl text-supplier-accent">
                  schedule
                </span>
                <div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                    -
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Last Updated
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceListManagement;
