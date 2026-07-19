export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validatePhoneNumber(phone: string): ValidationResult {
  if (!phone) {
    return { isValid: false, error: "Phone number is required" };
  }

  const cleaned = phone.replace(/\D/g, "");

  if (cleaned.length < 8) {
    return { isValid: false, error: "Phone number is too short" };
  }

  if (cleaned.length > 15) {
    return { isValid: false, error: "Phone number is too long" };
  }

  return { isValid: true };
}
