import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Comment } from '../../types';
import { Ionicons } from '@expo/vector-icons';

export default function CommentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchComments();
  }, [id]);

  const fetchComments = async () => {
    if (!id) return;
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(username, avatar_url)')
      .eq('post_id', id)
      .order('created_at', { ascending: true });
    
    if (data) setComments(data as unknown as Comment[]);
    setLoading(false);
  };

  const handleSend = async () => {
    if (!newComment.trim() || !user || !id) return;

    const { error } = await supabase.from('comments').insert({
      post_id: id,
      user_id: user.id,
      content: newComment,
    });

    if (!error) {
      setNewComment('');
      fetchComments();
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>التعليقات</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} color={Colors.dark.primary} />
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={styles.commentItem}>
              <Image 
                source={{ uri: item.profiles?.avatar_url || 'https://i.pravatar.cc/150' }} 
                style={styles.avatar} 
              />
              <View style={styles.commentContent}>
                <Text style={styles.username}>{item.profiles?.username}</Text>
                <Text style={styles.text}>{item.content}</Text>
              </View>
            </View>
          )}
        />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="أضف تعليقاً..."
          placeholderTextColor={Colors.dark.textSecondary}
          value={newComment}
          onChangeText={setNewComment}
          textAlign="right"
        />
        <TouchableOpacity onPress={handleSend} disabled={!newComment.trim()}>
          <Text style={[styles.sendText, !newComment.trim() && styles.disabledText]}>نشر</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.surface,
  },
  headerTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  commentItem: {
    flexDirection: 'row-reverse',
    marginBottom: 16,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.surface,
  },
  commentContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  username: {
    color: Colors.dark.text,
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
  },
  text: {
    color: Colors.dark.text,
    fontSize: 14,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row-reverse',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.surface,
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: Colors.dark.text,
    textAlign: 'right',
  },
  sendText: {
    color: Colors.dark.primary,
    fontWeight: 'bold',
  },
  disabledText: {
    color: Colors.dark.textSecondary,
  },
});
