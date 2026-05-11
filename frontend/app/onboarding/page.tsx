import OnboardingWizard from '@/components/onboarding/OnboardingWizard';

export const metadata = {
  title: 'Bienvenido — Albunmanía',
};

export default function OnboardingPage() {
  return (
    <main className="min-h-[60vh]">
      <OnboardingWizard />
    </main>
  );
}
