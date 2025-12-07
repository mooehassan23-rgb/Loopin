import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/Colors';
import { supabase } from '../lib/supabase';
import { Notification } from '../types';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          actor:profiles!actor_id(*)
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data as any);
      
      // Mark as read
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user!.id)
        .eq('read', false);
        
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationText = (type: string) => {
    switch (type) {
      case 'like': return 'أعجب بمنشورك';
      case 'comment': return 'علق على منشورك';
      case 'follow': return 'بدأ بمتابعتك';
      default: return 'تفاعل معك';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الإشعارات</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} color={Colors.dark.primary} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>لا توجد إشعارات جديدة</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.item, !item.read && styles.unread]}>
              <Image 
                source={{ uri: item.actor?.avatar_url || 'https://i.pravatar.cc/150' }} 
                style={styles.avatar} 
              />
              <View style={styles.content}>
                <Text style={styles.text}>
                  <Text style={styles.username}>{item.actor?.username} </Text>
                  {getNotificationText(item.type)}
                </Text>
                <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString('ar-EG')}</Text>
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
  unread: {
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.dark.surface,
  },
  content: {
    flex: 1,
    alignItems: 'flex-end',
  },
  text: {
    color: Colors.dark.text,
    fontSize: 14,
    textAlign: 'right',
  },
  username: {
    fontWeight: 'bold',
  },
  date: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
});
