import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { account } from "../../../lib/appwrite";
import { associationService, orderService } from "../../../lib/orderService";
import { priceListService } from "../../../lib/priceListService";
import type { PriceListWithItems, PriceListTableRow } from "../../../types/priceList";
import type { CartItem, OrderItem } from "../../../types/order";
import { generateOrderNumber } from "../../../types/order";
import { createNotification } from "../../../lib/notificationService";
import { userManagementService } from "../../../lib/userManagement";
import Modal from "../../common/Modal";

interface SupplierWithPriceList {
  supplierId: string;
  supplierName: string;
  priceList: PriceListWithItems;
}

type OrderView = "selection" | "ordering";

const PlaceOrder = () => {
  // User and selection state
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);
  const [orderView, setOrderView] = useState<OrderView>("selection");
  const [supplierPriceLists, setSupplierPriceLists] = useState<SupplierWithPriceList[]>([]);
  const [selectedSupplierPriceList, setSelectedSupplierPriceList] = useState<SupplierWithPriceList | null>(null);

  // Products and categories
  const [categories, setCategories] = useState<string[]>([]);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [productsMap, setProductsMap] = useState<Map<string, PriceListTableRow[]>>(new Map());

  // Cart and order state
  const [cart, setCart] = useState<Map<string, CartItem>>(new Map());
  const [notes, setNotes] = useState("");
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    loadUserAndSupplierPriceLists();
  }, []);

  const loadUserAndSupplierPriceLists = async () => {
    setLoading(true);
    try {
      const user = await account.get();
      setCurrentUser({ id: user.$id, name: user.name || "Customer" });

      // Get associated suppliers
      const associations = await associationService.getByCustomer(user.$id);

      // For each supplier, get their active price lists
      const supplierData: SupplierWithPriceList[] = [];

      for (const association of associations) {
        const activePriceLists = await priceListService.getActiveBySupplier(association.supplier_id);

        for (const priceList of activePriceLists) {
          // Load full details
          const fullPriceList = await priceListService.getWithItems(priceList.$id!);

          supplierData.push({
            supplierId: association.supplier_id,
            supplierName: association.supplier_name,
            priceList: fullPriceList,
          });
        }
      }

      setSupplierPriceLists(supplierData);
    } catch (error) {
      console.error("Error loading supplier price lists:", error);
      toast.error("Failed to load supplier price lists");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSupplierPriceList = (supplierPriceList: SupplierWithPriceList) => {
    setSelectedSupplierPriceList(supplierPriceList);

    // Process products from price list
    const products = supplierPriceList.priceList.items
      ?.filter((item) => item.is_available && item.price_box !== null)
      .map((item) => ({
        product: item.product!,
        category: item.product?.category!,
        price_box: item.price_box,
        price_box_vac: item.price_box_vac,
        vac_surcharge: item.vac_surcharge,
        is_available: item.is_available,
        item_id: item.$id,
      })) || [];

    // Group by category
    const grouped = products.reduce((acc, product) => {
      const categoryName = product.category?.name || "Other";
      if (!acc.has(categoryName)) {
        acc.set(categoryName, []);
      }
      acc.get(categoryName)!.push(product);
      return acc;
    }, new Map<string, PriceListTableRow[]>());

    const categoryNames = Array.from(grouped.keys());
    setCategories(categoryNames);
    setProductsMap(grouped);
    setCurrentCategoryIndex(0);
    setCart(new Map());
    setNotes("");
    setOrderView("ordering");
  };

  const handleBackToSelection = () => {
    setOrderView("selection");
    setSelectedSupplierPriceList(null);
    setCategories([]);
    setProductsMap(new Map());
    setCurrentCategoryIndex(0);
    setCart(new Map());
    setNotes("");
  };

  const handleQuantityChange = (
    productId: string,
    productName: string,
    categoryId: string | undefined,
    categoryName: string | undefined,
    price: number,
    quantity: number
  ) => {
    const newCart = new Map(cart);
    if (quantity > 0) {
      newCart.set(productId, {
        product_id: productId,
        product_name: productName,
        unit_price: price,
        quantity,
      });
    } else {
      newCart.delete(productId);
    }
    setCart(newCart);
  };

  const handleNextCategory = () => {
    if (currentCategoryIndex < categories.length - 1) {
      setCurrentCategoryIndex(currentCategoryIndex + 1);
    }
  };

  const handlePreviousCategory = () => {
    if (currentCategoryIndex > 0) {
      setCurrentCategoryIndex(currentCategoryIndex - 1);
    }
  };

  const handleViewSummary = () => {
    if (cart.size === 0) {
      toast.error("Please add items to your cart");
      return;
    }
    setShowSummaryModal(true);
  };

  const handlePlaceOrder = async () => {
    if (!selectedSupplierPriceList || !currentUser) return;

    setPlacing(true);
    try {
      const orderItems: OrderItem[] = Array.from(cart.values()).map((item) => {
        // Find the product to get category information
        let categoryId: string | undefined;
        let categoryName: string | undefined;

        for (const [catName, products] of productsMap.entries()) {
          const product = products.find(p => p.product.$id === item.product_id);
          if (product) {
            categoryId = product.category.$id;
            categoryName = product.category.name;
            break;
          }
        }

        return {
          product_id: item.product_id,
          product_name: item.product_name,
          category_id: categoryId,
          category_name: categoryName,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.quantity * item.unit_price,
        };
      });

      const newOrder = await orderService.create({
        order_number: generateOrderNumber(),
        customer_id: currentUser.id,
        customer_name: currentUser.name,
        supplier_id: selectedSupplierPriceList.supplierId,
        supplier_name: selectedSupplierPriceList.supplierName,
        price_list_id: selectedSupplierPriceList.priceList.$id!,
        price_list_name: selectedSupplierPriceList.priceList.name,
        status: "pending_approval",
        order_date: new Date().toISOString(),
        delivery_start_date: selectedSupplierPriceList.priceList.effective_date,
        delivery_end_date: selectedSupplierPriceList.priceList.expiry_date!,
        items: orderItems,
        customer_notes: notes || null,
        currency: "EUR",
        total_amount: 0, // Calculated by service
      });

      // Create notification for admins
      const adminIds = await userManagementService.getAdminUserIds();
      for (const adminId of adminIds) {
        await createNotification(
          "order_pending_approval",
          `Order ${newOrder.order_number} from ${currentUser.name} is pending approval`,
          newOrder.$id!,
          currentUser.name,
          adminId
        );
      }

      toast.success("Order placed successfully and is pending admin approval!");
      setShowSummaryModal(false);

      // Go back to selection view
      handleBackToSelection();
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Failed to place order");
    } finally {
      setPlacing(false);
    }
  };

  const cartTotal = Array.from(cart.values()).reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );

  const cartItemCount = Array.from(cart.values()).reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const currentCategoryName = categories[currentCategoryIndex];
  const currentProducts = currentCategoryName ? productsMap.get(currentCategoryName) || [] : [];

  // Group cart items by category for summary modal
  const groupedCartItems = Array.from(cart.values()).reduce((acc, item) => {
    let categoryName = "Other";
    for (const [catName, products] of productsMap.entries()) {
      if (products.find(p => p.product.$id === item.product_id)) {
        categoryName = catName;
        break;
      }
    }
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(item);
    return acc;
  }, {} as Record<string, CartItem[]>);

  return (
    <div className="flex flex-1 flex-col p-6">
      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-customer-accent"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      ) : orderView === "selection" ? (
        // ===== SUPPLIER & PRICE LIST SELECTION VIEW =====
        <>
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              Select Supplier & Price List
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Choose a supplier and their active price list to start ordering
            </p>
          </div>

          {supplierPriceLists.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <span className="material-symbols-outlined text-6xl text-gray-400 dark:text-gray-600">
                store
              </span>
              <p className="mt-4 text-gray-600 dark:text-gray-400 text-lg">
                No active price lists available
              </p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
                Your suppliers don't have any active price lists at the moment
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {supplierPriceLists.map((supplierPriceList) => (
                <button
                  key={`${supplierPriceList.supplierId}-${supplierPriceList.priceList.$id}`}
                  onClick={() => handleSelectSupplierPriceList(supplierPriceList)}
                  className="group bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all p-6 text-left border-2 border-transparent hover:border-customer-accent"
                >
                  <div className="flex flex-col h-full">
                    {/* Supplier Name */}
                    <div className="mb-4">
                      <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                        {supplierPriceList.supplierName}
                      </h3>
                      <div className="h-1 w-12 bg-customer-accent rounded"></div>
                    </div>

                    {/* Price List Name */}
                    <div className="flex-1 mb-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Price List
                      </p>
                      <p className="text-base font-semibold text-gray-800 dark:text-gray-200">
                        {supplierPriceList.priceList.name}
                      </p>
                    </div>

                    {/* Delivery Window */}
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-1">
                        Delivery Window (ETA)
                      </p>
                      <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                        {format(new Date(supplierPriceList.priceList.effective_date), "EEE dd-MM-yyyy")} -{" "}
                        {format(new Date(supplierPriceList.priceList.expiry_date!), "EEE dd-MM-yyyy")}
                      </p>
                    </div>

                    {/* CTA Button */}
                    <div className="flex items-center justify-between px-4 py-3 bg-customer-accent bg-opacity-10 dark:bg-customer-accent dark:bg-opacity-20 rounded-lg group-hover:bg-customer-accent group-hover:text-white transition-colors">
                      <span className="font-semibold text-customer-accent group-hover:text-white">
                        Create Order
                      </span>
                      <span className="material-symbols-outlined text-customer-accent group-hover:text-white">
                        arrow_forward
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        // ===== CATEGORY-PAGINATED ORDERING VIEW =====
        <div className="flex flex-col h-full">
          {/* Compact Header - Single Row */}
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBackToSelection}
                className="flex items-center gap-1 text-customer-accent hover:text-opacity-80 transition-colors text-sm"
              >
                <span className="material-symbols-outlined text-lg">arrow_back</span>
              </button>
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 leading-tight">
                  {selectedSupplierPriceList?.supplierName}
                </h2>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {selectedSupplierPriceList?.priceList.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-lg font-bold text-customer-accent leading-tight">
                  € {cartTotal.toFixed(2)}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}
                </p>
              </div>
              <button
                onClick={handleViewSummary}
                disabled={cart.size === 0}
                className="px-3 py-2 bg-customer-accent text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">receipt_long</span>
                <span>Summary</span>
              </button>
            </div>
          </div>

          {/* Compact Navigation and Progress */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 mb-3">
            <div className="flex items-center justify-between gap-4 mb-2">
              <button
                onClick={handlePreviousCategory}
                disabled={currentCategoryIndex === 0}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                <span>Previous</span>
              </button>

              <div className="text-center flex-1">
                <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 leading-tight">
                  {currentCategoryName}
                </h3>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {currentCategoryIndex + 1} / {categories.length}
                </span>
              </div>

              <button
                onClick={handleNextCategory}
                disabled={currentCategoryIndex === categories.length - 1}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>

            {/* Compact Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div
                className="bg-customer-accent h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${((currentCategoryIndex + 1) / categories.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Products Table - Scrollable */}
          <div className="flex-1 overflow-hidden bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="h-full overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Product
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Unit
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Price
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Quantity
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {currentProducts.map((product) => {
                    const cartItem = cart.get(product.product.$id!);
                    const quantity = cartItem?.quantity || 0;
                    const subtotal = quantity * (product.price_box || 0);

                    return (
                      <tr
                        key={product.product.$id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {product.product.name}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {product.product.unit_of_measure}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                            € {product.price_box?.toFixed(2)}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 justify-center">
                            <button
                              onClick={() =>
                                handleQuantityChange(
                                  product.product.$id!,
                                  product.product.name,
                                  product.category.$id,
                                  product.category.name,
                                  product.price_box!,
                                  Math.max(0, quantity - 1)
                                )
                              }
                              className="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                            >
                              <span className="material-symbols-outlined text-lg">remove</span>
                            </button>
                            <input
                              type="number"
                              value={quantity}
                              onChange={(e) =>
                                handleQuantityChange(
                                  product.product.$id!,
                                  product.product.name,
                                  product.category.$id,
                                  product.category.name,
                                  product.price_box!,
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-20 px-2 py-1 text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm"
                              min="0"
                              step="0.5"
                            />
                            <button
                              onClick={() =>
                                handleQuantityChange(
                                  product.product.$id!,
                                  product.product.name,
                                  product.category.$id,
                                  product.category.name,
                                  product.price_box!,
                                  quantity + 1
                                )
                              }
                              className="w-8 h-8 flex items-center justify-center bg-customer-accent text-white rounded hover:bg-opacity-90 transition-colors"
                            >
                              <span className="material-symbols-outlined text-lg">add</span>
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                            {quantity > 0 ? `€ ${subtotal.toFixed(2)}` : '-'}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Order Summary Modal */}
      <Modal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        title="Order Summary"
        wide
      >
        <div className="space-y-6">
          {/* Supplier & Price List Info */}
          <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Supplier</p>
              <p className="font-medium text-gray-800 dark:text-gray-200">
                {selectedSupplierPriceList?.supplierName}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Price List</p>
              <p className="font-medium text-gray-800 dark:text-gray-200">
                {selectedSupplierPriceList?.priceList.name}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">Delivery Window</p>
              <p className="font-medium text-gray-800 dark:text-gray-200">
                {selectedSupplierPriceList && format(new Date(selectedSupplierPriceList.priceList.effective_date), "EEE dd-MM-yyyy")} -{" "}
                {selectedSupplierPriceList && format(new Date(selectedSupplierPriceList.priceList.expiry_date!), "EEE dd-MM-yyyy")}
              </p>
            </div>
          </div>

          {/* Order Items Grouped by Category */}
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">
              Order Items ({cartItemCount} items)
            </h4>
            <div className="space-y-6">
              {Object.entries(groupedCartItems).map(([categoryName, items]) => (
                <div key={categoryName}>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.product_id}
                        className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {item.product_name}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            € {item.unit_price.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-800 dark:text-gray-200">
                            × {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-800 dark:text-gray-200">
                            € {(item.quantity * item.unit_price).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Order Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-customer-accent resize-none text-sm"
              placeholder="Add any special requests or notes for this order..."
            />
          </div>

          {/* Total */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Total
              </span>
              <span className="text-2xl font-bold text-customer-accent">
                € {cartTotal.toFixed(2)}
              </span>
            </div>
            <button
              onClick={handlePlaceOrder}
              disabled={placing}
              className="w-full px-4 py-3 bg-customer-accent text-white rounded-lg font-medium hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {placing && (
                <span className="animate-spin material-symbols-outlined text-base">
                  progress_activity
                </span>
              )}
              <span>{placing ? "Placing Order..." : "Submit Order"}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PlaceOrder;
