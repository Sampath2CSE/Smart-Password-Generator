import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

interface PasswordOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
}

export default function PasswordGenerator() {
  console.log('PasswordGenerator starting...');
  
  const [options, setOptions] = useState<PasswordOptions>({
    length: 12,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
  });
  
  const [passwords, setPasswords] = useState<string[]>([]);
  
  const generatePassword = (opts: PasswordOptions): string => {
    let charset = '';
    
    if (opts.includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (opts.includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (opts.includeNumbers) charset += '0123456789';
    if (opts.includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    if (!charset) charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    
    let password = '';
    for (let i = 0; i < opts.length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    return password;
  };
  
  const handleGeneratePasswords = () => {
    console.log('Generating passwords...');
    try {
      const newPasswords = [];
      for (let i = 0; i < 5; i++) {
        newPasswords.push(generatePassword(options));
      }
      setPasswords(newPasswords);
      console.log('Passwords generated successfully');
    } catch (error) {
      console.error('Error generating passwords:', error);
      Alert.alert('Error', 'Failed to generate passwords');
    }
  };
  
  const copyPassword = (password: string) => {
    if (Platform.OS === 'web') {
      navigator.clipboard?.writeText(password).then(() => {
        Alert.alert('Success', 'Password copied!');
      }).catch(() => {
        Alert.alert('Error', 'Failed to copy password');
      });
    } else {
      Alert.alert('Password', password, [
        { text: 'OK', style: 'default' }
      ]);
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
  
  console.log('Rendering PasswordGenerator...');
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <MaterialIcons name="security" size={32} color="#2196F3" />
          <Text style={styles.title}>Password Generator</Text>
          <Text style={styles.subtitle}>Create secure passwords</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Password Length</Text>
          <View style={styles.lengthContainer}>
            <TouchableOpacity 
              style={styles.lengthButton}
              onPress={() => setOptions(prev => ({ ...prev, length: Math.max(4, prev.length - 1) }))}
            >
              <Text style={styles.lengthButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.lengthText}>{options.length}</Text>
            <TouchableOpacity 
              style={styles.lengthButton}
              onPress={() => setOptions(prev => ({ ...prev, length: Math.min(50, prev.length + 1) }))}
            >
              <Text style={styles.lengthButtonText}>+</Text>
            </TouchableOpacity>
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
        </View>
        
        <TouchableOpacity style={styles.generateButton} onPress={handleGeneratePasswords}>
          <MaterialIcons name="refresh" size={20} color="#fff" />
          <Text style={styles.generateButtonText}>Generate Passwords</Text>
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
            <Text style={styles.tapToCopyText}>Tap any password to view/copy</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
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
  lengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lengthButton: {
    backgroundColor: '#2196F3',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  lengthButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  lengthText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    minWidth: 50,
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
    fontSize: 16,
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
});