import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import API from "@/lib/api";
import { toast } from "sonner";

export interface EmiPlan {
  _id: string;
  customers?: { name: string; phone: string } | null;
  products?: { name: string } | null;
  [key: string]: any;
}

export interface EmiPayment {
  _id: string;
  amount_paid: number;
  payment_date: string;
  payment_mode: string;
}

export function useEmiPlans() {
  return useQuery({
    queryKey: ["emi_plans"],
    queryFn: async () => {
      const { data } = await API.get("/api/emi/plans");
      return data.map((p: any) => ({
        ...p,
        id: p._id,
        customers: p.customerId,
        products: p.productId
      })) as EmiPlan[];
    },
  });
}

export function useEmiPayments(planId: string) {
  return useQuery({
    queryKey: ["emi_payments", planId],
    queryFn: async () => {
      const { data } = await API.get(`/api/emi/plans/${planId}/payments`);
      return data.map((p: any) => ({ ...p, id: p._id })) as EmiPayment[];
    },
    enabled: !!planId,
  });
}

export function useCreateEmiPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (plan: any) => {
      const { data } = await API.post("/api/emi/plans", plan);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emi_plans"] });
      toast.success("EMI plan created successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to create EMI plan: ${error.response?.data?.message || error.message}`);
    },
  });
}

export function useRecordEmiPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ payment, planId }: { payment: any; planId: string; newBalance?: number }) => {
      const { data } = await API.post(`/api/emi/plans/${planId}/payments`, payment);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emi_plans"] });
      queryClient.invalidateQueries({ queryKey: ["emi_payments"] });
      toast.success("EMI payment recorded successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to record payment: ${error.response?.data?.message || error.message}`);
    },
  });
}
