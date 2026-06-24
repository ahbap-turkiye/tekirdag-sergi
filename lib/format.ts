// Türkçe karakterleri doğru çevirir: "ilknur can" -> "İlknur Can", "MERT" -> "Mert"
export function titleCase(name: string): string {
  if (!name) return name;
  return name
    .trim()
    .split(/\s+/)
    .map(
      (word) =>
        word.charAt(0).toLocaleUpperCase("tr-TR") +
        word.slice(1).toLocaleLowerCase("tr-TR")
    )
    .join(" ");
}
