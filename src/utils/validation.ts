
export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

export function validatePhoneNumber(phone: string): ValidationResult {
    if (!phone) {
        return { isValid: false, error: 'Phone number is required' };
    }
    
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length < 8) {
        return { isValid: false, error: 'Phone number is too short' };
    }
    
    if (cleaned.length > 15) {
        return { isValid: false, error: 'Phone number is too long' };
    }
    
    return { isValid: true };
}

export function validateEmail(email: string): ValidationResult {
    if (!email) {
        return { isValid: false, error: 'Email is required' };
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
        return { isValid: false, error: 'Please enter a valid email address' };
    }
    
    return { isValid: true };
}

export function validateVerificationCode(code: string): ValidationResult {
    if (!code) {
        return { isValid: false, error: 'Verification code is required' };
    }
    
    const cleaned = code.replace(/\D/g, '');
    
    if (cleaned.length !== 4) {
        return { isValid: false, error: 'Please enter a 4-digit verification code' };
    }
    
    return { isValid: true };
}

export function validateRequired(value: any, fieldName: string = 'This field'): ValidationResult {
    if (value === null || value === undefined || value === '') {
        return { isValid: false, error: `${fieldName} is required` };
    }
    
    return { isValid: true };
}