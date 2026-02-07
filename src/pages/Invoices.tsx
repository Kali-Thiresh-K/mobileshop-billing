import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useInvoices, useDeleteInvoice } from "@/hooks/useInvoices";
import { format } from "date-fns";
import { Search, FileText, Download, Eye, Printer, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import API from "@/lib/api";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Invoices() {
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewInvoice, setViewInvoice] = useState<any | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isLoadingView, setIsLoadingView] = useState(false);
  const { data: invoices, isLoading } = useInvoices();
  const deleteInvoice = useDeleteInvoice();

  const filteredInvoices = invoices?.filter(
    (inv) =>
      inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customers?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customers?.phone?.includes(searchQuery)
  );

  const getPaymentBadge = (mode: string) => {
    const variants: Record<string, "default" | "secondary" | "success" | "warning" | "destructive"> = {
      cash: "success",
      upi: "secondary",
      card: "default",
      credit: "warning",
      emi: "destructive",
    };
    return <Badge variant={variants[mode] || "default"}>{mode.toUpperCase()}</Badge>;
  };

  const handleView = async (invoice: any) => {
    setIsLoadingView(true);
    try {
      const res = await API.get(`/invoices/${invoice.id || invoice._id}`);
      setViewInvoice(res.data);
      setIsViewOpen(true);
    } catch (error) {
      console.error("Error fetching invoice details:", error);
      toast.error("Failed to load invoice details");
    } finally {
      setIsLoadingView(false);
    }
  };

  const handlePrint = async (invoice: any) => {
    try {
      // 1. Fetch Shop Settings
      const settingsRes = await API.get("/settings");
      const shop = settingsRes.data;

      // 2. Fetch Full Invoice Details (to ensure items are populated)
      const invoiceRes = await API.get(`/invoices/${invoice.id || invoice._id}`);
      const fullInvoice = invoiceRes.data;

      const itemsHtml = fullInvoice.items.map((item: any, index: number) => `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px; text-align: center;">${index + 1}</td>
          <td style="padding: 8px;">${item.productId?.name || "Unknown Product"}</td>
          <td style="padding: 8px; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; text-align: right;">Rs. ${item.unit_price}</td>
          <td style="padding: 8px; text-align: right;">Rs. ${item.total_amount}</td>
        </tr>
      `).join("");

      // 3. Construct HTML
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Invoice #${fullInvoice.invoice_number}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; line-height: 1.5; color: #333; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .shop-name { font-size: 24px; font-weight: bold; margin: 0; text-transform: uppercase; }
            .shop-details { font-size: 14px; color: #666; margin-top: 5px; }
            .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .info-block { width: 48%; }
            .info-label { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
            .info-value { font-size: 16px; font-weight: 500; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background: #f8f9fa; text-align: left; padding: 10px; font-size: 12px; text-transform: uppercase; border-bottom: 2px solid #ddd; }
            td { font-size: 14px; }
            .totals { float: right; width: 40%; }
            .total-row { display: flex; justify-content: space-between; padding: 5px 0; }
            .grand-total { font-weight: bold; font-size: 18px; border-top: 2px solid #333; margin-top: 10px; padding-top: 10px; }
            .footer { clear: both; margin-top: 50px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 20px; }
            @media print {
              .no-print { display: none; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="shop-name">${shop.shop_name || "Mobile Shop Genius"}</h1>
            <div class="shop-details">
              ${shop.address || ""}<br>
              Phone: ${shop.phone || ""} | Email: ${shop.email || ""}
              ${shop.gst_number ? `<br>GSTIN: ${shop.gst_number}` : ""}
            </div>
          </div>

          <div class="invoice-info">
            <div class="info-block">
              <div class="info-label">Billed To</div>
              <div class="info-value">${fullInvoice.customerId?.name || fullInvoice.customers?.name || "Walk-in Customer"}</div>
              <div style="font-size: 14px;">${fullInvoice.customerId?.phone || fullInvoice.customers?.phone || ""}</div>
              ${fullInvoice.customerId?.address ? `<div style="font-size: 14px;">${fullInvoice.customerId.address}</div>` : ""}
            </div>
            <div class="info-block" style="text-align: right;">
              <div class="info-label">Invoice Details</div>
              <div class="info-value">#${fullInvoice.invoice_number}</div>
              <div style="font-size: 14px;">Date: ${new Date(fullInvoice.createdAt).toLocaleDateString()}</div>
               <div style="font-size: 14px;">Time: ${new Date(fullInvoice.createdAt).toLocaleTimeString()}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="text-align: center; width: 50px;">#</th>
                <th>Item</th>
                <th style="text-align: center; width: 80px;">Qty</th>
                <th style="text-align: right; width: 100px;">Price</th>
                <th style="text-align: right; width: 100px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span>Subtotal</span>
              <span>Rs. ${fullInvoice.subtotal?.toLocaleString()}</span>
            </div>
            <div class="total-row">
              <span>Discount</span>
              <span>-Rs. ${fullInvoice.discount_amount?.toLocaleString() || 0}</span>
            </div>
            <div class="total-row grand-total">
              <span>Grand Total</span>
              <span>Rs. ${fullInvoice.grand_total?.toLocaleString()}</span>
            </div>
             <div class="total-row" style="color: #666; font-size: 14px; margin-top: 5px;">
              <span>Paid via ${fullInvoice.payment_mode?.toUpperCase()}</span>
              <span>Rs. ${fullInvoice.amount_paid?.toLocaleString()}</span>
            </div>
             ${fullInvoice.balance_due > 0 ? `
            <div class="total-row" style="color: red; font-weight: bold;">
              <span>Balance Due</span>
              <span>Rs. ${fullInvoice.balance_due?.toLocaleString()}</span>
            </div>` : ""}
          </div>

          <div class="footer">
            <p>${shop.invoice_footer || "Thank you for your business!"}</p>
            <p style="margin-top: 5px; font-size: 10px;">Generated by Mobile Shop Genius</p>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            }
          </script>
        </body>
        </html>
      `;

      // 4. Create Blob and Open (Isolation Strategy)
      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, "_blank");

      if (!printWindow) {
        toast.error("Please allow popups to print");
      } else {
        // Auto-cleanup URL after 1 minute
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      }

    } catch (error) {
      console.error("Print error:", error);
      toast.error("Failed to generate invoice");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Invoices</h1>
            <p className="text-muted-foreground mt-1">View and manage all invoices</p>
          </div>
          <Button variant="gradient">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>

        <Card glass>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by invoice number, customer name or phone..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card glass>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              All Invoices ({filteredInvoices?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredInvoices && filteredInvoices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      <th className="text-left p-4 font-semibold">Invoice #</th>
                      <th className="text-left p-4 font-semibold">Customer</th>
                      <th className="text-left p-4 font-semibold">Date</th>
                      <th className="text-left p-4 font-semibold">Amount</th>
                      <th className="text-left p-4 font-semibold">Payment</th>
                      <th className="text-left p-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((invoice) => (
                      <tr
                        key={invoice.id}
                        className="border-b border-border/30 hover:bg-muted/20 transition-colors"
                      >
                        <td className="p-4 font-mono">{invoice.invoice_number}</td>
                        <td className="p-4">
                          <p className="font-medium">{invoice.customers?.name || "Walk-in"}</p>
                          <p className="text-sm text-muted-foreground">
                            {invoice.customers?.phone || "-"}
                          </p>
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {format(new Date(invoice.createdAt), "dd MMM yyyy, hh:mm a")}
                        </td>
                        <td className="p-4">
                          <p className="font-semibold">₹{invoice.grand_total.toLocaleString()}</p>
                          {invoice.balance_due && invoice.balance_due > 0 && (
                            <p className="text-sm text-destructive">
                              Due: ₹{invoice.balance_due.toLocaleString()}
                            </p>
                          )}
                        </td>
                        <td className="p-4">{getPaymentBadge(invoice.payment_mode)}</td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleView(invoice)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handlePrint(invoice)}>
                              <Printer className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteId(invoice.id || invoice._id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No invoices found</p>
                <p className="text-sm">Create your first invoice from the POS</p>
              </div>
            )}
          </CardContent>
        </Card>

        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the invoice,
                restore the stock quantity of items, and adjust customer metrics.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  if (deleteId) deleteInvoice.mutate(deleteId);
                  setDeleteId(null);
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Invoice #{viewInvoice?.invoice_number}</DialogTitle>
            </DialogHeader>
            {isLoadingView ? (
              <div className="py-8 space-y-4">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-20 w-1/2 ml-auto" />
              </div>
            ) : viewInvoice ? (
              <div className="space-y-6">
                {/* Header Info */}
                <div className="flex justify-between items-start border-b pb-4">
                  <div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Billed To</p>
                    <h3 className="font-bold text-lg">{viewInvoice.customerId?.name || viewInvoice.customers?.name || "Walk-in Customer"}</h3>
                    <p className="text-sm text-muted-foreground">{viewInvoice.customerId?.phone || viewInvoice.customers?.phone || ""}</p>
                    {viewInvoice.customerId?.address && (
                      <p className="text-sm text-muted-foreground">{viewInvoice.customerId.address}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Details</p>
                    <p className="font-medium">Date: {new Date(viewInvoice.createdAt).toLocaleDateString()}</p>
                    <p className="font-medium">Time: {new Date(viewInvoice.createdAt).toLocaleTimeString()}</p>
                    <div className="mt-1">{getPaymentBadge(viewInvoice.payment_mode || "cash")}</div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Item</th>
                        <th className="px-4 py-3 text-center font-medium">Qty</th>
                        <th className="px-4 py-3 text-right font-medium">Price</th>
                        <th className="px-4 py-3 text-right font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {viewInvoice.items?.map((item: any, i: number) => (
                        <tr key={i}>
                          <td className="px-4 py-3">
                            <span className="font-medium">{item.productId?.name || "Unknown Item"}</span>
                          </td>
                          <td className="px-4 py-3 text-center text-muted-foreground">{item.quantity}</td>
                          <td className="px-4 py-3 text-right text-muted-foreground">Rs. {item.unit_price}</td>
                          <td className="px-4 py-3 text-right font-medium">Rs. {item.total_amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end">
                  <div className="w-1/2 sm:w-1/3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>Rs. {viewInvoice.subtotal?.toLocaleString()}</span>
                    </div>
                    {viewInvoice.discount_amount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount</span>
                        <span>-Rs. {viewInvoice.discount_amount?.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>Grand Total</span>
                      <span>Rs. {viewInvoice.grand_total?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground pt-1">
                      <span>Amount Paid</span>
                      <span>Rs. {viewInvoice.amount_paid?.toLocaleString()}</span>
                    </div>
                    {viewInvoice.balance_due > 0 && (
                      <div className="flex justify-between text-sm font-medium text-destructive pt-1">
                        <span>Balance Due</span>
                        <span>Rs. {viewInvoice.balance_due?.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                Failed to load invoice details.
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
