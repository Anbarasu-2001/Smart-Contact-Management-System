import { redirect } from "next/navigation";

export default async function ChatContactPage({ params }: { params: Promise<{ id: string }> }) {
  // You can add authentication and chat logic here
  const resolvedParams = await params;
  redirect(`/?view=chat&contactId=${resolvedParams.id}`);
}
