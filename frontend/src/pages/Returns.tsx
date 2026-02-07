import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RotateCcw, FileText, AlertTriangle, Search, Check, Calculator, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import API from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useInvoices } from "@/hooks/useInvoices";

export default function Returns() {
  const [isNewReturnOpen, setIsNewReturnOpen] = useState(false);
  const [searchInvoiceNumber, setSearchInvoiceNumber] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [returnItems, setReturnItems] = useState<Record<string, { quantity: number; refund_amount: number; selected: boolean }>>({});
  const [returnReason, setReturnReason] = useState("");
  const [refundMode, setRefundMode] = useState("cash");

  const queryClient = useQueryClient();
  const { data: invoices } = useInvoices();

  // Fetch Returns History
  const { data: returns, isLoading: isLoadingReturns } = useQuery({
    queryKey: ["returns"],
    queryFn: async () => {
      const { data } = await API.get("/returns");
      return data;
    },
  });

  // Calculate Stats
  const totalReturns = returns?.length || 0;
  const totalRefunded = returns?.reduce((acc: number, curr: any) => acc + (curr.total_refund || 0), 0) || 0;
  // const pendingReturns = returns?.filter((r: any) => r.status === 'pending')?.length || 0; // Assuming status exists

  // Mutation for creating return
  const createReturnMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await API.post("/returns", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Return processed successfully");
      setIsNewReturnOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["returns"] });
      // Invalidate other related queries if needed
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to process return");
    }
  });

  const handleSearchInvoice = () => {
    if (!searchInvoiceNumber) return;
    const invoice = invoices?.find(
      (inv) => inv.invoice_number.toLowerCase() === searchInvoiceNumber.toLowerCase().trim()
    );

    if (invoice) {
      // Fetch full invoice details to get items if needed, or if invoice object already has items
      // useInvoices returns items in the list usually? Let's check. 
      // invoiceController getInvoices doesn't populate items fully (just array?), wait.
      // getInvoices populates: .populate('items.productId', 'name selling_price')? No, see invoiceController.
      // getInvoices: .populate('customerId', 'name phone').populate('userId', 'full_name').
      // It does NOT explicitly populate items.productId in getInvoices (list), only in getInvoiceById.
      // So we might need to fetch the single invoice to get product details.

      // Fetch full invoice
      API.get(`/invoices/${invoice.id || invoice._id}`).then(res => {
        setSelectedInvoice(res.data);
        // Initialize return items state
        const initialItems: any = {};
        res.data.items.forEach((item: any) => {
          initialItems[item._id] = {
            quantity: 1,
            refund_amount: item.unit_price, // Default full refund per unit
            selected: false
          };
        });
        setReturnItems(initialItems);
      }).catch(err => {
        toast.error("Failed to load invoice details");
      });
    } else {
      toast.error("Invoice not found");
      setSelectedInvoice(null);
    }
  };

  const resetForm = () => {
    setSearchInvoiceNumber("");
    setSelectedInvoice(null);
    setReturnItems({});
    setReturnReason("");
    setRefundMode("cash");
  };

  const handleItemToggle = (itemId: string, checked: boolean) => {
    setReturnItems(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], selected: checked }
    }));
  };

  const handleQuantityChange = (itemId: string, qty: number, max: number, unitPrice: number) => {
    if (qty < 1) qty = 1;
    if (qty > max) qty = max;
    setReturnItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        quantity: qty,
        refund_amount: qty * unitPrice
      }
    }));
  };

  const handleRefundAmountChange = (itemId: string, amount: number) => {
    setReturnItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        refund_amount: amount
      }
    }));
  };

  const calculateTotalRefund = () => {
    return Object.values(returnItems)
      .filter(item => item.selected)
      .reduce((acc, curr) => acc + (Number(curr.refund_amount) || 0), 0);
  };

  const handleSubmitReturn = () => {
    if (!selectedInvoice) return;

    const itemsToReturn = selectedInvoice.items
      .filter((item: any) => returnItems[item._id]?.selected)
      .map((item: any) => ({
        productId: item.productId._id || item.productId, // Handle populated or raw ID
        quantity: returnItems[item._id].quantity,
        refund_amount: returnItems[item._id].refund_amount,
        imei_returned: "" // Add field if needed later
      }));

    if (itemsToReturn.length === 0) {
      toast.error("Please select at least one item to return");
      return;
    }

    createReturnMutation.mutate({
      invoiceId: selectedInvoice._id,
      customerId: selectedInvoice.customerId?._id || selectedInvoice.customerId,
      items: itemsToReturn,
      total_refund: calculateTotalRefund(),
      refund_mode: refundMode,
      reason: returnReason
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Returns & Refunds</h1>
            <p className="text-muted-foreground mt-1">Process returns and issue refunds</p>
          </div>

          <Dialog open={isNewReturnOpen} onOpenChange={(open) => {
            setIsNewReturnOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button variant="gradient">
                <RotateCcw className="w-4 h-4" />
                New Return
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Return</DialogTitle>
                <DialogDescription>
                  Search for an invoice to process a return.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Search Section */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Enter Invoice Number (e.g. INV-172...)"
                      value={searchInvoiceNumber}
                      onChange={(e) => setSearchInvoiceNumber(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchInvoice()}
                      className="pl-9"
                    />
                  </div>
                  <Button onClick={handleSearchInvoice} disabled={!searchInvoiceNumber}>
                    Find Invoice
                  </Button>
                </div>

                {/* Selected Invoice Details */}
                {selectedInvoice && (
                  <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">Invoice #{selectedInvoice.invoice_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(selectedInvoice.createdAt), "dd MMM yyyy")}
                        </p>
                        <p className="text-sm">
                          Customer: {selectedInvoice.customerId?.name || "Walk-in"}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setSelectedInvoice(null)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label>Select Items to Return</Label>
                      <div className="border rounded-md overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-muted">
                            <tr>
                              <th className="p-2 text-left w-10"></th>
                              <th className="p-2 text-left">Item</th>
                              <th className="p-2 text-center">Sold Qty</th>
                              <th className="p-2 text-right">Price</th>
                              <th className="p-2 text-center">Return Qty</th>
                              <th className="p-2 text-right">Refund Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedInvoice.items.map((item: any) => (
                              <tr key={item._id} className="border-t">
                                <td className="p-2 text-center">
                                  <Checkbox
                                    checked={returnItems[item._id]?.selected || false}
                                    onCheckedChange={(c) => handleItemToggle(item._id, c as boolean)}
                                  />
                                </td>
                                <td className="p-2">
                                  {item.productId?.name || "Unknown Product"}
                                </td>
                                <td className="p-2 text-center">{item.quantity}</td>
                                <td className="p-2 text-right">₹{item.unit_price}</td>
                                <td className="p-2">
                                  {returnItems[item._id]?.selected && (
                                    <Input
                                      type="number"
                                      className="h-8 w-20 mx-auto"
                                      value={returnItems[item._id]?.quantity}
                                      onChange={(e) => handleQuantityChange(item._id, parseInt(e.target.value), item.quantity, item.unit_price)}
                                    />
                                  )}
                                </td>
                                <td className="p-2">
                                  {returnItems[item._id]?.selected && (
                                    <Input
                                      type="number"
                                      className="h-8 w-24 ml-auto"
                                      value={returnItems[item._id]?.refund_amount}
                                      onChange={(e) => handleRefundAmountChange(item._id, parseFloat(e.target.value))}
                                    />
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Return Reason</Label>
                        <Input
                          placeholder="Defective, Wrong Item, etc."
                          value={returnReason}
                          onChange={(e) => setReturnReason(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Refund Mode</Label>
                        <Select value={refundMode} onValueChange={setRefundMode}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="card">Card</SelectItem>
                            <SelectItem value="upi">UPI</SelectItem>
                            {/* <SelectItem value="credit">Store Credit</SelectItem> */}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex justify-between items-center bg-muted p-4 rounded-lg">
                      <span className="font-semibold">Total Refund:</span>
                      <span className="text-xl font-bold text-primary">₹{calculateTotalRefund().toLocaleString()}</span>
                    </div>

                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewReturnOpen(false)}>Cancel</Button>
                <Button
                  variant="gradient"
                  onClick={handleSubmitReturn}
                  disabled={createReturnMutation.isPending || !selectedInvoice || calculateTotalRefund() <= 0}
                >
                  {createReturnMutation.isPending ? "Processing..." : "Confirm Return"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card glass>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center">
                <RotateCcw className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalReturns}</p>
                <p className="text-sm text-muted-foreground">Total Returns</p>
              </div>
            </CardContent>
          </Card>
          {/* 
          <Card glass>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-warning to-amber-400 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingReturns}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
           */}
          <Card glass>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success to-emerald-400 flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">₹{totalRefunded.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Refunded</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Returns List */}
        <Card glass>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-primary" />
              Return History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingReturns ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : returns && returns.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="p-4 text-left">Return #</th>
                      <th className="p-4 text-left">Invoice #</th>
                      <th className="p-4 text-left">Customer</th>
                      <th className="p-4 text-left">Date</th>
                      <th className="p-4 text-left">Items</th>
                      <th className="p-4 text-right">Refund</th>
                      <th className="p-4 text-left text-center">Mode</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returns.map((ret: any) => (
                      <tr key={ret._id} className="border-t border-border/50 hover:bg-muted/20">
                        <td className="p-4 font-mono text-sm">{ret.return_number}</td>
                        <td className="p-4 font-mono text-sm text-muted-foreground">{ret.invoiceId?.invoice_number || "-"}</td>
                        <td className="p-4">{ret.customerId?.name || "Walk-in"}</td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {format(new Date(ret.createdAt), "dd MMM yyyy")}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            {ret.items.map((item: any, idx: number) => (
                              <span key={idx} className="text-xs badge badge-outline">
                                {item.productId?.name} (x{item.quantity})
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 text-right font-bold text-red-500">
                          ₹{ret.total_refund.toLocaleString()}
                        </td>
                        <td className="p-4 text-center">
                          <Badge variant="outline" className="uppercase text-xs">{ret.refund_mode}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-muted-foreground">
                <RotateCcw className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No returns processed yet</p>
                <p className="text-sm">Returns will appear here when processed</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
