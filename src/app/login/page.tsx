import { AuthForm } from "@/components/AuthForm";
import { login } from "@/app/actions/auth";
export default function LoginPage() { return <AuthForm action={login} mode="login" />; }
