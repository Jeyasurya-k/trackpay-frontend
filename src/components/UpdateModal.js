import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as IntentLauncher from "expo-intent-launcher";

const UpdateModal = ({ visible, updateData }) => {
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!visible) return null;

  const handleUpdate = async () => {
    if (Platform.OS !== "android") {
      // iOS doesn't allow direct APK installs, so we use the link
      Linking.openURL(updateData?.updateUrl);
      return;
    }

    try {
      setIsDownloading(true);
      const fileUri = FileSystem.cacheDirectory + "TrackPay_Update.apk";

      const downloadResumable = FileSystem.createDownloadResumable(
        updateData?.updateUrl,
        fileUri,
        {},
        (downloadProgress) => {
          const progress =
            downloadProgress.totalBytesWritten /
            downloadProgress.totalBytesExpectedToWrite;
          setDownloadProgress(progress);
        },
      );

      const { uri } = await downloadResumable.downloadAsync();
      setIsDownloading(false);

      // Trigger Android Installer
      const contentUri = await FileSystem.getContentUriAsync(uri);

      await IntentLauncher.startActivityAsync(
        "android.intent.action.INSTALL_PACKAGE",
        {
          data: contentUri,
          flags: 1, // Read permission
        },
      );
    } catch (error) {
      setIsDownloading(false);
      setDownloadProgress(0);
      Alert.alert(
        "Download Error",
        "Could not download the update automatically. Please use the browser.",
      );
      console.error(error);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconCircle}>
            <Ionicons
              name={isDownloading ? "download" : "cloud-download"}
              size={40}
              color="#2196F3"
            />
          </View>

          <Text style={styles.title}>Update Available!</Text>
          <Text style={styles.versionText}>
            Version {updateData?.latestVersion}
          </Text>

          <Text style={styles.description}>
            {isDownloading
              ? "Downloading update... Please do not close the app."
              : updateData?.releaseNotes ||
                "A new version of TrackPay is available with improved features."}
          </Text>

          {isDownloading ? (
            <View style={styles.progressContainer}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${downloadProgress * 100}%` },
                ]}
              />
              <Text style={styles.progressText}>
                {Math.round(downloadProgress * 100)}%
              </Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.updateBtn} onPress={handleUpdate}>
              <Text style={styles.updateBtnText}>Update Now</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 25,
    padding: 30,
    alignItems: "center",
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  title: { fontSize: 22, fontWeight: "bold", color: "#333" },
  versionText: {
    fontSize: 14,
    color: "#2196F3",
    marginBottom: 15,
    fontWeight: "600",
  },
  description: {
    textAlign: "center",
    color: "#666",
    marginBottom: 25,
    lineHeight: 22,
  },
  updateBtn: {
    backgroundColor: "#2196F3",
    paddingVertical: 15,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  updateBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

  // Progress Styles
  progressContainer: {
    width: "100%",
    height: 10,
    backgroundColor: "#EEE",
    borderRadius: 5,
    overflow: "hidden",
    position: "relative",
  },
  progressBar: { height: "100%", backgroundColor: "#2196F3" },
  progressText: {
    marginTop: 10,
    fontSize: 12,
    color: "#2196F3",
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default UpdateModal;
