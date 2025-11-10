import React, { useState, useEffect } from "react";
import { account } from "../../../lib/appwrite";
import {
  productService,
  productCategoryService,
  unitOfMeasureService,
} from "../../../lib/priceListService";
import type { Product, ProductCategory, UnitOfMeasure } from "../../../types/priceList";
import CreateProductModal from "../../priceList/CreateProductModal";
import CreateCategoryModal from "../../priceList/CreateCategoryModal";
import CreateUnitModal from "../../priceList/CreateUnitModal";
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
  const [units, setUnits] = useState<UnitOfMeasure[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [editingCategory, setEditingCategory] = useState<ProductCategory | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "product" | "category";
    id: string;
    name: string;
    productCount?: number;
  } | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const loadUser = async () => {
    try {
      const user = await account.get();
      setCurrentUser({ id: user.$id, name: user.name || "Supplier" });
    } catch (error) {
      console.error("Error loading user:", error);
      showNotification("error", "Failed to load user information");
    }
  };

  const loadData = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const [productsData, categoriesData, unitsData] = await Promise.all([
        productService.getAll(),
        productCategoryService.getAll(),
        unitOfMeasureService.getBySupplier(currentUser.id),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);

      // Ensure at least the default 'kg' unit exists
      if (unitsData.length === 0) {
        const defaultUnit = await unitOfMeasureService.createDefaultUnit(
          currentUser.id,
          currentUser.name
        );
        setUnits([defaultUnit]);
      } else {
        setUnits(unitsData);
      }
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
    const { name, category_id } = data;
    const existingProduct = products.find(
      (p) =>
        p.name.toLowerCase() === name.toLowerCase() &&
        p.category_id === category_id
    );

    if (existingProduct) {
      throw new Error(
        `Product "${name}" already exists in this category.`
      );
    }

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

    const { name, category_id } = data;
    const existingProduct = products.find(
      (p) =>
        p.$id !== editingProduct.$id &&
        p.name.toLowerCase() === name.toLowerCase() &&
        p.category_id === category_id
    );

    if (existingProduct) {
      throw new Error(
        `Product "${name}" already exists in this category.`
      );
    }

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
    // 1. Check for duplicates within the import list
    const nameCategorySet = new Set<string>();
    const duplicatesInList: string[] = [];
    for (const product of productsData) {
      const key = `${product.name.toLowerCase()}|${product.category_id}`;
      if (nameCategorySet.has(key)) {
        duplicatesInList.push(product.name);
      }
      nameCategorySet.add(key);
    }

    if (duplicatesInList.length > 0) {
      throw new Error(
        `Duplicate products found in your import list: ${[
          ...new Set(duplicatesInList),
        ].join(", ")}`
      );
    }

    // 2. Check for duplicates against existing products
    const duplicatesInDb: string[] = [];
    for (const product of productsData) {
      const existingProduct = products.find(
        (p) =>
          p.name.toLowerCase() === product.name.toLowerCase() &&
          p.category_id === product.category_id
      );
      if (existingProduct) {
        duplicatesInDb.push(product.name);
      }
    }

    if (duplicatesInDb.length > 0) {
      throw new Error(
        `The following products already exist in these categories: ${duplicatesInDb.join(
          ", "
        )}`
      );
    }

    // If no duplicates, proceed with creation
    try {
      console.log("Bulk importing products with data:", productsData); // Debugging line
      await Promise.all(productsData.map((data) => productService.create(data)));
      await loadData();
      showNotification("success", `Successfully imported ${productsData.length} products`);
    } catch (error) {
      console.error("Error bulk importing products:", error);
      throw new Error("Failed to import products");
    }
  };

  // Unit Handlers
  const handleCreateUnit = async (data: Omit<UnitOfMeasure, "$id">) => {
    await unitOfMeasureService.create(data);
    await loadData();
    showNotification("success", "Unit created successfully");
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

    const originalIsActive = editingCategory.is_active;
    const updatedCategory = await productCategoryService.update(
      editingCategory.$id!,
      data
    );

    // If category was active and is now inactive, deactivate all its products
    if (originalIsActive && !updatedCategory.is_active) {
      const productsToDeactivate = products.filter(
        (p) => p.category_id === updatedCategory.$id && p.is_active
      );

      if (productsToDeactivate.length > 0) {
        await Promise.all(
          productsToDeactivate.map((product) =>
            productService.update(product.$id!, { is_active: false })
          )
        );
        showNotification(
          "info",
          `${productsToDeactivate.length} products in "${updatedCategory.name}" have been deactivated.`
        );
      }
    }

    await loadData();
    setEditingCategory(undefined);
    showNotification("success", "Category updated successfully");
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const productsInCategory = products.filter((p) => p.category_id === id);
      if (productsInCategory.length > 0) {
        // First, delete all products in the category
        await Promise.all(
          productsInCategory.map((p) => productService.delete(p.$id!))
        );
      }

      // Then, delete the category itself
      await productCategoryService.delete(id);

      await loadData();
      showNotification(
        "success",
        `Category and its ${productsInCategory.length} products deleted successfully`
      );
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
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderProducts = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Products ({filteredProducts.length})
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBulkImportModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <span className="material-symbols-outlined text-base">upload</span>
            <span>Bulk Import</span>
          </button>
          <button
            onClick={() => {
              setEditingProduct(undefined);
              setShowProductModal(true);
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-supplier-accent text-white rounded-lg text-xs font-medium hover:bg-opacity-90 transition-colors"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>New Product</span>
          </button>
        </div>
      </div>

      {/* Products Tables - Grouped by Category */}
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
        <div className="flex gap-6">
          {/* Left Column */}
          <div className="flex-1 space-y-6">
            {categories
              .filter((category) =>
                filteredProducts.some((p) => p.category_id === category.$id)
              )
              .map((category, index) => {
                // Only render odd-indexed categories (0, 2, 4, etc.) in left column
                if (index % 2 !== 0) return null;

                const categoryProducts = filteredProducts.filter(
                  (p) => p.category_id === category.$id
                );

                return (
                  <div
                    key={category.$id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
                  >
                    {/* Category Header */}
                    <div className="bg-supplier-accent/10 dark:bg-supplier-accent/20 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                      <div className="flex items-center gap-2">
                        {category.icon && (
                          <span className="material-symbols-outlined text-xl text-supplier-accent">
                            {category.icon}
                          </span>
                        )}
                        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          {category.name}
                        </h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ({categoryProducts.length})
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                              Product Name
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                              Unit
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
                          {categoryProducts.map((product) => (
                            <tr
                              key={product.$id}
                              className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              <td className="px-4 py-3">
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                  {product.name}
                                </p>
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                  {product.unit_of_measure}
                                </span>
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
                );
              })}
          </div>

          {/* Right Column */}
          <div className="flex-1 space-y-6">
            {categories
              .filter((category) =>
                filteredProducts.some((p) => p.category_id === category.$id)
              )
              .map((category, index) => {
                // Only render even-indexed categories (1, 3, 5, etc.) in right column
                if (index % 2 === 0) return null;

                const categoryProducts = filteredProducts.filter(
                  (p) => p.category_id === category.$id
                );

                return (
                  <div
                    key={category.$id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
                  >
                    {/* Category Header */}
                    <div className="bg-supplier-accent/10 dark:bg-supplier-accent/20 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                      <div className="flex items-center gap-2">
                        {category.icon && (
                          <span className="material-symbols-outlined text-xl text-supplier-accent">
                            {category.icon}
                          </span>
                        )}
                        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          {category.name}
                        </h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ({categoryProducts.length})
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                              Product Name
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                              Unit
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
                          {categoryProducts.map((product) => (
                            <tr
                              key={product.$id}
                              className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              <td className="px-4 py-3">
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                  {product.name}
                                </p>
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                  {product.unit_of_measure}
                                </span>
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
                );
              })}
          </div>
        </div>
      )}
    </div>
  );

  const renderCategories = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Categories ({filteredCategories.length})
          </h3>
        </div>
        <button
          onClick={() => {
            setEditingCategory(undefined);
            setShowCategoryModal(true);
          }}
          className="flex items-center gap-2 px-3 py-1.5 bg-supplier-accent text-white rounded-lg text-xs font-medium hover:bg-opacity-90 transition-colors"
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
        <div className="space-y-3 max-h-[70vh] overflow-y-auto p-1">
          {filteredCategories.map((category) => {
            const productCount = products.filter(
              (p) => p.category_id === category.$id
            ).length;

            return (
              <div
                key={category.$id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {category.icon && (
                      <span className="material-symbols-outlined text-2xl text-supplier-accent">
                        {category.icon}
                      </span>
                    )}
                    <div>
                      <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200">
                        {category.name}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {productCount} product{productCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      category.is_active
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {category.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="flex items-center justify-end pt-2 mt-2 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-1">
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
                          productCount: productCount,
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
      {activeTab === "products" ? renderProducts() : renderCategories()}


      {/* Modals */}
      <CreateProductModal
        isOpen={showProductModal}
        onClose={() => {
          setShowProductModal(false);
          setEditingProduct(undefined);
        }}
        onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}
        categories={categories}
        units={units}
        onAddUnit={() => setShowUnitModal(true)}
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

      <CreateUnitModal
        isOpen={showUnitModal}
        onClose={() => setShowUnitModal(false)}
        onSubmit={handleCreateUnit}
        supplierInfo={{
          id: currentUser?.id || "",
          name: currentUser?.name || "",
        }}
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
        message={
          deleteConfirm?.type === "category" &&
          deleteConfirm.productCount &&
          deleteConfirm.productCount > 0 ? (
            <div className="space-y-2">
              <p>
                This action is irreversible. It will permanently delete the{" "}
                <strong>{deleteConfirm.name}</strong> category and all{" "}
                <strong>{deleteConfirm.productCount}</strong> products within it.
              </p>
            </div>
          ) : (
            `Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`
          )
        }
        confirmText="Delete"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        confirmationString={
          deleteConfirm?.type === "category" &&
          deleteConfirm.productCount &&
          deleteConfirm.productCount > 0
            ? deleteConfirm.name
            : undefined
        }
      />
    </div>
  );
};

export default ProductManagement;
