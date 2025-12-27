const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(getCurrentUser());
  const [isRegistering, setIsRegistering] = useState(false);
  const [settings, setSettings] = useState<ProfileSettings>(() => getProfileSettings());
  const { location: liveLocation, error: locationError, isFetching: isLocationFetching, refreshLocation } = useGeolocation();
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);

  const applyTheme = useCallback(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', settings.theme === 'dark');
  }, [settings.theme]);

  useEffect(() => {
    applyTheme();
  }, [applyTheme]);

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
  };

  const handleSettingsChange = (newSettings: ProfileSettings) => {
    setSettings(newSettings);
    saveProfileSettings(newSettings);
  };

  const handleUserUpdate = (updatedUser: User) => {
    setCurrentUser(updatedUser);
  };

  if (!currentUser) {
    return isRegistering ? (
      <RegisterPage
        onRegister={setCurrentUser}
        onSwitchToLogin={() => setIsRegistering(false)}
      />
    ) : (
      <LoginPage
        onLogin={setCurrentUser}
        onSwitchToRegister={() => setIsRegistering(true)}
      />
    );
  }

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
