import { Redirect } from 'expo-router';

// KYC-status polling step removed — KYC submit now goes directly to bank linking
export default function KycStatusRedirect() {
  return <Redirect href="/signup/bank" />;
}
