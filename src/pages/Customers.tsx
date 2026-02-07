import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from "@/hooks/useCustomers";
import { Plus, Search, Users, Phone, Mail, Edit, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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

import { isValidPhone, isValidEmail } from "@/utils/validation";

export default function Customers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", address: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: customers, isLoading } = useCustomers();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const filteredCustomers = customers?.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) { toast.error("Name and phone required"); return; }

    if (!isValidPhone(formData.phone)) {
      toast.error("Phone number must be exactly 10 digits");
      return;
    }

    if (formData.email && !isValidEmail(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (editingId) {
      await updateCustomer.mutateAsync({ id: editingId, ...formData });
    } else {
      await createCustomer.mutateAsync(formData);
    }
    setDialogOpen(false);
    setFormData({ name: "", phone: "", email: "", address: "" });
    setEditingId(null);
  };

  const handleEdit = (customer: any) => {
    setEditingId(customer.id);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || "",
      address: customer.address || ""
    });
    setDialogOpen(true);
  };

  // Reset form when closing dialog
  const onOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingId(null);
      setFormData({ name: "", phone: "", email: "", address: "" });
    }
  };

  const totalPurchases = customers?.reduce((sum, c) => sum + (c.total_purchases || 0), 0) || 0;
  const totalOutstanding = customers?.reduce((sum, c) => sum + (c.outstanding_balance || 0), 0) || 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div><h1 className="text-3xl font-bold">Customers</h1><p className="text-muted-foreground mt-1">Manage your customer database</p></div>
          <Dialog open={dialogOpen} onOpenChange={onOpenChange}>
            <DialogTrigger asChild><Button variant="gradient"><Plus className="w-4 h-4" />Add Customer</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingId ? "Edit Customer" : "Add New Customer"}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="space-y-2"><Label>Name *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Phone *</Label><Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
                <div className="space-y-2"><Label>Address</Label><Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} /></div>
                <Button type="submit" variant="gradient" className="w-full" disabled={createCustomer.isPending || updateCustomer.isPending}>
                  {editingId ? (updateCustomer.isPending ? "Updating..." : "Update Customer") : (createCustomer.isPending ? "Adding..." : "Add Customer")}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card glass><CardContent className="p-6 flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center"><Users className="w-6 h-6 text-white" /></div><div><p className="text-2xl font-bold">{customers?.length || 0}</p><p className="text-sm text-muted-foreground">Total Customers</p></div></CardContent></Card>
          <Card glass><CardContent className="p-6 flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success to-emerald-400 flex items-center justify-center"><Users className="w-6 h-6 text-white" /></div><div><p className="text-2xl font-bold">₹{totalPurchases.toLocaleString()}</p><p className="text-sm text-muted-foreground">Total Purchases</p></div></CardContent></Card>
          <Card glass><CardContent className="p-6 flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-gradient-to-br from-warning to-amber-400 flex items-center justify-center"><Users className="w-6 h-6 text-white" /></div><div><p className="text-2xl font-bold">₹{totalOutstanding.toLocaleString()}</p><p className="text-sm text-muted-foreground">Outstanding Dues</p></div></CardContent></Card>
        </div>

        <Card glass><CardContent className="p-4"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" /><Input placeholder="Search by name or phone..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div></CardContent></Card>

        <Card glass>
          <CardHeader><CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" />All Customers ({filteredCustomers?.length || 0})</CardTitle></CardHeader>
          <CardContent className="p-0">
            {isLoading ? <div className="p-6 space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div> : filteredCustomers && filteredCustomers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-border/50 bg-muted/30"><th className="text-left p-4 font-semibold">Customer</th><th className="text-left p-4 font-semibold">Contact</th><th className="text-left p-4 font-semibold">Type</th><th className="text-left p-4 font-semibold">Purchases</th><th className="text-left p-4 font-semibold">Outstanding</th><th className="text-left p-4 font-semibold">Actions</th></tr></thead>
                  <tbody>
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.id} className="border-b border-border/30 hover:bg-muted/20">
                        <td className="p-4"><p className="font-medium">{customer.name}</p></td>
                        <td className="p-4"><div className="flex items-center gap-2 text-sm"><Phone className="w-3 h-3" />{customer.phone}</div>{customer.email && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Mail className="w-3 h-3" />{customer.email}</div>}</td>
                        <td className="p-4"><Badge variant={customer.customer_type === "wholesale" ? "secondary" : "outline"}>{customer.customer_type || "retail"}</Badge></td>
                        <td className="p-4 font-semibold">₹{(customer.total_purchases || 0).toLocaleString()}</td>
                        <td className="p-4">{(customer.outstanding_balance || 0) > 0 ? <span className="text-destructive font-medium">₹{customer.outstanding_balance?.toLocaleString()}</span> : <Badge variant="success">Cleared</Badge>}</td>
                        <td className="p-4"><div className="flex gap-2"><Button variant="ghost" size="icon" onClick={() => handleEdit(customer)}><Edit className="w-4 h-4" /></Button><Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(customer.id || customer._id)}><Trash2 className="w-4 h-4" /></Button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <div className="p-12 text-center text-muted-foreground"><Users className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>No customers found</p></div>}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the customer
                and remove them from your database.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  if (deleteId) deleteCustomer.mutate(deleteId);
                  setDeleteId(null);
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
