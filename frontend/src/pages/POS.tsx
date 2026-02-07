import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone, QrCode, Loader2, User, UserPlus } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useCustomers, useCreateCustomer } from "@/hooks/useCustomers";
import { useCreateInvoice } from "@/hooks/useInvoices";
import { Product, Customer } from "@/types";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isValidPhone } from "@/utils/validation";
import { Skeleton } from "@/components/ui/skeleton";

interface CartItem extends Product {
  quantity: number;
}

export default function POS() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({ name: "", phone: "" });
  const [discount, setDiscount] = useState<string>("0");

  // EMI State
  const [emiModalOpen, setEmiModalOpen] = useState(false);
  const [emiConfig, setEmiConfig] = useState({
    downPayment: "",
    interestRate: "0",
    tenure: "6",
  });

  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: customers, isLoading: customersLoading } = useCustomers();
  const createCustomer = useCreateCustomer();
  const createInvoice = useCreateInvoice();

  const addToCart = (product: Product) => {
    // ... (unchanged)
    if (product.stock_quantity === 0) {
      toast.error("Product out of stock");
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          toast.error("Not enough stock");
          return prev;
        }
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    // ... (unchanged)
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            if (newQty > item.stock_quantity) {
              toast.error("Not enough stock");
              return item;
            }
            return { ...item, quantity: Math.max(0, newQty) };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.selling_price * item.quantity, 0);
  const gst = 0; // Assuming inclusive or 0 for now based on previous UI, can configure later
  const discountAmount = parseFloat(discount) || 0;
  const total = Math.max(0, subtotal + gst - discountAmount);

  // EMI Calculations
  const downPayment = parseFloat(emiConfig.downPayment) || 0;
  const loanAmount = Math.max(0, total - downPayment);
  const tenure = parseInt(emiConfig.tenure) || 6;
  const annualRate = parseFloat(emiConfig.interestRate) || 0;

  let monthlyEmi = 0;
  let totalPayable = 0;
  let totalInterest = 0;

  if (loanAmount > 0) {
    if (annualRate > 0) {
      // PMT Formula: E = P * r * (1 + r)^n / ((1 + r)^n - 1)
      const r = annualRate / 12 / 100;
      monthlyEmi = Math.ceil(loanAmount * r * Math.pow(1 + r, tenure) / (Math.pow(1 + r, tenure) - 1));
    } else {
      monthlyEmi = Math.ceil(loanAmount / tenure);
    }
    totalPayable = monthlyEmi * tenure;
    totalInterest = totalPayable - loanAmount;
  }

  const filteredProducts = products?.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCustomers = customers?.filter((c) =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch)
  );

  const handleQuickAddCustomer = async (e: React.FormEvent) => {
    // ... (unchanged)
    e.preventDefault();
    if (!newCustomerData.name || !newCustomerData.phone) return;

    if (!isValidPhone(newCustomerData.phone)) {
      toast.error("Phone number must be exactly 10 digits");
      return;
    }

    try {
      const newCustomer = await createCustomer.mutateAsync({
        name: newCustomerData.name,
        phone: newCustomerData.phone,
      });
      setSelectedCustomer(newCustomer.id);
      setNewCustomerOpen(false);
      setNewCustomerData({ name: "", phone: "" });
      toast.success("Customer added and selected");
    } catch (err) {
      // Toast handled by hook
    }
  };

  const handleCheckoutInit = (mode: string) => {
    if (cart.length === 0) return;
    if (!selectedCustomer) {
      toast.error("Please select a customer");
      return;
    }

    if (mode === 'emi') {
      setEmiConfig(prev => ({ ...prev, downPayment: Math.floor(total * 0.3).toString() })); // Default 30% down
      setEmiModalOpen(true);
    } else {
      processCheckout(mode);
    }
  };

  const processCheckout = async (mode: string, emiData?: any) => {
    const finalAmountPaid = mode === 'emi' ? (emiData?.down_payment || 0) : total;

    const invoiceData = {
      invoice: {
        grand_total: total,
        amount_paid: finalAmountPaid,
        subtotal: subtotal,
        payment_mode: mode,
        customer_id: selectedCustomer,
        discount_amount: discountAmount,
        emiDetails: emiData
      },
      items: cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.selling_price,
        total_amount: item.selling_price * item.quantity,
        gst_rate: 0
      }))
    };

    try {
      await createInvoice.mutateAsync(invoiceData);
      setCart([]);
      setSearchQuery("");
      setDiscount("0");
      setEmiModalOpen(false);
      toast.success("Invoice created successfully");
    } catch (err) {
      // Toast handled by hook
    }
  };

  const handleConfirmEmi = () => {
    if (downPayment >= total) {
      toast.error("Down payment cannot be equal or more than total. Use Cash/Card instead.");
      return;
    }
    const emiData = {
      down_payment: downPayment,
      interest_rate: annualRate,
      tenure_months: tenure,
    };
    processCheckout('emi', emiData);
  }

  return (
    <AppLayout>
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
        {/* Products Section */}
        <div className="flex-1 flex flex-col">
          <div className="mb-4">
            <h1 className="text-3xl font-bold">POS / Billing</h1>
            <p className="text-muted-foreground">Quick billing with barcode scanning</p>
          </div>

          <div className="flex gap-4 mb-4">
            {/* Search */}
            <Card glass className="flex-1">
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Scan barcode or search products..."
                    className="pl-10 text-lg h-12"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                </div>
              </CardContent>
            </Card>

            {/* Customer Select */}
            <Card glass className="w-1/3">
              <CardContent className="p-4 flex items-center gap-2">
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select Customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2">
                      <Input placeholder="Search user..." value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} className="mb-2 h-8" onKeyDown={e => e.stopPropagation()} />
                    </div>
                    {filteredCustomers?.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name} ({c.phone})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Dialog open={newCustomerOpen} onOpenChange={setNewCustomerOpen}>
                  <DialogTrigger asChild>
                    <Button variant="gradient" size="icon" className="h-12 w-12 shrink-0"><UserPlus className="w-5 h-5" /></Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>New Customer</DialogTitle></DialogHeader>
                    <form onSubmit={handleQuickAddCustomer} className="space-y-4 pt-4">
                      <div className="space-y-2"><Label>Name</Label><Input value={newCustomerData.name} onChange={e => setNewCustomerData({ ...newCustomerData, name: e.target.value })} required /></div>
                      <div className="space-y-2"><Label>Phone</Label><Input value={newCustomerData.phone} onChange={e => setNewCustomerData({ ...newCustomerData, phone: e.target.value })} required /></div>
                      <Button type="submit" variant="gradient" className="w-full" disabled={createCustomer.isPending}>
                        {createCustomer.isPending ? "Creating..." : "Create"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto">
            {productsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pb-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-48 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pb-4">
                {filteredProducts?.map((product) => {
                  return (
                    <Card
                      key={product.id}
                      glass
                      className="cursor-pointer hover:scale-[1.02] transition-transform"
                      onClick={() => addToCart(product)}
                    >
                      <CardContent className="p-4">
                        <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 rounded-xl mb-3 flex items-center justify-center overflow-hidden relative">
                          {product.image_url ? (
                            <img
                              src={`http://127.0.0.1:5000${product.image_url}`}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.error("Image failed to load:", e.currentTarget.src);
                                e.currentTarget.style.display = 'none';
                                // Show fallback icon
                                const icon = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                                if (icon) icon.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <Smartphone
                            className={`fallback-icon w-12 h-12 text-muted-foreground/50 ${product.image_url ? 'hidden' : ''}`}
                          />
                        </div>
                        <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
                        <div className="flex items-center justify-between mt-2">
                          <p className="font-bold text-primary">₹{product.selling_price.toLocaleString()}</p>
                          <Badge variant="outline" className={`text-xs ${product.stock_quantity < 5 ? 'text-red-500 border-red-500' : ''}`}>
                            {product.stock_quantity} left
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Cart Section */}
        <Card glass className="w-full lg:w-96 flex flex-col">
          <CardHeader className="border-b border-border/50">
            <CardTitle>Current Bill</CardTitle>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Smartphone className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No items in cart</p>
                <p className="text-sm">Scan or click products to add</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      ₹{item.selling_price.toLocaleString()} × {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.id, -1)}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.id, 1)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>

          {/* Totals */}
          <div className="p-4 border-t border-border/50 space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">GST (included)</span>
                <span>₹{gst.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Discount</span>
                <Input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="h-8 w-24 text-right"
                />
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-border/50">
                <span>Total</span>
                <span className="text-primary">₹{total.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-12" disabled={cart.length === 0 || createInvoice.isPending} onClick={() => handleCheckoutInit('cash')}>
                {createInvoice.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : <Banknote className="w-4 h-4 mr-2" />}
                Cash
              </Button>
              <Button variant="outline" className="h-12" disabled={cart.length === 0} onClick={() => handleCheckoutInit('upi')}>
                <QrCode className="w-4 h-4 mr-2" />
                UPI
              </Button>
              <Button variant="outline" className="h-12" disabled={cart.length === 0} onClick={() => handleCheckoutInit('card')}>
                <CreditCard className="w-4 h-4 mr-2" />
                Card
              </Button>
              <Button variant="gradient" className="h-12" disabled={cart.length === 0} onClick={() => handleCheckoutInit('emi')}>
                EMI
              </Button>
            </div>
          </div>
        </Card>

        {/* EMI Configuration Dialog */}
        <Dialog open={emiModalOpen} onOpenChange={setEmiModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>EMI Configuration</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="p-4 bg-muted/40 rounded-lg space-y-2">
                <div className="flex justify-between text-sm"><span>Bill Total:</span><span className="font-bold">₹{total.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm pt-2 border-t border-border/50"><span>Loan Principal:</span><span className="font-bold text-primary">₹{loanAmount.toLocaleString()}</span></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Down Payment</Label>
                  <Input
                    type="number"
                    value={emiConfig.downPayment}
                    onChange={(e) => setEmiConfig(prev => ({ ...prev, downPayment: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tenure (Months)</Label>
                  <Select value={emiConfig.tenure} onValueChange={(v) => setEmiConfig(prev => ({ ...prev, tenure: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[3, 6, 9, 12, 18, 24].map(m => (
                        <SelectItem key={m} value={m.toString()}>{m} Months</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Interest Rate (% Annual)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={emiConfig.interestRate}
                  onChange={(e) => setEmiConfig(prev => ({ ...prev, interestRate: e.target.value }))}
                />
              </div>

              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Monthly EMI</span>
                  <span className="text-xl font-bold text-primary">₹{monthlyEmi.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t border-primary/10">
                  <span>Total Interest: ₹{totalInterest.toLocaleString()}</span>
                  <span>Total Payable: ₹{totalPayable.toLocaleString()}</span>
                </div>
              </div>

              <Button className="w-full" variant="gradient" onClick={handleConfirmEmi} disabled={createInvoice.isPending}>
                {createInvoice.isPending ? "Procesing..." : "Confirm EMI Plan"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}