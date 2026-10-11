import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  StatusBar,
  Alert,
  Linking,
  Platform
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { CONFIG } from './src/config';
import Header from './src/widgets/Header';
import BottomNav from './src/widgets/BottomNav';

// Screens
import SplashScreen from './src/screens/SplashScreen';
import HomeScreen from './src/screens/HomeScreen';
import DescribeProblemScreen from './src/screens/DescribeProblemScreen';
import ChooseHelpScreen from './src/screens/ChooseHelpScreen';
import LiveTrackingScreen from './src/screens/LiveTrackingScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import RatingScreen from './src/screens/RatingScreen';
import BookingHistoryScreen from './src/screens/BookingHistoryScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ImpactDashboardScreen from './src/screens/ImpactDashboardScreen';
import PartnerConsoleScreen from './src/screens/PartnerConsoleScreen';

// Services
import {
  getCurrentDeviceLocation,
  reverseGeocodeCoordinates,
  getNearbyMechanics
} from './src/services/locationService';
import { INITIAL_VEHICLES, INITIAL_BOOKINGS } from './src/services/mockData';

export default function App() {
  // Navigation stack state: 'splash' | 'home' | 'describe' | 'choose_help' | 'live_tracking' | 'payment' | 'rating'
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'impact' | 'bookings' | 'partner' | 'profile'

  // Live Location & GPS state
  const [userCoords, setUserCoords] = useState(null);
  const [address, setAddress] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [nearbyMechanics, setNearbyMechanics] = useState([]);

  // Vehicles & Garage
  const [vehicles, setVehicles] = useState(INITIAL_VEHICLES);
  const [selectedVehicle, setSelectedVehicle] = useState(INITIAL_VEHICLES[0]);

  // Active Flow Data
  const [selectedCategory, setSelectedCategory] = useState('Flat Tyre');
  const [breakdownData, setBreakdownData] = useState(null);
  const [activeVisit, setActiveVisit] = useState(null);
  const [billData, setBillData] = useState(null);
  const [ratingTargetBooking, setRatingTargetBooking] = useState(null);

  // Booking records (used by history and impact dashboard)
  const [bookings, setBookings] = useState(INITIAL_BOOKINGS);

  // Initialize live GPS location from device
  const fetchLiveGps = async () => {
    setLocationLoading(true);
    const locRes = await getCurrentDeviceLocation();

    if (locRes.success && locRes.coords) {
      setUserCoords(locRes.coords);
      const addrRes = await reverseGeocodeCoordinates(
        locRes.coords.latitude,
        locRes.coords.longitude
      );
      setAddress(addrRes);

      const mechs = await getNearbyMechanics(locRes.coords.latitude, locRes.coords.longitude);
      setNearbyMechanics(mechs);
    } else {
      console.warn('GPS fallback active:', locRes.error);
      const fallbackLat = 28.5355;
      const fallbackLng = 77.3910;
      setUserCoords({ latitude: fallbackLat, longitude: fallbackLng });
      setAddress({
        short: 'Noida Expressway, Sector 128',
        full: 'Sector 128, Noida-Greater Noida Expressway, Uttar Pradesh 201304'
      });
      const mechs = await getNearbyMechanics(fallbackLat, fallbackLng);
      setNearbyMechanics(mechs);
    }
    setLocationLoading(false);
  };

  // Splash permission handlers
  const handlePermissionsGranted = async () => {
    await fetchLiveGps();
    setCurrentScreen('home');
  };

  const handleSkipSplash = async () => {
    await fetchLiveGps();
    setCurrentScreen('home');
  };

  // Emergency SOS trigger
  const handleSosPress = () => {
    Alert.alert(
      'Emergency SOS Dispatch',
      'Directly call Highway Emergency Helpline (1033) or Police Control Room (112)?',
      [
        {
          text: 'Call NHAI (1033)',
          onPress: () => Linking.openURL(`tel:${CONFIG.NATIONAL_HIGHWAY_EMERGENCY}`)
        },
        {
          text: 'Call Police (112)',
          onPress: () => Linking.openURL(`tel:${CONFIG.POLICE_EMERGENCY}`)
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  // Flow handlers
  const handleStartBreakdownFlow = (cat = 'Flat Tyre') => {
    setSelectedCategory(cat);
    setCurrentScreen('describe');
  };

  const handleProceedToHelp = (data) => {
    setBreakdownData(data);
    setCurrentScreen('choose_help');
  };

  // Escalate to on-site visit
  const handleEscalateToVisit = ({ mechanic, diagnosis, category, followUpAnswers, escalatedFromCall }) => {
    const visitData = {
      id: `VISIT-${Math.floor(1000 + Math.random() * 9000)}`,
      mechanic: mechanic || nearbyMechanics[0],
      diagnosis,
      category: category || 'Breakdown',
      followUpAnswers,
      escalatedFromCall: Boolean(escalatedFromCall)
    };
    setActiveVisit(visitData);
    setCurrentScreen('live_tracking');
  };

  // Proceed to bill / payment
  const handleProceedToPayment = (bill) => {
    setBillData(bill);
    setCurrentScreen('payment');
  };

  // Payment completed
  const handlePaymentSuccess = (paidDetails) => {
    const newRecord = {
      id: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
      date: 'Today, Just now',
      type: 'visit',
      category: paidDetails.category || selectedCategory,
      status: 'Completed',
      mechanicName: paidDetails.mechanic?.name || 'Highway Mechanic',
      phone: paidDetails.mechanic?.phone || '+919876543210',
      amount: paidDetails.amount,
      solved: true,
      summary: `On-site repair completed. Paid ₹${paidDetails.amount} via ${paidDetails.method?.toUpperCase()}.`
    };

    setBookings([newRecord, ...bookings]);
    setRatingTargetBooking(newRecord);
    setCurrentScreen('rating');
  };

  // Rated mechanic directly from call
  const handleRateMechanicDirect = ({ mechanic, type, solved }) => {
    const newRecord = {
      id: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
      date: 'Today, Just now',
      type: type || 'call',
      category: selectedCategory,
      status: 'Completed',
      mechanicName: mechanic?.name || 'Highway Mechanic',
      phone: mechanic?.phone || '+919876543210',
      amount: 0,
      solved: solved,
      summary: 'Phone guidance consultation completed successfully.'
    };
    setBookings([newRecord, ...bookings]);
    setRatingTargetBooking(newRecord);
    setCurrentScreen('rating');
  };

  const handleSubmitReview = () => {
    setCurrentScreen('home');
    setActiveTab('bookings');
  };

  // Determine top Header props
  const getHeaderProps = () => {
    switch (currentScreen) {
      case 'describe':
        return {
          title: 'Emergency Triage',
          subtitle: 'Voice & AI Diagnosis',
          showBack: true,
          onBack: () => setCurrentScreen('home')
        };
      case 'choose_help':
        return {
          title: 'AI Smart Dispatch',
          subtitle: 'Ranked Mechanics • Call or Visit',
          showBack: true,
          onBack: () => setCurrentScreen('describe')
        };
      case 'live_tracking':
        return {
          title: 'Live Rescue Tracking',
          subtitle: activeVisit?.mechanic?.name || 'Mechanic En Route',
          showBack: true,
          onBack: () => setCurrentScreen('home')
        };
      case 'payment':
        return {
          title: 'Invoice & Payment',
          subtitle: 'Transparent Breakdown Billing',
          showBack: true,
          onBack: () => setCurrentScreen('live_tracking')
        };
      case 'rating':
        return {
          title: 'Service Rating',
          subtitle: 'Feedback for Driver Safety',
          showBack: false
        };
      default:
        if (activeTab === 'impact') {
          return { title: 'Impact Dashboard', subtitle: 'Speed, Costs & Network Scale', showBack: false };
        }
        if (activeTab === 'partner') {
          return { title: 'Partner Console', subtitle: 'Mechanic Dispatch & Verification', showBack: false };
        }
        if (activeTab === 'bookings') {
          return { title: 'My Bookings', subtitle: 'Call & Visit History', showBack: false };
        }
        if (activeTab === 'profile') {
          return { title: 'Driver Profile', subtitle: 'Garage & ICE Emergency Contacts', showBack: false };
        }
        return {
          title: 'MechGO',
          subtitle: address?.short || 'Highway Roadside Rescue',
          showBack: false
        };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ExpoStatusBar style="dark" />

      {/* Screen 1: Splash / Onboarding */}
      {currentScreen === 'splash' ? (
        <SplashScreen
          onPermissionsGranted={handlePermissionsGranted}
          onSkip={handleSkipSplash}
        />
      ) : (
        <View style={styles.appShell}>
          {/* Header */}
          <Header {...getHeaderProps()} onSosPress={handleSosPress} />

          {/* Screen Content Router */}
          <View style={styles.body}>
            {currentScreen === 'home' && (
              <>
                {activeTab === 'home' && (
                  <HomeScreen
                    userCoords={userCoords}
                    address={address}
                    locationLoading={locationLoading}
                    nearbyMechanics={nearbyMechanics}
                    selectedVehicle={selectedVehicle}
                    onSelectVehiclePress={() => setActiveTab('profile')}
                    onGetHelpPress={() => handleStartBreakdownFlow(selectedCategory)}
                    onCategoryPress={(cat) => handleStartBreakdownFlow(cat)}
                    onRefreshLocation={fetchLiveGps}
                  />
                )}

                {activeTab === 'impact' && (
                  <ImpactDashboardScreen
                    bookings={bookings}
                    nearbyMechanics={nearbyMechanics}
                  />
                )}

                {activeTab === 'bookings' && (
                  <BookingHistoryScreen bookings={bookings} />
                )}

                {activeTab === 'partner' && (
                  <PartnerConsoleScreen
                    activeBooking={activeVisit}
                    onJobAccepted={(job) => {
                      setCurrentScreen('live_tracking');
                    }}
                    onJobRejected={(reason) => {
                      // Handled within partner console
                    }}
                  />
                )}

                {activeTab === 'profile' && (
                  <ProfileScreen
                    vehicles={vehicles}
                    selectedVehicle={selectedVehicle}
                    onSelectVehicle={(veh) => setSelectedVehicle(veh)}
                  />
                )}
              </>
            )}

            {currentScreen === 'describe' && (
              <DescribeProblemScreen
                initialCategory={selectedCategory}
                selectedVehicle={selectedVehicle}
                onProceedToHelp={handleProceedToHelp}
              />
            )}

            {currentScreen === 'choose_help' && (
              <ChooseHelpScreen
                breakdownData={breakdownData}
                nearbyMechanics={nearbyMechanics}
                userCoords={userCoords}
                selectedVehicle={selectedVehicle}
                onEscalateToVisit={handleEscalateToVisit}
                onRateMechanic={handleRateMechanicDirect}
              />
            )}

            {currentScreen === 'live_tracking' && (
              <LiveTrackingScreen
                activeVisit={activeVisit}
                userCoords={userCoords}
                address={address}
                onProceedToPayment={handleProceedToPayment}
              />
            )}

            {currentScreen === 'payment' && (
              <PaymentScreen
                billData={billData}
                onPaymentSuccess={handlePaymentSuccess}
              />
            )}

            {currentScreen === 'rating' && (
              <RatingScreen
                bookingData={ratingTargetBooking}
                onSubmitReview={handleSubmitReview}
              />
            )}
          </View>

          {/* Persistent Bottom Nav (shown on primary screens) */}
          {currentScreen === 'home' && (
            <BottomNav
              activeTab={activeTab}
              onSelectTab={(tab) => {
                setActiveTab(tab);
                setCurrentScreen('home');
              }}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  appShell: {
    flex: 1,
    backgroundColor: CONFIG.COLORS.background,
  },
  body: {
    flex: 1,
  },
});
