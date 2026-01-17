import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { customerAPI } from '../../api/client';

const CustomerDetailScreen = ({ route, navigation }) => {
  const { customerId } = route.params;
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddPurchase, setShowAddPurchase] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [newPurchase, setNewPurchase] = useState({
    amount: '',
    paid: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [paymentAmount, setPaymentAmount] = useState('');

  useEffect(() => {
    loadCustomer();
  }, [customerId]);

  const loadCustomer = async () => {
    try {
      setLoading(true);
      const response = await customerAPI.getOne(customerId);
      setCustomer(response.data);
    } catch (error) {
      console.error('Failed to load customer:', error);
      Alert.alert('Error', 'Failed to load customer details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPurchase = async () => {
    if (!newPurchase.amount) {
      Alert.alert('Error', 'Please enter amount');
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
      setNewPurchase({ amount: '', paid: '', description: '', date: new Date().toISOString().split('T')[0] });
      loadCustomer();
      Alert.alert('Success', 'Purchase added successfully');
    } catch (error) {
      console.error('Failed to add purchase:', error);
      Alert.alert('Error', 'Failed to add purchase');
    }
  };

  const handleAddPayment = async () => {
    if (!paymentAmount || !selectedPurchase) {
      Alert.alert('Error', 'Please enter payment amount');
      return;
    }

    const purchase = customer.purchases.find(p => p._id === selectedPurchase);
    const newPaid = purchase.paid + parseFloat(paymentAmount);

    if (newPaid > purchase.amount) {
      Alert.alert('Error', 'Payment amount exceeds remaining balance');
      return;
    }

    try {
      await customerAPI.updatePurchase(customerId, selectedPurchase, {
        ...purchase,
        paid: newPaid,
      });
      
      setShowAddPayment(false);
      setPaymentAmount('');
      setSelectedPurchase(null);
      loadCustomer();
      Alert.alert('Success', 'Payment recorded successfully');
    } catch (error) {
      console.error('Failed to record payment:', error);
      Alert.alert('Error', 'Failed to record payment');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (!customer) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Customer not found</Text>
      </View>
    );
  }

  const totalAmount = customer.purchases.reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = customer.purchases.reduce((sum, p) => sum + p.paid, 0);
  const pending = totalAmount - totalPaid;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{customer.name}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Customer Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="location" size={20} color="#2196F3" />
            <Text style={styles.infoText}>{customer.location || 'No location'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call" size={20} color="#2196F3" />
            <Text style={styles.infoText}>{customer.phone}</Text>
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Amount:</Text>
            <Text style={styles.summaryValue}>${totalAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Paid:</Text>
            <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>${totalPaid.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Pending Amount:</Text>
            <Text style={[styles.totalValue, { color: pending > 0 ? '#f44336' : '#4CAF50' }]}>
              ${pending.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Add Purchase Button */}
        <TouchableOpacity style={styles.addPurchaseBtn} onPress={() => setShowAddPurchase(true)}>
          <Ionicons name="add-circle" size={24} color="#fff" />
          <Text style={styles.addPurchaseBtnText}>Add Purchase</Text>
        </TouchableOpacity>

        {/* Purchase History */}
        <Text style={styles.sectionTitle}>Purchase History</Text>
        {customer.purchases.map((purchase) => {
          const remaining = purchase.amount - purchase.paid;
          return (
            <View key={purchase._id} style={styles.purchaseCard}>
              <View style={styles.purchaseHeader}>
                <Text style={styles.purchaseDescription}>
                  {purchase.description || 'No description'}
                </Text>
                <Text style={styles.purchaseDate}>
                  {new Date(purchase.date).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.purchaseDetails}>
                <View style={styles.purchaseDetailRow}>
                  <Text style={styles.detailLabel}>Amount:</Text>
                  <Text style={styles.detailValue}>${purchase.amount.toFixed(2)}</Text>
                </View>
                <View style={styles.purchaseDetailRow}>
                  <Text style={styles.detailLabel}>Paid:</Text>
                  <Text style={[styles.detailValue, { color: '#4CAF50' }]}>
                    ${purchase.paid.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.purchaseDetailRow}>
                  <Text style={styles.detailLabel}>Remaining:</Text>
                  <Text style={[styles.detailValue, { color: remaining > 0 ? '#f44336' : '#4CAF50' }]}>
                    ${remaining.toFixed(2)}
                  </Text>
                </View>
              </View>
              {remaining > 0 && (
                <TouchableOpacity
                  style={styles.payBtn}
                  onPress={() => { setSelectedPurchase(purchase._id); setShowAddPayment(true); }}
                >
                  <Text style={styles.payBtnText}>Record Payment</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
        {customer.purchases.length === 0 && (
          <Text style={styles.emptyText}>No purchases recorded</Text>
        )}
      </ScrollView>

      {/* Add Purchase Modal */}
      <Modal
        visible={showAddPurchase}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddPurchase(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Purchase</Text>
              <TouchableOpacity onPress={() => setShowAddPurchase(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Total Amount *"
              keyboardType="decimal-pad"
              value={newPurchase.amount}
              onChangeText={(text) => setNewPurchase({ ...newPurchase, amount: text })}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Amount Paid"
              keyboardType="decimal-pad"
              value={newPurchase.paid}
              onChangeText={(text) => setNewPurchase({ ...newPurchase, paid: text })}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Description"
              value={newPurchase.description}
              onChangeText={(text) => setNewPurchase({ ...newPurchase, description: text })}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Date (YYYY-MM-DD)"
              value={newPurchase.date}
              onChangeText={(text) => setNewPurchase({ ...newPurchase, date: text })}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancelBtn]}
                onPress={() => setShowAddPurchase(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalAddBtn]}
                onPress={handleAddPurchase}
              >
                <Text style={styles.modalBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Payment Modal */}
      <Modal
        visible={showAddPayment}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddPayment(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Payment</Text>
              <TouchableOpacity onPress={() => setShowAddPayment(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Payment Amount"
              keyboardType="decimal-pad"
              value={paymentAmount}
              onChangeText={setPaymentAmount}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancelBtn]}
                onPress={() => setShowAddPayment(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalAddBtn]}
                onPress={handleAddPayment}
              >
                <Text style={styles.modalBtnText}>Record</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  summarySection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  addPurchaseBtn: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  addPurchaseBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  purchaseCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  purchaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  purchaseDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  purchaseDate: {
    fontSize: 14,
    color: '#666',
  },
  purchaseDetails: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
  },
  purchaseDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  payBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    alignItems: 'center',
  },
  payBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  modalBtn: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCancelBtn: {
    backgroundColor: '#f0f0f0',
  },
  modalAddBtn: {
    backgroundColor: '#2196F3',
  },
  modalCancelText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CustomerDetailScreen;