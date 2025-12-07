import React, { useState } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Clock } from 'lucide-react-native';

export default function CreatePostScreen() {
  const { image } = useLocalSearchParams<{ image: string }>();
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [duration, setDuration] = useState<null | 24 | 48>(null); // null = Permanent
  const router = useRouter();
  const { user } = useAuth();

  const handlePost = async () => {
    if (!image || !user) return;

    setUploading(true);

    try {
      // 1. Upload Image to Supabase Storage
      const filename = `${user.id}/${Date.now()}.jpg`;
      const formData = new FormData();
      
      formData.append('file', {
        uri: image,
        name: filename,
        type: 'image/jpeg',
      } as any);

      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(filename, formData);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('posts')
        .getPublicUrl(filename);

      // 2. Calculate Expiration
      let expiresAt = null;
      if (duration) {
        const date = new Date();
        date.setHours(date.getHours() + duration);
        expiresAt = date.toISOString();
      }

      // 3. Insert into Posts Table
      const { error: dbError } = await supabase.from('posts').insert({
        user_id: user.id,
        image_url: publicUrl,
        caption: caption,
        is_3d: false,
        expires_at: expiresAt,
      });

      if (dbError) throw dbError;

      Alert.alert('تم النشر!', 'تمت مشاركة منشورك بنجاح.');
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'حدث خطأ أثناء النشر');
    } finally {
      setUploading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>منشور جديد</Text>
        <TouchableOpacity onPress={handlePost} disabled={uploading}>
          {uploading ? (
            <ActivityIndicator color={Colors.dark.primary} />
          ) : (
            <Text style={styles.postButton}>نشر</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.row}>
          <Image source={{ uri: image }} style={styles.previewImage} />
          <TextInput
            style={styles.input}
            placeholder="اكتب تعليقاً..."
            placeholderTextColor={Colors.dark.textSecondary}
            multiline
            value={caption}
            onChangeText={setCaption}
            textAlign="right"
          />
        </View>

        <View style={styles.optionsContainer}>
          <Text style={styles.sectionTitle}>مدة العرض</Text>
          <View style={styles.durationOptions}>
            <TouchableOpacity 
              style={[styles.durationBtn, duration === null && styles.activeDurationBtn]} 
              onPress={() => setDuration(null)}
            >
              <Text style={[styles.durationText, duration === null && styles.activeDurationText]}>دائم</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.durationBtn, duration === 24 && styles.activeDurationBtn]} 
              onPress={() => setDuration(24)}
            >
              <Clock size={16} color={duration === 24 ? '#fff' : Colors.dark.textSecondary} style={{ marginRight: 4 }} />
              <Text style={[styles.durationText, duration === 24 && styles.activeDurationText]}>24 ساعة</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.durationBtn, duration === 48 && styles.activeDurationBtn]} 
              onPress={() => setDuration(48)}
            >
              <Clock size={16} color={duration === 48 ? '#fff' : Colors.dark.textSecondary} style={{ marginRight: 4 }} />
              <Text style={[styles.durationText, duration === 48 && styles.activeDurationText]}>48 ساعة</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.helperText}>
            {duration 
              ? `سيختفي هذا المنشور تلقائياً بعد ${duration} ساعة.` 
              : 'سيبقى هذا المنشور في ملفك الشخصي بشكل دائم.'}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  headerTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  postButton: {
    color: Colors.dark.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  row: {
    flexDirection: 'row-reverse',
    gap: 15,
    marginBottom: 30,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: Colors.dark.surface,
  },
  input: {
    flex: 1,
    color: Colors.dark.text,
    fontSize: 16,
    textAlignVertical: 'top',
    height: 100,
  },
  optionsContainer: {
    gap: 12,
  },
  sectionTitle: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 8,
  },
  durationOptions: {
    flexDirection: 'row-reverse',
    gap: 10,
  },
  durationBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.dark.surface,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  activeDurationBtn: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  durationText: {
    color: Colors.dark.textSecondary,
    fontWeight: '600',
  },
  activeDurationText: {
    color: '#fff',
  },
  helperText: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  }
});
