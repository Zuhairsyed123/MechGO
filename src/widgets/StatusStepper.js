import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CONFIG } from '../config';

const STEPS = [
  { id: 'booked', label: 'Booked' },
  { id: 'en_route', label: 'En Route' },
  { id: 'arrived', label: 'Arrived' },
  { id: 'repairing', label: 'Repairing' },
  { id: 'completed', label: 'Done' }
];

export default function StatusStepper({ currentStepIndex = 1 }) {
  return (
    <View style={styles.container}>
      <View style={styles.stepsRow}>
        {STEPS.map((step, idx) => {
          const isPassed = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;
          const isFuture = idx > currentStepIndex;

          return (
            <React.Fragment key={step.id}>
              {/* Step Circle */}
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.circle,
                    isPassed && styles.circlePassed,
                    isCurrent && styles.circleCurrent,
                    isFuture && styles.circleFuture,
                  ]}
                >
                  {isPassed ? (
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  ) : (
                    <Text
                      style={[
                        styles.circleNumber,
                        isCurrent ? styles.circleNumberCurrent : styles.circleNumberFuture,
                      ]}
                    >
                      {idx + 1}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    isCurrent && styles.stepLabelCurrent,
                    isPassed && styles.stepLabelPassed,
                  ]}
                >
                  {step.label}
                </Text>
              </View>

              {/* Connecting Bar */}
              {idx < STEPS.length - 1 && (
                <View
                  style={[
                    styles.connector,
                    idx < currentStepIndex ? styles.connectorPassed : styles.connectorFuture,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 10,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    minWidth: 44,
  },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  circlePassed: {
    backgroundColor: CONFIG.COLORS.success,
  },
  circleCurrent: {
    backgroundColor: CONFIG.COLORS.primary,
  },
  circleFuture: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  circleNumber: {
    fontSize: 11,
    fontWeight: '700',
  },
  circleNumberCurrent: {
    color: '#FFFFFF',
  },
  circleNumberFuture: {
    color: '#94A3B8',
  },
  stepLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
  },
  stepLabelCurrent: {
    color: CONFIG.COLORS.primary,
    fontWeight: '700',
  },
  stepLabelPassed: {
    color: '#0F172A',
    fontWeight: '600',
  },
  connector: {
    flex: 1,
    height: 2,
    marginTop: -16,
    marginHorizontal: 2,
  },
  connectorPassed: {
    backgroundColor: CONFIG.COLORS.success,
  },
  connectorFuture: {
    backgroundColor: '#E2E8F0',
  },
});
