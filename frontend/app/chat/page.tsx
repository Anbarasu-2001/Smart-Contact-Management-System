import { redirect } from "next/navigation";

export default function ChatPage() {
  redirect("/?view=chat");
}
