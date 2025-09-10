import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';

interface OTAUpdaterProps {
  autoPrompt?: boolean;
}

type UpdatesModule = typeof import('expo-updates');

const isWeb = Platform.OS === 'web';

export default function OTAUpdater({ autoPrompt = true }: OTAUpdaterProps) {
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const hasCheckedRef = useRef<boolean>(false);

  const checkAndApply = useCallback(async () => {
    if (isWeb) return;
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;
    setIsChecking(true);
    try {
      const Updates: UpdatesModule | null = !isWeb ? (await import('expo-updates')) : null;
      if (!Updates || !('checkForUpdateAsync' in Updates)) {
        console.log('[OTA] Updates module unavailable');
        return;
      }
      console.log('[OTA] Checking for update');
      const result = await Updates.checkForUpdateAsync();
      if (result.isAvailable) {
        console.log('[OTA] Update available, fetching');
        await Updates.fetchUpdateAsync();
        console.log('[OTA] Update fetched');
        if (autoPrompt) {
          Alert.alert(
            'Update available',
            'A new version is ready. Restart to apply?',
            [
              { text: 'Later', style: 'cancel' },
              { text: 'Restart', onPress: () => Updates.reloadAsync() },
            ],
          );
        }
      } else {
        console.log('[OTA] No update available');
      }
    } catch (e) {
      console.log('[OTA] Update check failed', e);
    } finally {
      setIsChecking(false);
    }
  }, [autoPrompt]);

  useEffect(() => {
    checkAndApply();
  }, [checkAndApply]);

  return null;
}
