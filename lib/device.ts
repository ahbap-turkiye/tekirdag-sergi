export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("sergi_device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("sergi_device_id", id);
  }
  return id;
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
