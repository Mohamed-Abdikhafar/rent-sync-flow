
/**
 * Generate a random 6-character alphanumeric invitation code
 */
export const generateInvitationCode = (): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

/**
 * Generate a temporary password for new tenants
 * Creates an 8-character string with at least one uppercase, one lowercase,
 * one number, and one special character
 */
export const generateTemporaryPassword = (): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*';
  const all = uppercase + lowercase + numbers + special;
  
  // Ensure at least one of each type
  let result = '';
  result += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  result += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
  result += numbers.charAt(Math.floor(Math.random() * numbers.length));
  result += special.charAt(Math.floor(Math.random() * special.length));
  
  // Fill the rest with random characters
  for (let i = 4; i < 8; i++) {
    result += all.charAt(Math.floor(Math.random() * all.length));
  }
  
  // Shuffle the password to avoid predictable pattern
  return result.split('').sort(() => 0.5 - Math.random()).join('');
};
