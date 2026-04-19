import api from "../../utils/api";

export async function fetchVaultItems() {
  const res = await api.get("/vault");
  return res.data;
}

export async function addVaultItem({ type, title, content, size }: { type: string, title: string, content: string, size?: number }) {
  const res = await api.post("/vault", { type, title, content, size });
  return res.data;
}
