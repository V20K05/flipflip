import { redirect } from "next/navigation";
import { requireUser } from "@/lib/current-user";
import { OnboardingForm } from "@/components/OnboardingForm";

export default async function OnboardingPage() {
  const user = await requireUser();
  if (user.onboardingCompleted) redirect("/dashboard");
  return <OnboardingForm name={user.displayName.split(" ")[0] ?? user.displayName} />;
}
