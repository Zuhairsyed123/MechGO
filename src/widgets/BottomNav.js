import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CONFIG } from '../config';

export default function BottomNav({ activeTab, onSelectTab }) {
  const tabs = [
    { id: 'home', label: 'Home', icon: 'map', outlineIcon: 'map-outline' },
    { id: 'impact', label: 'Impact', icon: 'bar-chart', outlineIcon: 'bar-chart-outline' },
    { id: 'bookings', label: 'Bookings', icon: 'time', outlineIcon: 'time-outline' },
    { id: 'partner', label: 'Partner', icon: 'construct', outlineIcon: 'construct-outline' },
    { id: 'profile', label: 'Profile', icon: 'person', outlineIcon: 'person-outline' },
  ];

  return (
    <View style={styles.navBar}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.navItem}
            onPress={() => onSelectTab(tab.id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isActive ? tab.icon : tab.outlineIcon}
              size={20}
              color={isActive ? CONFIG.COLORS.primary : '#64748B'}
            />
            <Text
              style={[
                styles.navLabel,
                { color: isActive ? CONFIG.COLORS.primary : '#64748B', fontWeight: isActive ? '700' : '500' },
              ]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 6,
    paddingBottom: 8,
    justifyContent: 'space-around',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 4,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 2,
  },
  navLabel: {
    fontSize: 10,
    marginTop: 2,
  },
});
