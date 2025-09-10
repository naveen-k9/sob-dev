declare module 'expo-updates' {
  export const checkForUpdateAsync: () => Promise<{ isAvailable: boolean }>;
  export const fetchUpdateAsync: () => Promise<void>;
  export const reloadAsync: () => Promise<void>;
  const _default: {
    checkForUpdateAsync: typeof checkForUpdateAsync;
    fetchUpdateAsync: typeof fetchUpdateAsync;
    reloadAsync: typeof reloadAsync;
  };
  export default _default;
}
