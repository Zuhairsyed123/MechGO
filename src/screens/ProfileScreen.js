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

export default function ProfileScreen({
  vehicles = [],
  selectedVehicle,
  onSelectVehicle,
}) {
  const [allowLocation, setAllowLocation] = useState(true);
  const [allowMic, setAllowMic] = useState(true);
  const [sosAlerts, setSosAlerts] = useState(true);

  const handleAddVehicle = () => {
    Alert.alert('Add Vehicle', 'Garage feature is connected. You can register your Car, Bike, or EV with license number.');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Driver Profile Header */}
      <View style={styles.profileCard}>
        <View style={styles.avatarBox}>
          <Ionicons name="person" size={28} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>Amitabh Verma</Text>
          <Text style={styles.userPhone}>+91 98201 54321</Text>
          <Text style={styles.userMembership}>MechGO Verified Driver • Highway Safe</Text>
        </View>
      </View>

      {/* Saved Vehicles / Garage */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>My Vehicles (Garage)</Text>
        <TouchableOpacity onPress={handleAddVehicle} activeOpacity={0.7}>
          <Text style={styles.addVehicleLink}>+ Add Vehicle</Text>
        </TouchableOpacity>
      </View>

      {vehicles.map((v) => {
        const isSelected = selectedVehicle?.id === v.id;
        return (
          <TouchableOpacity
            key={v.id}
            style={[styles.vehicleCard, isSelected && styles.vehicleCardSelected]}
            onPress={() => onSelectVehicle(v)}
            activeOpacity={0.75}
          >
            <View style={styles.carIconBox}>
              <Ionicons
                name={v.type === 'Bike' ? 'bicycle-outline' : 'car-outline'}
                size={22}
                color={isSelected ? CONFIG.COLORS.primary : '#475569'}
              />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={styles.carTitle}>{v.make} {v.model}</Text>
                {isSelected && (
                  <View style={styles.activePill}>
                    <Text style={styles.activePillText}>Active</Text>
                  </View>
                )}
              </View>
              <Text style={styles.carSub}>{v.number} • {v.fuel} {v.type}</Text>
            </View>
          </TouchableOpacity>
        );
      })}

      {/* Emergency ICE Contacts */}
      <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Emergency SOS Contacts (ICE)</Text>
      <View style={styles.iceCard}>
        <View style={styles.iceRow}>
          <Ionicons name="shield" size={18} color={CONFIG.COLORS.danger} style={{ marginRight: 8 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.iceName}>Emergency Contact: Sunita Verma (Spouse)</Text>
            <Text style={styles.icePhone}>+91 98110 43210</Text>
          </View>
        </View>
        <Text style={styles.iceHint}>
          Automated SMS with live highway coordinates is sent when SOS is pressed.
        </Text>
      </View>

      {/* Hardware & Emergency Settings */}
      <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Hardware & Permissions</Text>
      <View style={styles.settingsCard}>
        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingLabel}>Live GPS Location Access</Text>
            <Text style={styles.settingDesc}>Allows pinpointing exact highway breakdown coordinates</Text>
          </View>
          <Switch
            value={allowLocation}
            onValueChange={setAllowLocation}
            trackColor={{ false: '#CBD5E1', true: CONFIG.COLORS.primary }}
          />
        </View>

        <View style={styles.settingDivider} />

        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingLabel}>Microphone Voice Input</Text>
            <Text style={styles.settingDesc}>Enables Hindi & Hinglish voice breakdown triage</Text>
          </View>
          <Switch
            value={allowMic}
            onValueChange={setAllowMic}
            trackColor={{ false: '#CBD5E1', true: CONFIG.COLORS.primary }}
          />
        </View>

        <View style={styles.settingDivider} />

        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingLabel}>Toll-Free Helpline 24x7</Text>
            <Text style={styles.settingDesc}>{CONFIG.MECHGO_TOLL_FREE}</Text>
          </View>
          <Ionicons name="call" size={18} color={CONFIG.COLORS.primary} />
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
    paddingBottom: 32,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: CONFIG.COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  userPhone: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  userMembership: {
    fontSize: 10,
    fontWeight: '700',
    color: CONFIG.COLORS.success,
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  addVehicleLink: {
    fontSize: 12,
    fontWeight: '700',
    color: CONFIG.COLORS.primary,
  },
  vehicleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  vehicleCardSelected: {
    borderColor: CONFIG.COLORS.primary,
    borderWidth: 1.5,
    backgroundColor: '#FAFDFE',
  },
  carIconBox: {
    width: 38,
    height: 38,
    borderRadius: 6,
    backgroundColor: CONFIG.COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  carTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  carSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  activePill: {
    backgroundColor: CONFIG.COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activePillText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  iceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iceName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  icePhone: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  iceHint: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 8,
    lineHeight: 14,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  settingLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  settingDesc: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  settingDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
});
