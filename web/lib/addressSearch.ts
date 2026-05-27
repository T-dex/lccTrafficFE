export interface AddressSuggestion {
  label: string;
  full: string;
  lat?: number;
  lon?: number;
}

export async function searchAddresses(query: string): Promise<AddressSuggestion[]> {
  const q = query.trim();
  if (q.length < 4) return [];

  const res = await fetch(`/api/address-search?q=${encodeURIComponent(q)}`, {
    cache: "no-store",
  });
  const data: unknown = await res.json().catch(() => []);
  if (!res.ok) return [];
  if (!Array.isArray(data)) return [];
  return data.filter(
    (item): item is AddressSuggestion =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as AddressSuggestion).label === "string" &&
      typeof (item as AddressSuggestion).full === "string",
  );
}
