import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { APP_CONFIG } from "../config/constants";

const ProfileModal = ({ visible, onClose, user, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");

  const handleUpdateProfile = () => {
    // Logic for calling your update API would go here
    Alert.alert("Success", "Profile updated locally");
    setIsEditing(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isEditing ? "Edit Profile" : "My Account"}
            </Text>
            <TouchableOpacity onPress={() => { setIsEditing(false); onClose(); }}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Profile Picture & Basic Info */}
            <View style={styles.profileInfoSection}>
              <View style={styles.profileAvatarLarge}>
                <Ionicons name="person" size={50} color="#2196F3" />
              </View>

              {!isEditing ? (
                <>
                  <Text style={styles.profileMainName}>{user?.username || "User"}</Text>
                  <Text style={styles.profileEmail}>{user?.email || "No email"}</Text>
                </>
              ) : (
                <View style={styles.editForm}>
                  <Text style={styles.label}>Username</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={username}
                    onChangeText={setUsername}
                  />
                  <Text style={styles.label}>Email Address</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                  />
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionSection}>
              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => (isEditing ? handleUpdateProfile() : setIsEditing(true))}
              >
                <Ionicons
                  name={isEditing ? "checkmark-circle-outline" : "create-outline"}
                  size={22}
                  color="#2196F3"
                />
                <Text style={styles.actionText}>
                  {isEditing ? "Save Profile Changes" : "Edit Profile"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => Alert.alert("Change Password", "Redirecting to security...")}
              >
                <Ionicons name="lock-closed-outline" size={22} color="#FF9800" />
                <Text style={styles.actionText}>Change Password</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionRow, { borderBottomWidth: 0 }]}
                onPress={onLogout}
              >
                <Ionicons name="log-out-outline" size={22} color="#f44336" />
                <Text style={[styles.actionText, { color: "#f44336" }]}>Logout</Text>
              </TouchableOpacity>
            </View>

            {/* Footer / Version */}
            <View style={styles.versionContainer}>
              <Text style={styles.versionLabel}>Version</Text>
              <Text style={styles.versionNumber}>{APP_CONFIG.version}</Text>
              <Text style={styles.poweredBy}>Powered by TrackPay</Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#fff", borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, maxHeight: "90%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#333" },
  profileInfoSection: { alignItems: "center", marginBottom: 25 },
  profileAvatarLarge: { width: 90, height: 90, borderRadius: 45, backgroundColor: "#E3F2FD", justifyContent: "center", alignItems: "center", marginBottom: 15 },
  profileMainName: { fontSize: 22, fontWeight: "bold", color: "#333" },
  profileEmail: { fontSize: 14, color: "#666", marginTop: 4 },
  editForm: { width: "100%", paddingHorizontal: 10 },
  label: { fontSize: 12, color: "#888", marginBottom: 5, fontWeight: "600" },
  modalInput: { backgroundColor: "#F5F5F5", borderRadius: 10, padding: 12, marginBottom: 15, fontSize: 16, borderWidth: 1, borderColor: "#EEE" },
  actionSection: { backgroundColor: "#F8F9FA", borderRadius: 15, padding: 5, marginBottom: 20 },
  actionRow: { flexDirection: "row", alignItems: "center", padding: 15, borderBottomWidth: 1, borderBottomColor: "#EEE" },
  actionText: { marginLeft: 15, fontSize: 16, color: "#333", fontWeight: "500" },
  versionContainer: { alignItems: "center", paddingVertical: 20 },
  versionLabel: { fontSize: 10, color: "#AAA", textTransform: "uppercase", letterSpacing: 2 },
  versionNumber: { fontSize: 14, color: "#888", fontWeight: "700", marginTop: 2 },
  poweredBy: { fontSize: 10, color: "#CCC", marginTop: 5 },
});

export default ProfileModal;