
// Powered by OnSpace.AI

interface PasswordOptions {
  minLength: number;
  maxLength: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  avoidCommonWords: boolean;
  avoidPersonalInfo: boolean;
}

// For security, API functionality is disabled. Using local generation only.
// To enable AI features, add your OpenAI API key to environment variables.

export const generatePasswords = async (options: PasswordOptions): Promise<string[]> => {
  console.log('Generating passwords with options:', options);
  
  // Always use local generation for mobile compatibility
  try {
    const passwords = generateLocalPasswords(options, 5);
    console.log('Generated passwords successfully:', passwords.length);
    return passwords;
  } catch (error) {
    console.error('Error in password generation:', error);
    // Fallback with basic options
    return generateLocalPasswords(getDefaultOptions(), 5);
  }
};

/* AI Generation disabled for mobile compatibility
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY || ''}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a secure password generation assistant. Generate exactly 5 unique, secure passwords based on the user requirements. Return only the passwords, one per line, without any additional text or formatting.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 200,
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    const passwordsText = data.choices[0]?.message?.content?.trim();
    
    if (!passwordsText) {
      throw new Error('No passwords generated');
    }

    const passwords = passwordsText.split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 0)
      .slice(0, 5);

    if (passwords.length < 5) {
      // Fallback to local generation if OpenAI doesn't return enough passwords
      const fallbackPasswords = generateLocalPasswords(options, 5 - passwords.length);
      passwords.push(...fallbackPasswords);
    }

    return passwords;
  } catch (error) {
    console.error('Error generating passwords:', error);
    // Fallback to local generation
    return generateLocalPasswords(options, 5);
  }
*/

export const analyzePolicyAndGenerate = async (policyText: string): Promise<{
  analysis: string;
  extractedRules: PasswordOptions;
  passwords: string[];
}> => {
  console.log('Analyzing policy:', policyText.substring(0, 100) + '...');
  
  // Use local analysis for mobile compatibility
  try {
    const fallbackRules = extractBasicRules(policyText);
    const fallbackPasswords = generateLocalPasswords(fallbackRules, 5);
    
    console.log('Policy analysis completed locally');
    
    return {
      analysis: `Policy analyzed: Extracted ${fallbackRules.minLength}-${fallbackRules.maxLength} character requirements with ${Object.values(fallbackRules).filter(v => v === true).length} character type requirements.`,
      extractedRules: fallbackRules,
      passwords: fallbackPasswords
    };
  } catch (error) {
    console.error('Error in policy analysis:', error);
    const defaultRules = getDefaultOptions();
    return {
      analysis: 'Using default security settings due to analysis error',
      extractedRules: defaultRules,
      passwords: generateLocalPasswords(defaultRules, 5)
    };
  }
};

/* AI Analysis disabled for mobile compatibility
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY || ''}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a password policy analyzer. Analyze password policies and generate compliant passwords. Always return valid JSON.',
          },
          {
            role: 'user',
            content: analysisPrompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.choices[0]?.message?.content?.trim();
    
    if (!responseText) {
      throw new Error('No response from AI');
    }

    try {
      const parsedResponse = JSON.parse(responseText);
      
      return {
        analysis: parsedResponse.analysis || 'Policy analyzed successfully',
        extractedRules: parsedResponse.rules || getDefaultOptions(),
        passwords: parsedResponse.passwords || []
      };
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // Fallback to basic analysis
      const fallbackRules = extractBasicRules(policyText);
      const fallbackPasswords = generateLocalPasswords(fallbackRules, 5);
      
      return {
        analysis: 'Policy analyzed with basic extraction',
        extractedRules: fallbackRules,
        passwords: fallbackPasswords
      };
    }
  } catch (error) {
    console.error('Error analyzing policy:', error);
    // Fallback to basic analysis
    const fallbackRules = extractBasicRules(policyText);
    const fallbackPasswords = generateLocalPasswords(fallbackRules, 5);
    
    return {
      analysis: 'Policy analyzed with fallback method',
      extractedRules: fallbackRules,
      passwords: fallbackPasswords
    };
  }
*/

const extractBasicRules = (policyText: string): PasswordOptions => {
  const text = policyText.toLowerCase();
  
  // Extract length requirements
  const lengthMatch = text.match(/(\d+)(?:\s*(?:to|-)?\s*(\d+))?\s*characters?/);
  const minLength = lengthMatch ? parseInt(lengthMatch[1]) : 8;
  const maxLength = lengthMatch && lengthMatch[2] ? parseInt(lengthMatch[2]) : Math.max(minLength + 8, 16);
  
  return {
    minLength,
    maxLength,
    includeUppercase: /uppercase|capital/i.test(text),
    includeLowercase: /lowercase|small/i.test(text),
    includeNumbers: /number|digit|numeric/i.test(text),
    includeSymbols: /symbol|special|character|punctuation/i.test(text),
    avoidCommonWords: true,
    avoidPersonalInfo: true
  };
};

const getDefaultOptions = (): PasswordOptions => ({
  minLength: 12,
  maxLength: 16,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: true,
  avoidCommonWords: true,
  avoidPersonalInfo: true
});

const createPasswordPrompt = (options: PasswordOptions): string => {
  let prompt = `Generate 5 secure passwords with the following requirements:

- Length: between ${options.minLength} and ${options.maxLength} characters
- Include uppercase letters: ${options.includeUppercase ? 'Yes' : 'No'}
- Include lowercase letters: ${options.includeLowercase ? 'Yes' : 'No'}
- Include numbers: ${options.includeNumbers ? 'Yes' : 'No'}
- Include symbols: ${options.includeSymbols ? 'Yes' : 'No'}
- Avoid common words: ${options.avoidCommonWords ? 'Yes' : 'No'}
- Avoid personal info: ${options.avoidPersonalInfo ? 'Yes' : 'No'}

Make sure all passwords are:
- Randomly generated
- Secure and unpredictable
- User-friendly (avoid confusing characters like l and 1, or O and 0)
- Unique from each other

Return exactly 5 passwords, one per line.`;

  return prompt;
};

const generateLocalPasswords = (options: PasswordOptions, count: number): string[] => {
  const passwords: string[] = [];
  
  for (let i = 0; i < count; i++) {
    passwords.push(generateSinglePassword(options));
  }
  
  return passwords;
};

const generateSinglePassword = (options: PasswordOptions): string => {
  try {
    let charset = '';
    
    if (options.includeUppercase) charset += 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    if (options.includeLowercase) charset += 'abcdefghjkmnpqrstuvwxyz';
    if (options.includeNumbers) charset += '23456789';
    if (options.includeSymbols) charset += '@#$%&*+=-';
    
    // Ensure we have at least some charset
    if (!charset) charset = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    
    // Ensure valid length range
    const minLen = Math.max(4, options.minLength || 8);
    const maxLen = Math.max(minLen, options.maxLength || 16);
    const length = Math.floor(Math.random() * (maxLen - minLen + 1)) + minLen;
    
    let password = '';
    
    // Generate password with required character types
    const requiredChars = [];
    if (options.includeUppercase && charset.includes('A')) requiredChars.push('ABCDEFGHJKLMNPQRSTUVWXYZ');
    if (options.includeLowercase && charset.includes('a')) requiredChars.push('abcdefghjkmnpqrstuvwxyz');
    if (options.includeNumbers && charset.includes('2')) requiredChars.push('23456789');
    if (options.includeSymbols && charset.includes('@')) requiredChars.push('@#$%&*+=-');
    
    // Add at least one character from each required type
    requiredChars.forEach(chars => {
      if (password.length < length) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    });
    
    // Fill remaining length with random characters from full charset
    while (password.length < length) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    // Shuffle the password to avoid predictable patterns
    return password.split('').sort(() => Math.random() - 0.5).join('');
    
  } catch (error) {
    console.error('Error generating single password:', error);
    // Ultimate fallback
    return 'SecurePass123!';
  }
};
