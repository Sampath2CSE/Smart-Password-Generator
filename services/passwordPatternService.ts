// Powered by OnSpace.AI

export interface PatternRule {
  id: string;
  name: string;
  pattern: string;
  description: string;
  example: string;
}

export const PATTERN_RULES: PatternRule[] = [
  {
    id: 'uppercase',
    name: 'Uppercase Letter',
    pattern: 'A',
    description: 'A random uppercase letter (A-Z)',
    example: 'M'
  },
  {
    id: 'lowercase',
    name: 'Lowercase Letter',
    pattern: 'a',
    description: 'A random lowercase letter (a-z)',
    example: 'k'
  },
  {
    id: 'number',
    name: 'Number',
    pattern: '1',
    description: 'A random number (0-9)',
    example: '7'
  },
  {
    id: 'symbol',
    name: 'Symbol',
    pattern: '@',
    description: 'A random symbol (!@#$%^&*)',
    example: '#'
  },
  {
    id: 'alphanumeric',
    name: 'Alphanumeric',
    pattern: 'X',
    description: 'A random letter or number',
    example: 'F'
  },
  {
    id: 'consonant',
    name: 'Consonant',
    pattern: 'C',
    description: 'A random consonant',
    example: 'B'
  },
  {
    id: 'vowel',
    name: 'Vowel',
    pattern: 'V',
    description: 'A random vowel',
    example: 'E'
  }
];

export const PRESET_PATTERNS = [
  {
    name: 'Basic Strong',
    pattern: 'Aa1@Aa1@',
    description: 'Uppercase, lowercase, number, symbol pattern'
  },
  {
    name: 'Memorable',
    pattern: 'CvcCvc11',
    description: 'Consonant-vowel-consonant pattern with numbers'
  },
  {
    name: 'Corporate',
    pattern: 'Aa1@Aa1@Aa1@',
    description: 'Extended pattern for corporate policies'
  },
  {
    name: 'Secure Plus',
    pattern: 'A1@a1@A1@a',
    description: 'Alternating case with symbols and numbers'
  },
  {
    name: 'Pronounceable',
    pattern: 'CvcCvc@1',
    description: 'Pronounceable with security suffix'
  }
];

export const generatePasswordFromPattern = (pattern: string): string => {
  const charSets = {
    A: 'ABCDEFGHJKLMNPQRSTUVWXYZ', // Uppercase, avoiding confusing chars
    a: 'abcdefghjkmnpqrstuvwxyz',  // Lowercase, avoiding confusing chars
    '1': '23456789',               // Numbers, avoiding 0 and 1
    '@': '!@#$%^&*+-=',           // Symbols
    X: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghjkmnpqrstuvwxyz', // Alphanumeric
    C: 'BCDFGHJKLMNPQRSTVWXYZ',   // Consonants (uppercase)
    c: 'bcdfghjklmnpqrstvwxyz',   // Consonants (lowercase)
    V: 'AEIOU',                   // Vowels (uppercase)
    v: 'aeiou'                    // Vowels (lowercase)
  };

  let result = '';
  
  for (const char of pattern) {
    const charSet = charSets[char as keyof typeof charSets];
    if (charSet) {
      result += charSet.charAt(Math.floor(Math.random() * charSet.length));
    } else {
      result += char; // Keep literal characters
    }
  }
  
  return result;
};

export const validatePattern = (pattern: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!pattern.trim()) {
    errors.push('Pattern cannot be empty');
  }
  
  if (pattern.length < 4) {
    errors.push('Pattern should be at least 4 characters long');
  }
  
  if (pattern.length > 32) {
    errors.push('Pattern should not exceed 32 characters');
  }
  
  // Check for valid pattern characters
  const validChars = ['A', 'a', '1', '@', 'X', 'C', 'c', 'V', 'v'];
  const invalidChars = pattern.split('').filter(char => 
    !validChars.includes(char) && 
    !/[^A-Za-z0-9@!#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(char)
  );
  
  if (invalidChars.length > 0) {
    errors.push(`Invalid pattern characters: ${invalidChars.join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const getPatternComplexity = (pattern: string): {
  score: number;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumbers: boolean;
  hasSymbols: boolean;
  length: number;
} => {
  const hasUppercase = /[A|C|V]/.test(pattern);
  const hasLowercase = /[a|c|v]/.test(pattern);
  const hasNumbers = /[1]/.test(pattern);
  const hasSymbols = /[@]/.test(pattern);
  const length = pattern.length;
  
  let score = 0;
  score += length * 2; // Base score from length
  if (hasUppercase) score += 10;
  if (hasLowercase) score += 10;
  if (hasNumbers) score += 10;
  if (hasSymbols) score += 20;
  
  return {
    score: Math.min(100, score),
    hasUppercase,
    hasLowercase,
    hasNumbers,
    hasSymbols,
    length
  };
};