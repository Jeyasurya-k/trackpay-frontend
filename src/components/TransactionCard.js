import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const TransactionCard = ({ transaction, onDelete }) => {
  const isIncome = transaction.type === "income";

  return (
    <View style={styles.card}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={isIncome ? "arrow-down-circle" : "arrow-up-circle"}
            size={40}
            color={isIncome ? "#4CAF50" : "#f44336"}
          />
        </View>
        <View style={styles.info}>
          <Text style={styles.description}>
            {transaction.description || transaction.category}
          </Text>
          <Text style={styles.category}>
            {transaction.category} •{" "}
            {new Date(transaction.date).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.amountContainer}>
          <Text
            style={[styles.amount, { color: isIncome ? "#4CAF50" : "#f44336" }]}
          >
            {isIncome ? "+" : "-"}${transaction.amount.toFixed(2)}
          </Text>
          {onDelete && (
            <TouchableOpacity
              onPress={() => onDelete(transaction.id)}
              style={styles.deleteBtn}
            >
              <Ionicons name="trash-outline" size={20} color="#f44336" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
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
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  category: {
    fontSize: 14,
    color: "#666",
  },
  amountContainer: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  deleteBtn: {
    padding: 4,
  },
});

export default TransactionCard;
