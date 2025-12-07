import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Modal, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Colors } from '../constants/Colors';
import { X, Share2, Instagram, Facebook } from 'lucide-react-native';
import { Post } from '../types';

interface PostShareModalProps {
  visible: boolean;
  onClose: () => void;
  post: Post | null;
}

export default function PostShareModal({ visible, onClose, post }: PostShareModalProps) {
  const viewShotRef = useRef<ViewShot>(null);
  const [sharing, setSharing] = useState(false);

  if (!post) return null;

  const handleShare = async () => {
    if (!viewShotRef.current) return;
    setSharing(true);
    try {
      const uri = await viewShotRef.current.capture?.();
      if (uri) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share to Story',
        });
      }
    } catch (error) {
      console.error('Sharing failed', error);
    } finally {
      setSharing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>مشاركة القصة</Text>
            <TouchableOpacity onPress={onClose}>
              <X color={Colors.dark.text} size={24} />
            </TouchableOpacity>
          </View>

          {/* This View is what gets captured */}
          <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.9 }} style={styles.previewContainer}>
            <Image source={{ uri: post.image_url }} style={styles.postImage} resizeMode="cover" />
            
            {/* Watermark Overlay */}
            <View style={styles.watermarkOverlay}>
              <View style={styles.watermarkContent}>
                <Image 
                  source={{ uri: post.profiles?.avatar_url || 'https://i.pravatar.cc/150' }} 
                  style={styles.watermarkAvatar} 
                />
                <View>
                  <Text style={styles.watermarkUser}>@{post.profiles?.username}</Text>
                  <Text style={styles.watermarkApp}>Loopin</Text>
                </View>
              </View>
            </View>
          </ViewShot>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare} disabled={sharing}>
              {sharing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Share2 color="#fff" size={20} />
                  <Text style={styles.shareBtnText}>مشاركة (Instagram, WhatsApp...)</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: Colors.dark.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: '85%',
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 20,
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  watermarkOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 30,
    backgroundColor: 'rgba(0,0,0,0.4)', // Gradient simulation
  },
  watermarkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  watermarkAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.dark.primary,
  },
  watermarkUser: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 4,
  },
  watermarkApp: {
    color: Colors.dark.secondary,
    fontWeight: '800',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  actions: {
    gap: 10,
  },
  shareBtn: {
    backgroundColor: Colors.dark.primary,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  shareBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
