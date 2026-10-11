import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CONFIG } from '../config';
import LiveMap from '../widgets/LiveMap';
import { BREAKDOWN_CATEGORIES } from '../services/mockData';

export default function HomeScreen({
  userCoords,
  address,
  locationLoading,
  nearbyMechanics,
  selectedVehicle,
  onSelectVehiclePress,
  onGetHelpPress,
  onCategoryPress,
  onRefreshLocation,
}) {
  const handleDialHelpline = (number) => {
    Linking.openURL(`tel:${number}`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Active Vehicle & Highway Status Bar */}
      <View style={styles.vehicleBar}>
        <TouchableOpacity
          style={styles.vehicleInfo}
          onPress={onSelectVehiclePress}
          activeOpacity={0.7}
        >
          <View style={styles.carIconBox}>
            <Ionicons name="car-outline" size={20} color={CONFIG.COLORS.primary} />
          </View>
          <View>
            <Text style={styles.vehicleLabel}>Active Vehicle</Text>
            <Text style={styles.vehicleName}>
              {selectedVehicle ? `${selectedVehicle.make} ${selectedVehicle.model}` : 'Select Vehicle'}
            </Text>
            <Text style={styles.vehicleReg}>
              {selectedVehicle ? selectedVehicle.number : 'Tap to select'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchButton}
          onPress={onSelectVehiclePress}
          activeOpacity={0.7}
        >
          <Text style={styles.switchButtonText}>Change</Text>
        </TouchableOpacity>
      </View>

      {/* Live GPS Address Card */}
      <View style={styles.addressCard}>
        <View style={styles.addressLeft}>
          <View style={styles.gpsPulseDot} />
          <Ionicons name="location-sharp" size={18} color={CONFIG.COLORS.primary} style={{ marginRight: 6 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.addressHeader}>Live Rescue Location</Text>
            {locationLoading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <ActivityIndicator size="small" color={CONFIG.COLORS.primary} />
                <Text style={styles.addressFetching}>Acquiring real GPS lock...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.addressText} numberOfLines={1}>
                  {address?.short || 'Searching nearby highway...'}
                </Text>
                <Text style={styles.addressSubtext} numberOfLines={1}>
                  {address?.full || (userCoords ? `${userCoords.latitude.toFixed(5)}, ${userCoords.longitude.toFixed(5)}` : 'GPS active')}
                </Text>
              </>
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.gpsRefreshButton} onPress={onRefreshLocation} activeOpacity={0.7}>
          <Ionicons name="refresh" size={16} color="#475569" />
        </TouchableOpacity>
      </View>

      {/* Real Live Map Section */}
      <View style={styles.mapSection}>
        <LiveMap
          userCoords={userCoords}
          address={address}
          nearbyMechanics={nearbyMechanics}
          height={200}
          onRecenterPress={onRefreshLocation}
        />
        <View style={styles.mechanicsCountRow}>
          <Ionicons name="shield-checkmark" size={14} color={CONFIG.COLORS.success} />
          <Text style={styles.mechanicsCountText}>
            {nearbyMechanics.length} verified mechanics active within 5 km of your position
          </Text>
        </View>
      </View>

      {/* Primary Emergency CTA Button (Amber #F5A623 per Indian consumer app design) */}
      <TouchableOpacity
        style={styles.emergencyCta}
        onPress={() => onGetHelpPress()}
        activeOpacity={0.85}
      >
        <View style={styles.emergencyCtaRow}>
          <View style={styles.ctaIconBadge}>
            <Ionicons name="warning" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.ctaTextCol}>
            <Text style={styles.ctaTitle}>GET HELP NOW</Text>
            <Text style={styles.ctaSubtitle}>Voice AI diagnosis • Call or dispatch mechanic</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#0F172A" />
        </View>
      </TouchableOpacity>

      {/* Quick Problem Chips */}
      <View style={styles.chipsSection}>
        <Text style={styles.sectionTitle}>Quick Issue Selection</Text>
        <Text style={styles.sectionSubtitle}>Tap your issue to start instant voice / AI breakdown flow</Text>

        <View style={styles.chipsGrid}>
          {BREAKDOWN_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.chipCard, cat.urgent && styles.chipCardUrgent]}
              onPress={() => onCategoryPress(cat.name)}
              activeOpacity={0.7}
            >
              <View style={[styles.chipIconBox, cat.urgent && styles.chipIconBoxUrgent]}>
                <Ionicons
                  name={cat.icon}
                  size={20}
                  color={cat.urgent ? CONFIG.COLORS.danger : CONFIG.COLORS.primary}
                />
              </View>
              <Text style={styles.chipName} numberOfLines={1}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Direct Indian Highway Emergency Helplines */}
      <View style={styles.helplineSection}>
        <Text style={styles.sectionTitle}>Emergency Numbers (Direct Call)</Text>
        <View style={styles.helplineRow}>
          <TouchableOpacity
            style={styles.helplineCard}
            onPress={() => handleDialHelpline(CONFIG.NATIONAL_HIGHWAY_EMERGENCY)}
            activeOpacity={0.7}
          >
            <Ionicons name="call" size={16} color={CONFIG.COLORS.danger} />
            <Text style={styles.helplineName}>NHAI Highway (1033)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.helplineCard}
            onPress={() => handleDialHelpline(CONFIG.POLICE_EMERGENCY)}
            activeOpacity={0.7}
          >
            <Ionicons name="shield" size={16} color={CONFIG.COLORS.primary} />
            <Text style={styles.helplineName}>Police Helpline (112)</Text>
          </TouchableOpacity>
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
    paddingBottom: 24,
  },
  vehicleBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  carIconBox: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: CONFIG.COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  vehicleLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  vehicleName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  vehicleReg: {
    fontSize: 11,
    color: '#64748B',
  },
  switchButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
  },
  switchButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: CONFIG.COLORS.primary,
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  addressLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  gpsPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  addressHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addressText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 1,
  },
  addressSubtext: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  addressFetching: {
    fontSize: 11,
    color: '#64748B',
    marginLeft: 6,
  },
  gpsRefreshButton: {
    padding: 6,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
  },
  mapSection: {
    marginBottom: 16,
  },
  mechanicsCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#E2E8F0',
  },
  mechanicsCountText: {
    fontSize: 11,
    color: '#334155',
    marginLeft: 6,
    fontWeight: '600',
  },
  emergencyCta: {
    backgroundColor: CONFIG.COLORS.criticalCta,
    borderRadius: 8,
    padding: 14,
    marginBottom: 18,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  emergencyCtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ctaIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  ctaTextCol: {
    flex: 1,
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  ctaSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 1,
  },
  chipsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 10,
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '48%',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipCardUrgent: {
    borderColor: '#FECACA',
    backgroundColor: '#FFFBFB',
  },
  chipIconBox: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: CONFIG.COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  chipIconBoxUrgent: {
    backgroundColor: '#FEE2E2',
  },
  chipName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
  },
  helplineSection: {
    marginTop: 4,
  },
  helplineRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  helplineCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  helplineName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
});
