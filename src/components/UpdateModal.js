import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const UpdateModal = ({ visible, updateData }) => {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconCircle}>
            <Ionicons name="cloud-download" size={40} color="#2196F3" />
          </View>
          
          <Text style={styles.title}>Update Available!</Text>
          <Text style={styles.versionText}>Version {updateData?.latestVersion}</Text>
          
          <Text style={styles.description}>
            {updateData?.releaseNotes || "A new version of TrackPay is available with improved features."}
          </Text>

          <TouchableOpacity 
            style={styles.updateBtn}
            onPress={() => Linking.openURL(updateData?.updateUrl)}
          >
            <Text style={styles.updateBtnText}>Update Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  container: { width: '85%', backgroundColor: '#fff', borderRadius: 20, padding: 25, alignItems: 'center' },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  versionText: { fontSize: 14, color: '#2196F3', marginBottom: 15, fontWeight: '600' },
  description: { textAlign: 'center', color: '#666', marginBottom: 25, lineHeight: 22 },
  updateBtn: { backgroundColor: '#2196F3', paddingVertical: 15, borderRadius: 12, width: '100%', alignItems: 'center' },
  updateBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});

export default UpdateModal;