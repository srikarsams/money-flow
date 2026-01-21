import { getSetting, setSetting } from '../db';

// Premium features
export const PREMIUM_FEATURES = {
  removeAds: true,
  csvExport: true,
};

// Check if user is premium
export async function isPremium(): Promise<boolean> {
  const status = await getSetting('isPremium');
  return status === 'true';
}

// Set premium status (for testing or after purchase)
export async function setPremiumStatus(isPremium: boolean): Promise<void> {
  await setSetting('isPremium', isPremium.toString());
}

// Restore purchases (placeholder for RevenueCat integration)
export async function restorePurchases(): Promise<boolean> {
  // TODO: Implement with RevenueCat
  // For now, just check the setting
  return await isPremium();
}

// Purchase premium (placeholder for RevenueCat integration)
export async function purchasePremium(): Promise<boolean> {
  // TODO: Implement with RevenueCat
  // For testing, this will just set premium to true
  // In production, this should initiate the RevenueCat purchase flow

  // Simulating purchase for development
  // Remove this in production and implement actual RevenueCat flow
  if (__DEV__) {
    await setPremiumStatus(true);
    return true;
  }

  return false;
}

// Get premium price (placeholder)
export function getPremiumPrice(): string {
  // TODO: Get actual price from RevenueCat
  return '$4.99';
}

// Initialize purchase service
export async function initializePurchaseService(): Promise<void> {
  // TODO: Initialize RevenueCat SDK
  // Purchases.configure({ apiKey: 'your_api_key' });
}
