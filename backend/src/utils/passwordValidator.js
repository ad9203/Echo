/**
 * Validates password based on security policy:
 * - At least 8 characters
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one digit (0-9)
 * - Special characters are optional
 */
export function validatePassword(password) {
  if (!password || typeof password !== "string") {
    return {
      isValid: false,
      message: "Password is required",
    };
  }

  if (password.length < 8) {
    return {
      isValid: false,
      message: "Password must be at least 8 characters long",
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one uppercase letter (A-Z)",
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one lowercase letter (a-z)",
    };
  }

  if (!/[0-9]/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one digit (0-9)",
    };
  }

  return {
    isValid: true,
  };
}
