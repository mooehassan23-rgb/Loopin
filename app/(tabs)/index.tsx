import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Heart, MessageCircle, Share2, Box, Bell, Trash2, Archive, Clock } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { Post } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Link, useRouter } from 'expo-router';
import PostShareModal from '../../components/PostShareModal';

export default function FeedScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sharePost, setSharePost] = useState<Post | null>(null);
  const [shareVisible, setShareVisible] = useState(false);
  
  const { user } = useAuth();
  const router = useRouter();

  const fetchPosts = useCallback(async () => {
    try {
      // Fetch posts that are NOT archived AND (expires_at is NULL OR expires_at > now)
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (username, avatar_url),
          likes (user_id),
          comments (count)
        `)
        .eq('is_archived', false)
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data as unknown as Post[]);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  const handleLike = async (postId: string, postOwnerId: string) => {
    if (!user) return;
    
    // Optimistic Update
    const postIndex = posts.findIndex(p => p.id === postId);
    const isLiked = posts[postIndex].likes?.some(l => l.user_id === user.id);
    
    const updatedPosts = [...posts];
    if (isLiked) {
      updatedPosts[postIndex].likes = updatedPosts[postIndex].likes?.filter(l => l.user_id !== user.id);
      await supabase.from('likes').delete().match({ user_id: user.id, post_id: postId });
    } else {
      updatedPosts[postIndex].likes = [...(updatedPosts[postIndex].likes || []), { user_id: user.id, post_id: postId, id: 'temp', created_at: '' }];
      await supabase.from('likes').insert({ user_id: user.id, post_id: postId });

      if (postOwnerId !== user.id) {
        await supabase.from('notifications').insert({
          user_id: postOwnerId,
          actor_id: user.id,
          type: 'like',
          post_id: postId
        });
      }
    }
    setPosts(updatedPosts);
  };

  const handleDeletePost = async (postId: string) => {
    Alert.alert('حذف المنشور', 'هل أنت متأكد من حذف هذا المنشور؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('posts').delete().eq('id', postId);
          setPosts(posts.filter(p => p.id !== postId));
        }
      }
    ]);
  };

  const handleArchivePost = async (postId: string) => {
    Alert.alert('أرشفة المنشور', 'هل تريد إخفاء هذا المنشور من صفحتك؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'أرشفة',
        onPress: async () => {
          await supabase.from('posts').update({ is_archived: true }).eq('id', postId);
          setPosts(posts.filter(p => p.id !== postId));
        }
      }
    ]);
  };

  const openShareModal = (post: Post) => {
    setSharePost(post);
    setShareVisible(true);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/notifications')}>
          <Bell color={Colors.dark.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Loopin</Text>
        <View style={{width: 24}} /> 
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.primary} />}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>لا توجد منشورات بعد</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isLiked = item.likes?.some(l => l.user_id === user?.id);
          const likesCount = item.likes?.length || 0;
          const commentsCount = item.comments?.[0]?.count || 0;
          const isMyPost = item.user_id === user?.id;
          const isExpiring = !!item.expires_at;

          return (
            <View style={styles.postContainer}>
              <View style={styles.postHeader}>
                <TouchableOpacity 
                   style={styles.userInfo} 
                   onPress={() => router.push({ pathname: '/profile-view', params: { userId: item.user_id } })}
                >
                  <Image 
                    source={{ uri: item.profiles?.avatar_url || 'https://i.pravatar.cc/150' }} 
                    style={styles.avatar} 
                  />
                  <View>
                    <Text style={styles.userName}>{item.profiles?.username || 'Unknown'}</Text>
                    {isExpiring && (
                      <View style={styles.expiringBadge}>
                        <Clock size={10} color={Colors.dark.secondary} />
                        <Text style={styles.expiringText}>مؤقت</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
                
                {isMyPost && (
                  <View style={styles.headerActions}>
                    <TouchableOpacity onPress={() => handleArchivePost(item.id)} style={styles.actionBtn}>
                      <Archive color={Colors.dark.textSecondary} size={20} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeletePost(item.id)} style={styles.actionBtn}>
                      <Trash2 color={Colors.dark.error} size={20} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.imageContainer}>
                <Image source={{ uri: item.image_url }} style={styles.postImage} />
                {item.is_3d && (
                  <View style={styles.badge3D}>
                    <Box color="#fff" size={14} />
                    <Text style={styles.badgeText}>3D View</Text>
                  </View>
                )}
              </View>

              <View style={styles.postFooter}>
                <View style={styles.actions}>
                  <View style={styles.actionLeft}>
                    <TouchableOpacity style={styles.iconButton} onPress={() => handleLike(item.id, item.user_id)}>
                      <Heart 
                        color={isLiked ? Colors.dark.error : Colors.dark.text} 
                        fill={isLiked ? Colors.dark.error : 'transparent'} 
                        size={24} 
                      />
                    </TouchableOpacity>
                    <Link href={`/comments/${item.id}`} asChild>
                      <TouchableOpacity style={styles.iconButton}>
                        <MessageCircle color={Colors.dark.text} size={24} />
                      </TouchableOpacity>
                    </Link>
                    <TouchableOpacity style={styles.iconButton} onPress={() => openShareModal(item)}>
                      <Share2 color={Colors.dark.text} size={24} />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <Text style={styles.likes}>{likesCount} إعجاب</Text>
                
                {item.caption && (
                  <View style={styles.captionContainer}>
                    <Text style={styles.userNameCaption}>{item.profiles?.username}</Text>
                    <Text style={styles.caption}>{item.caption}</Text>
                  </View>
                )}
                
                {commentsCount > 0 && (
                  <Link href={`/comments/${item.id}`} asChild>
                    <TouchableOpacity>
                      <Text style={styles.viewComments}>عرض كل الـ {commentsCount} تعليق</Text>
                    </TouchableOpacity>
                  </Link>
                )}
              </View>
            </View>
          );
        }}
      />
      
      <PostShareModal 
        visible={shareVisible} 
        onClose={() => setShareVisible(false)} 
        post={sharePost} 
      />
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
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.surface,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.dark.primary,
    fontFamily: 'Inter_700Bold',
  },
  postContainer: {
    marginBottom: 20,
  },
  postHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  userInfo: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 15,
  },
  actionBtn: {
    padding: 4,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark.surface,
  },
  userName: {
    color: Colors.dark.text,
    fontWeight: '600',
    fontSize: 14,
  },
  expiringBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 2,
  },
  expiringText: {
    color: Colors.dark.secondary,
    fontSize: 10,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1, 
    backgroundColor: Colors.dark.surface,
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  badge3D: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  postFooter: {
    padding: 12,
  },
  actions: {
    flexDirection: 'row-reverse',
    marginBottom: 8,
  },
  actionLeft: {
    flexDirection: 'row-reverse',
    gap: 16,
  },
  iconButton: {
    padding: 4,
  },
  likes: {
    color: Colors.dark.text,
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 6,
    textAlign: 'right',
  },
  captionContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  userNameCaption: {
    color: Colors.dark.text,
    fontWeight: '600',
    fontSize: 14,
  },
  caption: {
    color: Colors.dark.text,
    fontSize: 14,
  },
  viewComments: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    textAlign: 'right',
    marginTop: 4,
  },
  emptyText: {
    color: Colors.dark.textSecondary,
    fontSize: 16,
  }
});
