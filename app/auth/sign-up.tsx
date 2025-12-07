import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Colors } from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signUpWithEmail() {
    if (!email || !password || !username) {
      Alert.alert('تنبيه', 'يرجى ملء جميع الحقول');
      return;
    }

    setLoading(true);
    
    // 1. Create Auth User
    const { data: { user }, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username, // Stored in raw_user_meta_data
        },
      },
    });

    if (error) {
      Alert.alert('خطأ', error.message);
      setLoading(false);
      return;
    }

    // Note: Profile creation is handled by Database Trigger as per best practices
    
    setLoading(false);
    if (user) {
      Alert.alert('تم التسجيل بنجاح', 'يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب إذا لزم الأمر، أو قم بتسجيل الدخول.', [
        { text: 'حسناً', onPress: () => router.replace('/auth/sign-in') }
      ]);
    }
  }

  return (
    <View style={styles.container}>
       <LinearGradient
        colors={['rgba(0, 206, 201, 0.1)', 'transparent']}
        style={styles.backgroundGradient}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Loopin</Text>
        <Text style={styles.subtitle}>انضم إلى عالم جديد من التواصل</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="الاسم الكامل"
            placeholderTextColor={Colors.dark.textSecondary}
            value={username}
            onChangeText={setUsername}
            textAlign="right"
          />
          <TextInput
            style={styles.input}
            placeholder="البريد الإلكتروني"
            placeholderTextColor={Colors.dark.textSecondary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            textAlign="right"
          />
          <TextInput
            style={styles.input}
            placeholder="كلمة المرور"
            placeholderTextColor={Colors.dark.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textAlign="right"
          />

          <TouchableOpacity 
            style={styles.button} 
            onPress={signUpWithEmail}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>إنشاء حساب</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>لديك حساب بالفعل؟ </Text>
            <Link href="/auth/sign-in" asChild>
              <TouchableOpacity>
                <Text style={styles.linkText}>تسجيل الدخول</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 400,
  },
  content: {
    padding: 24,
    flexGrow: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: Colors.dark.secondary,
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'Inter_700Bold',
  },
  subtitle: {
    fontSize: 18,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
    fontFamily: 'Inter_400Regular',
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    color: Colors.dark.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  button: {
    backgroundColor: Colors.dark.secondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter_600SemiBold',
  },
  footer: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
  },
  linkText: {
    color: Colors.dark.secondary,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
