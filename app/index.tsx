// Powered by OnSpace.AI
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';import { generatePasswords, analyzePolicyAndGenerate } from '../services/passwordService';
import { calculatePasswordStrength, PasswordStrength } from '../services/passwordStrengthService';
import { 
  generatePasswordFromPattern, 
  validatePattern, 
  getPatternComplexity, 
  PATTERN_RULES, 
  PRESET_PATTERNS, 
  PatternRule 
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

interface GeneratedPassword {
  value: string;
  strength: PasswordStrength;
}

export default function PasswordGenerator() {
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
  const [passwords, setPasswords] = useState<GeneratedPassword[]>([]);
  const [loading, setLoading] = useState(false);
  const [usePattern, setUsePattern] = useState(false);
  const [customPattern, setCustomPattern] = useState('Aa1@Aa1@');
  const [patternModalVisible, setPatternModalVisible] = useState(false);
  const [selectedPassword, setSelectedPassword] = useState<string>('');
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);
  const [policyText, setPolicyText] = useState('');
  const [policyAnalysis, setPolicyAnalysis] = useState('');
  const [policyModalVisible, setPolicyModalVisible] = useState(false);
  const [policyLoading, setPolicyLoading] = useState(false);
  const [generationMethod, setGenerationMethod] = useState<'manual' | 'pattern' | 'policy'>('manual');  const handleGeneratePasswords = async () => {
    if (generationMethod === 'pattern') {
      handleGeneratePatternPasswords();
      return;
    }

    if (generationMethod === 'policy') {
      handlePolicyGeneration();
      return;
    }

    setLoading(true);
    try {
      const generatedPasswords = await generatePasswords(options);
      const passwordsWithStrength = generatedPasswords.map(password => ({
        value: password,
        strength: calculatePasswordStrength(password)
      }));
      setPasswords(passwordsWithStrength);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate passwords. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePolicyGeneration = async () => {
    if (!policyText.trim()) {
      Alert.alert('Error', 'Please enter a password policy to analyze');
      return;
    }

    setPolicyLoading(true);
    try {
      const result = await analyzePolicyAndGenerate(policyText);
      setPolicyAnalysis(result.analysis);
      setOptions(result.extractedRules);
      
      const passwordsWithStrength = result.passwords.map(password => ({
        value: password,
        strength: calculatePasswordStrength(password)
      }));
      setPasswords(passwordsWithStrength);
    } catch (error) {
      Alert.alert('Error', 'Failed to analyze policy and generate passwords. Please try again.');
    } finally {
      setPolicyLoading(false);
    }
  };

  const handleGeneratePatternPasswords = () => {
    const patternValidation = validatePattern(customPattern);
    
    if (!patternValidation.isValid) {
      Alert.alert('Invalid Pattern', patternValidation.errors.join('\n'));
      return;
    }

    setLoading(true);
    
    setTimeout(() => {
      const generatedPasswords = Array.from({ length: 5 }, () => 
        generatePasswordFromPattern(customPattern)
      );
      
      const passwordsWithStrength = generatedPasswords.map(password => ({
        value: password,
        strength: calculatePasswordStrength(password)
      }));
      
      setPasswords(passwordsWithStrength);
      setLoading(false);
    }, 500);
  };

  const handlePasswordChange = (password: string) => {
    setSelectedPassword(password);
    setPasswordStrength(calculatePasswordStrength(password));
  };

  const selectPresetPattern = (pattern: string) => {
    setCustomPattern(pattern);
    setPatternModalVisible(false);
  };

  useEffect(() => {
    if (selectedPassword) {
      setPasswordStrength(calculatePasswordStrength(selectedPassword));
    }
  }, [selectedPassword]);
  const copyToClipboard = async (password: string) => {
    await Clipboard.setStringAsync(password);
    Alert.alert('Success', 'Password copied to clipboard!');
  };

  const StrengthMeter = ({ strength }: { strength: PasswordStrength }) => (
    <View style={styles.strengthMeter}>
      <View style={styles.strengthHeader}>
        <Text style={[styles.strengthLevel, { color: strength.color }]}>
          {strength.level}
        </Text>
        <Text style={styles.strengthScore}>{strength.score}/100</Text>
      </View>
      <View style={styles.strengthBarContainer}>
        <View 
          style={[
            styles.strengthBar, 
            { width: `${strength.score}%`, backgroundColor: strength.color }
          ]} 
        />
      </View>
      <View style={styles.entropyContainer}>
        <Text style={styles.entropyText}>
          Entropy: {strength.entropy.toFixed(1)} bits
        </Text>
        <Text style={styles.crackTime}>
          Time to crack: {strength.timeToCrack}
        </Text>
      </View>
      {strength.feedback.length > 0 && (
        <View style={styles.feedbackContainer}>
          {strength.feedback.map((feedback, index) => (
            <Text key={index} style={styles.feedbackText}>
              • {feedback}
            </Text>
          ))}
        </View>
      )}
    </View>
  );

  const PatternHelper = () => (
    <View style={styles.patternHelper}>
      <Text style={styles.patternHelperTitle}>Pattern Rules:</Text>
      <FlatList
        data={PATTERN_RULES}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.patternRule}
            onPress={() => setCustomPattern(prev => prev + item.pattern)}
          >
            <Text style={styles.patternRulePattern}>{item.pattern}</Text>
            <Text style={styles.patternRuleName}>{item.name}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={item => item.id}
      />
    </View>
  );

  const toggleOption = (key: keyof PasswordOptions) => {
    setOptions(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const updateLength = (type: 'min' | 'max', value: string) => {
    const numValue = parseInt(value) || 0;
    setOptions(prev => ({
      ...prev,
      [type === 'min' ? 'minLength' : 'maxLength']: numValue,
    }));
  };

  const ToggleSwitch = ({ label, value, onToggle }: { label: string; value: boolean; onToggle: () => void }) => (
    <TouchableOpacity style={styles.toggleContainer} onPress={onToggle}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <View style={[styles.switch, value && styles.switchActive]}>
        <View style={[styles.switchThumb, value && styles.switchThumbActive]} />
      </View>
    </TouchableOpacity>
  );

  const backgroundTouchable = Platform.OS !== 'web' ? (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={StyleSheet.absoluteFillObject} />
    </TouchableWithoutFeedback>
  ) : null;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        {backgroundTouchable}
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <MaterialIcons name="security" size={32} color="#2196F3" />
            <Text style={styles.title}>Smart Password Generator</Text>
            <Text style={styles.subtitle}>Generate secure passwords with AI assistance</Text>
          </View>          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Generation Method</Text>
            <TouchableOpacity
              style={styles.methodToggle}
              onPress={() => setGenerationMethod('manual')}
            >
              <MaterialIcons
                name={generationMethod === 'manual' ? 'radio-button-checked' : 'radio-button-unchecked'}
                size={20}
                color="#2196F3"
              />
              <Text style={styles.methodText}>Manual Configuration</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.methodToggle}
              onPress={() => setGenerationMethod('pattern')}
            >
              <MaterialIcons
                name={generationMethod === 'pattern' ? 'radio-button-checked' : 'radio-button-unchecked'}
                size={20}
                color="#2196F3"
              />
              <Text style={styles.methodText}>Custom Pattern</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.methodToggle}
              onPress={() => setGenerationMethod('policy')}
            >
              <MaterialIcons
                name={generationMethod === 'policy' ? 'radio-button-checked' : 'radio-button-unchecked'}
                size={20}
                color="#2196F3"
              />
              <Text style={styles.methodText}>Policy Analyzer</Text>
            </TouchableOpacity>
          </View>
          {generationMethod === 'pattern' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Custom Pattern</Text>
              <View style={styles.patternInputContainer}>
                <TextInput
                  style={styles.patternInput}
                  placeholder="Enter pattern (e.g., Aa1@Aa1@)"
                  value={customPattern}
                  onChangeText={setCustomPattern}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.presetButton}
                  onPress={() => setPatternModalVisible(true)}
                >
                  <MaterialIcons name="library-books" size={20} color="#2196F3" />
                </TouchableOpacity>
              </View>
              <PatternHelper />
            </View>
          )}

          {generationMethod === 'policy' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Password Policy Analyzer</Text>
              <Text style={styles.policyDescription}>
                Paste any website's password policy text, and AI will analyze it to generate compliant passwords.
              </Text>
              <View style={styles.policyInputContainer}>
                <TextInput
                  style={styles.policyInput}
                  placeholder="Paste password policy here (e.g., 'Password must be 8-16 characters, include uppercase, lowercase, numbers, and symbols')"
                  value={policyText}
                  onChangeText={setPolicyText}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  autoCapitalize="sentences"
                  autoCorrect={false}
                />
              </View>
              {policyAnalysis && (
                <View style={styles.analysisResult}>
                  <Text style={styles.analysisTitle}>Policy Analysis:</Text>
                  <Text style={styles.analysisText}>{policyAnalysis}</Text>
                </View>
              )}
            </View>
          )}

          {generationMethod === 'manual' && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Password Length</Text>
                <View style={styles.lengthContainer}>
                  <View style={styles.lengthInput}>
                    <Text style={styles.lengthLabel}>Min Length</Text>
                    <TextInput
                      style={styles.lengthTextInput}
                      value={options.minLength.toString()}
                      onChangeText={(value) => updateLength('min', value)}
                      keyboardType="numeric"
                      maxLength={2}
                    />
                  </View>
                  <View style={styles.lengthInput}>
                    <Text style={styles.lengthLabel}>Max Length</Text>
                    <TextInput
                      style={styles.lengthTextInput}
                      value={options.maxLength.toString()}
                      onChangeText={(value) => updateLength('max', value)}
                      keyboardType="numeric"
                      maxLength={2}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Character Options</Text>
                <ToggleSwitch
                  label="Include Uppercase Letters"
                  value={options.includeUppercase}
                  onToggle={() => toggleOption('includeUppercase')}
                />
                <ToggleSwitch
                  label="Include Lowercase Letters"
                  value={options.includeLowercase}
                  onToggle={() => toggleOption('includeLowercase')}
                />
                <ToggleSwitch
                  label="Include Numbers"
                  value={options.includeNumbers}
                  onToggle={() => toggleOption('includeNumbers')}
                />
                <ToggleSwitch
                  label="Include Symbols"
                  value={options.includeSymbols}
                  onToggle={() => toggleOption('includeSymbols')}
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Security Options</Text>
                <ToggleSwitch
                  label="Avoid Common Words"
                  value={options.avoidCommonWords}
                  onToggle={() => toggleOption('avoidCommonWords')}
                />
                <ToggleSwitch
                  label="Avoid Personal Info"
                  value={options.avoidPersonalInfo}
                  onToggle={() => toggleOption('avoidPersonalInfo')}
                />
              </View>
            </>          )}

          {(generationMethod === 'manual' || generationMethod === 'policy') && selectedPassword && passwordStrength && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Password Analysis</Text>
              <View style={styles.analysisContainer}>
                <TextInput
                  style={styles.analysisInput}
                  placeholder="Enter password to analyze"
                  value={selectedPassword}
                  onChangeText={handlePasswordChange}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <StrengthMeter strength={passwordStrength} />
              </View>
            </View>
          )}
                    <TouchableOpacity
            style={[styles.generateButton, (loading || policyLoading) && styles.generateButtonDisabled]}
            onPress={handleGeneratePasswords}
            disabled={loading || policyLoading}
          >
            {(loading || policyLoading) ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <MaterialIcons name="refresh" size={20} color="#fff" />
                <Text style={styles.generateButtonText}>
                  {generationMethod === 'policy' ? 'Analyze & Generate' : 'Generate Passwords'}
                </Text>
              </>
            )}
          </TouchableOpacity>
          {passwords.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Generated Passwords</Text>
              {passwords.map((passwordData, index) => (
                <View key={index} style={styles.passwordContainer}>
                  <View style={styles.passwordHeader}>
                    <Text style={styles.passwordText}>{passwordData.value}</Text>
                    <View style={styles.passwordActions}>
                      <TouchableOpacity
                        style={styles.analyzeButton}
                        onPress={() => handlePasswordChange(passwordData.value)}
                      >
                        <MaterialIcons name="analytics" size={16} color="#666" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.copyButton}
                        onPress={() => copyToClipboard(passwordData.value)}
                      >
                        <MaterialIcons name="content-copy" size={16} color="#2196F3" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.passwordStrengthPreview}>
                    <View style={styles.strengthIndicator}>
                      <View style={[styles.strengthDot, { backgroundColor: passwordData.strength.color }]} />
                      <Text style={[styles.strengthLevelSmall, { color: passwordData.strength.color }]}>
                        {passwordData.strength.level}
                      </Text>
                    </View>
                    <Text style={styles.entropySmall}>
                      {passwordData.strength.entropy.toFixed(1)} bits
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
          
          <Modal
            visible={patternModalVisible}
            animationType="slide"
            presentationStyle="pageSheet"
          >
            <SafeAreaView style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Pattern Presets</Text>
                <TouchableOpacity onPress={() => setPatternModalVisible(false)}>
                  <MaterialIcons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalContent}>
                {PRESET_PATTERNS.map((preset, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.presetItem}
                    onPress={() => selectPresetPattern(preset.pattern)}
                  >
                    <Text style={styles.presetName}>{preset.name}</Text>
                    <Text style={styles.presetPattern}>{preset.pattern}</Text>
                    <Text style={styles.presetDescription}>{preset.description}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </SafeAreaView>
          </Modal>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  textInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  lengthContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lengthInput: {
    flex: 1,
    marginHorizontal: 5,
  },
  lengthLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  lengthTextInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    fontSize: 16,
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
    marginBottom: 20,
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
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  passwordText: {
    flex: 1,
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#333',
  },  copyButton: {
    padding: 8,
    marginLeft: 10,
  },
  methodToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  methodText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  patternInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  patternInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  presetButton: {
    padding: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#e9ecef',
  },
  patternHelper: {
    marginTop: 15,
  },
  patternHelperTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  patternRule: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
    alignItems: 'center',
    minWidth: 60,
  },
  patternRulePattern: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  patternRuleName: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
  },
  strengthMeter: {
    marginTop: 15,
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  strengthLevel: {
    fontSize: 16,
    fontWeight: '600',
  },
  strengthScore: {
    fontSize: 14,
    color: '#666',
  },
  strengthBarContainer: {
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
    overflow: 'hidden',
  },
  strengthBar: {
    height: '100%',
    borderRadius: 3,
  },
  entropyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  entropyText: {
    fontSize: 12,
    color: '#666',
  },
  crackTime: {
    fontSize: 12,
    color: '#666',
  },
  feedbackContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
  },
  feedbackText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  analysisContainer: {
    marginTop: 10,
  },
  analysisInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  passwordActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  analyzeButton: {
    padding: 8,
    marginRight: 5,
  },
  passwordStrengthPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  strengthIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  strengthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  strengthLevelSmall: {
    fontSize: 12,
    fontWeight: '600',
  },
  entropySmall: {
    fontSize: 12,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
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
  modalContent: {
    flex: 1,
    padding: 20,
  },
  presetItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  presetName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  presetPattern: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#2196F3',
    marginBottom: 4,
  },  presetDescription: {
    fontSize: 12,
    color: '#666',
  },
  policyDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  policyInputContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 15,
  },
  policyInput: {
    padding: 12,
    fontSize: 16,
    color: '#333',
    minHeight: 100,
  },
  analysisResult: {
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#155724',
    marginBottom: 8,
  },
  analysisText: {
    fontSize: 14,
    color: '#155724',
    lineHeight: 20,
  },
});