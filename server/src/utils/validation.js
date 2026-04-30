/**
 * Small validation helpers. For a larger production app, replace this with Zod.
 */
export function assertString(value, fieldName, maxLength = 255) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    const error = new Error(`${fieldName} is required.`);
    error.statusCode = 400;
    throw error;
  }

  if (value.length > maxLength) {
    const error = new Error(`${fieldName} is too long.`);
    error.statusCode = 400;
    throw error;
  }

  return value.trim();
}

export function assertEmail(value) {
  const email = assertString(value, 'Email', 320).toLowerCase();
  const basicEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!basicEmailPattern.test(email)) {
    const error = new Error('Please enter a valid email address.');
    error.statusCode = 400;
    throw error;
  }

  return email;
}

export function assertPositiveInteger(value, fieldName) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    const error = new Error(`${fieldName} must be a positive whole number.`);
    error.statusCode = 400;
    throw error;
  }
  return number;
}
