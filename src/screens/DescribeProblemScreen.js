import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CONFIG } from '../config';
import { VoiceService } from '../services/voiceService';
import { diagnoseBreakdownWithAI } from '../services/aiDiagnosticService';
import { BREAKDOWN_CATEGORIES } from '../services/mockData';
import {
  CATEGORY_FOLLOW_UPS,
  UPFRONT_ESTIMATES,
  SUPPORTED_LANGUAGES,
  MULTI_LANG_SAFETY_TIPS
} from '../services/safetyService';
import SafetyCheckModal from '../widgets/SafetyCheckModal';

export default function DescribeProblemScreen({
  initialCategory,
  selectedVehicle,
  onProceedToHelp,
}) {
  const [category, setCategory] = useState(initialCategory || 'Flat Tyre');
  const [description, setDescription] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState(null);

  // Multi-language: 'en' | 'hi' | 'hinglish'
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  // Follow-up answers for category
  const [followUpAnswers, setFollowUpAnswers] = useState({});

  // Safety Checklist Modal state
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [safetyVerified, setSafetyVerified] = useState(false);

  // AI Diagnostic State
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [aiDiagnosis, setAiDiagnosis] = useState(null);
  const [aiFallbackUsed, setAiFallbackUsed] = useState(false);

  // Mic Pulse animation
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let animationLoop;
    if (isListening) {
      animationLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      animationLoop.start();
    } else {
      pulseAnim.setValue(1);
    }

    return () => {
      if (animationLoop) animationLoop.stop();
    };
  }, [isListening]);

  // Voice Mic Toggle with truthful error handling and preservation of previous text
  const toggleVoiceInput = async () => {
    if (isListening) {
      VoiceService.stopListening();
      setIsListening(false);
      setInterimTranscript('');
      return;
    }

    setVoiceError(null);
    setInterimTranscript('');

    const perm = await VoiceService.requestMicPermission();
    if (!perm.granted) {
      setVoiceError(perm.error || 'Microphone access is unavailable.');
      Alert.alert(
        'Microphone Inactive',
        'Microphone is unavailable or permission was denied. You can directly type your description in English, Hindi, or Hinglish below.',
        [{ text: 'Type Description Instead' }]
      );
      return;
    }

    setIsListening(true);

    VoiceService.startListening({
      language: selectedLanguage,
      existingText: description,
      onInterimText: (interim) => {
        setInterimTranscript(interim);
      },
      onFinalText: (finalText) => {
        // Populate confirmed transcript into description field and let user edit
        setDescription((prev) => (prev ? `${prev} ${finalText}`.trim() : finalText));
        setInterimTranscript('');
        setIsListening(false);
        setVoiceError(null);
      },
      onError: ({ error, preservedText }) => {
        setIsListening(false);
        setInterimTranscript('');
        setVoiceError(error);
        // Explicitly preserve the user's last valid description
        if (preservedText && !description) {
          setDescription(preservedText);
        }
      },
      onStateChange: (st) => {
        if (st === 'idle' || st === 'error') {
          setIsListening(false);
          setInterimTranscript('');
        }
      }
    });
  };

  const handleFollowUpSelect = (questionId, option) => {
    setFollowUpAnswers({
      ...followUpAnswers,
      [questionId]: option,
    });
  };

  // Run AI breakdown diagnosis
  const handleRunAiDiagnosis = async () => {
    // 1. Mandatory Driver Safety Check before submitting
    if (!safetyVerified) {
      setShowSafetyModal(true);
      return;
    }

    // 2. Do not run diagnosis on empty or whitespace descriptions
    const cleanDesc = description.trim();
    if (!cleanDesc) {
      Alert.alert(
        'Describe Problem',
        'Please enter or speak a symptom description before running diagnostic triage.'
      );
      return;
    }

    setIsDiagnosing(true);

    // Enrich description with structured follow-up answers
    const followUpSummary = Object.entries(followUpAnswers)
      .map(([k, v]) => `${k}: ${v}`)
      .join('; ');
    const enrichedDescription = `${cleanDesc} ${followUpSummary ? `(Follow-ups: ${followUpSummary})` : ''}`.trim();

    const diagnosis = await diagnoseBreakdownWithAI({
      description: enrichedDescription,
      category,
      vehicleInfo: selectedVehicle,
      followUpAnswers
    });

    setAiDiagnosis(diagnosis);
    setAiFallbackUsed(diagnosis.source !== 'Live AI Analysis');
    setIsDiagnosing(false);
  };

  // When user confirms safety checklist, do NOT auto-diagnose! Simply close modal.
  const handleSafetyModalConfirmed = () => {
    setShowSafetyModal(false);
    setSafetyVerified(true);
  };

  const currentEstimates = UPFRONT_ESTIMATES[category] || UPFRONT_ESTIMATES['Other Issue'];
  const followUps = CATEGORY_FOLLOW_UPS[category] || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Driver Safety Badge / Banner */}
      <TouchableOpacity
        style={[styles.safetyBanner, safetyVerified ? styles.safetyBannerOk : styles.safetyBannerPending]}
        onPress={() => setShowSafetyModal(true)}
        activeOpacity={0.8}
      >
        <Ionicons
          name={safetyVerified ? 'shield-checkmark' : 'warning'}
          size={18}
          color={safetyVerified ? CONFIG.COLORS.success : '#D97706'}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.safetyBannerTitle}>
            {safetyVerified ? 'Highway Safety Verified ✓' : 'Step 1: Driver Roadside Safety Check'}
          </Text>
          <Text style={styles.safetyBannerSub}>
            {safetyVerified
              ? 'Hazard lights ON • Parked away from highway lanes'
              : 'Tap here to confirm hazard lights and safe passenger positioning'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#64748B" />
      </TouchableOpacity>

      {/* Language Toggle Header */}
      <View style={styles.languageBar}>
        <Text style={styles.languageBarLabel}>Language / भाषा:</Text>
        <View style={styles.languagePills}>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.id}
              style={[styles.langPill, selectedLanguage === lang.id && styles.langPillActive]}
              onPress={() => setSelectedLanguage(lang.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.langPillText, selectedLanguage === lang.id && styles.langPillTextActive]}>
                {lang.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Vehicle Summary Bar */}
      <View style={styles.vehicleHeader}>
        <Ionicons name="car" size={16} color={CONFIG.COLORS.primary} />
        <Text style={styles.vehicleHeaderText}>
          Active Vehicle: {selectedVehicle ? `${selectedVehicle.make} ${selectedVehicle.model} (${selectedVehicle.number})` : 'Maruti Swift Dzire'}
        </Text>
      </View>

      {/* Category selector chips */}
      <Text style={styles.sectionTitle}>1. Select Breakdown Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
        {BREAKDOWN_CATEGORIES.map((cat) => {
          const isSelected = category === cat.name;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
              onPress={() => {
                setCategory(cat.name);
                setFollowUpAnswers({});
                setAiDiagnosis(null); // Reset diagnosis when category changes
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.categoryChipText, isSelected && styles.categoryChipTextSelected]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Upfront Transparent Price Card */}
      <View style={styles.estimateCard}>
        <View style={styles.estimateCardTop}>
          <Ionicons name="pricetag-outline" size={16} color={CONFIG.COLORS.primary} />
          <Text style={styles.estimateCardTitle}>Upfront Price Estimate ({category})</Text>
        </View>
        <View style={styles.estimateRow}>
          <View style={styles.estCol}>
            <Text style={styles.estLabel}>Phone Call Guidance</Text>
            <Text style={styles.estVal}>{currentEstimates.callFee === 0 ? 'FREE 1st Call' : `₹${currentEstimates.callFee}`}</Text>
          </View>
          <View style={styles.estCol}>
            <Text style={styles.estLabel}>On-Site Visit Rate</Text>
            <Text style={styles.estVal}>₹{currentEstimates.visitMin} - ₹{currentEstimates.visitMax}</Text>
          </View>
          <View style={styles.estCol}>
            <Text style={styles.estLabel}>Estimated Arrival</Text>
            <Text style={styles.estVal}>{currentEstimates.avgTime}</Text>
          </View>
        </View>
        <Text style={styles.estimateNote}>*No hidden surge pricing on Indian highways. Arrival time is an estimate based on highway traffic.</Text>
      </View>

      {/* Category-Specific Follow-Up Questions (Customer Understanding) */}
      {followUps.length > 0 && (
        <View style={styles.followUpsBox}>
          <Text style={styles.sectionTitle}>2. Specific Details for {category}</Text>
          {followUps.map((fu) => {
            const currentSelected = followUpAnswers[fu.id];
            const qText = fu.question[selectedLanguage] || fu.question.en;

            return (
              <View key={fu.id} style={styles.fuQuestionBlock}>
                <Text style={styles.fuQuestionText}>• {qText}</Text>
                <View style={styles.fuOptionsRow}>
                  {fu.options.map((opt, oIdx) => {
                    const isOptSelected = currentSelected === opt;
                    return (
                      <TouchableOpacity
                        key={oIdx}
                        style={[styles.fuOptionChip, isOptSelected && styles.fuOptionChipSelected]}
                        onPress={() => handleFollowUpSelect(fu.id, opt)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.fuOptionText, isOptSelected && styles.fuOptionTextSelected]}>
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Voice & Text Description Box */}
      <View style={styles.inputHeaderRow}>
        <Text style={styles.sectionTitle}>3. Describe Symptoms</Text>
        <Text style={styles.langSupportText}>English • हिन्दी • Hinglish</Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          multiline
          numberOfLines={4}
          placeholder={
            selectedLanguage === 'hi'
              ? "माइक दबाकर बोलें या टाइप करें (उदा: 'गाड़ी में पेट्रोल खत्म हो गया है')..."
              : selectedLanguage === 'hinglish'
              ? "Mic daba kar bole ya type karein (e.g. 'Car ka petrol bilkul khatam ho gaya hai')..."
              : "Tap mic to speak or type here (e.g. 'Engine stalled, fuel gauge indicates empty')..."
          }
          placeholderTextColor="#94A3B8"
          value={description}
          onChangeText={setDescription}
        />

        {/* Big obvious mic button */}
        <View style={styles.micButtonContainer}>
          <TouchableOpacity
            style={[styles.micButton, isListening && styles.micButtonListening]}
            onPress={toggleVoiceInput}
            activeOpacity={0.8}
          >
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Ionicons
                name={isListening ? 'mic' : 'mic-outline'}
                size={26}
                color="#FFFFFF"
              />
            </Animated.View>
          </TouchableOpacity>
          <Text style={styles.micLabel}>{isListening ? 'Tap to Stop' : 'Tap to Speak'}</Text>
        </View>
      </View>

      {/* Interim Live Transcript Preview */}
      {isListening && interimTranscript ? (
        <View style={styles.interimBox}>
          <Ionicons name="mic" size={14} color={CONFIG.COLORS.danger} />
          <Text style={styles.interimText}>"{interimTranscript}..."</Text>
        </View>
      ) : null}

      {/* Voice Recognition Error Notice with Retry */}
      {voiceError ? (
        <View style={styles.fallbackNotice}>
          <Ionicons name="alert-circle-outline" size={16} color={CONFIG.COLORS.danger} />
          <Text style={styles.fallbackNoticeText}>{voiceError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={toggleVoiceInput}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Live Voice Listening Indicator */}
      {isListening && !voiceError ? (
        <View style={styles.listeningBar}>
          <View style={styles.redRecordingDot} />
          <Text style={styles.listeningBarText}>
            Listening... Speak clearly in {selectedLanguage === 'hi' ? 'Hindi' : 'English / Hinglish'}
          </Text>
        </View>
      ) : null}

      {/* Safety Guideline Snippet */}
      <View style={styles.safetyTipsSnippet}>
        <Ionicons name="shield-outline" size={14} color="#047857" />
        <Text style={styles.safetyTipsSnippetText}>
          {MULTI_LANG_SAFETY_TIPS[selectedLanguage]?.[0] || MULTI_LANG_SAFETY_TIPS.en[0]}
        </Text>
      </View>

      {/* AI Triage Trigger Button */}
      <TouchableOpacity
        style={styles.aiTriageButton}
        onPress={handleRunAiDiagnosis}
        disabled={isDiagnosing || isListening}
        activeOpacity={0.8}
      >
        {isDiagnosing ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ActivityIndicator color="#FFFFFF" size="small" />
            <Text style={styles.aiTriageButtonText}>Analyzing Symptoms with AI...</Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="sparkles" size={18} color="#FFFFFF" />
            <Text style={styles.aiTriageButtonText}>Diagnose Issue & Match Mechanics</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Clarification Alert if evidence conflicts */}
      {aiDiagnosis && aiDiagnosis.status === 'NEEDS_CLARIFICATION' && (
        <View style={styles.clarificationAlert}>
          <View style={styles.clarificationHeader}>
            <Ionicons name="help-circle" size={18} color="#D97706" />
            <Text style={styles.clarificationTitle}>Clarification Needed</Text>
          </View>
          <Text style={styles.clarificationText}>
            {aiDiagnosis.clarificationQuestion || 'Conflicting symptoms detected. Please verify your selected category.'}
          </Text>
        </View>
      )}

      {/* AI Diagnosis Result Card (Structured Diagnosis Summary) */}
      {aiDiagnosis && (
        <View style={styles.diagnosisCard}>
          <View style={styles.diagnosisHeader}>
            <View style={styles.diagnosisTitleRow}>
              <Ionicons name="shield-checkmark" size={18} color={CONFIG.COLORS.primary} />
              <Text style={styles.diagnosisTitle}>Diagnostic Triage Result</Text>
            </View>
            <View
              style={[
                styles.severityBadge,
                aiDiagnosis.severity === 'Critical'
                  ? styles.severityCritical
                  : styles.severityModerate,
              ]}
            >
              <Text style={styles.severityText}>{aiDiagnosis.severity} Severity</Text>
            </View>
          </View>

          {aiFallbackUsed && (
            <View style={styles.sourcePill}>
              <Text style={styles.sourcePillText}>Verified Category-Rule System Active</Text>
            </View>
          )}

          <Text style={styles.likelyIssueTitle}>{aiDiagnosis.issue}</Text>
          <Text style={styles.inferredCauseText}>Inferred Cause: {aiDiagnosis.inferredCause}</Text>

          {/* Safe to Drive Status */}
          <View
            style={[
              styles.driveSafetyBox,
              aiDiagnosis.safe_to_drive ? styles.driveSafeOk : styles.driveSafeStop,
            ]}
          >
            <Ionicons
              name={aiDiagnosis.safe_to_drive ? 'checkmark-circle' : 'alert-circle'}
              size={18}
              color={aiDiagnosis.safe_to_drive ? CONFIG.COLORS.success : CONFIG.COLORS.danger}
            />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text
                style={[
                  styles.driveSafetyHeading,
                  { color: aiDiagnosis.safe_to_drive ? CONFIG.COLORS.success : CONFIG.COLORS.danger },
                ]}
              >
                {aiDiagnosis.safe_to_drive ? 'Safe to Drive Slowly' : 'Do NOT Drive / Immediate Stop'}
              </Text>
              <Text style={styles.driveSafetyNote}>{aiDiagnosis.safe_to_drive_note}</Text>
            </View>
          </View>

          {/* Immediate Roadside Safety Steps */}
          {aiDiagnosis.immediate_advice && aiDiagnosis.immediate_advice.length > 0 && (
            <View style={styles.safetyStepsSection}>
              <Text style={styles.safetyStepsHeader}>Immediate Safety Advice:</Text>
              {aiDiagnosis.immediate_advice.map((step, idx) => (
                <View key={idx} style={styles.safetyStepItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.safetyStepText}>{step}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Recommended Mechanic Tools */}
          {aiDiagnosis.required_tools && aiDiagnosis.required_tools.length > 0 && (
            <View style={styles.mechanicKitSection}>
              <Text style={styles.mechanicKitHeader}>Required Tools / Equipment:</Text>
              <View style={styles.kitTagsRow}>
                {aiDiagnosis.required_tools.map((item, idx) => (
                  <View key={idx} style={styles.kitTag}>
                    <Ionicons name="construct" size={12} color={CONFIG.COLORS.primary} />
                    <Text style={styles.kitTagText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Estimated Cost and Time */}
          <View style={styles.estimatesRow}>
            <View style={styles.estimateCol}>
              <Text style={styles.estimateLabel}>Estimated Arrival</Text>
              <Text style={styles.estimateValue}>{aiDiagnosis.estimatedRepairTime}</Text>
            </View>
            <View style={styles.estimateCol}>
              <Text style={styles.estimateLabel}>Estimated Repair</Text>
              <Text style={styles.estimateValue}>₹{aiDiagnosis.estimatedCost}</Text>
            </View>
          </View>

          {/* Proceed to Choose Help Button */}
          <TouchableOpacity
            style={styles.proceedButton}
            onPress={() => onProceedToHelp({
              category,
              description: description.trim(),
              followUpAnswers,
              aiDiagnosis
            })}
            activeOpacity={0.8}
          >
            <Text style={styles.proceedButtonText}>See Ranked Mechanics & Choose Help</Text>
            <Ionicons name="arrow-forward" size={18} color="#0F172A" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>
      )}

      {/* Driver Safety Check Modal */}
      <SafetyCheckModal
        visible={showSafetyModal}
        language={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
        onConfirmSafe={handleSafetyModalConfirmed}
        onCancel={() => setShowSafetyModal(false)}
      />
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
  safetyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 10,
  },
  safetyBannerPending: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
  },
  safetyBannerOk: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  safetyBannerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  safetyBannerSub: {
    fontSize: 10,
    color: '#475569',
    marginTop: 1,
  },
  languageBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  languageBarLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  languagePills: {
    flexDirection: 'row',
    gap: 4,
  },
  langPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
  },
  langPillActive: {
    backgroundColor: CONFIG.COLORS.primary,
  },
  langPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  langPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    gap: 8,
  },
  vehicleHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  categoriesScroll: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  categoryChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  categoryChipSelected: {
    backgroundColor: CONFIG.COLORS.primary,
    borderColor: CONFIG.COLORS.primary,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
  },
  estimateCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  estimateCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  estimateCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: CONFIG.COLORS.primary,
  },
  estimateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  estCol: {
    flex: 1,
  },
  estLabel: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  estVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  estimateNote: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 6,
  },
  followUpsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  fuQuestionBlock: {
    marginBottom: 10,
  },
  fuQuestionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 6,
  },
  fuOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  fuOptionChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  fuOptionChipSelected: {
    backgroundColor: CONFIG.COLORS.primaryLight,
    borderColor: CONFIG.COLORS.primary,
  },
  fuOptionText: {
    fontSize: 11,
    color: '#475569',
  },
  fuOptionTextSelected: {
    color: CONFIG.COLORS.primary,
    fontWeight: '700',
  },
  inputHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  langSupportText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    minHeight: 76,
    textAlignVertical: 'top',
    paddingRight: 10,
  },
  micButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 6,
    borderLeftWidth: 1,
    borderLeftColor: '#F1F5F9',
  },
  micButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: CONFIG.COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  micButtonListening: {
    backgroundColor: CONFIG.COLORS.danger,
  },
  micLabel: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '600',
  },
  interimBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
    gap: 6,
  },
  interimText: {
    fontSize: 12,
    color: CONFIG.COLORS.danger,
    fontStyle: 'italic',
  },
  fallbackNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
    gap: 6,
  },
  fallbackNoticeText: {
    fontSize: 11,
    color: '#1E40AF',
    flex: 1,
  },
  retryBtn: {
    backgroundColor: CONFIG.COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  retryBtnText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listeningBar: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 6,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  redRecordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: CONFIG.COLORS.danger,
    marginRight: 8,
  },
  listeningBarText: {
    fontSize: 12,
    fontWeight: '600',
    color: CONFIG.COLORS.danger,
  },
  safetyTipsSnippet: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
    gap: 6,
  },
  safetyTipsSnippetText: {
    fontSize: 11,
    color: '#065F46',
    flex: 1,
  },
  aiTriageButton: {
    backgroundColor: CONFIG.COLORS.primary,
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  aiTriageButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  clarificationAlert: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
  },
  clarificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  clarificationTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
  },
  clarificationText: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 16,
  },
  diagnosisCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4,
  },
  diagnosisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  diagnosisTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  diagnosisTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  severityCritical: {
    backgroundColor: '#FEE2E2',
  },
  severityModerate: {
    backgroundColor: '#FEF3C7',
  },
  severityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F172A',
  },
  sourcePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 8,
  },
  sourcePillText: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '600',
  },
  likelyIssueTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  inferredCauseText: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 12,
  },
  driveSafetyBox: {
    flexDirection: 'row',
    padding: 10,
    borderRadius: 6,
    marginBottom: 14,
    alignItems: 'flex-start',
  },
  driveSafeStop: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  driveSafeOk: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  driveSafetyHeading: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  driveSafetyNote: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 15,
  },
  safetyStepsSection: {
    marginBottom: 14,
  },
  safetyStepsHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  safetyStepItem: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingLeft: 4,
  },
  bullet: {
    fontSize: 12,
    color: CONFIG.COLORS.primary,
    marginRight: 6,
  },
  safetyStepText: {
    fontSize: 12,
    color: '#334155',
    flex: 1,
    lineHeight: 16,
  },
  mechanicKitSection: {
    marginBottom: 14,
  },
  mechanicKitHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  kitTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  kitTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  kitTagText: {
    fontSize: 11,
    color: '#334155',
  },
  estimatesRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    marginBottom: 16,
  },
  estimateCol: {
    flex: 1,
  },
  estimateLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  estimateValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  proceedButton: {
    backgroundColor: CONFIG.COLORS.criticalCta,
    borderRadius: 6,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proceedButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
});
