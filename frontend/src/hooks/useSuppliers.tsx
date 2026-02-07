import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import API from "@/lib/api";
import { toast } from "sonner";

export interface Supplier {
  _id: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  gst_number: string;
  balance: number;
}

export function useSuppliers() {
  return useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data } = await API.get("/api/suppliers");
      return data.map((s: any) => ({ ...s, id: s._id })) as Supplier[];
    },
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (supplier: Partial<Supplier>) => {
      const { data } = await API.post("/api/suppliers", supplier);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier created successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to create supplier: ${error.response?.data?.message || error.message}`);
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...supplier }: Partial<Supplier> & { id: string }) => {
      const { data } = await API.put(`/api/suppliers/${id}`, supplier);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier updated successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to update supplier: ${error.response?.data?.message || error.message}`);
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await API.delete(`/api/suppliers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier deleted successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to delete supplier: ${error.response?.data?.message || error.message}`);
    },
  });
}
