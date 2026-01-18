import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAuth } from "../../context/AuthContext";
import { transactionAPI } from "../../api/client";
import TransactionCard from "../../components/TransactionCard";
import PieChart from "../../components/PieChart";
import ProfileModal from "../../components/ProfileModal"; // New Component
import UpdateModal from "../../components/UpdateModal"; // Version Check Component
import { useFocusEffect } from "@react-navigation/native";
import { APP_CONFIG, API_URL } from "../../config/constants";

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Version Update States
  const [updateVisible, setUpdateVisible] = useState(false);
  const [updateData, setUpdateData] = useState(null);

  const [transactionType, setTransactionType] = useState("expense");
  const [dateFilter, setDateFilter] = useState("currentMonth");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [newTransaction, setNewTransaction] = useState({
    amount: "",
    category: "",
    description: "",
  });

  // Check for app updates on mount
  useEffect(() => {
    checkAppVersion();
  }, []);

  const checkAppVersion = async () => {
    try {
      const response = await fetch(`${API_URL}/app-config`);
      const data = await response.json();
      if (data.latestVersion !== APP_CONFIG.version) {
        setUpdateData(data);
        setUpdateVisible(true);
      }
    } catch (error) {
      console.log("Version check failed", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [dateFilter]),
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const params = getDateParams();
      const [transactionsRes, summaryRes] = await Promise.all([
        transactionAPI.getAll(params),
        transactionAPI.getSummary(params),
      ]);
      setTransactions(transactionsRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      Alert.alert("Error", "Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getDateParams = () => {
    const params = {};
    if (dateFilter === "currentMonth") {
      const now = new Date();
      params.startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
      ).toISOString();
      params.endDate = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
      ).toISOString();
    }
    return params;
  };

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === "ios");
    setDate(currentDate);
  };

  const handleAddTransaction = async () => {
    if (!newTransaction.amount || !newTransaction.category) {
      Alert.alert("Error", "Please fill in the amount and category");
      return;
    }
    try {
      await transactionAPI.create({
        ...newTransaction,
        type: transactionType,
        amount: parseFloat(newTransaction.amount),
        date: date.toISOString(),
      });
      setShowAddModal(false);
      setNewTransaction({ amount: "", category: "", description: "" });
      setDate(new Date());
      loadData();
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to add transaction");
    }
  };

  const handleDeleteTransaction = async (id) => {
    Alert.alert("Delete", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await transactionAPI.delete(id);
            loadData();
          } catch (error) {
            Alert.alert("Error", "Failed to delete");
          }
        },
      },
    ]);
  };

  const getPieChartData = (type) => {
    if (!summary) return [];
    if (type === "main") {
      return [
        { name: "Income", value: summary.income, color: "#4CAF50" },
        { name: "Expense", value: summary.expense, color: "#f44336" },
      ].filter((d) => d.value > 0);
    }
    return Object.entries(summary.categoryBreakdown || {})
      .map(([name, value], i) => ({
        name,
        value,
        color: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"][i % 4],
      }))
      .filter((d) => d.value > 0);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>TrackPay</Text>
          <Text style={styles.headerSubtitle}>Welcome, {user?.username}</Text>
        </View>
        <TouchableOpacity onPress={() => setShowProfileModal(true)}>
          <Ionicons name="person-circle" size={42} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
          />
        }
      >
        {/* Filter Section */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Period:</Text>
          {["currentMonth", "all"].map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterBtn,
                dateFilter === f && styles.filterBtnActive,
              ]}
              onPress={() => setDateFilter(f)}
            >
              <Text
                style={[
                  styles.filterBtnText,
                  dateFilter === f && styles.filterBtnTextActive,
                ]}
              >
                {f === "currentMonth" ? "This Month" : "All Time"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Mini Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.miniCard, { borderBottomColor: "#4CAF50" }]}>
            <Text style={styles.miniLabel}>Income</Text>
            <Text style={[styles.miniAmount, { color: "#4CAF50" }]}>
              ₹{summary?.income?.toFixed(0)}
            </Text>
          </View>
          <View style={[styles.miniCard, { borderBottomColor: "#f44336" }]}>
            <Text style={styles.miniLabel}>Expense</Text>
            <Text style={[styles.miniAmount, { color: "#f44336" }]}>
              ₹{summary?.expense?.toFixed(0)}
            </Text>
          </View>
          <View style={[styles.miniCard, { borderBottomColor: "#2196F3" }]}>
            <Text style={styles.miniLabel}>Balance</Text>
            <Text style={[styles.miniAmount, { color: "#2196F3" }]}>
              ₹{summary?.balance?.toFixed(0)}
            </Text>
          </View>
        </View>

        {/* Charts */}
        {getPieChartData("main").length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Overview</Text>
            <PieChart data={getPieChartData("main")} />
          </View>
        )}

        {/* History */}
        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>Recent History</Text>
          {transactions.map((t) => (
            <TransactionCard
              key={t.id}
              transaction={t}
              onDelete={handleDeleteTransaction}
            />
          ))}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      {/* Externalized Modals */}
      <ProfileModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
        onLogout={logout}
      />

      <UpdateModal visible={updateVisible} updateData={updateData} />

      {/* Add Transaction Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Entry</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalInput}
              placeholder="Amount (₹)"
              keyboardType="decimal-pad"
              value={newTransaction.amount}
              onChangeText={(t) =>
                setNewTransaction({ ...newTransaction, amount: t })
              }
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Category (e.g. Salary, Food)"
              value={newTransaction.category}
              onChangeText={(t) =>
                setNewTransaction({ ...newTransaction, category: t })
              }
            />
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleAddTransaction}
            >
              <Text style={styles.saveBtnText}>Save Transaction</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    backgroundColor: "#2196F3",
    padding: 20,
    paddingTop: 60,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  headerSubtitle: { fontSize: 14, color: "#E3F2FD" },
  content: { flex: 1 },
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#fff",
  },
  filterLabel: { marginRight: 10, fontWeight: "bold", color: "#666" },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: "#F0F0F0",
    marginRight: 8,
  },
  filterBtnActive: { backgroundColor: "#2196F3" },
  filterBtnText: { fontSize: 12, color: "#666" },
  filterBtnTextActive: { color: "#fff", fontWeight: "bold" },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
  },
  miniCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    width: "31%",
    elevation: 2,
    borderBottomWidth: 3,
  },
  miniLabel: { fontSize: 10, color: "#888", marginBottom: 4 },
  miniAmount: { fontSize: 14, fontWeight: "bold" },
  chartCard: {
    backgroundColor: "#fff",
    margin: 15,
    padding: 15,
    borderRadius: 12,
    elevation: 3,
  },
  chartTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  transactionsSection: { padding: 15 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 15 },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 30,
    backgroundColor: "#2196F3",
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold" },
  modalInput: {
    backgroundColor: "#F8F9FA",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  saveBtn: {
    backgroundColor: "#2196F3",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
