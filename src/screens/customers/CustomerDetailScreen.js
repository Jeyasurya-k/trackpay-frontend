import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { customerAPI } from "../../api/client";

export default function CustomerDetailScreen({ route, navigation }) {
  const { customerId } = route.params;
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddPurchase, setShowAddPurchase] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  const [newPurchase, setNewPurchase] = useState({
    amount: "",
    paid: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [paymentAmount, setPaymentAmount] = useState("");

  useEffect(() => {
    loadCustomer();
  }, [customerId]);

  const loadCustomer = async () => {
    try {
      setLoading(true);
      const response = await customerAPI.getOne(customerId);
      setCustomer(response.data);
    } catch (error) {
      Alert.alert("Error", "Failed to load customer details");
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIC: APPLY PAYMENT TO TOTAL PENDING (FIFO) ---
  const handleAddPayment = async () => {
    const amountToPay = parseFloat(paymentAmount);
    if (!paymentAmount || isNaN(amountToPay) || amountToPay <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    const allPurchases = [...(customer?.purchases || [])].sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );
    const totalPending = allPurchases.reduce(
      (sum, p) => sum + (p.amount - (p.paid || 0)),
      0,
    );

    if (amountToPay > totalPending) {
      Alert.alert("Error", "Payment exceeds total outstanding balance");
      return;
    }

    try {
      let remainingPayment = amountToPay;

      // Loop through purchases and update them until the payment amount is exhausted
      for (let purchase of allPurchases) {
        const balance = purchase.amount - (purchase.paid || 0);
        if (balance > 0 && remainingPayment > 0) {
          const paymentForThis = Math.min(balance, remainingPayment);
          const newPaid = (purchase.paid || 0) + paymentForThis;

          await customerAPI.updatePurchase(customerId, purchase.id, {
            ...purchase,
            paid: newPaid,
          });

          remainingPayment -= paymentForThis;
        }
      }

      setShowAddPayment(false);
      setPaymentAmount("");
      loadCustomer();
      Alert.alert(
        "Success",
        `Total payment of ₹${amountToPay} applied to balance`,
      );
    } catch (error) {
      Alert.alert("Error", "Failed to record payment");
    }
  };

  const handleAddPurchase = async () => {
    if (!newPurchase.amount) {
      Alert.alert("Error", "Please enter amount");
      return;
    }
    try {
      await customerAPI.addPurchase(customerId, {
        amount: parseFloat(newPurchase.amount),
        paid: parseFloat(newPurchase.paid) || 0,
        description: newPurchase.description,
        date: newPurchase.date,
      });
      setShowAddPurchase(false);
      setNewPurchase({
        amount: "",
        paid: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
      });
      loadCustomer();
    } catch (error) {
      Alert.alert("Error", "Failed to add purchase");
    }
  };

  if (loading || !customer)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );

  const allPurchases = customer.purchases || [];
  const totalAmount = allPurchases.reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = allPurchases.reduce((sum, p) => sum + (p.paid || 0), 0);
  const pending = totalAmount - totalPaid;

  const filteredPurchases = allPurchases.filter((p) => {
    const d = new Date(p.date);
    return (
      d.getMonth() === new Date().getMonth() &&
      d.getFullYear() === new Date().getFullYear()
    );
  });
  const paginatedPurchases = filteredPurchases.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
  const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage);

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{customer.name}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Main Scrollable Area */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={40} color="#fff" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.customerName}>{customer.name}</Text>
            <Text style={styles.infoText}>
              <Ionicons name="call" size={14} /> {customer.phone}
            </Text>
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Financial Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Bill</Text>
              <Text style={styles.summaryValueLarge}>₹{totalAmount}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Paid</Text>
              <Text style={[styles.summaryValueLarge, { color: "#4CAF50" }]}>
                ₹{totalPaid}
              </Text>
            </View>
            <View style={styles.pendingItem}>
              <Text style={styles.summaryLabel}>Total Outstanding Balance</Text>
              <Text
                style={[
                  styles.summaryValueLarge,
                  { color: pending > 0 ? "#f44336" : "#4CAF50", fontSize: 28 },
                ]}
              >
                ₹{pending.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.splitBtn, { backgroundColor: "#2196F3" }]}
            onPress={() => setShowAddPurchase(true)}
          >
            <Ionicons name="cart" size={20} color="#fff" />
            <Text style={styles.splitBtnText}>New Purchase</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.splitBtn, { backgroundColor: "#4CAF50" }]}
            onPress={() => setShowAddPayment(true)}
          >
            <Ionicons name="cash" size={20} color="#fff" />
            <Text style={styles.splitBtnText}>Pay Pending</Text>
          </TouchableOpacity>
        </View>

        {/* History Table */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>History (Current Month)</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Desc</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Amt</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Bal</Text>
            </View>
            {paginatedPurchases.map((p) => (
              <View key={p.id} style={styles.tableRow}>
                <View style={{ flex: 2 }}>
                  <Text style={styles.tableCellText}>
                    {p.description || "Purchase"}
                  </Text>
                  <Text style={styles.tableDateText}>
                    {new Date(p.date).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={{ flex: 1 }}>₹{p.amount}</Text>
                <Text
                  style={{
                    flex: 1,
                    color: p.amount - p.paid > 0 ? "#f44336" : "#4CAF50",
                  }}
                >
                  ₹{(p.amount - p.paid).toFixed(1)}
                </Text>
              </View>
            ))}
          </View>
          {totalPages > 1 && (
            <View style={styles.pagination}>
              <TouchableOpacity
                onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <Ionicons name="chevron-back" size={24} color="#2196F3" />
              </TouchableOpacity>
              <Text>
                Page {currentPage} of {totalPages}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
              >
                <Ionicons name="chevron-forward" size={24} color="#2196F3" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* MODAL: NEW PURCHASE */}
      <Modal visible={showAddPurchase} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Purchase</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Amount"
              keyboardType="decimal-pad"
              onChangeText={(t) =>
                setNewPurchase({ ...newPurchase, amount: t })
              }
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Paid"
              keyboardType="decimal-pad"
              onChangeText={(t) => setNewPurchase({ ...newPurchase, paid: t })}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Description"
              onChangeText={(t) =>
                setNewPurchase({ ...newPurchase, description: t })
              }
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setShowAddPurchase(false)}
                style={styles.modalBtn}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddPurchase}
                style={[styles.modalBtn, styles.modalAddBtn]}
              >
                <Text style={{ color: "#fff" }}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: PAY TOTAL PENDING */}
      <Modal visible={showAddPayment} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Receive Payment</Text>
            <View style={styles.paymentContext}>
              <Text style={styles.contextText}>
                Total Outstanding: ₹{pending.toFixed(2)}
              </Text>
            </View>
            <TextInput
              style={styles.modalInput}
              placeholder="Amount Paid Now"
              keyboardType="decimal-pad"
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setShowAddPayment(false)}
                style={styles.modalBtn}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddPayment}
                style={[styles.modalBtn, styles.modalAddBtn]}
              >
                <Text style={{ color: "#fff" }}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    backgroundColor: "#2196F3",
    padding: 20,
    paddingTop: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  content: { flex: 1, padding: 16 },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  customerName: { fontSize: 20, fontWeight: "bold" },
  infoText: { color: "#666", marginTop: 4 },
  summarySection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 12 },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap" },
  summaryItem: { width: "50%", marginBottom: 10 },
  pendingItem: {
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 10,
  },
  summaryLabel: { fontSize: 12, color: "#666" },
  summaryValueLarge: { fontSize: 20, fontWeight: "bold", color: "#2196F3" },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  splitBtn: {
    flex: 0.48,
    borderRadius: 10,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  splitBtnText: { color: "#fff", fontWeight: "bold", marginLeft: 8 },
  historySection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  table: { borderTopWidth: 1, borderColor: "#eee" },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 10,
    backgroundColor: "#f9f9f9",
  },
  tableHeaderText: { fontWeight: "bold", fontSize: 12 },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tableCellText: { fontSize: 13 },
  tableDateText: { fontSize: 10, color: "#999" },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: { backgroundColor: "#fff", borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 15 },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  modalButtons: { flexDirection: "row", justifyContent: "flex-end" },
  modalBtn: { padding: 12, marginLeft: 10 },
  modalAddBtn: { backgroundColor: "#2196F3", borderRadius: 8 },
  paymentContext: {
    backgroundColor: "#e3f2fd",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  contextText: { color: "#1976D2", fontWeight: "bold" },
});
