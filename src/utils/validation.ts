export const isValidPhone = (phone: string): boolean => {
    // Must be exactly 10 digits
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
};

export const isValidEmail = (email: string): boolean => {
    // Standard email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const isValidGST = (gst: string): boolean => {
    // Must be exactly 15 characters alphanumeric
    // Standard GST regex: \d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}
    // But for simple validation "exactly 15 chars" as requested:
    return gst.length === 15;
};
