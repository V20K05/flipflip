import { AuthForm } from "@/components/AuthForm";
import { signup } from "@/app/actions/auth";
export default function SignupPage() { return <AuthForm action={signup} mode="signup" />; }
