import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDashboardStats } from "@/hooks/useInvoices";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  Package,
  ShoppingCart,
  Users,
  AlertTriangle,
  IndianRupee,
  Calendar,
  ArrowUpRight,
} from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  const statCards = [
    { title: "Today's Sales", value: `₹${(stats?.todaySales || 0).toLocaleString()}`, icon: IndianRupee, color: "from-primary to-blue-400" },
    { title: "Monthly Sales", value: `₹${(stats?.monthlySales || 0).toLocaleString()}`, icon: TrendingUp, color: "from-secondary to-purple-400" },
    { title: "Total Products", value: stats?.productCount || 0, icon: Package, color: "from-success to-emerald-400" },
    { title: "Total Customers", value: stats?.customerCount || 0, icon: Users, color: "from-info to-cyan-400" },
    { title: "Total Invoices", value: stats?.invoiceCount || 0, icon: ShoppingCart, color: "from-warning to-amber-400" },
    { title: "Pending EMI", value: `₹${(stats?.pendingEmi || 0).toLocaleString()}`, icon: Calendar, color: "from-destructive to-red-400" },
  ];

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back! Here's your shop overview.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((stat) => (
            <Card key={stat.title} glass className="hover:scale-[1.02] transition-transform">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold mt-2">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card glass>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary" />
                Recent Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.recentSales && stats.recentSales.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentSales.map((sale: any) => (
                    <div key={sale.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                      <div>
                        <p className="font-medium">{sale.customerId?.name || sale.customers?.name || "Walk-in"}</p>
                        <p className="text-sm text-muted-foreground">{sale.invoice_number}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">₹{sale.grand_total.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(sale.createdAt), "dd MMM, hh:mm a")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No recent sales</p>
              )}
            </CardContent>
          </Card>

          <Card glass>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                Low Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.lowStockProducts && stats.lowStockProducts.length > 0 ? (
                <div className="space-y-4">
                  {stats.lowStockProducts.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-warning/5 border border-warning/20">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">Threshold: {item.low_stock_threshold}</p>
                      </div>
                      <Badge variant="warning">{item.stock_quantity} left</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">All products well stocked</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
