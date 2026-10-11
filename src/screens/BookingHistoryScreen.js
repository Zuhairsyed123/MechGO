import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CONFIG } from '../config';

export default function BookingHistoryScreen({ bookings = [] }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.headerTitle}>Rescue & Call History</Text>
      <Text style={styles.headerSub}>Records of roadside visits and mechanic phone guidance sessions</Text>

      {bookings.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="receipt-outline" size={36} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No past bookings yet</Text>
          <Text style={styles.emptySub}>Your emergency assistance calls and mechanic requests will appear here.</Text>
        </View>
      ) : (
        bookings.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.badgeRow}>
                <View
                  style={[
                    styles.typeBadge,
                    item.type === 'call' ? styles.typeBadgeCall : styles.typeBadgeVisit,
                  ]}
                >
                  <Ionicons
                    name={item.type === 'call' ? 'call' : 'car-sport'}
                    size={11}
                    color={item.type === 'call' ? CONFIG.COLORS.primary : CONFIG.COLORS.success}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.typeBadgeText,
                      { color: item.type === 'call' ? CONFIG.COLORS.primary : CONFIG.COLORS.success },
                    ]}
                  >
                    {item.type === 'call' ? 'Phone Guidance' : 'On-Site Visit'}
                  </Text>
                </View>

                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>{item.status || 'Completed'}</Text>
                </View>
              </View>

              <Text style={styles.dateText}>{item.date || 'Recent'}</Text>
            </View>

            <Text style={styles.mechanicName}>{item.mechanicName || item.mechanic?.name || 'Highway Mechanic'}</Text>
            <Text style={styles.categoryText}>Issue: {item.category || 'Breakdown Support'}</Text>

            {item.summary && (
              <Text style={styles.summaryText}>{item.summary}</Text>
            )}

            <View style={styles.cardFooter}>
              <View style={styles.idBox}>
                <Text style={styles.idText}>ID: {item.id}</Text>
              </View>
              <Text style={styles.amountText}>
                {item.amount === 0 ? 'Free Service' : `₹${item.amount}`}
              </Text>
            </View>
          </View>
        ))
      )}
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
    paddingBottom: 28,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 16,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  typeBadgeCall: {
    backgroundColor: CONFIG.COLORS.primaryLight,
  },
  typeBadgeVisit: {
    backgroundColor: '#DCFCE7',
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  dateText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  mechanicName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  categoryText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  summaryText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 15,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    marginTop: 10,
  },
  idBox: {},
  idText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  amountText: {
    fontSize: 13,
    fontWeight: '800',
    color: CONFIG.COLORS.primary,
  },
});
