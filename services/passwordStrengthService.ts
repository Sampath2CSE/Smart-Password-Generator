// Powered by OnSpace.AI

export interface PasswordStrength {
  score: number; // 0-100
  level: 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong' | 'Very Strong';
  color: string;
  entropy: number;
  feedback: string[];
  timeToCrack: string;
}

export const calculatePasswordStrength = (password: string): PasswordStrength => {
  if (!password) {
    return {
      score: 0,
      level: 'Very Weak',
      color: '#ff4444',
      entropy: 0,
      feedback: ['Enter a password to analyze'],
      timeToCrack: 'Instant'
    };
  }

  const entropy = calculateEntropy(password);
  const score = calculateScore(password, entropy);
  const level = getStrengthLevel(score);
  const color = getStrengthColor(level);
  const feedback = generateFeedback(password, entropy, score);
  const timeToCrack = estimateTimeToCrack(entropy);

  return {
    score,
    level,
    color,
    entropy,
    feedback,
    timeToCrack
  };
};

const calculateEntropy = (password: string): number => {
  const charsetSize = getCharsetSize(password);
  const length = password.length;
  
  // Base entropy calculation: log2(charsetSize^length)
  const entropy = length * Math.log2(charsetSize);
  
  // Apply penalties for patterns and repetitions
  const patternPenalty = calculatePatternPenalty(password);
  const repetitionPenalty = calculateRepetitionPenalty(password);
  
  return Math.max(0, entropy - patternPenalty - repetitionPenalty);
};

const getCharsetSize = (password: string): number => {
  let size = 0;
  
  if (/[a-z]/.test(password)) size += 26; // lowercase
  if (/[A-Z]/.test(password)) size += 26; // uppercase
  if (/[0-9]/.test(password)) size += 10; // numbers
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) size += 32; // symbols
  
  return size || 1;
};

const calculatePatternPenalty = (password: string): number => {
  let penalty = 0;
  
  // Common patterns
  const patterns = [
    /(.)\1{2,}/g, // Repeated characters (aaa, 111)
    /012|123|234|345|456|567|678|789/g, // Sequential numbers
    /abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/gi, // Sequential letters
    /qwerty|asdf|zxcv|1234|password|admin|user/gi, // Common words/sequences
  ];
  
  patterns.forEach(pattern => {
    const matches = password.match(pattern);
    if (matches) {
      penalty += matches.length * 5; // 5 bits penalty per pattern
    }
  });
  
  return penalty;
};

const calculateRepetitionPenalty = (password: string): number => {
  const charCount = new Map<string, number>();
  
  for (const char of password) {
    charCount.set(char, (charCount.get(char) || 0) + 1);
  }
  
  let penalty = 0;
  charCount.forEach(count => {
    if (count > 1) {
      penalty += (count - 1) * 2; // 2 bits penalty per repeated character
    }
  });
  
  return penalty;
};

const calculateScore = (password: string, entropy: number): number => {
  let score = 0;
  
  // Base score from entropy
  score += Math.min(entropy * 2, 60);
  
  // Length bonus
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;
  
  // Character diversity bonus
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSymbols = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);
  
  const diversity = [hasLower, hasUpper, hasNumbers, hasSymbols].filter(Boolean).length;
  score += diversity * 5;
  
  // Penalties
  if (password.length < 8) score -= 20;
  if (!/[a-z]/.test(password) && !/[A-Z]/.test(password)) score -= 15;
  if (!/[0-9]/.test(password)) score -= 10;
  
  return Math.max(0, Math.min(100, score));
};

const getStrengthLevel = (score: number): PasswordStrength['level'] => {
  if (score < 20) return 'Very Weak';
  if (score < 40) return 'Weak';
  if (score < 60) return 'Fair';
  if (score < 80) return 'Good';
  if (score < 90) return 'Strong';
  return 'Very Strong';
};

const getStrengthColor = (level: PasswordStrength['level']): string => {
  const colors = {
    'Very Weak': '#ff4444',
    'Weak': '#ff8800',
    'Fair': '#ffaa00',
    'Good': '#88cc00',
    'Strong': '#00cc44',
    'Very Strong': '#00aa88'
  };
  return colors[level];
};

const generateFeedback = (password: string, entropy: number, score: number): string[] => {
  const feedback: string[] = [];
  
  if (password.length < 8) {
    feedback.push('Use at least 8 characters');
  }
  
  if (password.length < 12) {
    feedback.push('Consider using 12+ characters for better security');
  }
  
  if (!/[a-z]/.test(password)) {
    feedback.push('Add lowercase letters');
  }
  
  if (!/[A-Z]/.test(password)) {
    feedback.push('Add uppercase letters');
  }
  
  if (!/[0-9]/.test(password)) {
    feedback.push('Add numbers');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
    feedback.push('Add symbols for stronger security');
  }
  
  if (/(.)\1{2,}/.test(password)) {
    feedback.push('Avoid repeated characters');
  }
  
  if (/012|123|234|345|456|567|678|789/.test(password)) {
    feedback.push('Avoid sequential numbers');
  }
  
  if (/abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/gi.test(password)) {
    feedback.push('Avoid sequential letters');
  }
  
  if (entropy < 50) {
    feedback.push('Increase randomness and avoid predictable patterns');
  }
  
  if (feedback.length === 0) {
    feedback.push('Excellent password strength!');
  }
  
  return feedback;
};

const estimateTimeToCrack = (entropy: number): string => {
  // Assuming 1 billion guesses per second
  const guessesPerSecond = 1e9;
  const totalPossibilities = Math.pow(2, entropy);
  const avgGuesses = totalPossibilities / 2;
  const seconds = avgGuesses / guessesPerSecond;
  
  if (seconds < 1) return 'Instant';
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
  if (seconds < 31536000) return `${Math.round(seconds / 86400)} days`;
  if (seconds < 31536000000) return `${Math.round(seconds / 31536000)} years`;
  return 'Centuries';
};