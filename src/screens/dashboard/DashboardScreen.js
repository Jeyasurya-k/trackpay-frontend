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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { transactionAPI } from "../../api/client";
import TransactionCard from "../../components/TransactionCard";
import PieChart from "../../components/PieChart";
import { useFocusEffect } from "@react-navigation/native";

const DashboardScreen = () => {
  const { user, logout } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [transactionType, setTransactionType] = useState("income");
  const [dateFilter, setDateFilter] = useState("currentMonth");
  const [categories] = useState([
    "Salary",
    "Freelance",
    "Food",
    "Transport",
    "Shopping",
    "Bills",
    "Entertainment",
    "Other",
  ]);

  const [newTransaction, setNewTransaction] = useState({
    amount: "",
    category: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [dateFilter])
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
      Alert.alert("Error", "Failed to load data");
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
        1
      ).toISOString();
      params.endDate = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0
      ).toISOString();
    }
    return params;
  };

  const handleAddTransaction = async () => {
    if (!newTransaction.amount || !newTransaction.category) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    try {
      await transactionAPI.create({
        ...newTransaction,
        type: transactionType,
        amount: parseFloat(newTransaction.amount),
      });

      setShowAddModal(false);
      setNewTransaction({
        amount: "",
        category: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
      });
      loadData();
      Alert.alert("Success", "Transaction added successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to add transaction");
    }
  };

  const handleDeleteTransaction = async (id) => {
    Alert.alert("Delete Transaction", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await transactionAPI.delete(id);
          loadData();
        },
      },
    ]);
  };

  const getPieChartData = () => {
    if (!summary) return [];
    const data = [
      {
        name: "Income",
        value: summary.income || 0,
        color: "#4CAF50",
        legendFontColor: "#333",
      },
      {
        name: "Expense",
        value: summary.expense || 0,
        color: "#f44336",
        legendFontColor: "#333",
      },
    ];
    return data.filter((d) => d.value > 0);
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
      {/* 1. Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>TrackPay</Text>
          <Text style={styles.headerSubtitle}>Welcome, {user?.username}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={24} color="#fff" />
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
        {/* 2. Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, styles.incomeCard]}>
            <Ionicons name="trending-up" size={24} color="#4CAF50" />
            <Text style={styles.summaryLabel}>Income</Text>
            <Text style={[styles.summaryAmount, styles.incomeText]}>
              ${summary?.income?.toFixed(2) || "0.00"}
            </Text>
          </View>
          <View style={[styles.summaryCard, styles.expenseCard]}>
            <Ionicons name="trending-down" size={24} color="#f44336" />
            <Text style={styles.summaryLabel}>Expense</Text>
            <Text style={[styles.summaryAmount, styles.expenseText]}>
              ${summary?.expense?.toFixed(2) || "0.00"}
            </Text>
          </View>
        </View>

        {/* 3. Visual Charts */}
        {getPieChartData().length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Overview</Text>
            <PieChart data={getPieChartData()} />
          </View>
        )}

        {/* 4. Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.incomeBtn]}
            onPress={() => {
              setTransactionType("income");
              setShowAddModal(true);
            }}
          >
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Income</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.expenseBtn]}
            onPress={() => {
              setTransactionType("expense");
              setShowAddModal(true);
            }}
          >
            <Ionicons name="remove-circle" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Expense</Text>
          </TouchableOpacity>
        </View>

        {/* 5. Transactions List */}
        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>Recent History</Text>
          {transactions.map((t) => (
            <TransactionCard
              key={t._id}
              transaction={t}
              onDelete={handleDeleteTransaction}
            />
          ))}
        </View>
      </ScrollView>

      {/* 6. Add Transaction Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add {transactionType}</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalInput}
              placeholder="Amount"
              keyboardType="decimal-pad"
              onChangeText={(t) =>
                setNewTransaction({ ...newTransaction, amount: t })
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
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    backgroundColor: "#2196F3",
    padding: 20,
    paddingTop: 50,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  headerSubtitle: { color: "#fff", opacity: 0.8 },
  summaryContainer: {
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryCard: {
    backgroundColor: "#fff",
    width: "48%",
    padding: 15,
    borderRadius: 12,
    elevation: 2,
  },
  incomeCard: { borderLeftWidth: 4, borderLeftColor: "#4CAF50" },
  expenseCard: { borderLeftWidth: 4, borderLeftColor: "#f44336" },
  summaryAmount: { fontSize: 18, fontWeight: "bold", marginTop: 5 },
  incomeText: { color: "#4CAF50" },
  expenseText: { color: "#f44336" },
  chartCard: {
    backgroundColor: "#fff",
    margin: 15,
    padding: 15,
    borderRadius: 12,
    elevation: 2,
  },
  chartTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: 15,
    justifyContent: "space-between",
  },
  actionBtn: {
    width: "48%",
    padding: 15,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  incomeBtn: { backgroundColor: "#4CAF50" },
  expenseBtn: { backgroundColor: "#f44336" },
  actionBtnText: { color: "#fff", fontWeight: "bold", marginLeft: 5 },
  transactionsSection: { padding: 15 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold" },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  saveBtn: {
    backgroundColor: "#2196F3",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontWeight: "bold" },
});

export default DashboardScreen;
