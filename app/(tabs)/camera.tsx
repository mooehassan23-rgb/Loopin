import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Colors } from '../../constants/Colors';
import { RefreshCw, Zap, X, Type, Smile, Box } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [is3DMode, setIs3DMode] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>نحتاج إذن الوصول للكاميرا</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>منح الإذن</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  async function takePicture() {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7,
          skipProcessing: true,
        });
        
        if (photo) {
          router.push({
            pathname: '/create-post',
            params: { image: photo.uri }
          });
        }
      } catch (e) {
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
        {/* Overlay UI */}
        <View style={styles.overlay}>
          {/* Top Controls */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
              <X color="#fff" size={28} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => {}}>
              <Zap color="#fff" size={24} />
            </TouchableOpacity>
          </View>

          {/* 3D / AR Mode Indicator */}
          {is3DMode && (
             <View style={styles.arIndicator}>
                <Box color={Colors.dark.secondary} size={20} />
                <Text style={styles.arText}>AR Mode Active</Text>
             </View>
          )}

          {/* Side Controls (Filters, Text, 3D) */}
          <View style={styles.sideControls}>
             <TouchableOpacity style={styles.sideButton} onPress={() => setIs3DMode(!is3DMode)}>
                <Box color="#fff" size={24} />
                <Text style={styles.sideButtonText}>3D</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.sideButton}>
                <Type color="#fff" size={24} />
                <Text style={styles.sideButtonText}>نص</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.sideButton}>
                <Smile color="#fff" size={24} />
                <Text style={styles.sideButtonText}>فلاتر</Text>
             </TouchableOpacity>
          </View>

          {/* Bottom Controls */}
          <View style={styles.bottomBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
                {/* Mock Filters */}
                {[1,2,3,4,5].map(i => (
                    <View key={i} style={styles.filterBubble} />
                ))}
            </ScrollView>

            <View style={styles.captureRow}>
                <TouchableOpacity style={styles.iconButton} onPress={toggleCameraFacing}>
                    <RefreshCw color="#fff" size={24} />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.captureBtnOuter} onPress={takePicture}>
                    <View style={styles.captureBtnInner} />
                </TouchableOpacity>

                <View style={{width: 24}} /> 
            </View>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: '#fff',
  },
  button: {
    backgroundColor: Colors.dark.primary,
    padding: 15,
    borderRadius: 10,
    alignSelf: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 50,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconButton: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
  },
  sideControls: {
    position: 'absolute',
    right: 20,
    top: 100,
    gap: 20,
  },
  sideButton: {
    alignItems: 'center',
    gap: 4,
  },
  sideButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 4,
  },
  arIndicator: {
    position: 'absolute',
    top: 100,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  arText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  bottomBar: {
    alignItems: 'center',
    gap: 20,
  },
  filtersScroll: {
    maxHeight: 60,
    marginBottom: 10,
  },
  filterBubble: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: '#fff',
    marginHorizontal: 8,
  },
  captureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 30,
  },
  captureBtnOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtnInner: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: '#fff',
  },
});
