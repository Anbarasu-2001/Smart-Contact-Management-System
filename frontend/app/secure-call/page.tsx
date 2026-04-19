import { redirect } from "next/navigation";

export default function SecureCallLandingPage() {
  redirect("/?view=calls");
}
