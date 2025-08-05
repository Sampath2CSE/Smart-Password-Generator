
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { generatePasswords, analyzePolicyAndGenerate } from '../services/passwordService';
import { calculatePasswordStrength, PasswordStrength } from '../services/passwordStrengthService';
import { 
  generatePasswordFromPattern, 
  validatePattern, 
  PRESET_PATTERNS, 
  PATTERN_RULES 
} from '../services/passwordPatternService';

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

type GenerationMode = 'standard' | 'pattern' | 'policy' | 'analyzer';

const { width } = Dimensions.get('window');

export default function PasswordGenerator() {
  console.log('Advanced PasswordGenerator starting...');
  
  const [mode, setMode] = useState<GenerationMode>('standard');
  const [loading, setLoading] = useState(false);
  
  // Standard generation
  const [options, setOptions] = useState<PasswordOptions>({
    minLength: 12,
    maxLength: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    avoidCommonWords: true,
    avoidPersonalInfo: true,
  });
  
  // Pattern generation
  const [customPattern, setCustomPattern] = useState('Aa1@Aa1@');
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [patternPasswords, setPatternPasswords] = useState<string[]>([]);
  
  // Policy analysis
  const [policyText, setPolicyText] = useState('');
  const [policyAnalysis, setPolicyAnalysis] = useState<{
    analysis: string;
    extractedRules: PasswordOptions;
    passwords: string[];
  } | null>(null);
  
  // Password analyzer
  const [testPassword, setTestPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);
  
  // Generated passwords
  const [passwords, setPasswords] = useState<string[]>([]);
  
  // Pattern validation modal
  const [showPatternHelp, setShowPatternHelp] = useState(false);

  // Real-time password strength analysis
  useEffect(() => {
    if (testPassword) {
      const strength = calculatePasswordStrength(testPassword);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(null);
    }
  }, [testPassword]);

  const handleGenerateStandard = async () => {
    console.log('Generating standard passwords...');
    setLoading(true);
    try {
      const newPasswords = await generatePasswords(options);
      setPasswords(newPasswords);
      console.log('Standard passwords generated successfully');
    } catch (error) {
      console.error('Error generating standard passwords:', error);
      showAlert('Error', 'Failed to generate passwords');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFromPattern = () => {
    console.log('Generating from pattern:', customPattern);
    const validation = validatePattern(customPattern);
    
    if (!validation.isValid) {
      showAlert('Invalid Pattern', validation.errors.join('\n'));
      return;
    }
    
    try {
      const newPasswords = [];
      for (let i = 0; i < 5; i++) {
        newPasswords.push(generatePasswordFromPattern(customPattern));
      }
      setPatternPasswords(newPasswords);
      console.log('Pattern passwords generated successfully');
    } catch (error) {
      console.error('Error generating pattern passwords:', error);
      showAlert('Error', 'Failed to generate pattern passwords');
    }
  };

  const handleAnalyzePolicy = async () => {
    if (!policyText.trim()) {
      showAlert('Error', 'Please enter a password policy to analyze');
      return;
    }
    
    console.log('Analyzing policy...');
    setLoading(true);
    try {
      const result = await analyzePolicyAndGenerate(policyText);
      setPolicyAnalysis(result);
      console.log('Policy analysis completed');
    } catch (error) {
      console.error('Error analyzing policy:', error);
      showAlert('Error', 'Failed to analyze policy');
    } finally {
      setLoading(false);
    }
  };

  const copyPassword = async (password: string) => {
    try {
      await Clipboard.setStringAsync(password);
      showAlert('Success', 'Password copied to clipboard!');
    } catch (error) {
      console.error('Error copying password:', error);
      showAlert('Error', 'Failed to copy password');
    }
  };

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const ToggleSwitch = ({ label, value, onToggle }: { 
    label: string; 
    value: boolean; 
    onToggle: () => void 
  }) => (
    <TouchableOpacity style={styles.toggleContainer} onPress={onToggle}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <View style={[styles.switch, value && styles.switchActive]}>
        <View style={[styles.switchThumb, value && styles.switchThumbActive]} />
      </View>
    </TouchableOpacity>
  );

  const ModeSelector = () => (
    <View style={styles.modeSelector}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity 
          style={[styles.modeButton, mode === 'standard' && styles.modeButtonActive]}
          onPress={() => setMode('standard')}
        >
          <MaterialIcons name="tune" size={20} color={mode === 'standard' ? '#fff' : '#2196F3'} />
          <Text style={[styles.modeButtonText, mode === 'standard' && styles.modeButtonTextActive]}>
            Standard
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.modeButton, mode === 'pattern' && styles.modeButtonActive]}
          onPress={() => setMode('pattern')}
        >
          <MaterialIcons name="pattern" size={20} color={mode === 'pattern' ? '#fff' : '#2196F3'} />
          <Text style={[styles.modeButtonText, mode === 'pattern' && styles.modeButtonTextActive]}>
            Pattern
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.modeButton, mode === 'policy' && styles.modeButtonActive]}
          onPress={() => setMode('policy')}
        >
          <MaterialIcons name="policy" size={20} color={mode === 'policy' ? '#fff' : '#2196F3'} />
          <Text style={[styles.modeButtonText, mode === 'policy' && styles.modeButtonTextActive]}>
            Policy
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.modeButton, mode === 'analyzer' && styles.modeButtonActive]}
          onPress={() => setMode('analyzer')}
        >
          <MaterialIcons name="analytics" size={20} color={mode === 'analyzer' ? '#fff' : '#2196F3'} />
          <Text style={[styles.modeButtonText, mode === 'analyzer' && styles.modeButtonTextActive]}>
            Analyzer
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const StrengthMeter = ({ strength }: { strength: PasswordStrength }) => (
    <View style={styles.strengthContainer}>
      <View style={styles.strengthHeader}>
        <Text style={styles.strengthTitle}>Password Strength</Text>
        <Text style={[styles.strengthLevel, { color: strength.color }]}>
          {strength.level}
        </Text>
      </View>
      
      <View style={styles.strengthBar}>
        <View 
          style={[
            styles.strengthFill, 
            { 
              width: `${strength.score}%`,
              backgroundColor: strength.color 
            }
          ]} 
        />
      </View>
      
      <View style={styles.strengthStats}>
        <View style={styles.strengthStat}>
          <Text style={styles.strengthStatLabel}>Score</Text>
          <Text style={styles.strengthStatValue}>{strength.score}/100</Text>
        </View>
        <View style={styles.strengthStat}>
          <Text style={styles.strengthStatLabel}>Entropy</Text>
          <Text style={styles.strengthStatValue}>{Math.round(strength.entropy)} bits</Text>
        </View>
        <View style={styles.strengthStat}>
          <Text style={styles.strengthStatLabel}>Crack Time</Text>
          <Text style={styles.strengthStatValue}>{strength.timeToCrack}</Text>
        </View>
      </View>
      
      <View style={styles.feedbackContainer}>
        <Text style={styles.feedbackTitle}>Recommendations:</Text>
        {strength.feedback.map((item, index) => (
          <Text key={index} style={styles.feedbackItem}>• {item}</Text>
        ))}
      </View>
    </View>
  );

  const renderStandardMode = () => (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Password Length</Text>
        <View style={styles.lengthRow}>
          <View style={styles.lengthContainer}>
            <Text style={styles.lengthLabel}>Min:</Text>
            <TouchableOpacity 
              style={styles.lengthButton}
              onPress={() => setOptions(prev => ({ 
                ...prev, 
                minLength: Math.max(4, prev.minLength - 1) 
              }))}
            >
              <Text style={styles.lengthButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.lengthText}>{options.minLength}</Text>
            <TouchableOpacity 
              style={styles.lengthButton}
              onPress={() => setOptions(prev => ({ 
                ...prev, 
                minLength: Math.min(prev.maxLength, prev.minLength + 1) 
              }))}
            >
              <Text style={styles.lengthButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.lengthContainer}>
            <Text style={styles.lengthLabel}>Max:</Text>
            <TouchableOpacity 
              style={styles.lengthButton}
              onPress={() => setOptions(prev => ({ 
                ...prev, 
                maxLength: Math.max(prev.minLength, prev.maxLength - 1) 
              }))}
            >
              <Text style={styles.lengthButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.lengthText}>{options.maxLength}</Text>
            <TouchableOpacity 
              style={styles.lengthButton}
              onPress={() => setOptions(prev => ({ 
                ...prev, 
                maxLength: Math.min(50, prev.maxLength + 1) 
              }))}
            >
              <Text style={styles.lengthButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Character Types</Text>
        <ToggleSwitch
          label="Uppercase Letters (A-Z)"
          value={options.includeUppercase}
          onToggle={() => setOptions(prev => ({ ...prev, includeUppercase: !prev.includeUppercase }))}
        />
        <ToggleSwitch
          label="Lowercase Letters (a-z)"
          value={options.includeLowercase}
          onToggle={() => setOptions(prev => ({ ...prev, includeLowercase: !prev.includeLowercase }))}
        />
        <ToggleSwitch
          label="Numbers (0-9)"
          value={options.includeNumbers}
          onToggle={() => setOptions(prev => ({ ...prev, includeNumbers: !prev.includeNumbers }))}
        />
        <ToggleSwitch
          label="Symbols (!@#$...)"
          value={options.includeSymbols}
          onToggle={() => setOptions(prev => ({ ...prev, includeSymbols: !prev.includeSymbols }))}
        />
        <ToggleSwitch
          label="Avoid Common Words"
          value={options.avoidCommonWords}
          onToggle={() => setOptions(prev => ({ ...prev, avoidCommonWords: !prev.avoidCommonWords }))}
        />
        <ToggleSwitch
          label="Avoid Personal Info"
          value={options.avoidPersonalInfo}
          onToggle={() => setOptions(prev => ({ ...prev, avoidPersonalInfo: !prev.avoidPersonalInfo }))}
        />
      </View>
      
      <TouchableOpacity 
        style={[styles.generateButton, loading && styles.generateButtonDisabled]} 
        onPress={handleGenerateStandard}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <MaterialIcons name="refresh" size={20} color="#fff" />
        )}
        <Text style={styles.generateButtonText}>
          {loading ? 'Generating...' : 'Generate Passwords'}
        </Text>
      </TouchableOpacity>
      
      {passwords.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Generated Passwords</Text>
          {passwords.map((password, index) => (
            <TouchableOpacity
              key={index}
              style={styles.passwordContainer}
              onPress={() => copyPassword(password)}
            >
              <Text style={styles.passwordText}>{password}</Text>
              <MaterialIcons name="content-copy" size={16} color="#2196F3" />
            </TouchableOpacity>
          ))}
          <Text style={styles.tapToCopyText}>Tap any password to copy</Text>
        </View>
      )}
    </>
  );

  const renderPatternMode = () => (
    <>
      <View style={styles.section}>
        <View style={styles.patternHeader}>
          <Text style={styles.sectionTitle}>Custom Pattern</Text>
          <TouchableOpacity onPress={() => setShowPatternHelp(true)}>
            <MaterialIcons name="help-outline" size={20} color="#2196F3" />
          </TouchableOpacity>
        </View>
        
        <TextInput
          style={styles.patternInput}
          value={customPattern}
          onChangeText={setCustomPattern}
          placeholder="e.g. Aa1@Aa1@"
          placeholderTextColor="#999"
        />
        
        <TouchableOpacity style={styles.generateButton} onPress={handleGenerateFromPattern}>
          <MaterialIcons name="auto-fix-high" size={20} color="#fff" />
          <Text style={styles.generateButtonText}>Generate from Pattern</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preset Patterns</Text>
        {PRESET_PATTERNS.map((preset, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.presetContainer, selectedPreset === index && styles.presetSelected]}
            onPress={() => {
              setSelectedPreset(index);
              setCustomPattern(preset.pattern);
            }}
          >
            <View style={styles.presetInfo}>
              <Text style={styles.presetName}>{preset.name}</Text>
              <Text style={styles.presetDescription}>{preset.description}</Text>
            </View>
            <Text style={styles.presetPattern}>{preset.pattern}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {patternPasswords.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pattern Passwords</Text>
          {patternPasswords.map((password, index) => (
            <TouchableOpacity
              key={index}
              style={styles.passwordContainer}
              onPress={() => copyPassword(password)}
            >
              <Text style={styles.passwordText}>{password}</Text>
              <MaterialIcons name="content-copy" size={16} color="#2196F3" />
            </TouchableOpacity>
          ))}
          <Text style={styles.tapToCopyText}>Tap any password to copy</Text>
        </View>
      )}
    </>
  );

  const renderPolicyMode = () => (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Password Policy</Text>
        <Text style={styles.policyDescription}>
          Paste a website's password policy and get compliant passwords generated automatically.
        </Text>
        
        <TextInput
          style={styles.policyInput}
          value={policyText}
          onChangeText={setPolicyText}
          placeholder="Paste password requirements here..."
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        
        <TouchableOpacity 
          style={[styles.generateButton, loading && styles.generateButtonDisabled]} 
          onPress={handleAnalyzePolicy}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <MaterialIcons name="smart-toy" size={20} color="#fff" />
          )}
          <Text style={styles.generateButtonText}>
            {loading ? 'Analyzing...' : 'Analyze Policy & Generate'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {policyAnalysis && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Policy Analysis</Text>
            <Text style={styles.analysisText}>{policyAnalysis.analysis}</Text>
            
            <View style={styles.extractedRules}>
              <Text style={styles.rulesTitle}>Extracted Requirements:</Text>
              <Text style={styles.ruleItem}>• Length: {policyAnalysis.extractedRules.minLength}-{policyAnalysis.extractedRules.maxLength} characters</Text>
              {policyAnalysis.extractedRules.includeUppercase && <Text style={styles.ruleItem}>• Uppercase letters required</Text>}
              {policyAnalysis.extractedRules.includeLowercase && <Text style={styles.ruleItem}>• Lowercase letters required</Text>}
              {policyAnalysis.extractedRules.includeNumbers && <Text style={styles.ruleItem}>• Numbers required</Text>}
              {policyAnalysis.extractedRules.includeSymbols && <Text style={styles.ruleItem}>• Special characters required</Text>}
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Compliant Passwords</Text>
            {policyAnalysis.passwords.map((password, index) => (
              <TouchableOpacity
                key={index}
                style={styles.passwordContainer}
                onPress={() => copyPassword(password)}
              >
                <Text style={styles.passwordText}>{password}</Text>
                <MaterialIcons name="content-copy" size={16} color="#2196F3" />
              </TouchableOpacity>
            ))}
            <Text style={styles.tapToCopyText}>Tap any password to copy</Text>
          </View>
        </>
      )}
    </>
  );

  const renderAnalyzerMode = () => (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Password Analyzer</Text>
        <Text style={styles.analyzerDescription}>
          Enter a password to analyze its strength, entropy, and security level.
        </Text>
        
        <TextInput
          style={styles.passwordInput}
          value={testPassword}
          onChangeText={setTestPassword}
          placeholder="Enter password to analyze..."
          placeholderTextColor="#999"
          secureTextEntry={false}
        />
        
        <TouchableOpacity 
          style={styles.toggleSecureButton}
          onPress={() => {
            // Toggle visibility would be implemented here
          }}
        >
          <MaterialIcons name="visibility" size={16} color="#2196F3" />
          <Text style={styles.toggleSecureText}>Show/Hide Password</Text>
        </TouchableOpacity>
      </View>
      
      {passwordStrength && (
        <StrengthMeter strength={passwordStrength} />
      )}
      
      {!testPassword && (
        <View style={styles.section}>
          <Text style={styles.placeholderTitle}>How it works:</Text>
          <Text style={styles.placeholderText}>• Real-time strength analysis</Text>
          <Text style={styles.placeholderText}>• Entropy calculation (randomness measurement)</Text>
          <Text style={styles.placeholderText}>• Time-to-crack estimation</Text>
          <Text style={styles.placeholderText}>• Security recommendations</Text>
        </View>
      )}
    </>
  );

  console.log('Rendering Advanced PasswordGenerator...');
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="security" size={32} color="#2196F3" />
        <Text style={styles.title}>Advanced Password Generator</Text>
        <Text style={styles.subtitle}>Professional password security suite</Text>
      </View>
      
      <ModeSelector />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {mode === 'standard' && renderStandardMode()}
        {mode === 'pattern' && renderPatternMode()}
        {mode === 'policy' && renderPolicyMode()}
        {mode === 'analyzer' && renderAnalyzerMode()}
      </ScrollView>
      
      <Modal
        visible={showPatternHelp}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPatternHelp(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pattern Symbols</Text>
              <TouchableOpacity onPress={() => setShowPatternHelp(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              {PATTERN_RULES.map((rule, index) => (
                <View key={index} style={styles.ruleRow}>
                  <Text style={styles.ruleSymbol}>{rule.pattern}</Text>
                  <View style={styles.ruleInfo}>
                    <Text style={styles.ruleName}>{rule.name}</Text>
                    <Text style={styles.ruleDescription}>{rule.description}</Text>
                    <Text style={styles.ruleExample}>Example: {rule.example}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  modeSelector: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  modeButtonActive: {
    backgroundColor: '#2196F3',
  },
  modeButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  lengthRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  lengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lengthLabel: {
    fontSize: 16,
    color: '#666',
    marginRight: 10,
  },
  lengthButton: {
    backgroundColor: '#2196F3',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  lengthButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  lengthText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    minWidth: 30,
    textAlign: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  toggleLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  switch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    padding: 2,
  },
  switchActive: {
    backgroundColor: '#2196F3',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  switchThumbActive: {
    transform: [{ translateX: 22 }],
  },
  generateButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  generateButtonDisabled: {
    backgroundColor: '#ccc',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  passwordText: {
    flex: 1,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#333',
    marginRight: 10,
  },
  tapToCopyText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  
  // Pattern Mode Styles
  patternHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  patternInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    backgroundColor: '#f8f9fa',
    marginBottom: 15,
  },
  presetContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    marginBottom: 8,
  },
  presetSelected: {
    borderColor: '#2196F3',
    backgroundColor: '#e3f2fd',
  },
  presetInfo: {
    flex: 1,
  },
  presetName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  presetDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  presetPattern: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#2196F3',
    fontWeight: '600',
  },
  
  // Policy Mode Styles
  policyDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  policyInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#f8f9fa',
    marginBottom: 15,
    height: 100,
  },
  analysisText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 15,
  },
  extractedRules: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  rulesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  ruleItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  
  // Analyzer Mode Styles
  analyzerDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    backgroundColor: '#f8f9fa',
    marginBottom: 10,
  },
  toggleSecureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  toggleSecureText: {
    fontSize: 14,
    color: '#2196F3',
    marginLeft: 4,
  },
  strengthContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  strengthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  strengthLevel: {
    fontSize: 16,
    fontWeight: '600',
    // color property is set dynamically based on strength.color
  },
  strengthBar: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    marginBottom: 20,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 4,
    // width and backgroundColor are set dynamically based on strength.score and strength.color
  },
  strengthStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  strengthStat: {
    alignItems: 'center',
  },
  strengthStatLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  strengthStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  feedbackContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  feedbackTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  feedbackItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  placeholderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  placeholderText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: width - 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  ruleSymbol: {
    fontSize: 24,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    color: '#2196F3',
    width: 40,
    textAlign: 'center',
  },
  ruleInfo: {
    flex: 1,
    marginLeft: 15,
  },
  ruleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  ruleDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  ruleExample: {
    fontSize: 12,
    color: '#2196F3',
    marginTop: 2,
    fontStyle: 'italic',
  },
});
