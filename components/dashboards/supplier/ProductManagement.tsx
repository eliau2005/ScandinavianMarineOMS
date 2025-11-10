import React, { useState, useEffect } from "react";
import {
  productService,
  productCategoryService,
} from "../../../lib/priceListService";
import type { Product, ProductCategory } from "../../../types/priceList";
import CreateProductModal from "../../priceList/CreateProductModal";
import CreateCategoryModal from "../../priceList/CreateCategoryModal";
import BulkImportModal from "../../priceList/BulkImportModal";
import ConfirmationDialog from "../../common/ConfirmationDialog";

interface Notification {
  type: "success" | "error" | "info";
  message: string;
}

type Tab = "products" | "categories";

const ProductManagement = () => {
  const [activeTab, setActiveTab] = useState<Tab>("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [editingCategory, setEditingCategory] = useState<ProductCategory | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "product" | "category";
    id: string;
    name: string;
  } | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsData, categoriesData] = await Promise.all([
        productService.getAll(),
        productCategoryService.getAll(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error loading data:", error);
      showNotification("error", "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: Notification["type"], message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Product Handlers
  const handleCreateProduct = async (data: Omit<Product, "$id">) => {
    const product = await productService.create(data);
    await loadData();
    showNotification("success", "Product created successfully");
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowProductModal(true);
  };

  const handleUpdateProduct = async (data: Omit<Product, "$id">) => {
    if (!editingProduct) return;
    await productService.update(editingProduct.$id!, data);
    await loadData();
    setEditingProduct(undefined);
    showNotification("success", "Product updated successfully");
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await productService.delete(id);
      await loadData();
      showNotification("success", "Product deleted successfully");
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting product:", error);
      showNotification("error", "Failed to delete product");
    }
  };

  const handleBulkImport = async (productsData: Omit<Product, "$id">[]) => {
    try {
      await Promise.all(productsData.map((data) => productService.create(data)));
      await loadData();
      showNotification("success", `Successfully imported ${productsData.length} products`);
    } catch (error) {
      console.error("Error bulk importing products:", error);
      throw new Error("Failed to import products");
    }
  };

  // Category Handlers
  const handleCreateCategory = async (data: Omit<ProductCategory, "$id">) => {
    await productCategoryService.create(data);
    await loadData();
    showNotification("success", "Category created successfully");
  };

  const handleEditCategory = (category: ProductCategory) => {
    setEditingCategory(category);
    setShowCategoryModal(true);
  };

  const handleUpdateCategory = async (data: Omit<ProductCategory, "$id">) => {
    if (!editingCategory) return;
    await productCategoryService.update(editingCategory.$id!, data);
    await loadData();
    setEditingCategory(undefined);
    showNotification("success", "Category updated successfully");
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      // Check if category has products
      const categoryProducts = products.filter((p) => p.category_id === id);
      if (categoryProducts.length > 0) {
        showNotification(
          "error",
          `Cannot delete category with ${categoryProducts.length} products. Delete products first.`
        );
        setDeleteConfirm(null);
        return;
      }

      await productCategoryService.delete(id);
      await loadData();
      showNotification("success", "Category deleted successfully");
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting category:", error);
      showNotification("error", "Failed to delete category");
    }
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.$id === categoryId)?.name || "Unknown";
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.base_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderProductsTab = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Products
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage your product catalog
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBulkImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <span className="material-symbols-outlined text-base">upload</span>
            <span>Bulk Import</span>
          </button>
          <button
            onClick={() => {
              setEditingProduct(undefined);
              setShowProductModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-supplier-accent text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>New Product</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="flex items-center justify-center p-12 bg-white dark:bg-gray-800 rounded-lg">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-supplier-accent"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading products...</p>
          </div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <span className="material-symbols-outlined text-6xl text-gray-400 dark:text-gray-600">
            inventory_2
          </span>
          <p className="mt-4 text-gray-600 dark:text-gray-400 text-lg">
            {searchTerm ? "No products found" : "No products yet"}
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
            {searchTerm
              ? "Try a different search term"
              : "Create your first product to get started"}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Product Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    SKU
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredProducts.map((product) => (
                  <tr
                    key={product.$id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {product.base_name}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">
                      {getCategoryName(product.category_id)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {product.sku || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.is_active
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {product.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-supplier-accent dark:hover:text-supplier-accent transition-colors"
                          title="Edit"
                        >
                          <span className="material-symbols-outlined text-base">
                            edit
                          </span>
                        </button>
                        <button
                          onClick={() =>
                            setDeleteConfirm({
                              type: "product",
                              id: product.$id!,
                              name: product.name,
                            })
                          }
                          className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <span className="material-symbols-outlined text-base">
                            delete
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderCategoriesTab = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Product Categories
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Organize products into categories
          </p>
        </div>
        <button
          onClick={() => {
            setEditingCategory(undefined);
            setShowCategoryModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-supplier-accent text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
        >
          <span className="material-symbols-outlined text-base">add</span>
          <span>New Category</span>
        </button>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-12 bg-white dark:bg-gray-800 rounded-lg">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-supplier-accent"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Loading categories...
            </p>
          </div>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <span className="material-symbols-outlined text-6xl text-gray-400 dark:text-gray-600">
            category
          </span>
          <p className="mt-4 text-gray-600 dark:text-gray-400 text-lg">
            {searchTerm ? "No categories found" : "No categories yet"}
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
            {searchTerm
              ? "Try a different search term"
              : "Create your first category to organize products"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((category) => {
            const productCount = products.filter(
              (p) => p.category_id === category.$id
            ).length;

            return (
              <div
                key={category.$id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {category.icon && (
                      <span className="material-symbols-outlined text-3xl text-supplier-accent">
                        {category.icon}
                      </span>
                    )}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        {category.name}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Order: {category.display_order}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      category.is_active
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {category.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                {category.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {category.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {productCount} product{productCount !== 1 ? "s" : ""}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-supplier-accent dark:hover:text-supplier-accent transition-colors"
                      title="Edit"
                    >
                      <span className="material-symbols-outlined text-base">
                        edit
                      </span>
                    </button>
                    <button
                      onClick={() =>
                        setDeleteConfirm({
                          type: "category",
                          id: category.$id!,
                          name: category.name,
                        })
                      }
                      className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <span className="material-symbols-outlined text-base">
                        delete
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-1 flex-col p-6">
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div
            className={`px-4 py-3 rounded-lg shadow-lg ${
              notification.type === "success"
                ? "bg-green-500 text-white"
                : notification.type === "error"
                ? "bg-red-500 text-white"
                : "bg-blue-500 text-white"
            }`}
          >
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
          Product Management
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Manage products and categories for your price lists
        </p>
      </div>

      {/* Tabs & Search */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab("products")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "products"
                ? "bg-supplier-accent text-white"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            Products ({products.length})
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "categories"
                ? "bg-supplier-accent text-white"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            Categories ({categories.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-supplier-accent w-64"
          />
        </div>
      </div>

      {/* Content */}
      {activeTab === "products" ? renderProductsTab() : renderCategoriesTab()}

      {/* Modals */}
      <CreateProductModal
        isOpen={showProductModal}
        onClose={() => {
          setShowProductModal(false);
          setEditingProduct(undefined);
        }}
        onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}
        categories={categories}
        editProduct={editingProduct}
      />

      <CreateCategoryModal
        isOpen={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false);
          setEditingCategory(undefined);
        }}
        onSubmit={
          editingCategory ? handleUpdateCategory : handleCreateCategory
        }
        editCategory={editingCategory}
      />

      <BulkImportModal
        isOpen={showBulkImportModal}
        onClose={() => setShowBulkImportModal(false)}
        onSubmit={handleBulkImport}
        categories={categories}
      />

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => {
          if (deleteConfirm) {
            if (deleteConfirm.type === "product") {
              handleDeleteProduct(deleteConfirm.id);
            } else {
              handleDeleteCategory(deleteConfirm.id);
            }
          }
        }}
        title={`Delete ${deleteConfirm?.type === "product" ? "Product" : "Category"}`}
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />
    </div>
  );
};

export default ProductManagement;
