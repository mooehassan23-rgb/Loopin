import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/Colors';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Profile, Post } from '../types';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileViewScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user } = useAuth();
  const router = useRouter();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      // 1. Profile
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userId).single();
      setProfile(profileData);

      // 2. Posts
      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });
      setPosts(postsData as any);

      // 3. Stats
      const { count: followers } = await supabase.from('followers').select('*', { count: 'exact', head: true }).eq('following_id', userId);
      setFollowersCount(followers || 0);

      const { count: following } = await supabase.from('followers').select('*', { count: 'exact', head: true }).eq('follower_id', userId);
      setFollowingCount(following || 0);

      // 4. Follow Status
      if (user) {
        const { data: followData } = await supabase
          .from('followers')
          .select('*')
          .eq('follower_id', user.id)
          .eq('following_id', userId)
          .single();
        setIsFollowing(!!followData);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user || !userId) return;
    
    // Optimistic update
    if (isFollowing) {
      setIsFollowing(false);
      setFollowersCount(prev => prev - 1);
      await supabase.from('followers').delete().match({ follower_id: user.id, following_id: userId });
    } else {
      setIsFollowing(true);
      setFollowersCount(prev => prev + 1);
      await supabase.from('followers').insert({ follower_id: user.id, following_id: userId });
      
      // Notify
      await supabase.from('notifications').insert({
        user_id: userId,
        actor_id: user.id,
        type: 'follow'
      });
    }
  };

  const handleMessage = async () => {
    if (!user || !userId) return;

    // Check if conversation exists
    const { data: existingConvs } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id);

    let conversationId = null;

    if (existingConvs && existingConvs.length > 0) {
      // Check if the other user is in any of these conversations
      const myConvIds = existingConvs.map(c => c.conversation_id);
      const { data: match } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId)
        .in('conversation_id', myConvIds)
        .limit(1)
        .single();
      
      if (match) conversationId = match.conversation_id;
    }

    if (!conversationId) {
      // Create new
      const { data: newConv } = await supabase.from('conversations').insert({}).select().single();
      if (newConv) {
        conversationId = newConv.id;
        await supabase.from('conversation_participants').insert([
          { conversation_id: newConv.id, user_id: user.id },
          { conversation_id: newConv.id, user_id: userId }
        ]);
      }
    }

    if (conversationId) {
      router.push(`/messages/${conversationId}?name=${profile?.username}`);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1, backgroundColor: Colors.dark.background, justifyContent: 'center' }} color={Colors.dark.primary} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{profile?.username}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView>
        <View style={styles.profileInfo}>
          <Image source={{ uri: profile?.avatar_url || 'https://i.pravatar.cc/150' }} style={styles.avatar} />
          <View style={styles.stats}>
             <View style={styles.statItem}><Text style={styles.statNumber}>{followingCount}</Text><Text style={styles.statLabel}>يتابع</Text></View>
             <View style={styles.statItem}><Text style={styles.statNumber}>{followersCount}</Text><Text style={styles.statLabel}>متابعون</Text></View>
             <View style={styles.statItem}><Text style={styles.statNumber}>{posts.length}</Text><Text style={styles.statLabel}>منشور</Text></View>
          </View>
        </View>

        <View style={styles.bioContainer}>
          <Text style={styles.fullname}>{profile?.username}</Text>
          <Text style={styles.bio}>{profile?.bio}</Text>
        </View>

        {user?.id !== userId && (
          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.btn, isFollowing ? styles.unfollowBtn : styles.followBtn]} 
              onPress={handleFollow}
            >
              <Text style={styles.btnText}>{isFollowing ? 'إلغاء المتابعة' : 'متابعة'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.msgBtn]} onPress={handleMessage}>
              <Text style={styles.btnText}>رسالة</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.grid}>
          {posts.map(post => (
            <Image key={post.id} source={{ uri: post.image_url }} style={styles.gridItem} />
          ))}
        </View>
      </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  headerTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileInfo: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.dark.surface,
  },
  stats: {
    flexDirection: 'row',
    gap: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: Colors.dark.text,
    fontWeight: 'bold',
    fontSize: 18,
  },
  statLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
  },
  bioContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: 'flex-end',
  },
  fullname: {
    color: Colors.dark.text,
    fontWeight: 'bold',
    fontSize: 16,
  },
  bio: {
    color: Colors.dark.text,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
  },
  btn: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  followBtn: {
    backgroundColor: Colors.dark.primary,
  },
  unfollowBtn: {
    backgroundColor: Colors.dark.surface,
  },
  msgBtn: {
    backgroundColor: Colors.dark.surface,
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItem: {
    width: '33.33%',
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: Colors.dark.background,
  },
});
