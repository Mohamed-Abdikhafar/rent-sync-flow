
/**
 * Generates a random alphanumeric invitation code of a specified length
 * @param length Length of the invitation code to generate
 * @returns A random alphanumeric invitation code
 */
export const generateInvitationCode = (length: number = 6): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    code += chars.charAt(randomIndex);
  }
  
  return code;
};

/**
 * Generates a random temporary password of a specified length
 * @param length Length of the temporary password to generate
 * @returns A random password with a mix of characters
 */
export const generateTemporaryPassword = (length: number = 8): string => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%^&*';
  const allChars = lowercase + uppercase + numbers + special;
  
  let password = '';
  
  // Ensure at least one of each character type
  password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  password += special.charAt(Math.floor(Math.random() * special.length));
  
  // Fill the rest with random characters
  for (let i = 4; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * allChars.length);
    password += allChars.charAt(randomIndex);
  }
  
  // Shuffle the password to mix the guaranteed characters
  return password.split('').sort(() => 0.5 - Math.random()).join('');
};

/**
 * Formats a phone number for display
 * @param phoneNumber The phone number to format (e.g., +254712345678)
 * @returns Formatted phone number (e.g., +254 712 345 678)
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  // Remove any non-digit characters except the + sign
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // Check if it starts with + (international format)
  if (cleaned.startsWith('+')) {
    // Format as international number: +254 712 345 678
    const countryCode = cleaned.substring(0, 4); // Assuming +XXX format for country code
    const rest = cleaned.substring(4);
    
    // Split the rest into groups of 3
    const formatted = [];
    for (let i = 0; i < rest.length; i += 3) {
      formatted.push(rest.substring(i, i + 3));
    }
    
    return `${countryCode} ${formatted.join(' ')}`;
  }
  
  // If not international, just return as is
  return cleaned;
};

/**
 * Gets a tenant's full name
 * @param firstName The tenant's first name
 * @param lastName The tenant's last name
 * @returns The tenant's full name
 */
export const getTenantFullName = (firstName?: string | null, lastName?: string | null): string => {
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }
  
  if (firstName) {
    return firstName;
  }
  
  if (lastName) {
    return lastName;
  }
  
  return 'Unknown Tenant';
};
