import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CONFIG } from '../config';
import { VoiceService } from '../services/voiceService';

export default function SplashScreen({ onPermissionsGranted, onSkip }) {
  const [requesting, setRequesting] = useState(false);
  const [locGranted, setLocGranted] = useState(false);
  const [micGranted, setMicGranted] = useState(false);

  const handleGrantPermissions = async () => {
    setRequesting(true);
    // Request mic
    const micRes = await VoiceService.requestMicPermission();
    setMicGranted(micRes.granted);

    // Call permission handler which fetches live GPS
    if (onPermissionsGranted) {
      await onPermissionsGranted();
    }
    setRequesting(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Brand Logo Box */}
        <View style={styles.logoBox}>
          <Ionicons name="construct" size={44} color="#FFFFFF" />
        </View>

        <Text style={styles.brandTitle}>MechGO</Text>
        <Text style={styles.tagline}>Never get stranded again.</Text>
        <Text style={styles.subtext}>
          On-demand roadside assistance across Indian highways and cities. Connect instantly with verified nearby mechanics.
        </Text>

        {/* Permission Explanation Box */}
        <View style={styles.permCard}>
          <Text style={styles.permCardTitle}>Required for Emergency Rescue:</Text>

          <View style={styles.permRow}>
            <View style={styles.permIconBox}>
              <Ionicons name="location" size={20} color={CONFIG.COLORS.primary} />
            </View>
            <View style={styles.permTextCol}>
              <Text style={styles.permLabel}>Live GPS Location</Text>
              <Text style={styles.permDesc}>
                Pinpoints your exact highway or street coordinate so mechanics can reach your stranded vehicle.
              </Text>
            </View>
          </View>

          <View style={styles.permRow}>
            <View style={styles.permIconBox}>
              <Ionicons name="mic" size={20} color={CONFIG.COLORS.primary} />
            </View>
            <View style={styles.permTextCol}>
              <Text style={styles.permLabel}>Microphone (Voice Input)</Text>
              <Text style={styles.permDesc}>
                Speak your breakdown issue in Hindi, English, or Hinglish without typing while stranded.
              </Text>
            </View>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleGrantPermissions}
          disabled={requesting}
          activeOpacity={0.8}
        >
          {requesting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.primaryButtonText}>Enable Location & Continue</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipButton} onPress={onSkip} activeOpacity={0.7}>
          <Text style={styles.skipButtonText}>Continue with Manual Address</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: CONFIG.COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    elevation: 4,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '700',
    color: CONFIG.COLORS.criticalCtaDark,
    marginTop: 4,
    marginBottom: 8,
  },
  subtext: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  permCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  permCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  permRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  permIconBox: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: CONFIG.COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  permTextCol: {
    flex: 1,
  },
  permLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  permDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 15,
  },
  primaryButton: {
    backgroundColor: CONFIG.COLORS.primary,
    borderRadius: 8,
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  skipButton: {
    marginTop: 14,
    paddingVertical: 6,
  },
  skipButtonText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
});
