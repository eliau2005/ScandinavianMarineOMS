import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUnreadNotifications,
  getNotificationsForSupplier,
  getNotificationsForCustomer,
  markAsRead,
  type Notification,
} from "../notificationService";

// Query keys for cache management
export const notificationKeys = {
  all: ["notifications"] as const,
  admin: () => [...notificationKeys.all, "admin"] as const,
  supplier: (supplierId: string) =>
    [...notificationKeys.all, "supplier", supplierId] as const,
  customer: (customerId: string) =>
    [...notificationKeys.all, "customer", customerId] as const,
};

/**
 * Hook for admin notifications (pending approvals only)
 */
export function useAdminNotifications() {
  return useQuery({
    queryKey: notificationKeys.admin(),
    queryFn: async () => {
      const unreadNotifications = await getUnreadNotifications();
      // Admin sees ONLY pending approval notifications
      return unreadNotifications.filter(
        (notification) =>
          notification.type === "order_pending_approval" ||
          notification.type === "price_list_pending_approval"
      );
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 20000, // Consider data stale after 20 seconds
  });
}

/**
 * Hook for supplier notifications (approved items only)
 */
export function useSupplierNotifications(supplierId: string | null) {
  return useQuery({
    queryKey: supplierId ? notificationKeys.supplier(supplierId) : [],
    queryFn: async () => {
      if (!supplierId) return [];

      const supplierNotifications = await getNotificationsForSupplier(
        supplierId
      );

      // Supplier sees ONLY approved notifications (order_approved, price_list_approved)
      return supplierNotifications.filter(
        (notification) =>
          notification.type === "order_approved" ||
          notification.type === "price_list_approved"
      );
    },
    enabled: !!supplierId, // Only run query if supplierId exists
    refetchInterval: 30000,
    staleTime: 20000,
  });
}

/**
 * Hook for customer notifications (approved items only)
 */
export function useCustomerNotifications(customerId: string | null) {
  return useQuery({
    queryKey: customerId ? notificationKeys.customer(customerId) : [],
    queryFn: async () => {
      if (!customerId) return [];

      const customerNotifications = await getNotificationsForCustomer(
        customerId
      );

      // Customer sees ONLY approved notifications
      return customerNotifications.filter(
        (notification) =>
          notification.type === "order_approved" ||
          notification.type === "price_list_approved"
      );
    },
    enabled: !!customerId,
    refetchInterval: 30000,
    staleTime: 20000,
  });
}

/**
 * Mutation hook for marking notifications as read
 */
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      await markAsRead(notificationId);
      return notificationId;
    },
    onSuccess: (notificationId) => {
      // Invalidate all notification queries to trigger refetch
      queryClient.invalidateQueries({
        queryKey: notificationKeys.all,
      });

      // Optimistically update the cache to remove the read notification
      queryClient.setQueriesData(
        { queryKey: notificationKeys.all },
        (oldData: Notification[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.filter((n) => n.$id !== notificationId);
        }
      );
    },
  });
}

/**
 * Hook to invalidate notification queries (useful after approvals)
 */
export function useInvalidateNotifications() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({
      queryKey: notificationKeys.all,
    });
  };
}
