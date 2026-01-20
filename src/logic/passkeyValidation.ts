// Passkey Validation Utility
// Implements entropy-based strength scoring with pattern detection

// Common weak passwords/phrases to reject
const COMMON_PASSWORDS = [
  'password', 'password1', 'password123', '123456', '12345678', '123456789',
  'qwerty', 'abc123', 'letmein', 'welcome', 'admin', 'login', 'master',
  'monkey', 'dragon', 'passw0rd', 'iloveyou', 'trustno1', 'sunshine',
  'princess', 'football', 'baseball', 'soccer', 'hockey', 'batman',
  'superman', 'starwars', 'shadow', 'ashley', 'michael', 'ninja',
  'mustang', 'access', 'hello', 'charlie', 'donald', 'password1234'
];

// Keyboard patterns to detect
const KEYBOARD_PATTERNS = [
  'qwerty', 'qwertyuiop', 'asdf', 'asdfgh', 'asdfghjkl', 'zxcv', 'zxcvbn',
  '1234567890', 'qazwsx', 'qweasd', '!@#$%', '!@#$%^', '!@#$%^&*'
];

// Sequential patterns
const SEQUENTIAL_ALPHA = 'abcdefghijklmnopqrstuvwxyz';
const SEQUENTIAL_NUM = '0123456789';

export type StrengthLevel = 'weak' | 'fair' | 'strong' | 'very-strong';

export interface ValidationResult {
  isValid: boolean;
  strength: StrengthLevel;
  score: number; // 0-100
  hints: string[];
  canSubmit: boolean;
}

export interface PasskeyConfig {
  minLength: number;
  maxLength: number;
  recommendedLength: number;
  userName?: string;
  email?: string;
}

const DEFAULT_CONFIG: PasskeyConfig = {
  minLength: 12,
  maxLength: 64,
  recommendedLength: 14,
};

// Check character diversity
function getCharacterGroups(passkey: string): { 
  hasUpper: boolean; 
  hasLower: boolean; 
  hasNumber: boolean; 
  hasSpecial: boolean;
  groupCount: number;
} {
  const hasUpper = /[A-Z]/.test(passkey);
  const hasLower = /[a-z]/.test(passkey);
  const hasNumber = /[0-9]/.test(passkey);
  const hasSpecial = /[!@#$%^&*()_+\[\]{}|;:,.<>?~`\-=\\/'"]/.test(passkey);
  
  const groupCount = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  
  return { hasUpper, hasLower, hasNumber, hasSpecial, groupCount };
}

// Check for repeated characters (e.g., aaaa, 1111)
function hasRepeatedChars(passkey: string, threshold: number = 3): boolean {
  const regex = new RegExp(`(.)\\1{${threshold - 1},}`, 'i');
  return regex.test(passkey);
}

// Check for sequential patterns (e.g., abcd, 1234)
function hasSequentialPattern(passkey: string, length: number = 4): boolean {
  const lowerPasskey = passkey.toLowerCase();
  
  // Check forward sequences
  for (let i = 0; i <= SEQUENTIAL_ALPHA.length - length; i++) {
    if (lowerPasskey.includes(SEQUENTIAL_ALPHA.substring(i, i + length))) {
      return true;
    }
  }
  
  // Check reverse sequences
  const reverseAlpha = SEQUENTIAL_ALPHA.split('').reverse().join('');
  for (let i = 0; i <= reverseAlpha.length - length; i++) {
    if (lowerPasskey.includes(reverseAlpha.substring(i, i + length))) {
      return true;
    }
  }
  
  // Check numeric sequences
  for (let i = 0; i <= SEQUENTIAL_NUM.length - length; i++) {
    if (passkey.includes(SEQUENTIAL_NUM.substring(i, i + length))) {
      return true;
    }
  }
  
  // Check reverse numeric
  const reverseNum = SEQUENTIAL_NUM.split('').reverse().join('');
  for (let i = 0; i <= reverseNum.length - length; i++) {
    if (passkey.includes(reverseNum.substring(i, i + length))) {
      return true;
    }
  }
  
  return false;
}

// Check for keyboard patterns
function hasKeyboardPattern(passkey: string): boolean {
  const lowerPasskey = passkey.toLowerCase();
  return KEYBOARD_PATTERNS.some(pattern => lowerPasskey.includes(pattern));
}

// Check for common passwords
function isCommonPassword(passkey: string): boolean {
  const lowerPasskey = passkey.toLowerCase();
  return COMMON_PASSWORDS.some(common => 
    lowerPasskey === common || lowerPasskey.includes(common)
  );
}

// Check if passkey contains user-related strings
function containsUserInfo(passkey: string, userName?: string, email?: string): boolean {
  const lowerPasskey = passkey.toLowerCase();
  
  if (userName && userName.length >= 3) {
    if (lowerPasskey.includes(userName.toLowerCase())) {
      return true;
    }
  }
  
  if (email) {
    const emailPrefix = email.split('@')[0].toLowerCase();
    if (emailPrefix.length >= 3 && lowerPasskey.includes(emailPrefix)) {
      return true;
    }
  }
  
  return false;
}

// Calculate entropy-based score
function calculateEntropy(passkey: string): number {
  const { groupCount } = getCharacterGroups(passkey);
  
  // Estimate character pool size based on groups used
  let poolSize = 0;
  if (/[a-z]/.test(passkey)) poolSize += 26;
  if (/[A-Z]/.test(passkey)) poolSize += 26;
  if (/[0-9]/.test(passkey)) poolSize += 10;
  if (/[!@#$%^&*()_+\[\]{}|;:,.<>?~`\-=\\/'"]/.test(passkey)) poolSize += 32;
  
  // Entropy = length * log2(pool size)
  const entropy = passkey.length * Math.log2(poolSize || 1);
  
  return entropy;
}

// Calculate overall score (0-100)
function calculateScore(passkey: string, config: PasskeyConfig): number {
  let score = 0;
  const length = passkey.length;
  const { groupCount } = getCharacterGroups(passkey);
  const entropy = calculateEntropy(passkey);
  
  // Length scoring (40 points max)
  if (length >= config.minLength) {
    score += 20;
    if (length >= config.recommendedLength) {
      score += 10;
    }
    if (length >= 16) {
      score += 5;
    }
    if (length >= 20) {
      score += 5;
    }
  } else {
    score += Math.floor((length / config.minLength) * 15);
  }
  
  // Character diversity (25 points max)
  score += groupCount * 6;
  if (groupCount >= 3) score += 1;
  
  // Entropy bonus (20 points max)
  if (entropy >= 40) score += 5;
  if (entropy >= 50) score += 5;
  if (entropy >= 60) score += 5;
  if (entropy >= 70) score += 5;
  
  // Penalties
  if (hasRepeatedChars(passkey)) score -= 15;
  if (hasSequentialPattern(passkey)) score -= 15;
  if (hasKeyboardPattern(passkey)) score -= 20;
  if (isCommonPassword(passkey)) score -= 30;
  if (containsUserInfo(passkey, config.userName, config.email)) score -= 15;
  
  // Bonus for longer passphrases
  if (length >= 20 && !hasRepeatedChars(passkey) && !hasSequentialPattern(passkey)) {
    score += 10;
  }
  
  return Math.max(0, Math.min(100, score));
}

// Get strength level from score
function getStrengthLevel(score: number, length: number, minLength: number): StrengthLevel {
  if (length < minLength || score < 40) return 'weak';
  if (score < 60) return 'fair';
  if (score < 80) return 'strong';
  return 'very-strong';
}

// Generate helpful hints
function generateHints(passkey: string, config: PasskeyConfig): string[] {
  const hints: string[] = [];
  const length = passkey.length;
  const { hasUpper, hasLower, hasNumber, hasSpecial, groupCount } = getCharacterGroups(passkey);
  
  // Length hints
  if (length < config.minLength) {
    const remaining = config.minLength - length;
    hints.push(`Add ${remaining} more character${remaining > 1 ? 's' : ''} (minimum ${config.minLength})`);
  } else if (length < config.recommendedLength) {
    hints.push(`Consider adding more characters for better security`);
  }
  
  // Character diversity hints
  if (groupCount < 3) {
    const missing: string[] = [];
    if (!hasUpper) missing.push('uppercase letter');
    if (!hasLower) missing.push('lowercase letter');
    if (!hasNumber) missing.push('number');
    if (!hasSpecial) missing.push('special character');
    
    if (missing.length > 0) {
      hints.push(`Try adding a ${missing.slice(0, 2).join(' or ')}`);
    }
  }
  
  // Pattern warnings
  if (hasRepeatedChars(passkey)) {
    hints.push('Avoid repeating the same character');
  }
  
  if (hasSequentialPattern(passkey)) {
    hints.push('Avoid sequential patterns like "abcd" or "1234"');
  }
  
  if (hasKeyboardPattern(passkey)) {
    hints.push('Avoid keyboard patterns like "qwerty"');
  }
  
  if (isCommonPassword(passkey)) {
    hints.push('This contains a commonly used password');
  }
  
  if (containsUserInfo(passkey, config.userName, config.email)) {
    hints.push('Avoid using your name or email in the passkey');
  }
  
  // Positive encouragement if strong
  if (hints.length === 0 && length >= config.recommendedLength && groupCount >= 3) {
    hints.push('Great passkey! 💪');
  }
  
  return hints;
}

// Main validation function
export function validatePasskey(
  passkey: string, 
  config: Partial<PasskeyConfig> = {}
): ValidationResult {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const length = passkey.length;
  
  // Empty passkey
  if (!passkey) {
    return {
      isValid: false,
      strength: 'weak',
      score: 0,
      hints: [],
      canSubmit: false,
    };
  }
  
  // Max length check
  if (length > fullConfig.maxLength) {
    return {
      isValid: false,
      strength: 'weak',
      score: 0,
      hints: [`Maximum ${fullConfig.maxLength} characters allowed`],
      canSubmit: false,
    };
  }
  
  const score = calculateScore(passkey, fullConfig);
  const strength = getStrengthLevel(score, length, fullConfig.minLength);
  const hints = generateHints(passkey, fullConfig);
  
  // Critical violations that block submission
  const hasCriticalViolation = 
    isCommonPassword(passkey) || 
    hasKeyboardPattern(passkey);
  
  // Can submit only if: length >= 12, strength is strong/very-strong, no critical violations
  const canSubmit = 
    length >= fullConfig.minLength &&
    (strength === 'strong' || strength === 'very-strong') &&
    !hasCriticalViolation;
  
  return {
    isValid: length >= fullConfig.minLength,
    strength,
    score,
    hints,
    canSubmit,
  };
}

// Get color for strength level (for UI)
export function getStrengthColor(strength: StrengthLevel): string {
  switch (strength) {
    case 'weak': return '#EF4444'; // red-500
    case 'fair': return '#F59E0B'; // amber-500
    case 'strong': return '#22C55E'; // green-500
    case 'very-strong': return '#10B981'; // emerald-500
    default: return '#9CA3AF'; // gray-400
  }
}

// Get label for strength level
export function getStrengthLabel(strength: StrengthLevel): string {
  switch (strength) {
    case 'weak': return 'Weak';
    case 'fair': return 'Fair';
    case 'strong': return 'Strong';
    case 'very-strong': return 'Very Strong';
    default: return '';
  }
}
