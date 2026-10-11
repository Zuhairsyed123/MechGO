import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CONFIG } from '../config';
import { DRIVER_SAFETY_CHECKLIST, SUPPORTED_LANGUAGES, MULTI_LANG_SAFETY_TIPS } from '../services/safetyService';

export default function SafetyCheckModal({
  visible,
  language = 'en',
  onLanguageChange,
  onConfirmSafe,
  onCancel,
}) {
  const [checkedItems, setCheckedItems] = useState({
    hazard_lights: true,
    safe_shoulder: true,
    passengers_safe: false,
    handbrake_gear: true,
  });

  const toggleCheck = (id) => {
    setCheckedItems({ ...checkedItems, [id]: !checkedItems[id] });
  };

  const handleDialEmergency = (number) => {
    Linking.openURL(`tel:${number}`);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.badgeWarning}>
              <Ionicons name="warning" size={18} color="#D97706" />
              <Text style={styles.badgeText}>CRITICAL SAFETY PROTOCOL</Text>
            </View>

            {/* Language Selector */}
            <View style={styles.langPills}>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.id}
                  style={[styles.langPill, language === lang.id && styles.langPillActive]}
                  onPress={() => onLanguageChange && onLanguageChange(lang.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.langPillText, language === lang.id && styles.langPillTextActive]}>
                    {lang.short}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Text style={styles.title}>
            {language === 'hi' && 'सड़क पर सुरक्षित रहें - सुरक्षा जांच'}
            {language === 'hinglish' && 'Roadside Safety Check - Pehle Safe Banein'}
            {language === 'en' && 'Driver Roadside Safety Verification'}
          </Text>

          <Text style={styles.subtitle}>
            {language === 'hi' && 'हाईवे पर मैकेनिक बुलाने से पहले यह सुनिश्चित करें कि आप और आपकी गाड़ी सुरक्षित स्थान पर हैं:'}
            {language === 'hinglish' && 'Highway par assistance request se pehle ensure karein ki aap safely parked hain:'}
            {language === 'en' && 'Before requesting mechanic dispatch, please confirm these essential highway safety measures:'}
          </Text>

          {/* Interactive Checklist */}
          <ScrollView style={styles.checklist}>
            {DRIVER_SAFETY_CHECKLIST.map((item) => {
              const isChecked = checkedItems[item.id];
              const itemText = item[language] || item.en;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.checkRow, isChecked && styles.checkRowChecked]}
                  onPress={() => toggleCheck(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                    {isChecked && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.checkText, isChecked && styles.checkTextChecked]}>
                      {itemText}
                    </Text>
                    {item.critical && (
                      <Text style={styles.criticalTag}>CRITICAL FOR NIGHT & HIGHWAY VISIBILITY</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Emergency SOS Callout */}
          <View style={styles.sosCard}>
            <Ionicons name="call" size={16} color={CONFIG.COLORS.danger} />
            <Text style={styles.sosText}>
              In severe highway accident or immediate danger? Call National Highway:
            </Text>
            <TouchableOpacity onPress={() => handleDialEmergency(CONFIG.NATIONAL_HIGHWAY_EMERGENCY)}>
              <Text style={styles.sosNumber}>1033</Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonsRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.confirmBtn} onPress={onConfirmSafe} activeOpacity={0.85}>
              <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.confirmBtnText}>I Am Safe, Proceed</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    width: '100%',
    maxWidth: 420,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.5,
  },
  langPills: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    padding: 2,
    gap: 2,
  },
  langPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  langPillActive: {
    backgroundColor: CONFIG.COLORS.primary,
  },
  langPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  langPillTextActive: {
    color: '#FFFFFF',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    marginBottom: 12,
  },
  checklist: {
    maxHeight: 220,
    marginBottom: 12,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  checkRowChecked: {
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: CONFIG.COLORS.success,
    borderColor: CONFIG.COLORS.success,
  },
  checkText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    lineHeight: 16,
  },
  checkTextChecked: {
    color: '#0F172A',
  },
  criticalTag: {
    fontSize: 8,
    fontWeight: '800',
    color: '#D97706',
    marginTop: 3,
    letterSpacing: 0.3,
  },
  sosCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 6,
    padding: 8,
    marginBottom: 14,
    gap: 6,
  },
  sosText: {
    fontSize: 10,
    color: '#991B1B',
    flex: 1,
  },
  sosNumber: {
    fontSize: 13,
    fontWeight: '900',
    color: CONFIG.COLORS.danger,
    textDecorationLine: 'underline',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: CONFIG.COLORS.primary,
    borderRadius: 6,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
