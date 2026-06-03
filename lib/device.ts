import FingerprintJS from "@fingerprintjs/fingerprintjs";

export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("sergi_device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("sergi_device_id", id);
  }
  return id;
}

let _fingerprint: string | null = null;

export async function getFingerprint(): Promise<string> {
  if (_fingerprint) return _fingerprint;
  if (typeof window === "undefined") return "";
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  _fingerprint = result.visitorId;
  return _fingerprint;
}

export async function getClientIp(): Promise<string> {
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();
    return data.ip || "unknown";
  } catch {
    return "unknown";
  }
}

export function getVoterName(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("sergi_voter_name") || "";
}

export function setVoterName(name: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("sergi_voter_name", name);
}

export function getMyVotes(): string[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem("sergi_my_votes");
  return raw ? JSON.parse(raw) : [];
}

export function addMyVote(photoId: string): string[] {
  const votes = getMyVotes();
  if (!votes.includes(photoId)) {
    votes.push(photoId);
    localStorage.setItem("sergi_my_votes", JSON.stringify(votes));
  }
  return votes;
}

export function removeMyVote(photoId: string): string[] {
  let votes = getMyVotes();
  votes = votes.filter((v) => v !== photoId);
  localStorage.setItem("sergi_my_votes", JSON.stringify(votes));
  return votes;
}

export const MAX_VOTES = 10;
