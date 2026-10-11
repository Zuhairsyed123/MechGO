import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CONFIG } from '../config';
import LiveMap from '../widgets/LiveMap';
import StatusStepper from '../widgets/StatusStepper';

export default function LiveTrackingScreen({
  activeVisit,
  userCoords,
  address,
  onProceedToPayment,
}) {
  const { mechanic, category, diagnosis } = activeVisit || {};

  // Status progression: 0: Booked, 1: En Route, 2: Arrived, 3: Repairing, 4: Completed
  const [stepIndex, setStepIndex] = useState(1);
  const [etaMinutes, setEtaMinutes] = useState(mechanic?.etaMinutes || 14);

  // Moving tracking mechanic coordinates towards user's real GPS position
  const [mechCoords, setMechCoords] = useState({
    latitude: (userCoords?.latitude || 28.6139) + 0.008,
    longitude: (userCoords?.longitude || 77.2090) + 0.006,
  });

  // Simulated live GPS progression countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setEtaMinutes((prev) => {
        if (prev <= 2) {
          if (stepIndex < 2) setStepIndex(2); // Arrived
          return 2;
        }
        return prev - 1;
      });
    }, 6000);

    return () => clearInterval(timer);
  }, [stepIndex]);

  // Real phone dialer trigger
  const handleCallMechanic = () => {
    Linking.openURL(`tel:${mechanic?.phone || '+919876543210'}`);
  };

  const handleSimulateChat = () => {
    Alert.alert(
      'Live Chat with Mechanic',
      `${mechanic?.leadMechanic || 'Mechanic'}: "Main highway cut se 2 km door hoon. Spare parts aur jack ready hai. Please hazard lights on rakhein."`,
      [{ text: 'Reply: Okay' }]
    );
  };

  const handleAdvanceStep = () => {
    if (stepIndex < 4) {
      setStepIndex(stepIndex + 1);
    } else {
      // Completed -> Proceed to Payment
      onProceedToPayment({
        mechanic,
        category,
        diagnosis,
        baseFee: mechanic?.visitFee || 349,
        partsFee: diagnosis?.estimatedCost ? Math.max(diagnosis.estimatedCost - 200, 150) : 150,
      });
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Live Stepper */}
      <StatusStepper currentStepIndex={stepIndex} />

      {/* Live Route Map with Mechanic Marker */}
      <View style={styles.mapContainer}>
        <LiveMap
          userCoords={userCoords}
          address={address}
          trackingMechanic={{
            ...mechanic,
            latitude: mechCoords.latitude,
            longitude: mechCoords.longitude,
            etaMinutes: etaMinutes,
          }}
          height={220}
        />
      </View>

      {/* ETA & Status Card */}
      <View style={styles.statusCard}>
        <View style={styles.etaRow}>
          <View>
            <Text style={styles.etaLabel}>Estimated Arrival Time</Text>
            <Text style={styles.etaValue}>
              {stepIndex === 0 && 'Mechanic Dispatched'}
              {stepIndex === 1 && `~${etaMinutes} Minutes`}
              {stepIndex === 2 && 'Mechanic Has Arrived!'}
              {stepIndex === 3 && 'On-site Repair in Progress'}
              {stepIndex === 4 && 'Repair Completed!'}
            </Text>
          </View>
          <View style={styles.distanceBadge}>
            <Ionicons name="navigate-outline" size={14} color={CONFIG.COLORS.primary} />
            <Text style={styles.distanceBadgeText}>{mechanic?.distanceKm || '1.8'} km away</Text>
          </View>
        </View>

        {/* Mechanic Profile Details */}
        <View style={styles.mechanicRow}>
          <View style={styles.avatarCircle}>
            <Ionicons name="construct" size={20} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.mechanicName}>{mechanic?.name || 'Verified Highway Mechanic'}</Text>
            <Text style={styles.leadName}>Driver / Tech: {mechanic?.leadMechanic || 'Rajesh Sharma'}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <Ionicons name="star" size={12} color="#D97706" />
              <Text style={styles.ratingText}>{mechanic?.rating || '4.8'} • Verified Tech</Text>
            </View>
          </View>

          {/* Call & Chat Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.callIconBtn} onPress={handleCallMechanic} activeOpacity={0.8}>
              <Ionicons name="call" size={18} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.chatIconBtn} onPress={handleSimulateChat} activeOpacity={0.8}>
              <Ionicons name="chatbubble" size={18} color={CONFIG.COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Attached Diagnosis Details */}
      <View style={styles.attachedCard}>
        <Text style={styles.attachedTitle}>Attached Rescue Brief:</Text>
        <Text style={styles.attachedIssue}>• Problem: {category || 'General Breakdown'}</Text>
        {diagnosis?.likelyIssue && (
          <Text style={styles.attachedDiagnosis}>• AI Diagnosis: {diagnosis.likelyIssue}</Text>
        )}
        <Text style={styles.attachedTools}>• Tools on Board: Hydraulic jack, inflator, emergency jumpstart</Text>
      </View>

      {/* Progress Simulation / Progression Button */}
      <TouchableOpacity
        style={[
          styles.progressionButton,
          stepIndex === 4 && styles.progressionButtonComplete,
        ]}
        onPress={handleAdvanceStep}
        activeOpacity={0.85}
      >
        <Text style={styles.progressionButtonText}>
          {stepIndex === 1 && 'Simulate: Mechanic Arrived at Vehicle'}
          {stepIndex === 2 && 'Start On-site Repair Work'}
          {stepIndex === 3 && 'Complete Repair & Proceed to Bill'}
          {stepIndex === 4 && 'Proceed to Payment (₹' + ((mechanic?.visitFee || 349) + 150) + ')'}
        </Text>
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
  mapContainer: {
    marginBottom: 14,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  etaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
    marginBottom: 10,
  },
  etaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  etaValue: {
    fontSize: 18,
    fontWeight: '800',
    color: CONFIG.COLORS.primary,
    marginTop: 2,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: CONFIG.COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  distanceBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: CONFIG.COLORS.primary,
  },
  mechanicRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: CONFIG.COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  mechanicName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  leadName: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  callIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: CONFIG.COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: CONFIG.COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachedCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  attachedTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  attachedIssue: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  attachedDiagnosis: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  attachedTools: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  progressionButton: {
    backgroundColor: CONFIG.COLORS.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressionButtonComplete: {
    backgroundColor: CONFIG.COLORS.criticalCta,
  },
  progressionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
