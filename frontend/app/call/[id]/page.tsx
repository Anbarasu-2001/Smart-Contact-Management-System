

import { notFound, redirect } from "next/navigation";
import ClientPage from "./ClientPage";

interface CallContactPageProps {
  params: Promise<{ id?: string }>;
}

export default async function CallContactPage({ params }: CallContactPageProps) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  if (!id) return notFound();
  return <ClientPage id={id} />;
}
