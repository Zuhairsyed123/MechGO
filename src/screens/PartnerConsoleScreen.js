import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CONFIG } from '../config';
import { PartnerService, REJECTION_REASONS } from '../services/partnerService';

export default function PartnerConsoleScreen({ activeBooking, onJobAccepted, onJobRejected }) {
  const [profile, setProfile] = useState(PartnerService.getProfile());
  const [incomingRequest, setIncomingRequest] = useState(
    activeBooking ? {
      id: 'REQ-LIVE-9921',
      customer: 'Sunil Malhotra (Stranded Driver)',
      phone: '+91 98112 00192',
      vehicle: 'Hyundai Creta SX (DL 04 CZ 1190)',
      issue: activeBooking.category || 'Flat Tyre & Bent Rim',
      diagnosis: activeBooking.diagnosis?.likelyIssue || 'Wheel Puncture / Valve Stem Failure',
      severity: activeBooking.diagnosis?.severity || 'Moderate',
      distanceKm: 2.4,
      etaMinutes: 11,
      customerSafe: true,
      suggestedFee: 399
    } : null
  );

  const [requestStatus, setRequestStatus] = useState(null); // 'accepted' | 'rejected'
  const [rejectReason, setRejectReason] = useState(null);

  const toggleAvailability = () => {
    const next = profile.availability === 'Online' ? 'Offline' : 'Online';
    const updated = PartnerService.toggleAvailability(next);
    setProfile({ ...profile, availability: updated });
  };

  const handleAcceptJob = () => {
    setRequestStatus('accepted');
    PartnerService.acceptRequest(incomingRequest.id);
    Alert.alert(
      'Rescue Job Accepted',
      'You are assigned to Sunil Malhotra. Navigation coordinates loaded. Proceed with roadside safety kit.',
      [{ text: 'Start Navigation', onPress: () => onJobAccepted && onJobAccepted(incomingRequest) }]
    );
  };

  const handleRejectJob = (reason) => {
    setRequestStatus('rejected');
    setRejectReason(reason);
    PartnerService.rejectRequest(incomingRequest.id, reason);
    Alert.alert(
      'Job Declined & Re-routed',
      `Reason: "${reason}". Request has been immediately handed over to the next nearby partner garage.`,
      [{ text: 'OK', onPress: () => {
        setIncomingRequest(null);
        if (onJobRejected) onJobRejected(reason);
      }}]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Partner Header & Verification Badge */}
      <View style={styles.partnerHeaderCard}>
        <View style={styles.avatarRow}>
          <View style={styles.partnerAvatar}>
            <Ionicons name="construct" size={24} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.partnerName}>{profile.name}</Text>
            </View>
            <View style={styles.verifiedBadgeRow}>
              <Ionicons name="checkmark-seal" size={14} color={CONFIG.COLORS.success} />
              <Text style={styles.verifiedText}>{profile.verificationStatus} • License: {profile.garageLicenseNumber}</Text>
            </View>
          </View>
        </View>

        {/* Live Availability Toggle */}
        <View style={styles.availabilityRow}>
          <View>
            <Text style={styles.availLabel}>Partner Status</Text>
            <Text style={[styles.availStatus, { color: profile.availability === 'Online' ? CONFIG.COLORS.success : '#64748B' }]}>
              {profile.availability === 'Online' ? '● Online & Receiving Highway Jobs' : '○ Offline'}
            </Text>
          </View>
          <Switch
            value={profile.availability === 'Online'}
            onValueChange={toggleAvailability}
            trackColor={{ false: '#CBD5E1', true: CONFIG.COLORS.success }}
          />
        </View>
      </View>

      {/* Incoming Rescue Job Request Card (Acceptance / Rejection Workflow) */}
      {incomingRequest && !requestStatus && (
        <View style={styles.incomingJobCard}>
          <View style={styles.incomingHeader}>
            <View style={styles.pulseDot} />
            <Text style={styles.incomingTitle}>Incoming Roadside Rescue Alert!</Text>
            <Text style={styles.incomingDistance}>{incomingRequest.distanceKm} km away</Text>
          </View>

          <View style={styles.jobDetailBlock}>
            <Text style={styles.jobCustomer}>{incomingRequest.customer}</Text>
            <Text style={styles.jobVehicle}>Vehicle: {incomingRequest.vehicle}</Text>
            <Text style={styles.jobIssue}>Reported: {incomingRequest.issue}</Text>
            <Text style={styles.jobDiagnosis}>AI Diagnosis: {incomingRequest.diagnosis}</Text>
            
            <View style={styles.safetyTag}>
              <Ionicons name="shield-checkmark" size={12} color="#047857" />
              <Text style={styles.safetyTagText}>Driver Safety Verified (Hazard lights ON, parked on shoulder)</Text>
            </View>
          </View>

          <View style={styles.jobFeeRow}>
            <Text style={styles.jobFeeLabel}>Standard Payout for Visit</Text>
            <Text style={styles.jobFeeValue}>₹{incomingRequest.suggestedFee}</Text>
          </View>

          {/* Accept / Reject Buttons */}
          <View style={styles.jobActionButtons}>
            <TouchableOpacity
              style={styles.rejectBtn}
              onPress={() => {
                Alert.alert(
                  'Decline Rescue Request',
                  'Select reason for declining so system can re-route quickly:',
                  REJECTION_REASONS.map((r) => ({
                    text: r,
                    onPress: () => handleRejectJob(r),
                  })).concat([{ text: 'Cancel', style: 'cancel' }])
                );
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.rejectBtnText}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={handleAcceptJob}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.acceptBtnText}>Accept & Dispatch</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Partner Performance Stats */}
      <View style={styles.statsCard}>
        <Text style={styles.sectionTitle}>Partner Performance</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{profile.completedJobsCount}</Text>
            <Text style={styles.statLabel}>Jobs Solved</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{profile.rating}★</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{profile.acceptanceRatePercent}%</Text>
            <Text style={styles.statLabel}>Acceptance</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{profile.serviceRadiusKm} km</Text>
            <Text style={styles.statLabel}>Service Radius</Text>
          </View>
        </View>
      </View>

      {/* Supported Vehicles & Service Radius */}
      <View style={styles.configCard}>
        <Text style={styles.sectionTitle}>Garage Capabilities & Rates</Text>
        <View style={styles.configRow}>
          <Text style={styles.configLabel}>Base Call Fee (Phone Triage):</Text>
          <Text style={styles.configValue}>{profile.baseCallFee === 0 ? 'Free First Call' : `₹${profile.baseCallFee}`}</Text>
        </View>
        <View style={styles.configRow}>
          <Text style={styles.configLabel}>Base On-Site Visit Fee:</Text>
          <Text style={styles.configValue}>₹{profile.baseVisitFee}</Text>
        </View>
        <View style={styles.configRow}>
          <Text style={styles.configLabel}>Supported Vehicle Categories:</Text>
          <Text style={styles.configValue}>{profile.supportedVehicles.join(', ')}</Text>
        </View>

        <Text style={[styles.configLabel, { marginTop: 10, marginBottom: 6 }]}>Verified Skills on Record:</Text>
        <View style={styles.skillsTagRow}>
          {profile.skills.map((skill, sIdx) => (
            <View key={sIdx} style={styles.skillPill}>
              <Ionicons name="build" size={11} color={CONFIG.COLORS.primary} />
              <Text style={styles.skillPillText}>{skill}</Text>
            </View>
          ))}
        </View>
      </View>
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
    paddingBottom: 36,
  },
  partnerHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  partnerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: CONFIG.COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  partnerName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  verifiedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  verifiedText: {
    fontSize: 11,
    color: CONFIG.COLORS.success,
    fontWeight: '700',
  },
  availabilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  availLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  availStatus: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  incomingJobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: CONFIG.COLORS.primary,
    padding: 14,
    marginBottom: 14,
    elevation: 3,
  },
  incomingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
    marginBottom: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: CONFIG.COLORS.danger,
    marginRight: 6,
  },
  incomingTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: CONFIG.COLORS.primary,
    flex: 1,
  },
  incomingDistance: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  jobDetailBlock: {
    marginBottom: 10,
  },
  jobCustomer: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  jobVehicle: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  jobIssue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginTop: 2,
  },
  jobDiagnosis: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  safetyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 4,
    marginTop: 6,
  },
  safetyTagText: {
    fontSize: 10,
    color: '#065F46',
    fontWeight: '600',
  },
  jobFeeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingVertical: 8,
  },
  jobFeeLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  jobFeeValue: {
    fontSize: 16,
    fontWeight: '900',
    color: CONFIG.COLORS.primary,
  },
  jobActionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  rejectBtn: {
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  acceptBtn: {
    flex: 1,
    backgroundColor: CONFIG.COLORS.success,
    borderRadius: 6,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: CONFIG.COLORS.primary,
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  configCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  configLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  configValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
    flexShrink: 1,
    textAlign: 'right',
  },
  skillsTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  skillPillText: {
    fontSize: 10,
    color: '#334155',
    fontWeight: '600',
  },
});
