import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Search as SearchIcon } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { Profile, Post } from '../../types';
import { useRouter } from 'expo-router';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<Profile[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'posts'>('users');
  const router = useRouter();

  useEffect(() => {
    if (query.length > 1) {
      handleSearch();
    } else {
      setUsers([]);
      setPosts([]);
    }
  }, [query, activeTab]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .ilike('username', `%${query}%`)
          .limit(20);
        if (data) setUsers(data);
      } else {
        const { data } = await supabase
          .from('posts')
          .select('*, profiles(username, avatar_url)')
          .ilike('caption', `%${query}%`)
          .eq('is_archived', false)
          .limit(20);
        if (data) setPosts(data as unknown as Post[]);
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
        <View style={styles.searchBar}>
          <SearchIcon color={Colors.dark.textSecondary} size={20} />
          <TextInput
            style={styles.input}
            placeholder="بحث..."
            placeholderTextColor={Colors.dark.textSecondary}
            value={query}
            onChangeText={setQuery}
            textAlign="right"
          />
        </View>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'users' && styles.activeTab]} 
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>مستخدمين</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'posts' && styles.activeTab]} 
          onPress={() => setActiveTab('posts')}
        >
          <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>منشورات</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} color={Colors.dark.primary} />
      ) : (
        <FlatList
          data={activeTab === 'users' ? users : posts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => {
            if (activeTab === 'users') {
              const user = item as Profile;
              return (
                <TouchableOpacity 
                  style={styles.userItem}
                  onPress={() => router.push({ pathname: '/profile-view', params: { userId: user.id } })}
                >
                  <Image source={{ uri: user.avatar_url || 'https://i.pravatar.cc/150' }} style={styles.avatar} />
                  <Text style={styles.username}>{user.username}</Text>
                </TouchableOpacity>
              );
            } else {
              const post = item as Post;
              return (
                <View style={styles.postItem}>
                  <View style={styles.postHeader}>
                     <Image source={{ uri: post.profiles?.avatar_url || 'https://i.pravatar.cc/150' }} style={styles.smallAvatar} />
                     <Text style={styles.postUser}>{post.profiles?.username}</Text>
                  </View>
                  <Image source={{ uri: post.image_url }} style={styles.postImage} />
                  {post.caption && <Text style={styles.caption}>{post.caption}</Text>}
                </View>
              );
            }
          }}
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
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  searchBar: {
    flexDirection: 'row-reverse',
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    color: Colors.dark.text,
    fontSize: 16,
  },
  tabs: {
    flexDirection: 'row-reverse',
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.surface,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.dark.primary,
  },
  tabText: {
    color: Colors.dark.textSecondary,
    fontSize: 16,
  },
  activeTabText: {
    color: Colors.dark.primary,
    fontWeight: 'bold',
  },
  userItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.surface,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.dark.surface,
  },
  username: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '600',
  },
  postItem: {
    marginBottom: 20,
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 10,
    gap: 8,
  },
  smallAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  postUser: {
    color: Colors.dark.text,
    fontWeight: '600',
  },
  postImage: {
    width: '100%',
    height: 200,
  },
  caption: {
    padding: 10,
    color: Colors.dark.text,
    textAlign: 'right',
  },
});
