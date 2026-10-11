import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CONFIG } from '../config';

export default function PaymentScreen({ billData, onPaymentSuccess }) {
  const { mechanic, category, baseFee = 349, partsFee = 150 } = billData || {};
  const [selectedMethod, setSelectedMethod] = useState('upi'); // 'upi' | 'card' | 'cash'
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  const gstTax = Math.round((baseFee + partsFee) * 0.18);
  const totalAmount = baseFee + partsFee + gstTax;

  const handlePayNow = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsPaid(true);
    }, 1200);
  };

  const handleProceedToRating = () => {
    onPaymentSuccess({
      amount: totalAmount,
      method: selectedMethod,
      mechanic: mechanic,
      category: category,
    });
  };

  if (isPaid) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successIconBox}>
          <Ionicons name="checkmark-circle" size={54} color={CONFIG.COLORS.success} />
        </View>
        <Text style={styles.successTitle}>Payment Successful</Text>
        <Text style={styles.successAmount}>₹{totalAmount}</Text>
        <Text style={styles.successSubtitle}>
          Paid via {selectedMethod.toUpperCase()} to {mechanic?.name || 'Highway Rescue'}
        </Text>

        <View style={styles.receiptBox}>
          <Text style={styles.receiptLine}>• Transaction ID: TXN-{Math.floor(100000 + Math.random() * 900000)}</Text>
          <Text style={styles.receiptLine}>• Breakdown: {category || 'Roadside Assistance'}</Text>
          <Text style={styles.receiptLine}>• Status: Resolved & Verified</Text>
        </View>

        <TouchableOpacity style={styles.ratingButton} onPress={handleProceedToRating} activeOpacity={0.85}>
          <Text style={styles.ratingButtonText}>Rate Mechanic & Finish</Text>
          <Ionicons name="star" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Bill Summary Card */}
      <View style={styles.billCard}>
        <Text style={styles.billHeader}>Itemized Breakdown Invoice</Text>
        <Text style={styles.mechanicNameText}>{mechanic?.name || 'Authorized Mechanic'}</Text>

        <View style={styles.divider} />

        <View style={styles.billRow}>
          <Text style={styles.billLabel}>Base On-Site Visit & Triage</Text>
          <Text style={styles.billVal}>₹{baseFee}</Text>
        </View>

        <View style={styles.billRow}>
          <Text style={styles.billLabel}>Parts / Consumables / Labour</Text>
          <Text style={styles.billVal}>₹{partsFee}</Text>
        </View>

        <View style={styles.billRow}>
          <Text style={styles.billLabel}>GST (18% Service Tax)</Text>
          <Text style={styles.billVal}>₹{gstTax}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Payable</Text>
          <Text style={styles.totalVal}>₹{totalAmount}</Text>
        </View>
      </View>

      {/* Payment Methods */}
      <Text style={styles.sectionTitle}>Select Payment Method:</Text>

      {/* UPI */}
      <TouchableOpacity
        style={[styles.methodCard, selectedMethod === 'upi' && styles.methodCardActive]}
        onPress={() => setSelectedMethod('upi')}
        activeOpacity={0.7}
      >
        <View style={styles.methodIconBox}>
          <Ionicons name="phone-portrait-outline" size={20} color={CONFIG.COLORS.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.methodTitle}>UPI (GPay / PhonePe / Paytm)</Text>
          <Text style={styles.methodSub}>Instant UPI Intent & QR payment</Text>
        </View>
        {selectedMethod === 'upi' && (
          <Ionicons name="checkmark-circle" size={20} color={CONFIG.COLORS.primary} />
        )}
      </TouchableOpacity>

      {/* Credit / Debit Card */}
      <TouchableOpacity
        style={[styles.methodCard, selectedMethod === 'card' && styles.methodCardActive]}
        onPress={() => setSelectedMethod('card')}
        activeOpacity={0.7}
      >
        <View style={styles.methodIconBox}>
          <Ionicons name="card-outline" size={20} color={CONFIG.COLORS.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.methodTitle}>Credit / Debit Card</Text>
          <Text style={styles.methodSub}>Visa, MasterCard, RuPay</Text>
        </View>
        {selectedMethod === 'card' && (
          <Ionicons name="checkmark-circle" size={20} color={CONFIG.COLORS.primary} />
        )}
      </TouchableOpacity>

      {/* Cash on Service */}
      <TouchableOpacity
        style={[styles.methodCard, selectedMethod === 'cash' && styles.methodCardActive]}
        onPress={() => setSelectedMethod('cash')}
        activeOpacity={0.7}
      >
        <View style={styles.methodIconBox}>
          <Ionicons name="cash-outline" size={20} color={CONFIG.COLORS.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.methodTitle}>Cash on Service</Text>
          <Text style={styles.methodSub}>Pay cash directly to mechanic on spot</Text>
        </View>
        {selectedMethod === 'cash' && (
          <Ionicons name="checkmark-circle" size={20} color={CONFIG.COLORS.primary} />
        )}
      </TouchableOpacity>

      {/* Pay Now Button */}
      <TouchableOpacity
        style={styles.payButton}
        onPress={handlePayNow}
        disabled={isProcessing}
        activeOpacity={0.85}
      >
        {isProcessing ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={styles.payButtonText}>Pay ₹{totalAmount} Now</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CONFIG.COLORS.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  billCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  billHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  mechanicNameText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  billLabel: {
    fontSize: 12,
    color: '#475569',
  },
  billVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  totalVal: {
    fontSize: 18,
    fontWeight: '900',
    color: CONFIG.COLORS.primary,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  methodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  methodCardActive: {
    borderColor: CONFIG.COLORS.primary,
    backgroundColor: '#FAFDFE',
    borderWidth: 1.5,
  },
  methodIconBox: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: CONFIG.COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  methodTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  methodSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  payButton: {
    backgroundColor: CONFIG.COLORS.criticalCta,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    elevation: 3,
  },
  payButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  successContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconBox: {
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  successAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: CONFIG.COLORS.success,
    marginTop: 6,
    marginBottom: 6,
  },
  successSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
  },
  receiptBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 14,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  receiptLine: {
    fontSize: 12,
    color: '#334155',
    marginBottom: 4,
  },
  ratingButton: {
    backgroundColor: CONFIG.COLORS.primary,
    borderRadius: 8,
    paddingVertical: 14,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
