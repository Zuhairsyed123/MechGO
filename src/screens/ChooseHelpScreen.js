import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Modal,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CONFIG } from '../config';
import { rankMechanicsWithAI } from '../services/dispatchService';

export default function ChooseHelpScreen({
  breakdownData,
  nearbyMechanics,
  userCoords,
  selectedVehicle,
  onEscalateToVisit,
  onBookingCompleted,
  onRateMechanic,
}) {
  const { category, aiDiagnosis, followUpAnswers } = breakdownData || {};

  // Radius state: starts at 1 km (with automatic 2 km fallback in ranking engine)
  const [searchRadiusKm, setSearchRadiusKm] = useState(1);

  // Rank mechanics using AI Smart Dispatch scoring & radius expansion
  const searchResult = useMemo(() => {
    return rankMechanicsWithAI({
      mechanics: nearbyMechanics || [],
      userCoords,
      category,
      diagnosis: aiDiagnosis,
      vehicleType: selectedVehicle?.type,
      searchRadiusKm,
      allowExpansion: true
    });
  }, [nearbyMechanics, userCoords, category, aiDiagnosis, selectedVehicle, searchRadiusKm]);

  const rankedMechanics = searchResult.mechanics || [];
  const [selectedMechanic, setSelectedMechanic] = useState(rankedMechanics[0] || null);

  // Update selected mechanic when list updates
  React.useEffect(() => {
    if (rankedMechanics.length > 0 && (!selectedMechanic || !rankedMechanics.some((m) => m.id === selectedMechanic.id))) {
      setSelectedMechanic(rankedMechanics[0]);
    }
  }, [rankedMechanics]);

  const [activeHelpMode, setActiveHelpMode] = useState('call_now'); // 'call_now' | 'book_call' | 'send_visit'
  const [selectedSlot, setSelectedSlot] = useState('Now');

  // Booking Card State for "Book a Call"
  const [scheduledCallBooking, setScheduledCallBooking] = useState(null);

  // Dispatching request simulation state
  const [isDispatching, setIsDispatching] = useState(false);

  // Post-call "Was your problem solved?" Modal
  const [showSolvedModal, setShowSolvedModal] = useState(false);
  const [lastCalledMechanic, setLastCalledMechanic] = useState(null);

  // Action 1: Call mechanic now via real Android phone dialer
  const handleCallMechanicNow = (mechanic) => {
    const mech = mechanic || selectedMechanic;
    if (!mech) return;

    setLastCalledMechanic(mech);

    // Open real phone dialer
    Linking.openURL(`tel:${mech.phone}`).then(() => {
      setTimeout(() => {
        setShowSolvedModal(true);
      }, 1500);
    }).catch((err) => {
      console.warn('Dialer error:', err);
      setShowSolvedModal(true);
    });
  };

  // Action 2: Book a scheduled call
  const handleConfirmBookCall = () => {
    if (!selectedMechanic) return;
    const booking = {
      id: `CALL-${Math.floor(1000 + Math.random() * 9000)}`,
      mechanic: selectedMechanic,
      slot: selectedSlot,
      category: category || 'Breakdown',
      timeLabel: selectedSlot === 'Now' ? 'Immediate Phone Guidance' : `Scheduled for ${selectedSlot}`,
    };
    setScheduledCallBooking(booking);
  };

  // Action 3: Dispatch mechanic with partner acceptance
  const handleDispatchMechanicWithSmartMatch = () => {
    if (!selectedMechanic) return;
    setIsDispatching(true);

    setTimeout(() => {
      setIsDispatching(false);
      onEscalateToVisit({
        mechanic: selectedMechanic,
        diagnosis: aiDiagnosis,
        category: category,
        followUpAnswers: followUpAnswers,
        escalatedFromCall: false,
      });
    }, 900);
  };

  // Post-call prompt resolution
  const handleProblemSolvedYes = () => {
    setShowSolvedModal(false);
    if (onRateMechanic) {
      onRateMechanic({
        mechanic: lastCalledMechanic || selectedMechanic,
        type: 'call',
        solved: true,
      });
    }
  };

  const handleProblemSolvedNo = () => {
    setShowSolvedModal(false);
    // Escalate to on-site visit with diagnosis and symptoms attached (No duplicate entry!)
    onEscalateToVisit({
      mechanic: lastCalledMechanic || selectedMechanic,
      diagnosis: aiDiagnosis,
      category: category,
      followUpAnswers: followUpAnswers,
      escalatedFromCall: true,
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* AI Smart Dispatch Diagnosis Header */}
      <View style={styles.triageBanner}>
        <View style={styles.triageBannerIcon}>
          <Ionicons name="sparkles" size={18} color={CONFIG.COLORS.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.triageBannerTitle}>
            {category || 'Breakdown'}: {aiDiagnosis?.issue || aiDiagnosis?.likelyIssue || 'Diagnosis Attached'}
          </Text>
          <Text style={styles.triageBannerSub}>
            Severity: {aiDiagnosis?.severity || 'Moderate'} • Est. Repair: ₹{aiDiagnosis?.estimatedCost || 350}
          </Text>
        </View>
        <View style={styles.aiMatchBadge}>
          <Text style={styles.aiMatchBadgeText}>AI Smart Matched</Text>
        </View>
      </View>

      {/* 3 Clear Resolution Options */}
      <Text style={styles.sectionTitle}>Choose Assistance Mode:</Text>
      <View style={styles.modesRow}>
        <TouchableOpacity
          style={[styles.modeTab, activeHelpMode === 'call_now' && styles.modeTabActive]}
          onPress={() => setActiveHelpMode('call_now')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="call"
            size={18}
            color={activeHelpMode === 'call_now' ? '#FFFFFF' : CONFIG.COLORS.primary}
          />
          <Text style={[styles.modeTabText, activeHelpMode === 'call_now' && styles.modeTabTextActive]}>
            Call Now
          </Text>
          <Text style={[styles.modeSubText, activeHelpMode === 'call_now' && styles.modeSubTextActive]}>
            Free / Remote Guidance
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeTab, activeHelpMode === 'book_call' && styles.modeTabActive]}
          onPress={() => setActiveHelpMode('book_call')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="calendar"
            size={18}
            color={activeHelpMode === 'book_call' ? '#FFFFFF' : CONFIG.COLORS.primary}
          />
          <Text style={[styles.modeTabText, activeHelpMode === 'book_call' && styles.modeTabTextActive]}>
            Book a Call
          </Text>
          <Text style={[styles.modeSubText, activeHelpMode === 'book_call' && styles.modeSubTextActive]}>
            Pick Time Slot
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeTab, activeHelpMode === 'send_visit' && styles.modeTabActive]}
          onPress={() => setActiveHelpMode('send_visit')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="car-sport"
            size={18}
            color={activeHelpMode === 'send_visit' ? '#FFFFFF' : CONFIG.COLORS.primary}
          />
          <Text style={[styles.modeTabText, activeHelpMode === 'send_visit' && styles.modeTabTextActive]}>
            Send Mechanic
          </Text>
          <Text style={[styles.modeSubText, activeHelpMode === 'send_visit' && styles.modeSubTextActive]}>
            On-site Rescue Visit
          </Text>
        </TouchableOpacity>
      </View>

      {/* Book Call Slot Selection */}
      {activeHelpMode === 'book_call' && !scheduledCallBooking && (
        <View style={styles.slotCard}>
          <Text style={styles.slotCardTitle}>Select Preferred Call Slot:</Text>
          <View style={styles.slotsRow}>
            {['Now', 'In 15 Mins', 'In 30 Mins', 'Custom'].map((slot) => (
              <TouchableOpacity
                key={slot}
                style={[styles.slotChip, selectedSlot === slot && styles.slotChipSelected]}
                onPress={() => setSelectedSlot(slot)}
                activeOpacity={0.7}
              >
                <Text style={[styles.slotChipText, selectedSlot === slot && styles.slotChipTextSelected]}>
                  {slot}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Scheduled Call Confirmation Card */}
      {scheduledCallBooking && (
        <View style={styles.bookingConfirmationCard}>
          <View style={styles.confirmHeaderRow}>
            <Ionicons name="checkmark-circle" size={20} color={CONFIG.COLORS.success} />
            <Text style={styles.confirmTitle}>Call Scheduled Successfully</Text>
          </View>
          <Text style={styles.confirmDetails}>
            Mechanic: {scheduledCallBooking.mechanic.name} ({scheduledCallBooking.slot})
          </Text>
          <Text style={styles.confirmPhone}>
            Direct Line: {scheduledCallBooking.mechanic.phone}
          </Text>

          {/* One-tap Real Call Button */}
          <TouchableOpacity
            style={styles.oneTapCallButton}
            onPress={() => handleCallMechanicNow(scheduledCallBooking.mechanic)}
            activeOpacity={0.8}
          >
            <Ionicons name="call" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.oneTapCallText}>Call Mechanic Directly Now</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Radius Expansion Banner when 0 mechanics found within 2 km */}
      {searchResult.status === 'EXPAND_REQUIRED' && (
        <View style={styles.expandAlertCard}>
          <View style={styles.expandAlertHeader}>
            <Ionicons name="location-outline" size={20} color="#D97706" />
            <Text style={styles.expandAlertTitle}>No Mechanics Within {searchResult.effectiveRadiusKm.toFixed(1)} km</Text>
          </View>
          <Text style={styles.expandAlertText}>
            No available mechanics with the required skills were found within {searchResult.effectiveRadiusKm.toFixed(1)} km of your live GPS fix.
          </Text>
          <TouchableOpacity
            style={styles.expandButton}
            onPress={() => setSearchRadiusKm(5)}
            activeOpacity={0.8}
          >
            <Ionicons name="expand" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.expandButtonText}>Expand Search Radius to 5.0 km</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Ranked Mechanics List */}
      <View style={styles.rankedHeaderRow}>
        <View>
          <Text style={styles.mechanicsListTitle}>
            Available Mechanics ({rankedMechanics.length}):
          </Text>
          <Text style={styles.rankedSub}>
            Within {searchResult.effectiveRadiusKm ? searchResult.effectiveRadiusKm.toFixed(1) : '2.0'} km • Sorted by Skill Match & Proximity
          </Text>
        </View>

        {searchRadiusKm < 5 && (
          <TouchableOpacity
            style={styles.radiusPillBtn}
            onPress={() => setSearchRadiusKm(5)}
            activeOpacity={0.7}
          >
            <Text style={styles.radiusPillText}>Expand to 5km</Text>
          </TouchableOpacity>
        )}
      </View>

      {rankedMechanics.map((mech, index) => {
        const isSelected = selectedMechanic?.id === mech.id;
        return (
          <TouchableOpacity
            key={mech.id}
            style={[styles.mechanicCard, isSelected && styles.mechanicCardSelected]}
            onPress={() => setSelectedMechanic(mech)}
            activeOpacity={0.75}
          >
            {/* Badges: Top match & Demo vs Real distinction */}
            <View style={styles.badgeRowTop}>
              {index === 0 && (
                <View style={styles.topMatchPill}>
                  <Ionicons name="sparkles" size={11} color="#FFFFFF" />
                  <Text style={styles.topMatchPillText}>#1 Smart Match ({mech.matchScore}% Score)</Text>
                </View>
              )}
              <View style={[styles.partnerTag, mech.isDemo ? styles.partnerTagDemo : styles.partnerTagReal]}>
                <Text style={[styles.partnerTagText, mech.isDemo ? styles.partnerTagTextDemo : styles.partnerTagTextReal]}>
                  {mech.isDemo ? 'Demo Catalog Partner' : 'Verified Live Workshop'}
                </Text>
              </View>
            </View>

            <View style={styles.mechCardTop}>
              <View style={styles.mechAvatarBox}>
                <Ionicons name="construct" size={18} color={CONFIG.COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={styles.mechName}>{mech.name}</Text>
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={12} color="#D97706" />
                    <Text style={styles.ratingText}>{mech.rating} ({mech.reviewsCount})</Text>
                  </View>
                </View>

                <Text style={styles.leadMechanicText}>
                  Lead Tech: {mech.leadMechanic} • {mech.experienceYears} yrs exp • {mech.availability}
                </Text>

                <Text style={styles.mechSpecialties}>
                  Specialties: {mech.specialties.join(' • ')}
                </Text>
              </View>
            </View>

            {/* Why Recommended Badge */}
            <View style={styles.whyRecommendedBox}>
              <Ionicons name="checkmark-circle" size={13} color={CONFIG.COLORS.success} />
              <Text style={styles.whyRecommendedText}>
                {mech.whyRecommended}
              </Text>
            </View>

            {/* ETA Truthful Notice */}
            <View style={styles.etaNoticeRow}>
              <Ionicons name="time-outline" size={12} color="#64748B" />
              <Text style={styles.etaNoticeText}>
                Arrival: {mech.etaLabel || `~${mech.etaMinutes} mins (Estimated • Traffic dependent)`}
              </Text>
            </View>

            <View style={styles.mechCardFooter}>
              <View style={styles.mechDistanceCol}>
                <Text style={styles.distanceLabel}>Straight-Line Distance</Text>
                <Text style={styles.distanceValue}>{mech.distanceKm.toFixed(2)} km</Text>
              </View>

              <View style={styles.pricingCol}>
                <Text style={styles.pricingLabel}>
                  {activeHelpMode === 'send_visit' ? 'On-site Visit' : 'Phone Guidance'}
                </Text>
                <Text style={styles.pricingValue}>
                  {activeHelpMode === 'send_visit' ? `₹${mech.visitFee}` : mech.callFeeLabel}
                </Text>
              </View>
            </View>

            {/* Direct Call Trigger inside Card */}
            {activeHelpMode === 'call_now' && (
              <TouchableOpacity
                style={styles.cardCallAction}
                onPress={() => handleCallMechanicNow(mech)}
                activeOpacity={0.8}
              >
                <Ionicons name="call" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.cardCallActionText}>Call {mech.leadMechanic} Now ({mech.callFeeLabel})</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        );
      })}

      {/* Main Bottom Execution Action */}
      {activeHelpMode === 'send_visit' && rankedMechanics.length > 0 && (
        <TouchableOpacity
          style={styles.mainActionCta}
          onPress={handleDispatchMechanicWithSmartMatch}
          disabled={isDispatching}
          activeOpacity={0.85}
        >
          {isDispatching ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator color="#0F172A" size="small" />
              <Text style={styles.mainActionCtaText}>Dispatching & Contacting Mechanic...</Text>
            </View>
          ) : (
            <Text style={styles.mainActionCtaText}>
              Dispatch {selectedMechanic?.name || 'Mechanic'} (₹{selectedMechanic?.visitFee || 349})
            </Text>
          )}
        </TouchableOpacity>
      )}

      {activeHelpMode === 'book_call' && !scheduledCallBooking && rankedMechanics.length > 0 && (
        <TouchableOpacity
          style={styles.mainActionCta}
          onPress={handleConfirmBookCall}
          activeOpacity={0.85}
        >
          <Text style={styles.mainActionCtaText}>
            Confirm Call Booking with {selectedMechanic?.name || 'Mechanic'}
          </Text>
        </TouchableOpacity>
      )}

      {/* "Was Your Problem Solved?" Post-Call Modal */}
      <Modal visible={showSolvedModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalIconBox}>
              <Ionicons name="help-circle" size={32} color={CONFIG.COLORS.primary} />
            </View>

            <Text style={styles.modalTitle}>Was your problem solved over the phone?</Text>
            <Text style={styles.modalSubtitle}>
              Did remote phone guidance with {lastCalledMechanic?.name || 'the mechanic'} solve the issue?
            </Text>

            <View style={styles.modalActionsRow}>
              {/* YES -> Closes booking with rating */}
              <TouchableOpacity
                style={styles.modalButtonYes}
                onPress={handleProblemSolvedYes}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.modalButtonYesText}>Yes, Solved!</Text>
              </TouchableOpacity>

              {/* NO -> Offers to send mechanic on-site with diagnosis already attached! */}
              <TouchableOpacity
                style={styles.modalButtonNo}
                onPress={handleProblemSolvedNo}
                activeOpacity={0.8}
              >
                <Ionicons name="car-sport" size={18} color="#0F172A" style={{ marginRight: 4 }} />
                <Text style={styles.modalButtonNoText}>No, Send On-Site</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  triageBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    gap: 10,
  },
  triageBannerIcon: {
    width: 34,
    height: 34,
    borderRadius: 6,
    backgroundColor: CONFIG.COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triageBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  triageBannerSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  aiMatchBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  aiMatchBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: CONFIG.COLORS.primary,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  modesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  modeTab: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  modeTabActive: {
    backgroundColor: CONFIG.COLORS.primary,
    borderColor: CONFIG.COLORS.primary,
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 4,
  },
  modeTabTextActive: {
    color: '#FFFFFF',
  },
  modeSubText: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  modeSubTextActive: {
    color: '#E2E8F0',
  },
  slotCard: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  slotCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  slotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  slotChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  slotChipSelected: {
    backgroundColor: CONFIG.COLORS.primary,
    borderColor: CONFIG.COLORS.primary,
  },
  slotChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  slotChipTextSelected: {
    color: '#FFFFFF',
  },
  bookingConfirmationCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
  },
  confirmHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  confirmTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: CONFIG.COLORS.success,
  },
  confirmDetails: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  confirmPhone: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 10,
  },
  oneTapCallButton: {
    backgroundColor: CONFIG.COLORS.success,
    borderRadius: 6,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  oneTapCallText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  expandAlertCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
    padding: 12,
    marginBottom: 14,
  },
  expandAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  expandAlertTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
  },
  expandAlertText: {
    fontSize: 11,
    color: '#78350F',
    lineHeight: 15,
    marginBottom: 10,
  },
  expandButton: {
    backgroundColor: '#D97706',
    borderRadius: 6,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  rankedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  mechanicsListTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  rankedSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  radiusPillBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  radiusPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: CONFIG.COLORS.primary,
  },
  mechanicCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  mechanicCardSelected: {
    borderColor: CONFIG.COLORS.primary,
    backgroundColor: '#FAFDFE',
    borderWidth: 1.5,
  },
  badgeRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  topMatchPill: {
    backgroundColor: CONFIG.COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  topMatchPillText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  partnerTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  partnerTagDemo: {
    backgroundColor: '#FEF3C7',
  },
  partnerTagReal: {
    backgroundColor: '#DCFCE7',
  },
  partnerTagText: {
    fontSize: 9,
    fontWeight: '700',
  },
  partnerTagTextDemo: {
    color: '#92400E',
  },
  partnerTagTextReal: {
    color: '#166534',
  },
  mechCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  mechAvatarBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: CONFIG.COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  mechName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  leadMechanicText: {
    fontSize: 11,
    color: '#475569',
    marginTop: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#78350F',
  },
  mechSpecialties: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  whyRecommendedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 4,
    gap: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  whyRecommendedText: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '600',
    flex: 1,
  },
  etaNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  etaNoticeText: {
    fontSize: 10,
    color: '#64748B',
  },
  mechCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  mechDistanceCol: {},
  distanceLabel: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  distanceValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 1,
  },
  pricingCol: {
    alignItems: 'flex-end',
  },
  pricingLabel: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  pricingValue: {
    fontSize: 13,
    fontWeight: '800',
    color: CONFIG.COLORS.primary,
    marginTop: 1,
  },
  cardCallAction: {
    backgroundColor: CONFIG.COLORS.primary,
    borderRadius: 6,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  cardCallActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  mainActionCta: {
    backgroundColor: CONFIG.COLORS.criticalCta,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    elevation: 3,
  },
  mainActionCtaText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    elevation: 6,
  },
  modalIconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: CONFIG.COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 20,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  modalButtonYes: {
    flex: 1,
    backgroundColor: CONFIG.COLORS.success,
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  modalButtonYesText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  modalButtonNo: {
    flex: 1,
    backgroundColor: CONFIG.COLORS.criticalCta,
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  modalButtonNoText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
});
