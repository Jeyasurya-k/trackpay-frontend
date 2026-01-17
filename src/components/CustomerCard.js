import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const CustomerCard = ({ customer, onPress }) => {
  const totalAmount = customer.purchases.reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = customer.purchases.reduce((sum, p) => sum + p.paid, 0);
  const pending = totalAmount - totalPaid;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={24} color="#fff" />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{customer.name}</Text>
          <Text style={styles.location}>
            <Ionicons name="location-outline" size={14} color="#666" />{" "}
            {customer.location || "No location"}
          </Text>
          <Text style={styles.phone}>
            <Ionicons name="call-outline" size={14} color="#666" />{" "}
            {customer.phone}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#2196F3" />
      </View>
      <View style={styles.divider} />
      <View style={styles.footer}>
        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Total</Text>
          <Text style={styles.amountValue}>${totalAmount.toFixed(2)}</Text>
        </View>
        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Paid</Text>
          <Text style={[styles.amountValue, { color: "#4CAF50" }]}>
            ${totalPaid.toFixed(2)}
          </Text>
        </View>
        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Pending</Text>
          <Text
            style={[
              styles.amountValue,
              { color: pending > 0 ? "#f44336" : "#4CAF50" },
            ]}
          >
            ${pending.toFixed(2)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  phone: {
    fontSize: 14,
    color: "#666",
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 12,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  amountBox: {
    alignItems: "center",
  },
  amountLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2196F3",
  },
});

export default CustomerCard;
