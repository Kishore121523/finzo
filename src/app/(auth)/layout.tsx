import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In - Finance Management Made Simple",
  description:
    "Sign in to Finzo to track your expenses, manage budgets, monitor recurring bills, and get smart insights into your personal finances.",
  openGraph: {
    title: "Sign In to Finzo - Personal Finance Management",
    description:
      "Track expenses, manage budgets, and gain financial insights with Finzo.",
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
