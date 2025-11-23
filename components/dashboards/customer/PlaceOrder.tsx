import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { toast } from "react-toastify";
import { account } from "../../../lib/appwrite";
import { associationService, orderService } from "../../../lib/orderService";
import { priceListService } from "../../../lib/priceListService";
import type { PriceListWithItems, PriceListTableRow } from "../../../types/priceList";
import { getCategoryVacSurcharge } from "../../../types/priceList";
import type { CartItem, OrderItem } from "../../../types/order";
import { generateOrderNumber } from "../../../types/order";
import { createNotification } from "../../../lib/notificationService";
import Modal from "../../common/Modal";
import Button from "../../ui/Button";
import Card from "../../ui/Card";
import Input from "../../ui/Input";

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
    price: number,
    quantityRegular: number,
    quantityVac: number
  ) => {
    const newCart = new Map(cart);
    const totalQuantity = quantityRegular + quantityVac;

    if (totalQuantity > 0) {
      newCart.set(productId, {
        product_id: productId,
        product_name: productName,
        unit_price: price,
        quantity_regular: quantityRegular,
        quantity_vac: quantityVac,
      });
    } else {
      newCart.delete(productId);
    }
    setCart(newCart);
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
        let vacSurcharge: number | null = null;

        for (const [catName, products] of productsMap.entries()) {
          const product = products.find(p => p.product.$id === item.product_id);
          if (product) {
            categoryId = product.category.$id;
            categoryName = product.category.name;
            // Get VAC surcharge from price list, not category
            vacSurcharge = getCategoryVacSurcharge(selectedSupplierPriceList.priceList, categoryId!);
            break;
          }
        }

        const regularTotal = item.quantity_regular * item.unit_price;

        return {
          product_id: item.product_id,
          product_name: item.product_name,
          category_id: categoryId,
          category_name: categoryName,
          quantity_regular: item.quantity_regular,
          quantity_vac: item.quantity_vac,
          unit_price: item.unit_price,
          vac_surcharge_at_order: vacSurcharge,
          total: regularTotal,
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
      await createNotification(
        "order_pending_approval",
        `Order ${newOrder.order_number} from ${currentUser.name} is pending approval`,
        newOrder.$id!,
        currentUser.name,
        currentUser.id,
        selectedSupplierPriceList.supplierId,
        currentUser.id
      );

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
    (sum, item) => {
      const regularTotal = item.quantity_regular * item.unit_price;
      return sum + regularTotal;
    },
    0
  );

  const cartItemCount = Array.from(cart.values()).reduce(
    (sum, item) => sum + item.quantity_regular + item.quantity_vac,
    0
  );

  const currentCategoryName = categories[currentCategoryIndex];
  const currentProducts = currentCategoryName ? productsMap.get(currentCategoryName) || [] : [];

  // Check if current category has VAC pricing enabled
  const currentCategoryHasVac = currentProducts.length > 0 && currentProducts[0].category?.enable_vac_pricing;
  const currentCategoryUnit = currentProducts.length > 0 ? currentProducts[0].category?.unit_of_measure || "Box" : "Box";
  const currentCategoryVacSurcharge = currentProducts.length > 0 && selectedSupplierPriceList
    ? getCategoryVacSurcharge(selectedSupplierPriceList.priceList, currentProducts[0].category.$id!)
    : null;

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
          <div className="mb-8 animate-fade-in">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 tracking-tight">
              Select Supplier & Price List
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
              Choose a supplier and their active price list to start ordering
            </p>
          </div>

          {supplierPriceLists.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-16 animate-fade-in" glass>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-full mb-4">
                <span className="material-symbols-outlined text-6xl text-gray-400 dark:text-gray-500">
                  store
                </span>
              </div>
              <p className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                No active price lists available
              </p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Your suppliers don't have any active price lists at the moment
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
              {supplierPriceLists.map((supplierPriceList) => (
                <Card
                  key={`${supplierPriceList.supplierId}-${supplierPriceList.priceList.$id}`}
                  onClick={() => handleSelectSupplierPriceList(supplierPriceList)}
                  className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-customer-accent/50 !p-0 overflow-hidden"
                  glass
                >
                  <div className="p-6 flex flex-col h-full">
                    {/* Supplier Name */}
                    <div className="mb-5">
                      <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2 group-hover:text-customer-accent transition-colors">
                        {supplierPriceList.supplierName}
                      </h3>
                      <div className="h-1 w-12 bg-customer-accent rounded-full group-hover:w-20 transition-all duration-300"></div>
                    </div>

                    {/* Price List Name */}
                    <div className="flex-1 mb-5">
                      <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                        Price List
                      </p>
                      <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                        {supplierPriceList.priceList.name}
                      </p>
                    </div>

                    {/* Delivery Window */}
                    <div className="mb-6 p-3 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-blue-500 text-sm">calendar_today</span>
                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                          Delivery Window
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 pl-6">
                        {format(new Date(supplierPriceList.priceList.effective_date), "EEE dd-MM")} -{" "}
                        {format(new Date(supplierPriceList.priceList.expiry_date!), "EEE dd-MM-yyyy")}
                      </p>
                    </div>

                    {/* CTA Button */}
                    <div className="flex items-center justify-between px-4 py-3 bg-customer-accent/5 dark:bg-customer-accent/10 rounded-xl group-hover:bg-customer-accent group-hover:text-white transition-all duration-300">
                      <span className="font-semibold text-customer-accent group-hover:text-white">
                        Create Order
                      </span>
                      <span className="material-symbols-outlined text-customer-accent group-hover:text-white transform group-hover:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : (
        // ===== MASTER-DETAIL ORDERING VIEW =====
        <div className="flex flex-col h-full">
          {/* Compact Header - Single Row */}
          <div className="flex items-center justify-between gap-4 mb-4 flex-shrink-0 animate-fade-in">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToSelection}
                leftIcon={<span className="material-symbols-outlined">arrow_back</span>}
                className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Back
              </Button>
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 leading-tight">
                  {selectedSupplierPriceList?.supplierName}
                </h2>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                  {selectedSupplierPriceList?.priceList.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xl font-bold text-customer-accent leading-tight">
                  € {cartTotal.toFixed(2)}
                </p>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}
                </p>
              </div>
              <Button
                variant="primary"
                onClick={handleViewSummary}
                disabled={cart.size === 0}
                className="bg-customer-accent hover:bg-customer-accent/90 shadow-lg shadow-customer-accent/20"
                leftIcon={<span className="material-symbols-outlined">receipt_long</span>}
              >
                Summary
              </Button>
            </div>
          </div>

          {/* Master-Detail Layout */}
          <div className="flex gap-4 flex-1 overflow-hidden animate-slide-up">
            {/* Left Column - Master (Category List) */}
            <Card className="w-64 flex-shrink-0 !p-0 overflow-hidden flex flex-col" glass>
              <div className="bg-gray-50/50 dark:bg-gray-700/50 px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Categories
                </h4>
              </div>
              <div className="overflow-y-auto flex-1 p-2 space-y-1">
                {categories.map((categoryName, index) => {
                  const isSelected = currentCategoryIndex === index;
                  const categoryProducts = productsMap.get(categoryName) || [];
                  const categoryIcon = categoryProducts[0]?.category?.icon;

                  return (
                    <button
                      key={categoryName}
                      onClick={() => setCurrentCategoryIndex(index)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${isSelected
                        ? "bg-customer-accent text-white shadow-md shadow-customer-accent/20"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        {categoryIcon && (
                          <span
                            className={`material-symbols-outlined text-xl ${isSelected ? "text-white" : "text-gray-400"
                              }`}
                          >
                            {categoryIcon}
                          </span>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate`}>
                            {categoryName}
                          </p>
                          <p className={`text-xs ${isSelected ? "text-white/80" : "text-gray-400"}`}>
                            {categoryProducts.length} {categoryProducts.length === 1 ? "product" : "products"}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Right Content Area - Detail (Product Table) */}
            <Card className="flex-1 !p-0 overflow-hidden flex flex-col" glass>
              <div className="h-full overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-10 backdrop-blur-sm">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Unit
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Price/{currentCategoryUnit}
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {currentCategoryUnit}
                      </th>
                      {currentCategoryHasVac && (
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {currentCategoryVacSurcharge !== null && currentCategoryVacSurcharge > 0
                            ? `${currentCategoryUnit} (VAC +€${currentCategoryVacSurcharge.toFixed(2)}/kg)`
                            : `${currentCategoryUnit} (VAC)`}
                        </th>
                      )}
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {currentProducts.map((product) => {
                      const cartItem = cart.get(product.product.$id!);
                      const quantityRegular = cartItem?.quantity_regular || 0;
                      const quantityVac = cartItem?.quantity_vac || 0;
                      const subtotal = quantityRegular * (product.price_box || 0);

                      return (
                        <tr
                          key={product.product.$id}
                          className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                              {product.product.name}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {product.category.unit_of_measure}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="text-sm">
                              <p className="font-semibold text-gray-800 dark:text-gray-200">
                                € {product.price_box?.toFixed(2)}
                              </p>
                            </div>
                          </td>
                          {/* Regular Quantity */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 justify-center">
                              <button
                                onClick={() =>
                                  handleQuantityChange(
                                    product.product.$id!,
                                    product.product.name,
                                    product.price_box!,
                                    Math.max(0, quantityRegular - 1),
                                    quantityVac
                                  )
                                }
                                className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                              >
                                <span className="material-symbols-outlined text-lg">remove</span>
                              </button>
                              <input
                                type="number"
                                value={quantityRegular}
                                onChange={(e) =>
                                  handleQuantityChange(
                                    product.product.$id!,
                                    product.product.name,
                                    product.price_box!,
                                    parseFloat(e.target.value) || 0,
                                    quantityVac
                                  )
                                }
                                className="w-16 px-2 py-1 text-center border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm focus:ring-2 focus:ring-customer-accent focus:border-transparent outline-none"
                                min="0"
                                step="0.5"
                              />
                              <button
                                onClick={() =>
                                  handleQuantityChange(
                                    product.product.$id!,
                                    product.product.name,
                                    product.price_box!,
                                    quantityRegular + 1,
                                    quantityVac
                                  )
                                }
                                className="w-8 h-8 flex items-center justify-center bg-customer-accent text-white rounded-lg hover:bg-customer-accent/90 transition-colors shadow-sm"
                              >
                                <span className="material-symbols-outlined text-lg">add</span>
                              </button>
                            </div>
                          </td>
                          {/* VAC Quantity */}
                          {currentCategoryHasVac && (
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 justify-center">
                                <button
                                  onClick={() =>
                                    handleQuantityChange(
                                      product.product.$id!,
                                      product.product.name,
                                      product.price_box!,
                                      quantityRegular,
                                      Math.max(0, quantityVac - 1)
                                    )
                                  }
                                  className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-lg">remove</span>
                                </button>
                                <input
                                  type="number"
                                  value={quantityVac}
                                  onChange={(e) =>
                                    handleQuantityChange(
                                      product.product.$id!,
                                      product.product.name,
                                      product.price_box!,
                                      quantityRegular,
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="w-16 px-2 py-1 text-center border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm focus:ring-2 focus:ring-customer-accent focus:border-transparent outline-none"
                                  min="0"
                                  step="0.5"
                                />
                                <button
                                  onClick={() =>
                                    handleQuantityChange(
                                      product.product.$id!,
                                      product.product.name,
                                      product.price_box!,
                                      quantityRegular,
                                      quantityVac + 1
                                    )
                                  }
                                  className="w-8 h-8 flex items-center justify-center bg-customer-accent text-white rounded-lg hover:bg-customer-accent/90 transition-colors shadow-sm"
                                >
                                  <span className="material-symbols-outlined text-lg">add</span>
                                </button>
                              </div>
                            </td>
                          )}
                          <td className="px-6 py-4 text-right">
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                              {subtotal > 0 ? `€ ${subtotal.toFixed(2)}` : '-'}
                            </p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-gray-50/50 dark:bg-gray-700/30 border-none shadow-none">
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Supplier</p>
                  <p className="font-semibold text-gray-800 dark:text-gray-200 text-lg">
                    {selectedSupplierPriceList?.supplierName}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Price List</p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    {selectedSupplierPriceList?.priceList.name}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-gray-50/50 dark:bg-gray-700/30 border-none shadow-none">
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Delivery Window
                  </p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    {selectedSupplierPriceList && format(new Date(selectedSupplierPriceList.priceList.effective_date), "EEE dd-MM-yyyy")} -{" "}
                    {selectedSupplierPriceList && format(new Date(selectedSupplierPriceList.priceList.expiry_date!), "EEE dd-MM-yyyy")}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Order Items Grouped by Category */}
          <div>
            <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-customer-accent">shopping_cart</span>
              Order Items ({cartItemCount} items)
            </h4>
            <div className="space-y-6">
              {Object.entries(groupedCartItems).map(([categoryName, items]) => (
                <div key={categoryName} className="bg-gray-50/50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                  <h5 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
                    {categoryName}
                  </h5>
                  <div className="space-y-3">
                    {items.map((item) => {
                      const hasVac = item.quantity_vac > 0;
                      const hasRegular = item.quantity_regular > 0;
                      const regularTotal = item.quantity_regular * item.unit_price;

                      return (
                        <div
                          key={item.product_id}
                          className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <p className="text-base font-semibold text-gray-800 dark:text-gray-200">
                              {item.product_name}
                            </p>
                            <p className="font-bold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">
                              € {regularTotal.toFixed(2)}
                            </p>
                          </div>
                          <div className="space-y-2 text-sm">
                            {hasRegular && (
                              <div className="flex justify-between text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/30 p-2 rounded">
                                <span className="font-medium">Regular Packaging</span>
                                <span>{item.quantity_regular} × €{item.unit_price.toFixed(2)}</span>
                              </div>
                            )}
                            {hasVac && (
                              <div className="flex justify-between text-gray-600 dark:text-gray-400 bg-orange-50 dark:bg-orange-900/10 p-2 rounded border border-orange-100 dark:border-orange-900/30">
                                <span className="font-medium flex items-center gap-1">
                                  <span className="material-symbols-outlined text-orange-500 text-sm">science</span>
                                  VAC Packaging
                                </span>
                                <div className="text-right">
                                  <div>{item.quantity_vac} units</div>
                                  <div className="text-orange-600 dark:text-orange-400 text-xs font-medium mt-0.5">
                                    Surcharge to be calculated
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Order Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-customer-accent resize-none text-sm shadow-sm transition-all"
              placeholder="Add any special requests or notes for this order..."
            />
          </div>

          {/* Total */}
          <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xl font-bold text-gray-800 dark:text-gray-200">
                Total Amount
              </span>
              <span className="text-3xl font-bold text-customer-accent">
                € {cartTotal.toFixed(2)}
              </span>
            </div>

            {/* VAC Surcharge Warning */}
            <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl flex gap-3">
              <span className="material-symbols-outlined text-orange-600 dark:text-orange-400 text-2xl flex-shrink-0">
                info
              </span>
              <div>
                <p className="text-sm font-bold text-orange-800 dark:text-orange-200 mb-1">
                  VAC Surcharge Notice
                </p>
                <p className="text-xs text-orange-800 dark:text-orange-200 leading-relaxed">
                  The total amount does not include VAC surcharges. This charge will be calculated by the supplier in the final invoice based on the actual weight of the products.
                </p>
              </div>
            </div>

            <Button
              onClick={handlePlaceOrder}
              disabled={placing}
              isLoading={placing}
              className="w-full bg-customer-accent hover:bg-customer-accent/90 text-white shadow-lg shadow-customer-accent/20"
              size="lg"
              leftIcon={!placing && <span className="material-symbols-outlined">check_circle</span>}
            >
              Submit Order
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PlaceOrder;
