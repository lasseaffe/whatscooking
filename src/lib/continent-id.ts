export function continentId(name: string): string {
  return "continent-" + name.toLowerCase().replace(/\s+/g, "-");
}
