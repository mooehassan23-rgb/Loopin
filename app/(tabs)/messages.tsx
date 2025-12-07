import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors } from '../../constants/Colors';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';

export default function MessagesListScreen() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) fetchConversations();
  }, [user]);

  const fetchConversations = async () => {
    try {
      // Fetch conversations where user is a participant
      const { data: participations, error } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user!.id);

      if (error) throw error;

      if (participations && participations.length > 0) {
        const conversationIds = participations.map(p => p.conversation_id);
        
        // Fetch conversation details and other participants
        const { data: convs } = await supabase
          .from('conversations')
          .select(`
            id, 
            updated_at,
            conversation_participants(user_id, profiles(username, avatar_url))
          `)
          .in('id', conversationIds)
          .order('updated_at', { ascending: false });

        // Process to find the "other" user
        const formatted = convs?.map(c => {
          const otherParticipant = c.conversation_participants.find((p: any) => p.user_id !== user!.id);
          return {
            id: c.id,
            otherUser: otherParticipant?.profiles,
            updated_at: c.updated_at
          };
        });

        setConversations(formatted || []);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>الرسائل</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} color={Colors.dark.primary} />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>لا توجد محادثات</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.item}
              onPress={() => router.push(`/messages/${item.id}?name=${item.otherUser?.username}`)}
            >
              <Image 
                source={{ uri: item.otherUser?.avatar_url || 'https://i.pravatar.cc/150' }} 
                style={styles.avatar} 
              />
              <View style={styles.content}>
                <Text style={styles.username}>{item.otherUser?.username || 'مستخدم'}</Text>
                <Text style={styles.subtext}>اضغط للمراسلة</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    paddingTop: 50,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.surface,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  center: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.dark.textSecondary,
  },
  item: {
    flexDirection: 'row-reverse',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.surface,
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.dark.surface,
  },
  content: {
    flex: 1,
    alignItems: 'flex-end',
  },
  username: {
    color: Colors.dark.text,
    fontWeight: 'bold',
    fontSize: 16,
  },
  subtext: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
  },
});
