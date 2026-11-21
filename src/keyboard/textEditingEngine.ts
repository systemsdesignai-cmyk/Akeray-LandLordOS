import type { KeyboardLanguageId } from './keyboardData';

export interface TextFieldState {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

export type ShiftMode = 'off' | 'shift' | 'caps';

export interface InputFieldDescriptor {
  tagName: string;
  type?: string;
  name?: string;
  id?: string;
  autoComplete?: string;
  inputMode?: string;
  readOnly?: boolean;
  disabled?: boolean;
  dataSensitive?: string | null;
  dataKeyboard?: string | null;
}

/**
 * Determines whether a field is sensitive (passwords, OTPs, payment cards, tokens)
 * or unsuitable for the custom text keyboard (numeric-only, dates, checkboxes, files).
 */
export function isSensitiveField(desc: InputFieldDescriptor): boolean {
  const type = (desc.type || 'text').toLowerCase();
  if (type === 'password') return true;
  if (desc.dataSensitive === 'true') return true;

  const auto = (desc.autoComplete || '').toLowerCase();
  if (
    auto.includes('password') ||
    auto.includes('one-time-code') ||
    auto.startsWith('cc-') ||
    auto.includes('transaction')
  ) {
    return true;
  }

  const combinedName = `${desc.name || ''} ${desc.id || ''}`.toLowerCase();
  if (
    /\b(password|passwd|passcode|pin|otp|cvv|cvc|card_number|cardnumber|auth_token|secret)\b/.test(
      combinedName
    )
  ) {
    return true;
  }

  return false;
}

export function isSupportedKeyboardField(desc: InputFieldDescriptor): boolean {
  if (desc.readOnly || desc.disabled) return false;
  if (desc.dataKeyboard === 'native' || desc.dataKeyboard === 'off') return false;
  if (isSensitiveField(desc)) return false;

  const tag = desc.tagName.toUpperCase();
  if (tag === 'TEXTAREA') return true;
  if (tag !== 'INPUT') return false;

  const type = (desc.type || 'text').toLowerCase();
  // Activate only for text-capable input types; exclude number, date, file, checkbox, radio, etc.
  const supportedInputTypes = ['text', 'search', 'tel', 'url', 'email'];
  return supportedInputTypes.includes(type);
}

/**
 * Inserts text at the current cursor position or replaces the active selection.
 * Maintains exact UTF-16 code unit indices for HTMLInputElement/HTMLTextAreaElement selectionRange.
 */
export function insertTextAtSelection(
  state: TextFieldState,
  textToInsert: string
): TextFieldState {
  const start = Math.max(0, Math.min(state.selectionStart, state.value.length));
  const end = Math.max(start, Math.min(state.selectionEnd, state.value.length));

  const before = state.value.slice(0, start);
  const after = state.value.slice(end);
  const nextValue = `${before}${textToInsert}${after}`;
  const nextCursor = start + textToInsert.length;

  return {
    value: nextValue,
    selectionStart: nextCursor,
    selectionEnd: nextCursor,
  };
}

/**
 * Replaces the single complete Unicode code point immediately before the cursor.
 * Used for Ethiopic vowel-order composition (e.g., tapping base 'ለ' then tapping 4th order 'ላ').
 */
export function replacePrecedingCodePoint(
  state: TextFieldState,
  replacementChar: string
): TextFieldState {
  const start = Math.max(0, Math.min(state.selectionStart, state.value.length));
  const end = Math.max(start, Math.min(state.selectionEnd, state.value.length));

  if (start !== end || start === 0) {
    return insertTextAtSelection(state, replacementChar);
  }

  const before = state.value.slice(0, start);
  const after = state.value.slice(end);
  const codePointsBefore = Array.from(before);
  if (codePointsBefore.length === 0) {
    return insertTextAtSelection(state, replacementChar);
  }

  codePointsBefore.pop();
  const prefix = codePointsBefore.join('');
  const nextValue = `${prefix}${replacementChar}${after}`;
  const nextCursor = prefix.length + replacementChar.length;

  return {
    value: nextValue,
    selectionStart: nextCursor,
    selectionEnd: nextCursor,
  };
}

/**
 * Returns the single Unicode code point immediately preceding the cursor, if any.
 */
export function getPrecedingCodePoint(state: TextFieldState): string | null {
  const start = Math.max(0, Math.min(state.selectionStart, state.value.length));
  if (start === 0) return null;
  const codePoints = Array.from(state.value.slice(0, start));
  return codePoints.length > 0 ? codePoints[codePoints.length - 1] : null;
}

/**
 * Deletes the selected text or the single complete Unicode code point before the cursor.
 * Never corrupts surrogate pairs or multi-byte Ethiopic characters.
 */
export function deleteBackwardCodePoint(state: TextFieldState): TextFieldState {
  const start = Math.max(0, Math.min(state.selectionStart, state.value.length));
  const end = Math.max(start, Math.min(state.selectionEnd, state.value.length));

  // If a range is selected, delete the entire selection
  if (start !== end) {
    const nextValue = `${state.value.slice(0, start)}${state.value.slice(end)}`;
    return {
      value: nextValue,
      selectionStart: start,
      selectionEnd: start,
    };
  }

  if (start === 0) {
    return state;
  }

  const beforeCodePoints = Array.from(state.value.slice(0, start));
  beforeCodePoints.pop();
  const nextBefore = beforeCodePoints.join('');
  const nextValue = `${nextBefore}${state.value.slice(end)}`;
  const nextCursor = nextBefore.length;

  return {
    value: nextValue,
    selectionStart: nextCursor,
    selectionEnd: nextCursor,
  };
}

/**
 * Deletes the selected text or the single complete Unicode code point after the cursor.
 */
export function deleteForwardCodePoint(state: TextFieldState): TextFieldState {
  const start = Math.max(0, Math.min(state.selectionStart, state.value.length));
  const end = Math.max(start, Math.min(state.selectionEnd, state.value.length));

  if (start !== end) {
    const nextValue = `${state.value.slice(0, start)}${state.value.slice(end)}`;
    return {
      value: nextValue,
      selectionStart: start,
      selectionEnd: start,
    };
  }

  if (end >= state.value.length) {
    return state;
  }

  const afterCodePoints = Array.from(state.value.slice(end));
  afterCodePoints.shift();
  const nextAfter = afterCodePoints.join('');
  const nextValue = `${state.value.slice(0, start)}${nextAfter}`;

  return {
    value: nextValue,
    selectionStart: start,
    selectionEnd: start,
  };
}

/**
 * Moves the cursor left or right by one complete Unicode code point.
 */
export function moveCursorCodePoint(
  state: TextFieldState,
  direction: 'left' | 'right',
  extendSelection = false
): TextFieldState {
  const start = Math.max(0, Math.min(state.selectionStart, state.value.length));
  const end = Math.max(start, Math.min(state.selectionEnd, state.value.length));

  if (!extendSelection && start !== end) {
    const collapseTarget = direction === 'left' ? start : end;
    return {
      value: state.value,
      selectionStart: collapseTarget,
      selectionEnd: collapseTarget,
    };
  }

  if (direction === 'left') {
    if (start === 0) return state;
    const beforePoints = Array.from(state.value.slice(0, start));
    const lastPoint = beforePoints.pop() || '';
    const nextPos = start - lastPoint.length;
    return {
      value: state.value,
      selectionStart: nextPos,
      selectionEnd: extendSelection ? end : nextPos,
    };
  } else {
    if (end >= state.value.length) return state;
    const afterPoints = Array.from(state.value.slice(end));
    const firstPoint = afterPoints.shift() || '';
    const nextPos = end + firstPoint.length;
    return {
      value: state.value,
      selectionStart: extendSelection ? start : nextPos,
      selectionEnd: nextPos,
    };
  }
}

/**
 * Formats an Afaan Oromoo Qubee shortcut sequence according to the current capitalization state:
 * - 'off'   -> "dh", "ch", "sh", "ny", "ph", "aa", "ee", "ii", "oo", "uu"
 * - 'shift' -> "Dh", "Ch", "Sh", "Ny", "Ph", "Aa", "Ee", "Ii", "Oo", "Uu"
 * - 'caps'  -> "DH", "CH", "SH", "NY", "PH", "AA", "EE", "II", "OO", "UU"
 */
export function formatOromoShortcutSequence(
  canonicalShortcut: string,
  shiftMode: ShiftMode
): string {
  if (shiftMode === 'caps') {
    return canonicalShortcut.toUpperCase();
  }
  if (shiftMode === 'shift') {
    return (
      canonicalShortcut.charAt(0).toUpperCase() +
      canonicalShortcut.slice(1).toLowerCase()
    );
  }
  return canonicalShortcut.toLowerCase();
}

/**
 * Applies a TextFieldState update to a real HTMLInputElement or HTMLTextAreaElement
 * and triggers React's synthetic onChange pipeline without losing focus or selection.
 */
export function applyTextStateToDOMElement(
  element: HTMLInputElement | HTMLTextAreaElement,
  nextState: TextFieldState
): void {
  const prototype =
    element instanceof HTMLTextAreaElement
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;

  const nativeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
  if (nativeValueSetter) {
    nativeValueSetter.call(element, nextState.value);
  } else {
    element.value = nextState.value;
  }

  const inputEvent = new Event('input', { bubbles: true });
  element.dispatchEvent(inputEvent);

  try {
    element.focus({ preventScroll: true });
    element.setSelectionRange(nextState.selectionStart, nextState.selectionEnd);
  } catch {
    // Some input types (like email in certain browsers) may not support setSelectionRange
  }
}

/**
 * Persistent Keyboard Preferences & Opt-In Local Clipboard Manager
 */
export interface KeyboardPreferences {
  enabled: boolean;
  defaultLanguage: KeyboardLanguageId;
  activeLanguage: KeyboardLanguageId;
  preferredInputMode: 'akarai' | 'device';
  clipboardHistoryEnabled: boolean; // Opt-in by default (false) for privacy compliance
  maxClipboardItems: number;
  retentionHours: number;
  vibrationEnabled: boolean;
  keyPreviewEnabled: boolean;
  keyboardSize: 'compact' | 'standard' | 'large';
}

export interface ClipboardSnippet {
  id: string;
  text: string;
  createdAt: string;
  pinned: boolean;
  language: KeyboardLanguageId;
}

const KEYBOARD_PREFS_KEY = 'landlordos_akarai_keyboard_prefs_v1';
const CLIPBOARD_HISTORY_KEY = 'landlordos_akarai_clipboard_history_v1';
export const KEYBOARD_PREFS_EVENT = 'akarai-keyboard-prefs-updated';

export const DEFAULT_KEYBOARD_PREFERENCES: KeyboardPreferences = {
  enabled: true,
  defaultLanguage: 'en',
  activeLanguage: 'en',
  preferredInputMode: 'akarai',
  clipboardHistoryEnabled: false,
  maxClipboardItems: 12,
  retentionHours: 24,
  vibrationEnabled: false,
  keyPreviewEnabled: true,
  keyboardSize: 'standard',
};

export function loadKeyboardPreferences(): KeyboardPreferences {
  try {
    const raw = localStorage.getItem(KEYBOARD_PREFS_KEY);
    if (!raw) return DEFAULT_KEYBOARD_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<KeyboardPreferences>;
    return {
      ...DEFAULT_KEYBOARD_PREFERENCES,
      ...parsed,
    };
  } catch {
    return DEFAULT_KEYBOARD_PREFERENCES;
  }
}

export function saveKeyboardPreferences(
  updates: Partial<KeyboardPreferences>
): KeyboardPreferences {
  const next: KeyboardPreferences = {
    ...loadKeyboardPreferences(),
    ...updates,
  };
  try {
    localStorage.setItem(KEYBOARD_PREFS_KEY, JSON.stringify(next));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(KEYBOARD_PREFS_EVENT, { detail: next }));
    }
  } catch {
    // ignore storage errors
  }
  return next;
}

export function loadClipboardHistory(
  retentionHours = 24
): ClipboardSnippet[] {
  try {
    const raw = localStorage.getItem(CLIPBOARD_HISTORY_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as ClipboardSnippet[];
    if (!Array.isArray(list)) return [];

    const cutoffMs = Date.now() - retentionHours * 60 * 60 * 1000;
    const valid = list.filter((item) => {
      if (!item || typeof item.text !== 'string' || !item.text.trim()) return false;
      if (item.pinned) return true;
      const ts = new Date(item.createdAt).getTime();
      return !Number.isNaN(ts) && ts >= cutoffMs;
    });

    return valid;
  } catch {
    return [];
  }
}

export function recordClipboardSnippet(params: {
  text: string;
  language: KeyboardLanguageId;
  fieldDescriptor?: InputFieldDescriptor;
  prefs?: KeyboardPreferences;
}): ClipboardSnippet[] {
  const activePrefs = params.prefs || loadKeyboardPreferences();
  const cleanText = params.text.trim();
  if (!cleanText) {
    return loadClipboardHistory(activePrefs.retentionHours);
  }

  // Strictly block sensitive fields from entering clipboard history
  if (params.fieldDescriptor && isSensitiveField(params.fieldDescriptor)) {
    return loadClipboardHistory(activePrefs.retentionHours);
  }

  // Strictly respect opt-in clipboard history toggle
  if (!activePrefs.clipboardHistoryEnabled) {
    return loadClipboardHistory(activePrefs.retentionHours);
  }

  const existing = loadClipboardHistory(activePrefs.retentionHours);
  const existingMatch = existing.find((s) => s.text === cleanText);
  const pinnedFlag = existingMatch ? existingMatch.pinned : false;
  const deduplicated = existing.filter((s) => s.text !== cleanText);

  const newSnippet: ClipboardSnippet = {
    id: `clip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    text: cleanText,
    createdAt: new Date().toISOString(),
    pinned: pinnedFlag,
    language: params.language,
  };

  const merged = [newSnippet, ...deduplicated];
  const pinnedItems = merged.filter((s) => s.pinned);
  const unpinnedItems = merged
    .filter((s) => !s.pinned)
    .slice(0, Math.max(1, activePrefs.maxClipboardItems - pinnedItems.length));

  const finalHistory = [...pinnedItems, ...unpinnedItems];
  try {
    localStorage.setItem(CLIPBOARD_HISTORY_KEY, JSON.stringify(finalHistory));
  } catch {
    // ignore storage errors
  }
  return finalHistory;
}

export function togglePinClipboardSnippet(snippetId: string): ClipboardSnippet[] {
  const prefs = loadKeyboardPreferences();
  const existing = loadClipboardHistory(prefs.retentionHours);
  const updated = existing.map((item) =>
    item.id === snippetId ? { ...item, pinned: !item.pinned } : item
  );
  try {
    localStorage.setItem(CLIPBOARD_HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
  return updated;
}

export function deleteClipboardSnippet(snippetId: string): ClipboardSnippet[] {
  const prefs = loadKeyboardPreferences();
  const existing = loadClipboardHistory(prefs.retentionHours);
  const updated = existing.filter((item) => item.id !== snippetId);
  try {
    localStorage.setItem(CLIPBOARD_HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
  return updated;
}

export function clearAllClipboardHistory(): ClipboardSnippet[] {
  try {
    localStorage.removeItem(CLIPBOARD_HISTORY_KEY);
  } catch {
    // ignore
  }
  return [];
}
