import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CONFIG } from '../config';

const REVIEW_TAGS = [
  'Arrived on Time',
  'Polite & Professional',
  'Transparent Pricing',
  'Quick Puncture Fix',
  'Expert Knowledge',
  'Had All Necessary Tools'
];

export default function RatingScreen({ bookingData, onSubmitReview }) {
  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState(['Arrived on Time', 'Polite & Professional']);
  const [comment, setComment] = useState('');

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = () => {
    onSubmitReview({
      rating,
      selectedTags,
      comment,
      mechanic: bookingData?.mechanic,
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.contentCard}>
        <View style={styles.iconCircle}>
          <Ionicons name="shield-checkmark" size={32} color={CONFIG.COLORS.primary} />
        </View>

        <Text style={styles.title}>How was your experience?</Text>
        <Text style={styles.subtitle}>
          Your feedback helps keep roadside assistance trustworthy and fast for highway drivers.
        </Text>

        <Text style={styles.mechanicName}>
          {bookingData?.mechanic?.name || 'Verified Highway Mechanic'}
        </Text>

        {/* 5-Star Row */}
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => setRating(star)}
              activeOpacity={0.7}
              style={{ padding: 4 }}
            >
              <Ionicons
                name={star <= rating ? 'star' : 'star-outline'}
                size={34}
                color={star <= rating ? '#D97706' : '#CBD5E1'}
              />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.ratingLabel}>
          {rating === 5 && 'Excellent Service'}
          {rating === 4 && 'Good Experience'}
          {rating === 3 && 'Average'}
          {rating <= 2 && 'Needs Improvement'}
        </Text>

        {/* Compliment Tags */}
        <Text style={styles.tagsSectionTitle}>What went well?</Text>
        <View style={styles.tagsRow}>
          {REVIEW_TAGS.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <TouchableOpacity
                key={tag}
                style={[styles.tagChip, isSelected && styles.tagChipSelected]}
                onPress={() => toggleTag(tag)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Comment Box */}
        <TextInput
          style={styles.commentInput}
          multiline
          numberOfLines={3}
          placeholder="Write a brief note for the mechanic or community (optional)..."
          placeholderTextColor="#94A3B8"
          value={comment}
          onChangeText={setComment}
        />

        {/* Submit */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.85}>
          <Text style={styles.submitBtnText}>Submit Feedback & Done</Text>
        </TouchableOpacity>
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
    justifyContent: 'center',
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: CONFIG.COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
    lineHeight: 16,
  },
  mechanicName: {
    fontSize: 14,
    fontWeight: '700',
    color: CONFIG.COLORS.primary,
    marginBottom: 12,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  ratingLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
  },
  tagsSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
    width: '100%',
  },
  tagChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagChipSelected: {
    backgroundColor: CONFIG.COLORS.primary,
    borderColor: CONFIG.COLORS.primary,
  },
  tagText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },
  tagTextSelected: {
    color: '#FFFFFF',
  },
  commentInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    width: '100%',
    padding: 10,
    fontSize: 13,
    color: '#0F172A',
    minHeight: 64,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  submitBtn: {
    backgroundColor: CONFIG.COLORS.primary,
    borderRadius: 8,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
