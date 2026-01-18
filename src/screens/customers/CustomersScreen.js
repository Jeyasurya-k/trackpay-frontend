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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { customerAPI } from "../../api/client";
import CustomerCard from "../../components/CustomerCard";
import { useFocusEffect } from "@react-navigation/native";

export default function CustomersScreen({ navigation }) {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]); // List to display
  const [summary, setSummary] = useState({ totalAmount: 0, totalPending: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Search States
  const [searchQuery, setSearchQuery] = useState("");

  const [newCustomer, setNewCustomer] = useState({
    name: "",
    location: "",
    phone: "",
  });

  useFocusEffect(
    useCallback(() => {
      loadCustomers();
    }, []),
  );

  // Debounce logic for searching
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      handleSearch(searchQuery);
    }, 400); // 400ms delay

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, customers]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await customerAPI.getAll();
      setCustomers(response.data.customers);
      setFilteredCustomers(response.data.customers); // Initial set
      setSummary(response.data.summary);
    } catch (error) {
      console.error("Failed to load customers:", error);
      Alert.alert("Error", "Failed to load customers");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = (query) => {
    if (!query) {
      setFilteredCustomers(customers);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = customers.filter((customer) => {
      return (
        customer.name?.toLowerCase().includes(lowerQuery) ||
        customer.location?.toLowerCase().includes(lowerQuery) ||
        customer.phone?.includes(lowerQuery)
      );
    });
    setFilteredCustomers(filtered);
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone) {
      Alert.alert("Error", "Please fill required fields (Name and Phone)");
      return;
    }

    try {
      await customerAPI.create(newCustomer);
      setShowAddModal(false);
      setNewCustomer({ name: "", location: "", phone: "" });
      loadCustomers();
      Alert.alert("Success", "Customer added successfully");
    } catch (error) {
      console.error("Failed to add customer:", error);
      Alert.alert("Error", error.message || "Failed to add customer");
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Customers</Text>
        <TouchableOpacity
          onPress={() => setShowAddModal(true)}
          style={styles.addBtn}
        >
          <Ionicons name="add-circle" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search Bar Section */}
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Ionicons
            name="search"
            size={20}
            color="#999"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, location, or phone..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Ionicons name="cash-outline" size={24} color="#2196F3" />
          <View style={styles.summaryContent}>
            <Text style={styles.summaryLabel}>Total Amount</Text>
            <Text style={styles.summaryValue}>
              ₹{summary.totalAmount.toFixed(2)}
            </Text>
          </View>
        </View>
        <View style={styles.summaryCard}>
          <Ionicons name="time-outline" size={24} color="#f44336" />
          <View style={styles.summaryContent}>
            <Text style={styles.summaryLabel}>Total Pending</Text>
            <Text style={[styles.summaryValue, styles.pendingValue]}>
              ₹{summary.totalPending.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Customer List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              setSearchQuery(""); // Clear search on refresh
              loadCustomers();
            }}
          />
        }
      >
        {filteredCustomers.map((customer) => (
          <CustomerCard
            key={customer.id}
            customer={customer}
            onPress={() =>
              navigation.navigate("CustomerDetail", { customerId: customer.id })
            }
          />
        ))}
        {filteredCustomers.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={80} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery ? "No results found" : "No customers yet"}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery
                ? "Try searching for something else"
                : "Tap + to add your first customer"}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Add Customer Modal remains the same ... */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Customer</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Customer Name *"
              value={newCustomer.name}
              onChangeText={(text) =>
                setNewCustomer({ ...newCustomer, name: text })
              }
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Location (optional)"
              value={newCustomer.location}
              onChangeText={(text) =>
                setNewCustomer({ ...newCustomer, location: text })
              }
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Phone Number *"
              keyboardType="phone-pad"
              value={newCustomer.phone}
              onChangeText={(text) =>
                setNewCustomer({ ...newCustomer, phone: text })
              }
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancelBtn]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalAddBtn]}
                onPress={handleAddCustomer}
              >
                <Text style={styles.modalBtnText}>Add Customer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // Existing styles ...
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
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  addBtn: { padding: 4 },

  // NEW: Search Styles
  searchContainer: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 45,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },

  summaryContainer: { flexDirection: "row", padding: 16, gap: 12 },
  summaryCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    elevation: 3,
  },
  summaryContent: { marginLeft: 12, flex: 1 },
  summaryLabel: { fontSize: 12, color: "#666", marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: "bold", color: "#2196F3" },
  pendingValue: { color: "#f44336" },
  content: { flex: 1, padding: 16 },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: { fontSize: 18, color: "#666", marginTop: 16, fontWeight: "600" },
  emptySubtext: { fontSize: 14, color: "#999", marginTop: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#333" },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: "#f9f9f9",
  },
  modalButtons: { flexDirection: "row", gap: 12, marginTop: 10 },
  modalBtn: { flex: 1, padding: 15, borderRadius: 10, alignItems: "center" },
  modalCancelBtn: { backgroundColor: "#f0f0f0" },
  modalAddBtn: { backgroundColor: "#2196F3" },
  modalCancelText: { color: "#333", fontSize: 16, fontWeight: "bold" },
  modalBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
