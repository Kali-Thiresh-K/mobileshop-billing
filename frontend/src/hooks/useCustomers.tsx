import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import API from "@/lib/api";
import { Customer } from "@/types";
import { toast } from "sonner";

export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data } = await API.get("/api/customers");
      return data.map((c: any) => ({ ...c, id: c._id })) as Customer[];
    },
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customer: Partial<Customer>) => {
      const { data } = await API.post("/api/customers", customer);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer created successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to create customer: ${error.response?.data?.message || error.message}`);
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...customer }: Partial<Customer> & { id: string }) => {
      const { data } = await API.put(`/api/customers/${id}`, customer);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer updated successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to update customer: ${error.response?.data?.message || error.message}`);
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await API.delete(`/api/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer deleted successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to delete customer: ${error.response?.data?.message || error.message}`);
    },
  });
}
