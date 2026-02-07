import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, useBrands, useCategories } from "@/hooks/useProducts";
import { Plus, Search, Package, Edit, Trash2, Filter, Loader2, Image as ImageIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import API from "@/lib/api";
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

export default function Products() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", cost_price: "", selling_price: "", stock_quantity: "0", product_type: "mobile" as const, image: null as File | null });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: products, isLoading, refetch } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredProducts = products?.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (stock: number | null) => {
    const qty = stock || 0;
    if (qty === 0) return <Badge variant="destructive">Out of Stock</Badge>;
    if (qty < 5) return <Badge variant="warning">Low Stock</Badge>;
    return <Badge variant="success">In Stock</Badge>;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, image: e.target.files[0] });
    }
  };

  const handleEdit = (product: any) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      cost_price: product.cost_price?.toString() || "",
      selling_price: product.selling_price?.toString() || "",
      stock_quantity: product.stock_quantity?.toString() || "0",
      product_type: product.product_type || "mobile",
      image: null
    });
    setDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      await deleteProduct.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const handleValidation = () => {
    if (!formData.name || !formData.cost_price || !formData.selling_price) {
      toast.error("Please fill required fields");
      return false;
    }
    return true;
  }

  const resetForm = () => {
    setDialogOpen(false);
    setFormData({ name: "", cost_price: "", selling_price: "", stock_quantity: "0", product_type: "mobile", image: null });
    setEditingId(null);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handleValidation()) return;

    setIsSubmitting(true);
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('cost_price', formData.cost_price);
      data.append('selling_price', formData.selling_price);
      data.append('stock_quantity', formData.stock_quantity);
      data.append('product_type', formData.product_type);
      if (formData.image) {
        data.append('image', formData.image);
      }

      if (editingId) {
        await API.put(`/products/${editingId}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success("Product updated successfully");
      } else {
        await API.post('/products', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success("Product added successfully");
      }

      resetForm();
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to save product");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Products</h1>
            <p className="text-muted-foreground mt-1">Manage your mobile inventory</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button variant="gradient"><Plus className="w-4 h-4" />Add Product</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{editingId ? "Edit Product" : "Add New Product"}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="space-y-2"><Label>Name *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>

                <div className="space-y-2">
                  <Label>Product Image</Label>
                  <div className="flex items-center gap-2">
                    <Input type="file" accept="image/*" onChange={handleFileChange} className="cursor-pointer" />
                  </div>
                  {formData.image && <p className="text-xs text-muted-foreground">Selected: {formData.image.name}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Cost Price *</Label><Input type="number" value={formData.cost_price} onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })} required /></div>
                  <div className="space-y-2"><Label>Selling Price *</Label><Input type="number" value={formData.selling_price} onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })} required /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Stock</Label><Input type="number" value={formData.stock_quantity} onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Type</Label>
                    <Select value={formData.product_type} onValueChange={(v: any) => setFormData({ ...formData, product_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="mobile">Mobile</SelectItem><SelectItem value="accessory">Accessory</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" variant="gradient" className="w-full" disabled={isSubmitting}>{isSubmitting ? "Saving..." : editingId ? "Update Product" : "Add Product"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card glass><CardContent className="p-4"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" /><Input placeholder="Search products..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div></CardContent></Card>

        <Card glass>
          <CardHeader><CardTitle className="flex items-center gap-2"><Package className="w-5 h-5 text-primary" />All Products ({filteredProducts?.length || 0})</CardTitle></CardHeader>
          <CardContent className="p-0">
            {isLoading ? <div className="p-6 space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div> : filteredProducts && filteredProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-border/50 bg-muted/30"><th className="text-left p-4 font-semibold">Image</th><th className="text-left p-4 font-semibold">Product</th><th className="text-left p-4 font-semibold">SKU</th><th className="text-left p-4 font-semibold">Price</th><th className="text-left p-4 font-semibold">Stock</th><th className="text-left p-4 font-semibold">Status</th><th className="text-left p-4 font-semibold">Actions</th></tr></thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="border-b border-border/30 hover:bg-muted/20">
                        <td className="p-4">
                          {product.image_url ? (
                            <img src={`http://127.0.0.1:5000${product.image_url}`} alt={product.name} className="w-10 h-10 object-cover rounded-md" onError={(e) => (e.currentTarget.src = "/placeholder.svg")} />
                          ) : (
                            <div className="w-10 h-10 bg-secondary/20 rounded-md flex items-center justify-center"><ImageIcon className="w-5 h-5 text-muted-foreground" /></div>
                          )}
                        </td>
                        <td className="p-4"><p className="font-medium">{product.name}</p><p className="text-sm text-muted-foreground">{product.brands?.name || product.product_type}</p></td>
                        <td className="p-4 font-mono text-sm">{product.sku || "-"}</td>
                        <td className="p-4 font-semibold">₹{product.selling_price.toLocaleString()}</td>
                        <td className="p-4">{product.stock_quantity || 0} units</td>
                        <td className="p-4">{getStatusBadge(product.stock_quantity)}</td>
                        <td className="p-4"><div className="flex gap-2"><Button variant="ghost" size="icon" onClick={() => handleEdit(product)}><Edit className="w-4 h-4" /></Button><Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteClick(product.id)}><Trash2 className="w-4 h-4" /></Button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <div className="p-12 text-center text-muted-foreground"><Package className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>No products found</p></div>}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the product
                and remove it from your inventory.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={confirmDelete}
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
