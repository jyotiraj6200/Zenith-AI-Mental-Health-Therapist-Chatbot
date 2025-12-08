
import React, { useState, useEffect, useCallback } from 'react';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import Dashboard from './components/dashboard/Dashboard';
import { getCurrentUser, logout } from './services/authService';
import type { User, ProfileSettings } from './types';
import { getProfileSettings, saveProfileSettings } from './services/profileService';
import { VoiceControlProvider } from './contexts/VoiceControlContext';
import VoiceControlUI from './components/common/VoiceControlUI';
import { useGeolocation } from './hooks/useGeolocation';
import LocationErrorDisplay from './components/common/LocationErrorDisplay';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(getCurrentUser());
  const [isRegistering, setIsRegistering] = useState(false);
  const [settings, setSettings] = useState<ProfileSettings>(getProfileSettings());
  const { location: liveLocation, error: locationError, isFetching: isLocationFetching, refreshLocation } = useGeolocation();
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);

  const applyTheme = useCallback(() => {
    const root = window.document.documentElement;
 

  return (
    <VoiceControlProvider>
      <Dashboard 
        user={currentUser} 
        onLogout={handleLogout} 
        settings={settings} 
        onSettingsChange={handleSettingsChange} 
        onUserUpdate={handleUserUpdate} 
        liveLocation={liveLocation}
        isEmergencyMode={isEmergencyMode}
        onSetEmergencyMode={setIsEmergencyMode}
        isLocationFetching={isLocationFetching}
        onRefreshLocation={refreshLocation}
      />
      {locationError && <LocationErrorDisplay error={locationError} />}
      <VoiceControlUI />
    </VoiceControlProvider>
  );
};

export default App;