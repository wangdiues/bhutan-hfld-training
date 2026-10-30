/**
 * Safe browser storage for labs and progress. Every call is wrapped in try/catch so pages
 * keep working when storage is unavailable (private windows, blocked site data).
 */
export function loadJSON<T>(key: string): T | null {
	try {
		const raw = localStorage.getItem(key);
		return raw === null ? null : (JSON.parse(raw) as T);
	} catch {
		return null;
	}
}

export function saveJSON(key: string, value: unknown): boolean {
	try {
		localStorage.setItem(key, JSON.stringify(value));
		return true;
	} catch {
		return false;
	}
}

export function remove(key: string): void {
	try {
		localStorage.removeItem(key);
	} catch {
		/* storage unavailable */
	}
}
