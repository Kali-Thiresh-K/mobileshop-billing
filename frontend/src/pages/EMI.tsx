import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useEmiPlans, useRecordEmiPayment } from "@/hooks/useEmi";
import { format } from "date-fns";
import {
  Search,
  TrendingUp,
  Calendar,
  IndianRupee,
  CheckCircle,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function EMI() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState<string>("cash");
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const { data: emiPlans, isLoading } = useEmiPlans();
  const recordPayment = useRecordEmiPayment();

  const filteredPlans = emiPlans?.filter(
    (plan) =>
      plan.customers?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.customers?.phone?.includes(searchQuery) ||
      plan.products?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> Active
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Completed
          </Badge>
        );
      case "overdue":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Overdue
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedPlan || !paymentAmount) {
      toast.error("Please enter payment amount");
      return;
    }

    const amount = parseFloat(paymentAmount);
    const newBalance = selectedPlan.outstanding_balance - amount;

    await recordPayment.mutateAsync({
      payment: {
        emi_plan_id: selectedPlan.id,
        amount_paid: amount,
        payment_date: new Date().toISOString().split("T")[0],
        payment_mode: paymentMode as any,
      },
      planId: selectedPlan.id,
      newBalance: Math.max(0, newBalance),
    });

    setPaymentDialogOpen(false);
    setPaymentAmount("");
    setSelectedPlan(null);
  };

  const activePlans = emiPlans?.filter((p) => p.status === "active") || [];
  const totalPending = activePlans.reduce((sum, p) => sum + p.outstanding_balance, 0);
  const monthlyCollection = activePlans.reduce((sum, p) => sum + p.monthly_emi, 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">EMI Management</h1>
            <p className="text-muted-foreground mt-1">Track and manage EMI plans</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card glass>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activePlans.length}</p>
                <p className="text-sm text-muted-foreground">Active EMI Plans</p>
              </div>
            </CardContent>
          </Card>
          <Card glass>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-warning to-amber-400 flex items-center justify-center">
                <IndianRupee className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">₹{totalPending.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card glass>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success to-emerald-400 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">₹{monthlyCollection.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Monthly Collection</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card glass>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by customer or product..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* EMI Plans Table */}
        <Card glass>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              EMI Plans ({filteredPlans?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredPlans && filteredPlans.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      <th className="text-left p-4 font-semibold">Customer</th>
                      <th className="text-left p-4 font-semibold">Product</th>
                      <th className="text-left p-4 font-semibold">EMI Details</th>
                      <th className="text-left p-4 font-semibold">Outstanding</th>
                      <th className="text-left p-4 font-semibold">Next Due</th>
                      <th className="text-left p-4 font-semibold">Status</th>
                      <th className="text-left p-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPlans.map((plan) => (
                      <tr
                        key={plan.id}
                        className="border-b border-border/30 hover:bg-muted/20 transition-colors"
                      >
                        <td className="p-4">
                          <p className="font-medium">{plan.customers?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {plan.customers?.phone}
                          </p>
                        </td>
                        <td className="p-4">
                          <p className="font-medium">{plan.products?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {plan.emi_provider || "In-House"}
                          </p>
                        </td>
                        <td className="p-4">
                          <p className="font-semibold">₹{plan.monthly_emi.toLocaleString()}/mo</p>
                          <p className="text-sm text-muted-foreground">
                            {plan.tenure_months} months @ {plan.interest_rate}%
                          </p>
                        </td>
                        <td className="p-4">
                          <p className="font-semibold text-destructive">
                            ₹{plan.outstanding_balance.toLocaleString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            of ₹{plan.total_payable.toLocaleString()}
                          </p>
                        </td>
                        <td className="p-4">
                          {format(new Date(plan.next_emi_date), "dd MMM yyyy")}
                        </td>
                        <td className="p-4">{getStatusBadge(plan.status)}</td>
                        <td className="p-4">
                          <Dialog open={paymentDialogOpen && selectedPlan?.id === plan.id} onOpenChange={(open) => {
                            setPaymentDialogOpen(open);
                            if (open) setSelectedPlan(plan);
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                variant="gradient"
                                size="sm"
                                disabled={plan.status === "completed"}
                              >
                                Record Payment
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Record EMI Payment</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 pt-4">
                                <div className="p-4 rounded-xl bg-muted/50">
                                  <p className="text-sm text-muted-foreground">Monthly EMI</p>
                                  <p className="text-2xl font-bold">
                                    ₹{plan.monthly_emi.toLocaleString()}
                                  </p>
                                </div>
                                <div className="space-y-2">
                                  <Label>Payment Amount</Label>
                                  <Input
                                    type="number"
                                    placeholder="Enter amount"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Payment Mode</Label>
                                  <Select value={paymentMode} onValueChange={setPaymentMode}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="cash">Cash</SelectItem>
                                      <SelectItem value="upi">UPI</SelectItem>
                                      <SelectItem value="card">Card</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button
                                  variant="gradient"
                                  className="w-full"
                                  onClick={handleRecordPayment}
                                  disabled={recordPayment.isPending}
                                >
                                  {recordPayment.isPending ? "Recording..." : "Record Payment"}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-muted-foreground">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No EMI plans found</p>
                <p className="text-sm">Create EMI plans from the POS billing</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
