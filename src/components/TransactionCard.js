import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const TransactionCard = ({ transaction, onDelete }) => {
  const isIncome = transaction.type === "income";

  return (
    <View style={styles.tableRow}>
      {/* Icon Column */}
      <View style={styles.iconCol}>
        <Ionicons
          name={isIncome ? "arrow-down-circle" : "arrow-up-circle"}
          size={24}
          color={isIncome ? "#4CAF50" : "#f44336"}
        />
      </View>

      {/* Details Column */}
      <View style={styles.detailsCol}>
        <Text style={styles.description} numberOfLines={1}>
          {transaction.description || transaction.category}
        </Text>
        <Text style={styles.dateText}>
          {new Date(transaction.date).toLocaleDateString()}
        </Text>
      </View>

      {/* Amount Column */}
      <View style={styles.amountCol}>
        <Text
          style={[styles.amount, { color: isIncome ? "#4CAF50" : "#f44336" }]}
        >
          {isIncome ? "+" : "-"}₹{transaction.amount.toLocaleString()}
        </Text>
      </View>

      {/* Action Column */}
      <TouchableOpacity
        onPress={() => onDelete(transaction.id)}
        style={styles.actionCol}
      >
        <Ionicons name="trash-outline" size={18} color="#AAA" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  iconCol: { width: 40 },
  detailsCol: { flex: 2, paddingHorizontal: 5 },
  amountCol: { flex: 1.5, alignItems: "flex-end" },
  actionCol: { width: 40, alignItems: "flex-end" },
  description: { fontSize: 14, fontWeight: "600", color: "#333" },
  dateText: { fontSize: 11, color: "#999", marginTop: 2 },
  amount: { fontSize: 15, fontWeight: "bold" },
});

export default TransactionCard;
