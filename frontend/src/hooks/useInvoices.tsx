import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import API from "@/lib/api";
import { Invoice, InvoiceItem } from "@/types";
import { toast } from "sonner";

export function useInvoices() {
  return useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data } = await API.get("/invoices");
      return data.map((i: any) => ({ ...i, id: i._id, customers: i.customerId })) as Invoice[];
    },
  });
}

export function useInvoiceItems(invoiceId: string) {
  return useQuery({
    queryKey: ["invoice_items", invoiceId],
    queryFn: async () => {
      const { data } = await API.get(`/invoices/${invoiceId}`);
      // Backend returns the full invoice with items embedded
      return data.items.map((item: any) => ({
        ...item,
        products: item.productId // Map populated product to 'products' key
      })) as InvoiceItem[];
    },
    enabled: !!invoiceId,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      invoice,
      items,
    }: {
      invoice: any;
      items: any[];
    }) => {
      const payload = {
        ...invoice,
        items: items.map(i => ({
          productId: i.product_id, // Map frontend product_id to backend productId
          quantity: i.quantity,
          unit_price: i.unit_price,
          total_amount: i.total_amount,
          gst_rate: i.gst_rate
        })),
        customerId: invoice.customer_id
      };

      const { data } = await API.post("/invoices", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Invoice created successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to create invoice: ${error.response?.data?.message || error.message}`);
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await API.delete(`/invoices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Invoice deleted successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to delete invoice: ${error.response?.data?.message || error.message}`);
    },
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { data } = await API.get("/dashboard/stats");
      return data;
    },
  });
}
