import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CONFIG } from '../config';

export default function Header({ title, subtitle, showBack, onBack, onSosPress }) {
  const handleDirectSos = () => {
    if (onSosPress) {
      onSosPress();
    } else {
      Linking.openURL(`tel:${CONFIG.POLICE_EMERGENCY}`);
    }
  };

  return (
    <View style={styles.headerContainer}>
      <View style={styles.leftRow}>
        {showBack ? (
          <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
        ) : (
          <View style={styles.brandIconBox}>
            <Ionicons name="construct" size={20} color="#FFFFFF" />
          </View>
        )}

        <View style={styles.titleColumn}>
          <Text style={styles.titleText} numberOfLines={1}>
            {title || 'MechGO'}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitleText} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : (
            <Text style={styles.taglineText}>Roadside Rescue 24x7</Text>
          )}
        </View>
      </View>

      {/* High-priority Emergency SOS Quick Dial Button */}
      <TouchableOpacity 
        style={styles.sosButton} 
        onPress={handleDirectSos} 
        activeOpacity={0.8}
      >
        <Ionicons name="alert-circle" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
        <Text style={styles.sosButtonText}>SOS</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  backButton: {
    padding: 6,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  brandIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: CONFIG.COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  titleColumn: {
    flex: 1,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  subtitleText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  taglineText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  sosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CONFIG.COLORS.danger,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  sosButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});
