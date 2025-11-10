import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { account } from "../../../lib/appwrite";
import { associationService, orderService } from "../../../lib/orderService";
import { priceListService } from "../../../lib/priceListService";
import type { PriceListWithItems, PriceListTableRow } from "../../../types/priceList";
import type { CartItem, OrderItem } from "../../../types/order";
import { generateOrderNumber, calculateOrderTotal } from "../../../types/order";

interface Notification {
  type: "success" | "error" | "info";
  message: string;
}

interface Supplier {
  id: string;
  name: string;
}

const PlaceOrder = () => {
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [priceLists, setPriceLists] = useState<PriceListWithItems[]>([]);
  const [selectedPriceList, setSelectedPriceList] = useState<string>("");
  const [products, setProducts] = useState<PriceListTableRow[]>([]);
  const [cart, setCart] = useState<Map<string, CartItem>>(new Map());
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);

  useEffect(() => {
    loadUserAndSuppliers();
  }, []);

  useEffect(() => {
    if (selectedSupplier) {
      loadPriceLists();
    }
  }, [selectedSupplier]);

  useEffect(() => {
    if (selectedPriceList) {
      loadProducts();
    }
  }, [selectedPriceList]);

  const loadUserAndSuppliers = async () => {
    setLoading(true);
    try {
      const user = await account.get();
      setCurrentUser({ id: user.$id, name: user.name || "Customer" });

      // Get associated suppliers
      const associations = await associationService.getByCustomer(user.$id);
      const suppliersData = associations.map((a) => ({
        id: a.supplier_id,
        name: a.supplier_name,
      }));
      setSuppliers(suppliersData);
    } catch (error) {
      console.error("Error loading user and suppliers:", error);
      showNotification("error", "Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  };

  const loadPriceLists = async () => {
    try {
      const lists = await priceListService.getActiveBySupplier(selectedSupplier);

      // Load full details for each list
      const listsWithItems = await Promise.all(
        lists.map((list) => priceListService.getWithItems(list.$id!))
      );

      setPriceLists(listsWithItems);
      setSelectedPriceList("");
      setProducts([]);
      setCart(new Map());
    } catch (error) {
      console.error("Error loading price lists:", error);
      showNotification("error", "Failed to load price lists");
    }
  };

  const loadProducts = async () => {
    try {
      const priceList = priceLists.find((pl) => pl.$id === selectedPriceList);
      if (!priceList || !priceList.items) return;

      const productsData: PriceListTableRow[] = priceList.items
        .filter((item) => item.is_available && item.price_box !== null)
        .map((item) => ({
          product: item.product!,
          category: item.product?.category!,
          price_box: item.price_box,
          price_box_vac: item.price_box_vac,
          vac_surcharge: item.vac_surcharge,
          is_available: item.is_available,
          item_id: item.$id,
        }));

      setProducts(productsData);
      setCart(new Map());
    } catch (error) {
      console.error("Error loading products:", error);
      showNotification("error", "Failed to load products");
    }
  };

  const showNotification = (type: Notification["type"], message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleQuantityChange = (
    productId: string,
    productName: string,
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

  const handlePlaceOrder = async () => {
    if (cart.size === 0) {
      showNotification("error", "Please add items to your cart");
      return;
    }

    setPlacing(true);
    try {
      const supplier = suppliers.find((s) => s.id === selectedSupplier);
      const priceList = priceLists.find((pl) => pl.$id === selectedPriceList);

      if (!supplier || !priceList || !currentUser) {
        showNotification("error", "Missing required information");
        return;
      }

      if (!priceList.expiry_date) {
        showNotification("error", "Price list must have delivery dates");
        return;
      }

      const orderItems: OrderItem[] = Array.from(cart.values()).map((item) => {
        // Find the product to get category information
        const product = products.find(p => p.product.$id === item.product_id);
        return {
          product_id: item.product_id,
          product_name: item.product_name,
          category_id: product?.category.$id,
          category_name: product?.category.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.quantity * item.unit_price,
        };
      });

      await orderService.create({
        order_number: generateOrderNumber(),
        customer_id: currentUser.id,
        customer_name: currentUser.name,
        supplier_id: supplier.id,
        supplier_name: supplier.name,
        price_list_id: priceList.$id!,
        price_list_name: priceList.name,
        status: "pending",
        order_date: new Date().toISOString(),
        delivery_start_date: priceList.effective_date,
        delivery_end_date: priceList.expiry_date,
        items: orderItems,
        customer_notes: notes || null,
        currency: "EUR",
        total_amount: 0, // Calculated by service
      });

      showNotification("success", "Order placed successfully!");

      // Reset form
      setCart(new Map());
      setNotes("");
      setSelectedPriceList("");
      setProducts([]);
    } catch (error) {
      console.error("Error placing order:", error);
      showNotification("error", "Failed to place order");
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

  // Group products by category
  const groupedProducts = products.reduce((acc, product) => {
    const categoryName = product.category?.name || "Other";
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(product);
    return acc;
  }, {} as Record<string, PriceListTableRow[]>);

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
          Place Order
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Select a supplier and price list to start ordering
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-customer-accent"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      ) : suppliers.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <span className="material-symbols-outlined text-6xl text-gray-400 dark:text-gray-600">
            store
          </span>
          <p className="mt-4 text-gray-600 dark:text-gray-400 text-lg">
            No suppliers available
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
            Please contact your administrator to be assigned to a supplier
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Selection & Products */}
          <div className="lg:col-span-2 space-y-6">
            {/* Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Select Supplier & Price List
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Supplier */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Supplier
                  </label>
                  <select
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-customer-accent"
                  >
                    <option value="">Select supplier...</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price List */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Price List
                  </label>
                  <select
                    value={selectedPriceList}
                    onChange={(e) => setSelectedPriceList(e.target.value)}
                    disabled={!selectedSupplier || priceLists.length === 0}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-customer-accent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select price list...</option>
                    {priceLists.map((priceList) => (
                      <option key={priceList.$id} value={priceList.$id}>
                        {priceList.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Products */}
            {products.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Products
                  </h3>
                </div>
                <div className="p-4 max-h-[600px] overflow-y-auto space-y-6">
                  {Object.entries(groupedProducts).map(([categoryName, categoryProducts]) => (
                    <div key={categoryName}>
                      <div className="space-y-2">
                        {categoryProducts.map((product) => {
                          const cartItem = cart.get(product.product.$id!);
                          const quantity = cartItem?.quantity || 0;

                          return (
                            <div
                              key={product.product.$id}
                              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                            >
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                  {product.product.name}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  € {product.price_box?.toFixed(2)} / {product.product.unit_of_measure}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    handleQuantityChange(
                                      product.product.$id!,
                                      product.product.name,
                                      product.price_box!,
                                      Math.max(0, quantity - 1)
                                    )
                                  }
                                  className="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  value={quantity}
                                  onChange={(e) =>
                                    handleQuantityChange(
                                      product.product.$id!,
                                      product.product.name,
                                      product.price_box!,
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="w-16 px-2 py-1 text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm"
                                  min="0"
                                  step="0.5"
                                />
                                <button
                                  onClick={() =>
                                    handleQuantityChange(
                                      product.product.$id!,
                                      product.product.name,
                                      product.price_box!,
                                      quantity + 1
                                    )
                                  }
                                  className="w-8 h-8 flex items-center justify-center bg-customer-accent text-white rounded hover:bg-opacity-90 transition-colors"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Cart */}
          <div className="space-y-6">
            {/* Cart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md sticky top-6">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Cart ({cartItemCount} items)
                </h3>
              </div>
              <div className="p-4">
                {cart.size === 0 ? (
                  <div className="text-center py-8">
                    <span className="material-symbols-outlined text-4xl text-gray-400 dark:text-gray-600">
                      shopping_cart
                    </span>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Your cart is empty
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                      {Array.from(cart.values()).map((item) => (
                        <div
                          key={item.product_id}
                          className="flex justify-between items-start text-sm"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-800 dark:text-gray-200">
                              {item.product_name}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {item.quantity} × € {item.unit_price.toFixed(2)}
                            </p>
                          </div>
                          <p className="font-semibold text-gray-800 dark:text-gray-200">
                            € {(item.quantity * item.unit_price).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Delivery Window (from price list) */}
                    {selectedPriceList && priceLists.find(pl => pl.$id === selectedPriceList) && (
                      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-1">
                          Delivery Window (ETA)
                        </p>
                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                          {format(new Date(priceLists.find(pl => pl.$id === selectedPriceList)!.effective_date), "EEE dd-MM-yyyy")} - {format(new Date(priceLists.find(pl => pl.$id === selectedPriceList)!.expiry_date!), "EEE dd-MM-yyyy")}
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                          This order will be delivered within this time window
                        </p>
                      </div>
                    )}

                    {/* Notes */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Notes (Optional)
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-customer-accent resize-none text-sm"
                        placeholder="Special requests..."
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
                        <span>{placing ? "Placing Order..." : "Place Order"}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaceOrder;
