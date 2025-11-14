import React, { useState, useEffect } from "react";
import { account } from "../../../lib/appwrite";
import {
  productService,
  productCategoryService,
  unitOfMeasureService,
  priceListService,
} from "../../../lib/priceListService";
import type { Product, ProductCategory, UnitOfMeasure } from "../../../types/priceList";
import CreateProductModal from "../../priceList/CreateProductModal";
import CreateCategoryModal from "../../priceList/CreateCategoryModal";
import CreateUnitModal from "../../priceList/CreateUnitModal";
import BulkImportModal from "../../priceList/BulkImportModal";
import ConfirmationDialog from "../../common/ConfirmationDialog";
import Modal from "../../common/Modal";

interface Notification {
  type: "success" | "error" | "info";
  message: string;
}

const ProductManagement = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [units, setUnits] = useState<UnitOfMeasure[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showManageUnitsModal, setShowManageUnitsModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [isManaging, setIsManaging] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [editingCategory, setEditingCategory] = useState<ProductCategory | undefined>();
  const [editingUnit, setEditingUnit] = useState<UnitOfMeasure | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "product" | "category" | "unit";
    id: string;
    name: string;
    productCount?: number;
  } | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  // Set initial selected category when categories are loaded
  useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].$id!);
    }
  }, [categories, selectedCategoryId]);

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
      // Check if product is used in non-draft price lists
      const usageCheck = await priceListService.checkProductsInUse([id]);

      if (usageCheck.inUse) {
        const statusText = usageCheck.statuses
          .map((status) => status.replace("_", " "))
          .join(", ");
        const priceListText =
          usageCheck.priceListNames.length === 1
            ? `price list "${usageCheck.priceListNames[0]}" (${statusText})`
            : `${usageCheck.priceListNames.length} price lists (${statusText})`;

        showNotification(
          "error",
          `Cannot delete product. It is used in ${priceListText}. Remove it from those price lists first.`
        );
        setDeleteConfirm(null);
        return;
      }

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

  const handleEditUnit = (unit: UnitOfMeasure) => {
    setEditingUnit(unit);
    setShowUnitModal(true);
  };

  const handleUpdateUnit = async (data: Omit<UnitOfMeasure, "$id">) => {
    if (!editingUnit) return;

    await unitOfMeasureService.update(editingUnit.$id!, data);
    await loadData();
    setEditingUnit(undefined);
    showNotification("success", "Unit updated successfully");
  };

  const handleDeleteUnit = async (id: string) => {
    try {
      // Check if any products use this unit
      const productsUsingUnit = products.filter(
        (p) => p.unit_of_measure === units.find((u) => u.$id === id)?.unit_name
      );

      if (productsUsingUnit.length > 0) {
        showNotification(
          "error",
          `Cannot delete unit. It is used by ${productsUsingUnit.length} product${productsUsingUnit.length !== 1 ? "s" : ""}. Change the unit for those products first.`
        );
        setDeleteConfirm(null);
        return;
      }

      await unitOfMeasureService.delete(id);
      await loadData();
      showNotification("success", "Unit deleted successfully");
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting unit:", error);
      showNotification("error", "Failed to delete unit");
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

      // Check if any products in this category are used in non-draft price lists
      if (productsInCategory.length > 0) {
        const productIds = productsInCategory.map((p) => p.$id!);
        const usageCheck = await priceListService.checkProductsInUse(productIds);

        if (usageCheck.inUse) {
          const statusText = usageCheck.statuses
            .map((status) => status.replace("_", " "))
            .join(", ");
          const priceListText =
            usageCheck.priceListNames.length === 1
              ? `price list "${usageCheck.priceListNames[0]}" (${statusText})`
              : `${usageCheck.priceListNames.length} price lists (${statusText})`;

          showNotification(
            "error",
            `Cannot delete category. Products in this category are used in ${priceListText}. Remove them from those price lists first.`
          );
          setDeleteConfirm(null);
          return;
        }

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

  const filteredUnits = units.filter((unit) =>
    unit.unit_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderProducts = () => {
    // Get categories that have products
    const categoriesWithProducts = categories.filter((category) =>
      filteredProducts.some((p) => p.category_id === category.$id)
    );

    // Get products for selected category
    const selectedCategoryProducts = selectedCategoryId
      ? filteredProducts.filter((p) => p.category_id === selectedCategoryId)
      : [];

    const selectedCategory = categories.find((c) => c.$id === selectedCategoryId);

    return (
      <div className="space-y-4">

        {/* Master-Detail Layout */}
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
          <div className="flex gap-4 h-[calc(100vh-16rem)]">
            {/* Left Column - Master (Category List) */}
            <div className="w-64 flex-shrink-0 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase">
                  Categories
                </h4>
              </div>
              <div className="overflow-y-auto h-[calc(100%-3rem)]">
                {categoriesWithProducts.map((category) => {
                  const productCount = filteredProducts.filter(
                    (p) => p.category_id === category.$id
                  ).length;
                  const isSelected = selectedCategoryId === category.$id;

                  return (
                    <div
                      key={category.$id}
                      className={`border-b border-gray-100 dark:border-gray-700 transition-colors ${
                        isSelected
                          ? "bg-supplier-accent/10 dark:bg-supplier-accent/20 border-l-4 border-l-supplier-accent"
                          : "hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      <div
                        onClick={() => setSelectedCategoryId(category.$id!)}
                        className="w-full text-left px-4 py-3 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          {category.icon && (
                            <span
                              className={`material-symbols-outlined text-lg ${
                                isSelected
                                  ? "text-supplier-accent"
                                  : "text-gray-500 dark:text-gray-400"
                              }`}
                            >
                              {category.icon}
                            </span>
                          )}
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-medium truncate ${
                                isSelected
                                  ? "text-gray-900 dark:text-gray-100"
                                  : "text-gray-700 dark:text-gray-300"
                              }`}
                            >
                              {category.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {productCount} {productCount === 1 ? "product" : "products"}
                            </p>
                          </div>
                        </div>
                      </div>
                      {isManaging && (
                        <div className="flex items-center justify-end gap-1 px-2 pb-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditCategory(category);
                            }}
                            className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-supplier-accent dark:hover:text-supplier-accent transition-colors"
                            title="Edit"
                          >
                            <span className="material-symbols-outlined text-base">
                              edit
                            </span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirm({
                                type: "category",
                                id: category.$id!,
                                name: category.name,
                                productCount: productCount,
                              });
                            }}
                            className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined text-base">
                              delete
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Content Area - Detail (Product Table) */}
            <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              {selectedCategory ? (
                <>
                  {/* Category Header */}
                  <div className="bg-supplier-accent/10 dark:bg-supplier-accent/20 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-2">
                      {selectedCategory.icon && (
                        <span className="material-symbols-outlined text-xl text-supplier-accent">
                          {selectedCategory.icon}
                        </span>
                      )}
                      <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200">
                        {selectedCategory.name}
                      </h4>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({selectedCategoryProducts.length}{" "}
                        {selectedCategoryProducts.length === 1 ? "product" : "products"})
                      </span>
                    </div>
                  </div>

                  {/* Product Table */}
                  <div className="overflow-auto h-[calc(100%-3.5rem)]">
                    {selectedCategoryProducts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-12">
                        <span className="material-symbols-outlined text-6xl text-gray-400 dark:text-gray-600">
                          inventory_2
                        </span>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">
                          No products in this category
                        </p>
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 sticky top-0">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                              Product Name
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                              Unit
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                              Status
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {selectedCategoryProducts.map((product) => (
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
                                <div className="flex justify-end">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                    {product.unit_of_measure}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex justify-end">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      product.is_active
                                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                    }`}
                                  >
                                    {product.is_active ? "Active" : "Inactive"}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
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
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-12">
                  <span className="material-symbols-outlined text-6xl text-gray-400 dark:text-gray-600">
                    category
                  </span>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">
                    Select a category to view products
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };


  return (
    <div className="flex flex-1 flex-col overflow-hidden">
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

      {/* Fixed Header: Title & Actions */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4 bg-background-light dark:bg-background-dark">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            Product Management
          </h2>

          {/* Search */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products..."
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-supplier-accent w-64"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBulkImportModal(true)}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <span className="material-symbols-outlined text-base">upload</span>
            <span>Bulk Import</span>
          </button>
          <button
            onClick={() => {
              setEditingProduct(undefined);
              setShowProductModal(true);
            }}
            className="flex items-center gap-2 px-3 py-2 bg-supplier-accent text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>New Product</span>
          </button>
          <button
            onClick={() => {
              setEditingCategory(undefined);
              setShowCategoryModal(true);
            }}
            className="flex items-center gap-2 px-3 py-2 bg-supplier-accent text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>New Category</span>
          </button>
          <button
            onClick={() => setShowManageUnitsModal(true)}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <span className="material-symbols-outlined text-base">straighten</span>
            <span>Manage Units</span>
          </button>
          <button
            onClick={() => setIsManaging(!isManaging)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isManaging
                ? "bg-supplier-accent text-white hover:bg-opacity-90"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            <span className="material-symbols-outlined text-base">
              {isManaging ? "check" : "edit"}
            </span>
            <span>{isManaging ? "Done Managing" : "Manage Lists"}</span>
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {renderProducts()}
      </div>


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
        onClose={() => {
          setShowUnitModal(false);
          setEditingUnit(undefined);
        }}
        onSubmit={editingUnit ? handleUpdateUnit : handleCreateUnit}
        supplierInfo={{
          id: currentUser?.id || "",
          name: currentUser?.name || "",
        }}
        editUnit={editingUnit}
      />

      <BulkImportModal
        isOpen={showBulkImportModal}
        onClose={() => setShowBulkImportModal(false)}
        onSubmit={handleBulkImport}
        categories={categories}
      />

      {/* Manage Units Modal */}
      <Modal
        isOpen={showManageUnitsModal}
        onClose={() => setShowManageUnitsModal(false)}
        title="Manage Units of Measure"
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total: {filteredUnits.length} unit{filteredUnits.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={() => {
                setEditingUnit(undefined);
                setShowUnitModal(true);
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-supplier-accent text-white rounded-lg text-xs font-medium hover:bg-opacity-90 transition-colors"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>New Unit</span>
            </button>
          </div>

          {/* Units List */}
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-supplier-accent"></div>
                <p className="text-gray-600 dark:text-gray-400">
                  Loading units...
                </p>
              </div>
            </div>
          ) : filteredUnits.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12">
              <span className="material-symbols-outlined text-6xl text-gray-400 dark:text-gray-600">
                straighten
              </span>
              <p className="mt-4 text-gray-600 dark:text-gray-400 text-lg">
                No units yet
              </p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
                Create your first unit of measure
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto p-1">
              {filteredUnits.map((unit) => {
                const productCount = products.filter(
                  (p) => p.unit_of_measure === unit.unit_name
                ).length;

                return (
                  <div
                    key={unit.$id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-2xl text-supplier-accent">
                          straighten
                        </span>
                        <div>
                          <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200">
                            {unit.unit_name}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {productCount} product{productCount !== 1 ? "s" : ""}
                            {unit.is_default && " • Default"}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          unit.is_active
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {unit.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="flex items-center justify-end pt-2 mt-2 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditUnit(unit)}
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
                              type: "unit",
                              id: unit.$id!,
                              name: unit.unit_name,
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
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => {
          if (deleteConfirm) {
            if (deleteConfirm.type === "product") {
              handleDeleteProduct(deleteConfirm.id);
            } else if (deleteConfirm.type === "category") {
              handleDeleteCategory(deleteConfirm.id);
            } else if (deleteConfirm.type === "unit") {
              handleDeleteUnit(deleteConfirm.id);
            }
          }
        }}
        title={`Delete ${
          deleteConfirm?.type === "product"
            ? "Product"
            : deleteConfirm?.type === "category"
            ? "Category"
            : "Unit"
        }`}
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
