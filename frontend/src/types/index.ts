export interface Product {
    _id: string;
    id?: string; // Mapped from _id
    name: string;
    sku?: string;
    barcode?: string;
    description?: string;
    categoryId?: { _id: string; name: string } | string;
    brandId?: { _id: string; name: string } | string;
    supplierId?: { _id: string; name: string } | string;
    cost_price: number;
    selling_price: number;
    mrp?: number;
    stock_quantity: number;
    low_stock_threshold?: number;
    imei1?: string;
    imei2?: string;
    product_type: 'mobile' | 'accessory';
    images?: string[]; // Keep for backward compatibility if needed
    image_url?: string; // Add this field
    isActive: boolean;
    createdAt: string;
    updatedAt: string;

    // For compatibility with UI that expects nested objects
    brands?: { name: string };
    categories?: { name: string };
}

export interface Customer {
    _id: string;
    id?: string; // Mapped from _id
    name: string;
    phone: string;
    email?: string;
    address?: string;
    gst_number?: string;
    notes?: string;
    customer_type: 'retail' | 'wholesale';
    outstanding_balance: number;
    total_purchases: number;
    createdAt: string;
    updatedAt: string;
}

export interface Invoice {
    _id: string;
    id?: string; // Mapped from _id
    invoice_number: string;
    customerId?: { _id: string; name: string; phone?: string } | string;
    userId?: { _id: string; full_name: string } | string;
    items: InvoiceItem[];
    subtotal: number;
    discount_amount: number;
    total_gst: number;
    grand_total: number;
    amount_paid: number;
    balance_due: number;
    payment_mode: string;
    createdAt: string;
    customers?: { name: string; phone?: string }; // Mapped from customerId by hook
}

export interface InvoiceItem {
    productId: { _id: string; name: string; selling_price: number } | string;
    quantity: number;
    unit_price: number;
    total_amount: number;
    imei_sold?: string;
}

export interface Brand {
    _id: string;
    name: string;
    logo_url?: string;
}

export interface Category {
    _id: string;
    name: string;
    description?: string;
}
