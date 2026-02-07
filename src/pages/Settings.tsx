import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import API from "@/lib/api";
import { toast } from "sonner";
import { Settings as SettingsIcon, Store, Save, Loader2 } from "lucide-react";
import { isValidPhone, isValidEmail, isValidGST } from "@/utils/validation";

interface ShopSettings {
  _id?: string;
  shop_name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  gst_number: string | null;
  invoice_prefix: string | null;
  invoice_footer: string | null;
  logo_url: string | null;
}

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<ShopSettings | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await API.get("/settings");
      setSettings(data);
    } catch (error: any) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);

    try {
      await API.put("/settings", settings);
      toast.success("Settings saved successfully");
    } catch (error: any) {
      toast.error(`Failed to save settings: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof ShopSettings, value: string) => {
    setSettings((prev) =>
      prev
        ? { ...prev, [field]: value }
        : {
          shop_name: "",
          address: null,
          phone: null,
          email: null,
          gst_number: null,
          invoice_prefix: null,
          invoice_footer: null,
          logo_url: null,
          [field]: value,
        }
    );
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground mt-1">Configure your shop settings</p>
          </div>
          <Button variant="gradient" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </Button>
        </div>

        {/* Shop Details */}
        <Card glass>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5 text-primary" />
              Shop Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Shop Name</Label>
                <Input
                  placeholder="Your shop name"
                  value={settings?.shop_name || ""}
                  onChange={(e) => updateField("shop_name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  placeholder="Shop phone number"
                  value={settings?.phone || ""}
                  onChange={(e) => updateField("phone", e.target.value)}
                  onBlur={(e) => {
                    if (e.target.value && !isValidPhone(e.target.value)) {
                      toast.error("Phone number must be exactly 10 digits");
                    }
                  }}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="Shop email"
                  value={settings?.email || ""}
                  onChange={(e) => updateField("email", e.target.value)}
                  onBlur={(e) => {
                    if (e.target.value && !isValidEmail(e.target.value)) {
                      toast.error("Invalid Email Address");
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>GST Number</Label>
                <Input
                  placeholder="GST registration number"
                  value={settings?.gst_number || ""}
                  onChange={(e) => updateField("gst_number", e.target.value)}
                  onBlur={(e) => {
                    if (e.target.value && !isValidGST(e.target.value)) {
                      toast.error("GST Number must be exactly 15 characters");
                    }
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                placeholder="Full shop address"
                value={settings?.address || ""}
                onChange={(e) => updateField("address", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Invoice Settings */}
        <Card glass>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-primary" />
              Invoice Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Invoice Prefix</Label>
                <Input
                  placeholder="e.g., INV"
                  value={settings?.invoice_prefix || ""}
                  onChange={(e) => updateField("invoice_prefix", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Invoice Footer Text</Label>
              <Input
                placeholder="Thank you for shopping with us!"
                value={settings?.invoice_footer || ""}
                onChange={(e) => updateField("invoice_footer", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
