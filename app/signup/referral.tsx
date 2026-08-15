import { Redirect } from 'expo-router';

// Referral is now merged into the Password step
export default function ReferralRedirect() {
  return <Redirect href="/signup/terms" />;
}
