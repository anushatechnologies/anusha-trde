import { Redirect } from 'expo-router';

// Account activation step removed — bank linking now marks account as active automatically
export default function ActivateRedirect() {
  return <Redirect href="/signup/mpin" />;
}
