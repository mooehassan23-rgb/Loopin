import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '../../types';

export default function ChatScreen() {
  const { id, name } = useLocalSearchParams<{ id: string, name: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (id) {
      fetchMessages();
      subscribeToMessages();
    }
  }, [id]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });
    
    if (data) setMessages(data as any);
    setLoading(false);
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`chat:${id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          // Scroll to bottom
          setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !user) return;

    const content = inputText.trim();
    setInputText('');

    const { error } = await supabase.from('messages').insert({
      conversation_id: id,
      sender_id: user.id,
      content: content,
    });

    if (error) {
      console.error(error);
      setInputText(content); // Restore if failed
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{name || 'محادثة'}</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} color={Colors.dark.primary} />
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          renderItem={({ item }) => {
            const isMe = item.sender_id === user?.id;
            return (
              <View style={[styles.msgContainer, isMe ? styles.myMsg : styles.otherMsg]}>
                <Text style={[styles.msgText, isMe ? styles.myMsgText : styles.otherMsgText]}>{item.content}</Text>
              </View>
            );
          }}
        />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="اكتب رسالة..."
          placeholderTextColor={Colors.dark.textSecondary}
          value={inputText}
          onChangeText={setInputText}
          textAlign="right"
        />
        <TouchableOpacity onPress={sendMessage} disabled={!inputText.trim()}>
          <Ionicons name="send" size={24} color={inputText.trim() ? Colors.dark.primary : Colors.dark.textSecondary} />
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
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  msgContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  myMsg: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.dark.primary,
    borderBottomRightRadius: 2,
  },
  otherMsg: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.dark.surface,
    borderBottomLeftRadius: 2,
  },
  msgText: {
    fontSize: 16,
  },
  myMsgText: {
    color: '#fff',
  },
  otherMsgText: {
    color: Colors.dark.text,
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
});
