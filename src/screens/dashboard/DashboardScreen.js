import React, { useState, useCallback } from "react";
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
import { useFocusEffect } from "@react-navigation/native";
import { APP_CONFIG } from "../../config/constants";

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false); // New state
  const [transactionType, setTransactionType] = useState("expense");
  const [dateFilter, setDateFilter] = useState("currentMonth");

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [newTransaction, setNewTransaction] = useState({
    amount: "",
    category: "",
    description: "",
  });

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
      console.error("Failed to load data:", error);
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
      Alert.alert("Success", "Transaction recorded");
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

    // Define specific colors for your business categories
    const categoryColors = {
      "Customer Payment": "#4CAF50", // Green for income
      "Debt Recovery": "#8BC34A", // Light Green
      Salary: "#2196F3",
      Food: "#FF6384",
      // Default fallback colors
    };

    if (type === "main") {
      return [
        { name: "Income", value: summary.income, color: "#4CAF50" },
        { name: "Expense", value: summary.expense, color: "#f44336" },
      ].filter((d) => d.value > 0);
    } else {
      return Object.entries(summary.categoryBreakdown || {})
        .map(([name, value], i) => ({
          name,
          value,
          color:
            categoryColors[name] ||
            ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"][i % 4],
        }))
        .filter((d) => d.value > 0);
    }
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
      {/* Updated Header with Profile Icon */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>TrackPay</Text>
          <Text style={styles.headerSubtitle}>Manage your finances</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowProfileModal(true)}
          style={styles.profileIconBtn}
        >
          <Ionicons name="person-circle" size={40} color="#fff" />
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
        {/* ... (Filter, Summary Row, and Chart Card remain the same) ... */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Period:</Text>
          <TouchableOpacity
            style={[
              styles.filterBtn,
              dateFilter === "currentMonth" && styles.filterBtnActive,
            ]}
            onPress={() => setDateFilter("currentMonth")}
          >
            <Text
              style={[
                styles.filterBtnText,
                dateFilter === "currentMonth" && styles.filterBtnTextActive,
              ]}
            >
              This Month
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterBtn,
              dateFilter === "all" && styles.filterBtnActive,
            ]}
            onPress={() => setDateFilter("all")}
          >
            <Text
              style={[
                styles.filterBtnText,
                dateFilter === "all" && styles.filterBtnTextActive,
              ]}
            >
              All Time
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryRow}>
          <View style={[styles.miniCard, { borderBottomColor: "#4CAF50" }]}>
            <Text style={styles.miniLabel}>Income</Text>
            <Text style={[styles.miniAmount, { color: "#4CAF50" }]}>
              ₹{summary?.income?.toFixed(2)}
            </Text>
          </View>
          <View style={[styles.miniCard, { borderBottomColor: "#f44336" }]}>
            <Text style={styles.miniLabel}>Expense</Text>
            <Text style={[styles.miniAmount, { color: "#f44336" }]}>
              ₹{summary?.expense?.toFixed(2)}
            </Text>
          </View>
          <View style={[styles.miniCard, { borderBottomColor: "#2196F3" }]}>
            <Text style={styles.miniLabel}>Balance</Text>
            <Text style={[styles.miniAmount, { color: "#2196F3" }]}>
              ₹{summary?.balance?.toFixed(2)}
            </Text>
          </View>
        </View>

        {getPieChartData("main").length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Overview</Text>
            <PieChart data={getPieChartData("main")} />
          </View>
        )}

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

      {/* --- PROFILE MODAL --- */}
      <Modal visible={showProfileModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { borderTopLeftRadius: 25, borderTopRightRadius: 25 },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>User Profile</Text>
              <TouchableOpacity onPress={() => setShowProfileModal(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.profileInfoSection}>
              <View style={styles.profileAvatarLarge}>
                <Ionicons name="person" size={50} color="#2196F3" />
              </View>
              <Text style={styles.profileMainName}>
                {user?.username || "User"}
              </Text>
              <Text style={styles.profileEmail}>
                {user?.email || "No email provided"}
              </Text>
            </View>

            <View style={styles.profileDetailRow}>
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color="#666"
              />
              <Text style={styles.profileDetailText}>
                Account Status: Active
              </Text>
            </View>

            <TouchableOpacity
              style={styles.logoutActionBtn}
              onPress={() => {
                setShowProfileModal(false);
                logout();
              }}
            >
              <Ionicons name="log-out-outline" size={20} color="#f44336" />
              <Text style={styles.logoutActionText}>Logout of Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- ADD TRANSACTION MODAL --- */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Entry</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  transactionType === "income" && {
                    backgroundColor: "#4CAF50",
                  },
                ]}
                onPress={() => setTransactionType("income")}
              >
                <Text
                  style={[
                    styles.toggleBtnText,
                    transactionType === "income" && { color: "#fff" },
                  ]}
                >
                  Income
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  transactionType === "expense" && {
                    backgroundColor: "#f44336",
                  },
                ]}
                onPress={() => setTransactionType("expense")}
              >
                <Text
                  style={[
                    styles.toggleBtnText,
                    transactionType === "expense" && { color: "#fff" },
                  ]}
                >
                  Expense
                </Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalInput}
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={newTransaction.amount}
              onChangeText={(t) =>
                setNewTransaction({ ...newTransaction, amount: t })
              }
            />
            <TouchableOpacity
              style={styles.dateSelector}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#666" />
              <Text style={styles.dateText}>{date.toLocaleDateString()}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onDateChange}
              />
            )}
            <Text style={styles.pickerLabel}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
            >
              {APP_CONFIG.defaultCategories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    newTransaction.category === cat &&
                      styles.categoryChipSelected,
                  ]}
                  onPress={() =>
                    setNewTransaction({ ...newTransaction, category: cat })
                  }
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      newTransaction.category === cat &&
                        styles.categoryChipTextSelected,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput
              style={styles.modalInput}
              placeholder="Description (Optional)"
              value={newTransaction.description}
              onChangeText={(t) =>
                setNewTransaction({ ...newTransaction, description: t })
              }
            />
            <TouchableOpacity
              style={[
                styles.saveBtn,
                {
                  backgroundColor:
                    transactionType === "income" ? "#4CAF50" : "#f44336",
                },
              ]}
              onPress={handleAddTransaction}
            >
              <Text style={styles.saveBtnText}>Save {transactionType}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // ... (All your existing styles remain the same) ...
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
  profileIconBtn: { padding: 5 },
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
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#F0F0F0",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  toggleBtnText: { fontWeight: "bold", color: "#888" },
  modalInput: {
    backgroundColor: "#F8F9FA",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  dateText: { marginLeft: 10, color: "#333", fontSize: 16 },
  pickerLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
    fontWeight: "bold",
  },
  categoryScroll: { marginBottom: 20 },
  categoryChip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    marginRight: 10,
  },
  categoryChipSelected: { backgroundColor: "#2196F3" },
  categoryChipText: { color: "#666" },
  categoryChipTextSelected: { color: "#fff", fontWeight: "bold" },
  saveBtn: { padding: 16, borderRadius: 12, alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  // --- NEW PROFILE STYLES ---
  profileInfoSection: {
    alignItems: "center",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginBottom: 20,
  },
  profileAvatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  profileMainName: { fontSize: 22, fontWeight: "bold", color: "#333" },
  profileEmail: { fontSize: 14, color: "#666", marginTop: 5 },
  profileDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  profileDetailText: { marginLeft: 10, color: "#666", fontSize: 16 },
  logoutActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f44336",
    marginTop: 10,
  },
  logoutActionText: {
    marginLeft: 10,
    color: "#f44336",
    fontWeight: "bold",
    fontSize: 16,
  },
});
