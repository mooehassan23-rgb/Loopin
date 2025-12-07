import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Settings, Users, Grid, Bookmark, Plus } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Profile, Post } from '../../types';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfileData = async () => {
    if (!user) return;
    try {
      // 1. Fetch Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileData) setProfile(profileData);

      // 2. Fetch User Posts
      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', false) // Don't show archived in main grid
        .order('created_at', { ascending: false });
      
      if (postsData) setPosts(postsData);

      // 3. Fetch Followers Count
      const { count: followers } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', user.id);
      
      setFollowersCount(followers || 0);

      // 4. Fetch Following Count
      const { count: following } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', user.id);
        
      setFollowingCount(following || 0);

    } catch (error) {
      console.log('Error fetching profile:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchProfileData();
    }, [user])
  );

  const handleSignOut = async () => {
    await signOut();
    router.replace('/auth/sign-in');
  };

  if (loading && !profile) {
     return (
        <View style={[styles.container, styles.center]}>
           <ActivityIndicator color={Colors.dark.primary} size="large" />
        </View>
     );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProfileData(); }} tintColor={Colors.dark.primary} />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleSignOut}>
            <Settings color={Colors.dark.text} size={24} />
          </TouchableOpacity>
          <Text style={styles.username}>@{profile?.username || 'user'}</Text>
        </View>

        <View style={styles.profileInfo}>
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{followingCount}</Text>
              <Text style={styles.statLabel}>يتابع</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{followersCount}</Text>
              <Text style={styles.statLabel}>متابعون</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{posts.length}</Text>
              <Text style={styles.statLabel}>منشور</Text>
            </View>
          </View>
          
          <View style={styles.avatarContainer}>
             <Image 
                source={{ uri: profile?.avatar_url || 'https://i.pravatar.cc/150' }} 
                style={styles.avatar} 
             />
             <TouchableOpacity style={styles.addStoryBtn} onPress={() => router.push('/edit-profile')}>
                <Plus color="#fff" size={16} />
             </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bioContainer}>
            <Text style={styles.fullname}>{profile?.username || user?.email?.split('@')[0]}</Text>
            <Text style={styles.bio}>{profile?.bio || 'لا يوجد نبذة شخصية بعد'}</Text>
        </View>

        <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/edit-profile')}>
                <Text style={styles.editBtnText}>تعديل الملف الشخصي</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.brothersBtn}>
                <Users color="#fff" size={20} />
            </TouchableOpacity>
        </View>

        {/* Memories / Grid Tabs */}
        <View style={styles.tabsContainer}>
            <View style={styles.tabIndicator} />
            <TouchableOpacity style={styles.tabItem}>
                <Grid color={Colors.dark.primary} size={24} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.tabItem}>
                <Bookmark color={Colors.dark.textSecondary} size={24} />
            </TouchableOpacity>
        </View>

        <View style={styles.grid}>
            {posts.map((post) => (
                <View key={post.id} style={styles.gridItem}>
                    <Image 
                        source={{ uri: post.image_url }} 
                        style={styles.gridImage} 
                    />
                </View>
            ))}
            {posts.length === 0 && (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>لا توجد منشورات</Text>
                </View>
            )}
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
  },
  username: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2,
    borderColor: Colors.dark.border,
    backgroundColor: Colors.dark.surface,
  },
  addStoryBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.dark.secondary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.dark.background,
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
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
  },
  bioContainer: {
    paddingHorizontal: 20,
    alignItems: 'flex-end', // RTL alignment
    marginBottom: 20,
  },
  fullname: {
    color: Colors.dark.text,
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  bio: {
    color: Colors.dark.text,
    fontSize: 14,
    textAlign: 'right',
  },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
  },
  editBtn: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  editBtnText: {
    color: Colors.dark.text,
    fontWeight: '600',
  },
  brothersBtn: {
    backgroundColor: Colors.dark.surface,
    padding: 10,
    borderRadius: 8,
    width: 44,
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.dark.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.surface,
    paddingVertical: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '50%',
    height: 2,
    backgroundColor: Colors.dark.primary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItem: {
    width: '33.33%',
    aspectRatio: 1,
    padding: 1,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  emptyContainer: {
    width: '100%',
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.dark.textSecondary,
  }
});
