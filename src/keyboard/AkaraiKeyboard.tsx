import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  ChevronDown,
  Clipboard,
  Copy,
  Delete,
  Keyboard as KeyboardIcon,
  Pin,
  RotateCcw,
  RotateCw,
  Scissors,
  Settings,
  Smartphone,
  Smile,
  Trash2,
  X,
} from 'lucide-react';
import {
  AMHARIC_FIDEL_PAGE_1,
  AMHARIC_FIDEL_PAGE_2,
  CHAR_TO_FIDEL_FAMILY,
  ENGLISH_QWERTY_ROWS,
  ETHIOPIC_PUNCTUATION_SHORTCUTS,
  FIDEL_FAMILIES,
  type FidelFamily,
  KEYBOARD_LANGUAGES,
  type KeyboardLanguageId,
  NUMBERS_AND_SYMBOLS_ROWS,
  OROMO_QUBEE_SHORTCUTS,
  OROMO_QWERTY_ROWS,
  TIGRINYA_FIDEL_PAGE_1,
  TIGRINYA_FIDEL_PAGE_2,
} from './keyboardData';
import {
  applyTextStateToDOMElement,
  clearAllClipboardHistory,
  type ClipboardSnippet,
  deleteBackwardCodePoint,
  deleteClipboardSnippet,
  formatOromoShortcutSequence,
  getPrecedingCodePoint,
  type InputFieldDescriptor,
  insertTextAtSelection,
  isSupportedKeyboardField,
  KEYBOARD_PREFS_EVENT,
  type KeyboardPreferences,
  loadClipboardHistory,
  loadKeyboardPreferences,
  moveCursorCodePoint,
  recordClipboardSnippet,
  replacePrecedingCodePoint,
  saveKeyboardPreferences,
  type ShiftMode,
  type TextFieldState,
  togglePinClipboardSnippet,
} from './textEditingEngine';
import { useLanguagePreference } from '../components/DesignSystem';

type KeyboardPanelMode = 'keys' | 'clipboard' | 'settings';

function getElementDescriptor(el: HTMLElement): InputFieldDescriptor {
  const input = el as HTMLInputElement;
  return {
    tagName: el.tagName,
    type: input.type || 'text',
    name: input.name || '',
    id: input.id || '',
    autoComplete: input.autocomplete || '',
    inputMode: el.getAttribute('inputmode') || '',
    readOnly: Boolean(input.readOnly),
    disabled: Boolean(input.disabled),
    dataSensitive: el.getAttribute('data-sensitive'),
    dataKeyboard: el.getAttribute('data-keyboard'),
  };
}

function readElementTextState(
  el: HTMLInputElement | HTMLTextAreaElement
): TextFieldState {
  const val = el.value || '';
  const start =
    typeof el.selectionStart === 'number' ? el.selectionStart : val.length;
  const end = typeof el.selectionEnd === 'number' ? el.selectionEnd : val.length;
  return {
    value: val,
    selectionStart: start,
    selectionEnd: end,
  };
}

export const AkaraiKeyboard: React.FC<{
  onNotify?: (msg: string) => void;
}> = ({ onNotify }) => {
  const { t } = useLanguagePreference();
  const [prefs, setPrefs] = useState<KeyboardPreferences>(() =>
    loadKeyboardPreferences()
  );
  const [activeElement, setActiveElement] = useState<
    HTMLInputElement | HTMLTextAreaElement | null
  >(null);
  const [isVisible, setIsVisible] = useState(false);
  const [panelMode, setPanelMode] = useState<KeyboardPanelMode>('keys');
  const [toolbarExpanded, setToolbarExpanded] = useState(false);
  const [shiftMode, setShiftMode] = useState<ShiftMode>('shift');
  const [numbersLayer, setNumbersLayer] = useState(false);
  const [fidelPage, setFidelPage] = useState<1 | 2>(1);
  const [activeFidelFamily, setActiveFidelFamily] = useState<FidelFamily>(
    FIDEL_FAMILIES['ሀ']
  );
  const [justTypedFidelBase, setJustTypedFidelBase] = useState(false);
  const [popupFidelFamily, setPopupFidelFamily] = useState<FidelFamily | null>(
    null
  );
  const [previewKeyLabel, setPreviewKeyLabel] = useState<string | null>(null);
  const [clipboardSnippets, setClipboardSnippets] = useState<ClipboardSnippet[]>(
    () => loadClipboardHistory(prefs.retentionHours)
  );
  const [inMemoryClipboard, setInMemoryClipboard] = useState<string>('');
  const [clipboardNotice, setClipboardNotice] = useState<string | null>(null);

  // Undo / Redo stacks per focused element
  const undoStackRef = useRef<TextFieldState[]>([]);
  const redoStackRef = useRef<TextFieldState[]>([]);
  const backspaceTimerRef = useRef<number | null>(null);
  const backspaceIntervalRef = useRef<number | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const keyboardContainerRef = useRef<HTMLDivElement | null>(null);

  // Sync preferences when updated from Settings screen
  useEffect(() => {
    const handlePrefsUpdate = () => {
      const latest = loadKeyboardPreferences();
      setPrefs(latest);
      setClipboardSnippets(loadClipboardHistory(latest.retentionHours));
    };
    window.addEventListener(KEYBOARD_PREFS_EVENT, handlePrefsUpdate);
    window.addEventListener('storage', handlePrefsUpdate);
    return () => {
      window.removeEventListener(KEYBOARD_PREFS_EVENT, handlePrefsUpdate);
      window.removeEventListener('storage', handlePrefsUpdate);
    };
  }, []);

  const updatePrefs = useCallback(
    (updates: Partial<KeyboardPreferences>) => {
      const next = saveKeyboardPreferences(updates);
      setPrefs(next);
      setClipboardSnippets(loadClipboardHistory(next.retentionHours));
      return next;
    },
    []
  );

  // Manage inputMode="none" on active element when Akarai Keyboard is active
  useEffect(() => {
    if (!activeElement) return;
    if (prefs.enabled && prefs.preferredInputMode === 'akarai' && isVisible) {
      if (!activeElement.hasAttribute('data-orig-inputmode')) {
        activeElement.setAttribute(
          'data-orig-inputmode',
          activeElement.getAttribute('inputmode') || ''
        );
      }
      activeElement.setAttribute('inputmode', 'none');
    } else {
      const orig = activeElement.getAttribute('data-orig-inputmode');
      if (orig) {
        activeElement.setAttribute('inputmode', orig);
      } else {
        activeElement.removeAttribute('inputmode');
      }
    }
  }, [activeElement, prefs.enabled, prefs.preferredInputMode, isVisible]);

  // Listen for focusin across the app to attach to supported text fields
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Ignore focus events inside the keyboard UI itself
      if (
        keyboardContainerRef.current &&
        keyboardContainerRef.current.contains(target)
      ) {
        return;
      }

      const desc = getElementDescriptor(target);
      if (isSupportedKeyboardField(desc)) {
        const inputEl = target as HTMLInputElement | HTMLTextAreaElement;
        setActiveElement(inputEl);
        undoStackRef.current = [readElementTextState(inputEl)];
        redoStackRef.current = [];
        setJustTypedFidelBase(false);

        const currentPrefs = loadKeyboardPreferences();
        if (currentPrefs.enabled && currentPrefs.preferredInputMode === 'akarai') {
          setIsVisible(true);
          setPanelMode('keys');
          // Auto-scroll active field into view above the keyboard dock
          window.setTimeout(() => {
            try {
              inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } catch {
              // ignore
            }
          }, 80);
        }
      } else if (
        target.tagName === 'INPUT' ||
        target.tagName === 'SELECT' ||
        target.tagName === 'TEXTAREA'
      ) {
        // Unsupported or sensitive field (e.g. number, date, select, password) -> hide custom keyboard
        setIsVisible(false);
        setActiveElement(null);
      }
    };

    document.addEventListener('focusin', handleFocusIn, true);
    return () => {
      document.removeEventListener('focusin', handleFocusIn, true);
    };
  }, []);

  // Trigger optional tactile vibration if enabled and supported
  const triggerKeyFeedback = useCallback(
    (label?: string) => {
      if (prefs.vibrationEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(10);
        } catch {
          // ignore
        }
      }
      if (prefs.keyPreviewEnabled && label) {
        setPreviewKeyLabel(label);
        window.setTimeout(() => {
          setPreviewKeyLabel((curr) => (curr === label ? null : curr));
        }, 160);
      }
    },
    [prefs.vibrationEnabled, prefs.keyPreviewEnabled]
  );

  const commitTextMutation = useCallback(
    (mutator: (current: TextFieldState) => TextFieldState, recordUndo = true) => {
      if (!activeElement) return;
      const currentState = readElementTextState(activeElement);
      if (recordUndo) {
        undoStackRef.current = [...undoStackRef.current.slice(-29), currentState];
        redoStackRef.current = [];
      }
      const nextState = mutator(currentState);
      applyTextStateToDOMElement(activeElement, nextState);

      // Update active Fidel family if the preceding character is an Ethiopic character
      const lastCp = getPrecedingCodePoint(nextState);
      if (lastCp && CHAR_TO_FIDEL_FAMILY[lastCp]) {
        setActiveFidelFamily(CHAR_TO_FIDEL_FAMILY[lastCp]);
      }
    },
    [activeElement]
  );

  const handleInsertText = useCallback(
    (text: string, isFidelBaseKey = false) => {
      triggerKeyFeedback(text);
      commitTextMutation((curr) => insertTextAtSelection(curr, text));
      if (isFidelBaseKey && FIDEL_FAMILIES[text]) {
        setActiveFidelFamily(FIDEL_FAMILIES[text]);
        setJustTypedFidelBase(true);
      } else {
        setJustTypedFidelBase(false);
      }
      if (shiftMode === 'shift') {
        setShiftMode('off');
      }
    },
    [commitTextMutation, shiftMode, triggerKeyFeedback]
  );

  const handleSelectFidelVowelOrder = useCallback(
    (orderChar: string, index: number) => {
      triggerKeyFeedback(orderChar);
      if (justTypedFidelBase && index > 0) {
        // Morph the just-typed base consonant in-place into its selected vowel order
        commitTextMutation((curr) => replacePrecedingCodePoint(curr, orderChar));
        setJustTypedFidelBase(false);
      } else if (justTypedFidelBase && index === 0) {
        // 1st order was already inserted when the base key was tapped; tapping 1st order again inserts another
        commitTextMutation((curr) => insertTextAtSelection(curr, orderChar));
      } else {
        // Replace preceding char if it belongs to the same Fidel family, otherwise insert directly
        commitTextMutation((curr) => {
          const prevChar = getPrecedingCodePoint(curr);
          if (
            prevChar &&
            CHAR_TO_FIDEL_FAMILY[prevChar]?.base === activeFidelFamily.base
          ) {
            return replacePrecedingCodePoint(curr, orderChar);
          }
          return insertTextAtSelection(curr, orderChar);
        });
      }
      setPopupFidelFamily(null);
    },
    [
      activeFidelFamily.base,
      commitTextMutation,
      justTypedFidelBase,
      triggerKeyFeedback,
    ]
  );

  const handleBackspace = useCallback(() => {
    triggerKeyFeedback();
    setJustTypedFidelBase(false);
    commitTextMutation((curr) => deleteBackwardCodePoint(curr));
  }, [commitTextMutation, triggerKeyFeedback]);

  const startBackspaceRepeat = useCallback(() => {
    handleBackspace();
    if (backspaceTimerRef.current) window.clearTimeout(backspaceTimerRef.current);
    if (backspaceIntervalRef.current) window.clearInterval(backspaceIntervalRef.current);

    backspaceTimerRef.current = window.setTimeout(() => {
      backspaceIntervalRef.current = window.setInterval(() => {
        handleBackspace();
      }, 65);
    }, 380);
  }, [handleBackspace]);

  const stopBackspaceRepeat = useCallback(() => {
    if (backspaceTimerRef.current) {
      window.clearTimeout(backspaceTimerRef.current);
      backspaceTimerRef.current = null;
    }
    if (backspaceIntervalRef.current) {
      window.clearInterval(backspaceIntervalRef.current);
      backspaceIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopBackspaceRepeat();
  }, [stopBackspaceRepeat]);

  const handleMoveCursor = useCallback(
    (direction: 'left' | 'right', extendSelection = false) => {
      if (!activeElement) return;
      const curr = readElementTextState(activeElement);
      const next = moveCursorCodePoint(curr, direction, extendSelection);
      setJustTypedFidelBase(false);
      try {
        activeElement.focus({ preventScroll: true });
        activeElement.setSelectionRange(next.selectionStart, next.selectionEnd);
      } catch {
        // ignore
      }
    },
    [activeElement]
  );

  const handleUndo = useCallback(() => {
    if (!activeElement || undoStackRef.current.length === 0) return;
    const current = readElementTextState(activeElement);
    const previous = undoStackRef.current.pop();
    if (!previous) return;
    redoStackRef.current.push(current);
    applyTextStateToDOMElement(activeElement, previous);
    setJustTypedFidelBase(false);
  }, [activeElement]);

  const handleRedo = useCallback(() => {
    if (!activeElement || redoStackRef.current.length === 0) return;
    const current = readElementTextState(activeElement);
    const next = redoStackRef.current.pop();
    if (!next) return;
    undoStackRef.current.push(current);
    applyTextStateToDOMElement(activeElement, next);
    setJustTypedFidelBase(false);
  }, [activeElement]);

  const handleEnterOrNext = useCallback(() => {
    if (!activeElement) return;
    if (activeElement.tagName === 'TEXTAREA') {
      handleInsertText('\n');
      return;
    }
    // Move to next focusable text field in the form or close keyboard
    const form = activeElement.closest('form');
    if (form) {
      const fields = Array.from(
        form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
          'input:not([type="hidden"]):not([disabled]), textarea:not([disabled])'
        )
      ).filter((el) => isSupportedKeyboardField(getElementDescriptor(el)));
      const idx = fields.indexOf(activeElement);
      if (idx >= 0 && idx + 1 < fields.length) {
        fields[idx + 1].focus();
        return;
      }
    }
    setIsVisible(false);
  }, [activeElement, handleInsertText]);

  // Clipboard actions: Copy, Cut, Paste, Select All
  const handleSelectAll = useCallback(() => {
    if (!activeElement) return;
    try {
      activeElement.focus({ preventScroll: true });
      activeElement.setSelectionRange(0, activeElement.value.length);
      setClipboardNotice('Selected all text in active field.');
    } catch {
      // ignore
    }
  }, [activeElement]);

  const handleCopy = useCallback(
    async (cut = false) => {
      if (!activeElement) return;
      const state = readElementTextState(activeElement);
      const hasSelection = state.selectionStart !== state.selectionEnd;
      const selectedText = hasSelection
        ? state.value.slice(state.selectionStart, state.selectionEnd)
        : state.value;

      if (!selectedText) {
        setClipboardNotice('Nothing to copy from this field.');
        return;
      }

      setInMemoryClipboard(selectedText);
      const desc = getElementDescriptor(activeElement);
      const updatedHistory = recordClipboardSnippet({
        text: selectedText,
        language: prefs.activeLanguage,
        fieldDescriptor: desc,
        prefs,
      });
      setClipboardSnippets(updatedHistory);

      // Write to browser Clipboard API where available and permitted
      let systemClipboardWrote = false;
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(selectedText);
          systemClipboardWrote = true;
        } catch {
          systemClipboardWrote = false;
        }
      }

      if (cut) {
        if (hasSelection) {
          commitTextMutation((curr) => deleteBackwardCodePoint(curr));
        } else {
          commitTextMutation(() => ({
            value: '',
            selectionStart: 0,
            selectionEnd: 0,
          }));
        }
      }

      const actionLabel = cut ? 'Cut' : 'Copied';
      const msg = systemClipboardWrote
        ? `${actionLabel} "${selectedText.slice(0, 24)}${selectedText.length > 24 ? '…' : ''}"`
        : `${actionLabel} to in-app clipboard buffer.`;
      setClipboardNotice(msg);
      onNotify?.(msg);
    },
    [activeElement, commitTextMutation, onNotify, prefs]
  );

  const handlePasteText = useCallback(
    (textToPaste: string) => {
      if (!activeElement || !textToPaste) return;
      commitTextMutation((curr) => insertTextAtSelection(curr, textToPaste));
      setClipboardNotice(
        `Pasted "${textToPaste.slice(0, 22)}${textToPaste.length > 22 ? '…' : ''}" at cursor.`
      );
    },
    [activeElement, commitTextMutation]
  );

  const handlePasteFromClipboard = useCallback(async () => {
    if (!activeElement) return;
    // Try browser Clipboard API first on explicit user tap
    if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
      try {
        const clipText = await navigator.clipboard.readText();
        if (clipText) {
          handlePasteText(clipText);
          return;
        }
      } catch {
        // Fallback to in-app clipboard buffer or top history item
      }
    }

    if (inMemoryClipboard) {
      handlePasteText(inMemoryClipboard);
      return;
    }

    if (clipboardSnippets.length > 0) {
      handlePasteText(clipboardSnippets[0].text);
      return;
    }

    setClipboardNotice(
      'System clipboard read requires browser permission. Copy text using the keyboard or long-press the input field to use native Paste.'
    );
  }, [activeElement, clipboardSnippets, handlePasteText, inMemoryClipboard]);

  const handleSwitchLanguage = (langId: KeyboardLanguageId) => {
    updatePrefs({ activeLanguage: langId });
    setNumbersLayer(false);
    setFidelPage(1);
    setPopupFidelFamily(null);
    setJustTypedFidelBase(false);
    if (activeElement) {
      activeElement.focus({ preventScroll: true });
    }
  };

  const handleSwitchToDeviceKeyboard = () => {
    updatePrefs({ preferredInputMode: 'device' });
    if (activeElement) {
      const orig = activeElement.getAttribute('data-orig-inputmode');
      if (orig) {
        activeElement.setAttribute('inputmode', orig);
      } else {
        activeElement.removeAttribute('inputmode');
      }
      activeElement.focus();
    }
    setIsVisible(false);
    onNotify?.('Switched to Device Keyboard. Tap the keyboard pill anytime to return to the In-App Keyboard.');
  };

  const handleSwitchToAkaraiKeyboard = () => {
    updatePrefs({ preferredInputMode: 'akarai', enabled: true });
    if (activeElement) {
      activeElement.setAttribute('inputmode', 'none');
      activeElement.focus({ preventScroll: true });
    }
    setIsVisible(true);
    setPanelMode('keys');
  };

  const handleShiftPress = () => {
    setShiftMode((prev) =>
      prev === 'off' ? 'shift' : prev === 'shift' ? 'caps' : 'off'
    );
  };

  // Floating pill when user is focused in a supported text field but using Device Keyboard
  if (
    activeElement &&
    prefs.enabled &&
    (prefs.preferredInputMode === 'device' || !isVisible)
  ) {
    return (
      <div
        ref={keyboardContainerRef}
        className="fixed bottom-[78px] left-1/2 -translate-x-1/2 w-full max-w-[430px] px-4 z-50 pointer-events-none flex justify-start"
      >
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleSwitchToAkaraiKeyboard}
          className="pointer-events-auto h-[38px] px-3.5 rounded-full bg-[#FFFFFF] dark:bg-[#161920] border border-[#0145F2] text-[#0145F2] dark:text-[#68A2FF] shadow-[0_6px_20px_rgba(1,69,242,0.22)] flex items-center gap-2 text-[12.5px] font-bold transition-transform active:scale-95"
        >
          <KeyboardIcon className="w-4 h-4 stroke-[2.2]" />
          <span>
            In-App Keyboard ({KEYBOARD_LANGUAGES.find((l) => l.id === prefs.activeLanguage)?.shortLabel || 'EN'})
          </span>
        </button>
      </div>
    );
  }

  if (!isVisible || !prefs.enabled || !activeElement) {
    return null;
  }

  const activeLangMeta =
    KEYBOARD_LANGUAGES.find((l) => l.id === prefs.activeLanguage) ||
    KEYBOARD_LANGUAGES[0];

  const keyHeightClass =
    prefs.keyboardSize === 'compact'
      ? 'h-[38px]'
      : prefs.keyboardSize === 'large'
        ? 'h-[48px]'
        : 'h-[43px]';

  const renderLatinRows = (rows: string[][]) => (
    <div className="space-y-2 pt-0.5">
      {rows.map((row, rowIdx) => {
        const isLastRow = rowIdx === rows.length - 1;
        return (
          <div
            key={rowIdx}
            className={`flex items-center justify-center gap-[5px] ${
              rowIdx === 1 && rows[1].length === 9 ? 'px-3' : ''
            }`}
          >
            {isLastRow && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleShiftPress}
                aria-label={`Shift (${shiftMode})`}
                className={`${keyHeightClass} w-[44px] rounded-[11px] flex items-center justify-center border transition-colors shrink-0 ${
                  shiftMode !== 'off'
                    ? 'bg-[#0145F2] text-[#FFFFFF] border-[#0145F2]'
                    : 'bg-[#E2E8F0] dark:bg-[#232831] text-[#111318] dark:text-[#FFFFFF] border-[#D5DFEC] dark:border-[#2E3540]'
                }`}
              >
                <ArrowUp
                  className={`w-[19px] h-[19px] stroke-[2.3] ${
                    shiftMode === 'caps' ? 'underline' : ''
                  }`}
                />
              </button>
            )}

            {row.map((ch) => {
              const displayChar =
                ch === '’'
                  ? '’'
                  : shiftMode === 'off'
                    ? ch.toLowerCase()
                    : ch.toUpperCase();
              return (
                <button
                  key={ch}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleInsertText(displayChar)}
                  className={`${keyHeightClass} flex-1 min-w-[28px] max-w-[39px] rounded-[11px] bg-[#FFFFFF] dark:bg-[#1B1F26] hover:bg-[#F5F8FC] dark:hover:bg-[#242933] active:bg-[#0145F2] active:text-[#FFFFFF] border border-[#E1E7F0] dark:border-[#2A303B] shadow-[0_1px_2px_rgba(17,19,24,0.06)] dark:shadow-none text-[17px] font-semibold text-[#111318] dark:text-[#FFFFFF] flex items-center justify-center select-none transition-colors`}
                >
                  {displayChar}
                </button>
              );
            })}

            {isLastRow && (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  startBackspaceRepeat();
                }}
                onMouseUp={stopBackspaceRepeat}
                onMouseLeave={stopBackspaceRepeat}
                onTouchStart={(e) => {
                  e.preventDefault();
                  startBackspaceRepeat();
                }}
                onTouchEnd={stopBackspaceRepeat}
                aria-label="Backspace"
                className={`${keyHeightClass} w-[44px] rounded-[11px] bg-[#E2E8F0] dark:bg-[#232831] active:bg-[#CBD5E1] dark:active:bg-[#313846] text-[#111318] dark:text-[#FFFFFF] border border-[#D5DFEC] dark:border-[#2E3540] flex items-center justify-center shrink-0`}
              >
                <Delete className="w-[19px] h-[19px] stroke-[2.1]" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderFidelRows = (languageId: 'am' | 'ti') => {
    const rows =
      languageId === 'am'
        ? fidelPage === 1
          ? AMHARIC_FIDEL_PAGE_1
          : AMHARIC_FIDEL_PAGE_2
        : fidelPage === 1
          ? TIGRINYA_FIDEL_PAGE_1
          : TIGRINYA_FIDEL_PAGE_2;

    return (
      <div className="space-y-1.5 pt-0.5 relative">
        {/* Floating Long-Press Vowel Order Popup */}
        {popupFidelFamily && (
          <div className="p-2 rounded-[16px] bg-[#FFFFFF] dark:bg-[#161920] border-2 border-[#0145F2] shadow-[0_8px_24px_rgba(1,69,242,0.28)] flex items-center justify-between gap-1">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1">
              {popupFidelFamily.orders.map((ordChar, idx) => (
                <button
                  key={ordChar}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelectFidelVowelOrder(ordChar, idx)}
                  className="h-[38px] min-w-[36px] px-2 rounded-[10px] bg-[#E7F0FF] dark:bg-[#1E2942] hover:bg-[#0145F2] hover:text-[#FFFFFF] text-[#0145F2] dark:text-[#FFFFFF] text-[17px] font-bold flex items-center justify-center shrink-0"
                >
                  {ordChar}
                </button>
              ))}
            </div>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setPopupFidelFamily(null)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[#626A78] hover:text-[#111318] dark:hover:text-[#FFFFFF]"
              aria-label="Close character variants"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {rows.map((row, rowIdx) => (
          <div
            key={rowIdx}
            className="grid grid-cols-10 gap-[4px]"
          >
            {row.map((ch) => {
              const hasFamily = Boolean(FIDEL_FAMILIES[ch]);
              const isSelectedBase =
                hasFamily && activeFidelFamily.base === ch;

              return (
                <button
                  key={ch}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (hasFamily) {
                      if (longPressTimerRef.current) {
                        window.clearTimeout(longPressTimerRef.current);
                      }
                      longPressTimerRef.current = window.setTimeout(() => {
                        setPopupFidelFamily(FIDEL_FAMILIES[ch]);
                      }, 360);
                    }
                  }}
                  onMouseUp={() => {
                    if (longPressTimerRef.current) {
                      window.clearTimeout(longPressTimerRef.current);
                      longPressTimerRef.current = null;
                    }
                  }}
                  onMouseLeave={() => {
                    if (longPressTimerRef.current) {
                      window.clearTimeout(longPressTimerRef.current);
                      longPressTimerRef.current = null;
                    }
                  }}
                  onClick={() => handleInsertText(ch, hasFamily)}
                  className={`${keyHeightClass} rounded-[10px] border text-[16.5px] font-bold flex items-center justify-center select-none transition-colors ${
                    isSelectedBase
                      ? 'bg-[#E7F0FF] dark:bg-[#192848] text-[#0145F2] dark:text-[#68A2FF] border-[#0145F2]'
                      : 'bg-[#FFFFFF] dark:bg-[#1B1F26] active:bg-[#0145F2] active:text-[#FFFFFF] text-[#111318] dark:text-[#FFFFFF] border-[#E1E7F0] dark:border-[#2A303B] shadow-[0_1px_2px_rgba(17,19,24,0.05)] dark:shadow-none'
                  }`}
                >
                  {ch}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Spacer so bottom of page can scroll above the docked keyboard */}
      <div className="h-[290px] w-full shrink-0" aria-hidden="true" />

      <div
        ref={keyboardContainerRef}
        role="region"
        aria-label="In-App Multilingual Keyboard"
        onMouseDown={(e) => {
          // Prevent clicking keyboard chrome from blurring the active text input
          e.preventDefault();
        }}
        className="fixed bottom-0 left-0 right-0 z-[60] flex justify-center pointer-events-none pb-safe"
      >
        <div className="pointer-events-auto w-full max-w-[430px] rounded-t-[26px] bg-[#EDF1F6] dark:bg-[#0E1014] border-t border-[#DCE3EE] dark:border-[#232832] shadow-[0_-10px_32px_rgba(17,19,24,0.16)] dark:shadow-[0_-12px_36px_rgba(0,0,0,0.85)] px-2.5 pt-2.5 pb-3 transition-colors select-none">
          {/* Key press preview floating indicator */}
          {previewKeyLabel && (
            <div className="fixed bottom-[275px] left-1/2 -translate-x-1/2 z-[70] px-4 py-1.5 rounded-full bg-[#0145F2] text-[#FFFFFF] text-[16px] font-bold shadow-lg pointer-events-none">
              {previewKeyLabel}
            </div>
          )}

          {/* 1. Top Language Selector & Utility Toolbar Bar (1:1 match with screenshot) */}
          <div className="flex items-center justify-between gap-1.5 pb-2">
            {/* Left: Blue Keyboard Menu Button */}
            <button
              type="button"
              onClick={() => setToolbarExpanded((prev) => !prev)}
              aria-label="Toggle keyboard toolbar actions"
              title="Keyboard tools (Clipboard, Settings, Device Keyboard)"
              className={`w-[38px] h-[34px] rounded-full flex items-center justify-center border transition-colors shrink-0 ${
                toolbarExpanded || panelMode !== 'keys'
                  ? 'bg-[#0145F2] text-[#FFFFFF] border-[#0145F2]'
                  : 'bg-[#DCEBFF] dark:bg-[#162238] text-[#0145F2] dark:text-[#FFFFFF] border-[#0145F2]/40'
              }`}
            >
              <KeyboardIcon className="w-[18px] h-[18px] stroke-[2.2]" />
            </button>

            {/* Center: 4 Language Mode Pills (EN, አማ, ትግ, OR) */}
            <div
              role="tablist"
              aria-label="Keyboard language selector"
              className="flex-1 grid grid-cols-4 gap-1.5"
            >
              {KEYBOARD_LANGUAGES.map((lang) => {
                const isSelected =
                  prefs.activeLanguage === lang.id && panelMode === 'keys';
                return (
                  <button
                    key={lang.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => {
                      setPanelMode('keys');
                      handleSwitchLanguage(lang.id);
                    }}
                    className={`h-[34px] rounded-full text-[13.5px] font-bold transition-colors flex items-center justify-center ${
                      isSelected
                        ? 'bg-[#0145F2] text-[#FFFFFF] border border-[#0145F2] shadow-[0_2px_8px_rgba(1,69,242,0.3)]'
                        : 'bg-[#FFFFFF] dark:bg-[#181C23] text-[#111318] dark:text-[#E5E7EB] border border-[#E1E7F0] dark:border-[#2A303B]'
                    }`}
                  >
                    {lang.shortLabel}
                  </button>
                );
              })}
            </div>

            {/* Right: Quick Clipboard & Hide Keyboard buttons */}
            <button
              type="button"
              onClick={() =>
                setPanelMode((prev) =>
                  prev === 'clipboard' ? 'keys' : 'clipboard'
                )
              }
              aria-label="Open Clipboard Manager"
              title="Clipboard Manager"
              className={`w-[34px] h-[34px] rounded-full flex items-center justify-center border transition-colors shrink-0 ${
                panelMode === 'clipboard'
                  ? 'bg-[#0145F2] text-[#FFFFFF] border-[#0145F2]'
                  : 'bg-[#FFFFFF] dark:bg-[#181C23] text-[#111318] dark:text-[#E5E7EB] border-[#E1E7F0] dark:border-[#2A303B]'
              }`}
            >
              <Clipboard className="w-[15px] h-[15px] stroke-[2.1]" />
            </button>

            <button
              type="button"
              onClick={() => setIsVisible(false)}
              aria-label="Hide keyboard"
              title="Hide keyboard"
              className="w-[34px] h-[34px] rounded-full bg-[#FFFFFF] dark:bg-[#181C23] text-[#111318] dark:text-[#E5E7EB] border border-[#E1E7F0] dark:border-[#2A303B] flex items-center justify-center shrink-0"
            >
              <ChevronDown className="w-[17px] h-[17px] stroke-[2.2]" />
            </button>
          </div>

          {/* Expandable Compact Keyboard Toolbar (Clipboard, Settings, Device Keyboard Fallback, Cursor, Undo/Redo) */}
          {toolbarExpanded && (
            <div className="mb-2 px-2 py-1.5 rounded-[14px] bg-[#FFFFFF] dark:bg-[#171A21] border border-[#E1E7F0] dark:border-[#2A303B] flex items-center justify-between gap-1 text-[11.5px] font-semibold overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() =>
                  setPanelMode((p) => (p === 'clipboard' ? 'keys' : 'clipboard'))
                }
                className={`px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0 ${
                  panelMode === 'clipboard'
                    ? 'bg-[#0145F2] text-white'
                    : 'text-[#111318] dark:text-[#E5E7EB] hover:bg-[#EDF1F6] dark:hover:bg-[#232832]'
                }`}
              >
                <Clipboard className="w-3.5 h-3.5 text-[#0145F2] dark:text-[#68A2FF]" />
                <span>Clipboard</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setPanelMode((p) => (p === 'settings' ? 'keys' : 'settings'))
                }
                className={`px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0 ${
                  panelMode === 'settings'
                    ? 'bg-[#0145F2] text-white'
                    : 'text-[#111318] dark:text-[#E5E7EB] hover:bg-[#EDF1F6] dark:hover:bg-[#232832]'
                }`}
              >
                <Settings className="w-3.5 h-3.5 text-[#0145F2] dark:text-[#68A2FF]" />
                <span>KB Settings</span>
              </button>

              <button
                type="button"
                onClick={handleSwitchToDeviceKeyboard}
                className="px-2.5 py-1 rounded-full flex items-center gap-1 text-[#111318] dark:text-[#E5E7EB] hover:bg-[#EDF1F6] dark:hover:bg-[#232832] shrink-0"
              >
                <Smartphone className="w-3.5 h-3.5 text-[#0145F2] dark:text-[#68A2FF]" />
                <span>Device KB</span>
              </button>

              <div className="flex items-center gap-0.5 shrink-0 border-l border-[#E1E7F0] dark:border-[#2A303B] pl-1">
                <button
                  type="button"
                  onClick={() => handleMoveCursor('left')}
                  aria-label="Move cursor left"
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[#EDF1F6] dark:hover:bg-[#232832]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveCursor('right')}
                  aria-label="Move cursor right"
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[#EDF1F6] dark:hover:bg-[#232832]"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleUndo}
                  aria-label="Undo typing"
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[#EDF1F6] dark:hover:bg-[#232832]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleRedo}
                  aria-label="Redo typing"
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[#EDF1F6] dark:hover:bg-[#232832]"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* PANEL A: CLIPBOARD MANAGER */}
          {panelMode === 'clipboard' && (
            <div className="rounded-[18px] bg-[#FFFFFF] dark:bg-[#15181E] border border-[#E1E7F0] dark:border-[#262B34] p-3 space-y-2.5 max-h-[235px] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div className="text-[13px] font-bold text-[#111318] dark:text-[#FFFFFF] flex items-center gap-1.5">
                  <Clipboard className="w-4 h-4 text-[#0145F2]" />
                  <span>In-App Clipboard Manager</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPanelMode('keys')}
                  className="text-[12px] font-bold text-[#0145F2] dark:text-[#68A2FF]"
                >
                  Back to Keys
                </button>
              </div>

              {/* Direct Clipboard Actions: Copy, Cut, Paste, Select All */}
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleCopy(false)}
                  className="h-[36px] rounded-[11px] bg-[#E7F0FF] dark:bg-[#19243A] text-[#0145F2] dark:text-[#68A2FF] text-[12px] font-bold flex items-center justify-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(true)}
                  className="h-[36px] rounded-[11px] bg-[#F5F7FA] dark:bg-[#1F242D] text-[#111318] dark:text-[#FFFFFF] border border-[#E1E7F0] dark:border-[#2B313C] text-[12px] font-semibold flex items-center justify-center gap-1"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>Cut</span>
                </button>
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="h-[36px] rounded-[11px] bg-[#0145F2] text-[#FFFFFF] text-[12px] font-bold flex items-center justify-center gap-1"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  <span>Paste</span>
                </button>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="h-[36px] rounded-[11px] bg-[#F5F7FA] dark:bg-[#1F242D] text-[#111318] dark:text-[#FFFFFF] border border-[#E1E7F0] dark:border-[#2B313C] text-[12px] font-semibold flex items-center justify-center"
                >
                  <span>Select All</span>
                </button>
              </div>

              {clipboardNotice && (
                <div className="px-2.5 py-1.5 rounded-[10px] bg-[#F5F7FA] dark:bg-[#1C2028] text-[11px] text-[#626A78] dark:text-[#98A1B2]">
                  {clipboardNotice}
                </div>
              )}

              {/* Opt-in Clipboard History Header */}
              <div className="flex items-center justify-between pt-1 border-t border-[#EDF1F7] dark:border-[#232830]">
                <label className="flex items-center gap-2 text-[12px] font-semibold text-[#111318] dark:text-[#E5E7EB]">
                  <input
                    type="checkbox"
                    checked={prefs.clipboardHistoryEnabled}
                    onChange={(e) =>
                      updatePrefs({ clipboardHistoryEnabled: e.target.checked })
                    }
                    className="w-3.5 h-3.5 accent-[#0145F2]"
                  />
                  <span>Save Copied Snippets Locally (Opt-In)</span>
                </label>
                {clipboardSnippets.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setClipboardSnippets(clearAllClipboardHistory());
                      setClipboardNotice('Cleared all saved clipboard snippets.');
                    }}
                    className="text-[11px] font-semibold text-[#E82C33] dark:text-[#FF5A5F] hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Saved Clipboard History Cards */}
              {!prefs.clipboardHistoryEnabled ? (
                <div className="p-2.5 rounded-[12px] bg-[#F5F7FA] dark:bg-[#1A1E26] text-[11.5px] text-[#626A78] dark:text-[#98A1B2] leading-relaxed">
                  Clipboard history is currently off for privacy. Enable the checkbox above to keep recently copied names, phone numbers, and notice phrases locally on this device. Passwords and sensitive fields are never recorded.
                </div>
              ) : clipboardSnippets.length === 0 ? (
                <div className="p-2.5 rounded-[12px] bg-[#F5F7FA] dark:bg-[#1A1E26] text-[11.5px] text-[#626A78] dark:text-[#98A1B2] leading-relaxed">
                  No saved snippets yet. Select text in any field and tap <strong>Copy</strong> to save reusable snippets here.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {clipboardSnippets.map((item) => (
                    <div
                      key={item.id}
                      className="p-2 rounded-[12px] bg-[#F5F7FA] dark:bg-[#1C2029] border border-[#E1E7F0] dark:border-[#2B313C] flex items-center justify-between gap-2"
                    >
                      <button
                        type="button"
                        onClick={() => handlePasteText(item.text)}
                        className="flex-1 text-left text-[12.5px] font-medium text-[#111318] dark:text-[#FFFFFF] truncate"
                        title="Tap to paste at cursor"
                      >
                        {item.text}
                      </button>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setClipboardSnippets(
                              togglePinClipboardSnippet(item.id)
                            )
                          }
                          aria-label={item.pinned ? 'Unpin snippet' : 'Pin snippet'}
                          className={`w-7 h-7 rounded-full flex items-center justify-center ${
                            item.pinned
                              ? 'bg-[#0145F2] text-white'
                              : 'text-[#626A78] hover:text-[#0145F2]'
                          }`}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setClipboardSnippets(deleteClipboardSnippet(item.id))
                          }
                          aria-label="Delete snippet"
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[#626A78] hover:text-[#E82C33]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PANEL B: INLINE KEYBOARD SETTINGS */}
          {panelMode === 'settings' && (
            <div className="rounded-[18px] bg-[#FFFFFF] dark:bg-[#15181E] border border-[#E1E7F0] dark:border-[#262B34] p-3 space-y-2.5 max-h-[235px] overflow-y-auto text-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold text-[#111318] dark:text-[#FFFFFF]">
                  {t.keyboardSettings.title}
                </span>
                <button
                  type="button"
                  onClick={() => setPanelMode('keys')}
                  className="text-[12px] font-bold text-[#0145F2] dark:text-[#68A2FF]"
                >
                  {t.common.done}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[#626A78] dark:text-[#98A1B2] mb-1">
                    {t.keyboardSettings.defaultLangLabel}
                  </label>
                  <select
                    value={prefs.defaultLanguage}
                    onChange={(e) =>
                      updatePrefs({
                        defaultLanguage: e.target.value as KeyboardLanguageId,
                        activeLanguage: e.target.value as KeyboardLanguageId,
                      })
                    }
                    className="w-full h-[34px] px-2.5 rounded-[10px] border border-[#E1E7F0] dark:border-[#2B313C] bg-[#F5F7FA] dark:bg-[#1C2029] text-[#111318] dark:text-[#FFFFFF] font-semibold"
                  >
                    {KEYBOARD_LANGUAGES.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.englishName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#626A78] dark:text-[#98A1B2] mb-1">
                    {t.keyboardSettings.keySizeLabel}
                  </label>
                  <select
                    value={prefs.keyboardSize}
                    onChange={(e) =>
                      updatePrefs({
                        keyboardSize: e.target.value as
                          | 'compact'
                          | 'standard'
                          | 'large',
                      })
                    }
                    className="w-full h-[34px] px-2.5 rounded-[10px] border border-[#E1E7F0] dark:border-[#2B313C] bg-[#F5F7FA] dark:bg-[#1C2029] text-[#111318] dark:text-[#FFFFFF] font-semibold"
                  >
                    <option value="compact">{t.keyboardSettings.sizeCompact}</option>
                    <option value="standard">{t.keyboardSettings.sizeStandard}</option>
                    <option value="large">{t.keyboardSettings.sizeLarge}</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <label className="flex items-center gap-1.5 font-medium">
                  <input
                    type="checkbox"
                    checked={prefs.keyPreviewEnabled}
                    onChange={(e) =>
                      updatePrefs({ keyPreviewEnabled: e.target.checked })
                    }
                    className="w-3.5 h-3.5 accent-[#0145F2]"
                  />
                  <span>{t.keyboardSettings.keyPreviewLabel}</span>
                </label>
                <label className="flex items-center gap-1.5 font-medium">
                  <input
                    type="checkbox"
                    checked={prefs.vibrationEnabled}
                    onChange={(e) =>
                      updatePrefs({ vibrationEnabled: e.target.checked })
                    }
                    className="w-3.5 h-3.5 accent-[#0145F2]"
                  />
                  <span>{t.keyboardSettings.keyVibrationLabel}</span>
                </label>
              </div>

              <div className="pt-1 flex items-center justify-between border-t border-[#EDF1F7] dark:border-[#232830]">
                <button
                  type="button"
                  onClick={handleSwitchToDeviceKeyboard}
                  className="px-3 py-1.5 rounded-full bg-[#F5F7FA] dark:bg-[#1F242D] border border-[#E1E7F0] dark:border-[#2B313C] font-semibold flex items-center gap-1.5"
                >
                  <Smartphone className="w-3.5 h-3.5 text-[#0145F2]" />
                  <span>{t.keyboardSettings.deviceKeyboardLabel}</span>
                </button>
                <span className="text-[11px] text-[#626A78] dark:text-[#98A1B2]">
                  100% Offline Engine
                </span>
              </div>
            </div>
          )}

          {/* PANEL C: ACTIVE KEYBOARD KEYS */}
          {panelMode === 'keys' && (
            <>
              {/* 2. Language-Specific Shortcut / Vowel Composition Row */}
              {prefs.activeLanguage === 'om' && !numbersLayer && (
                <div
                  aria-label="Afaan Oromoo Qubee shortcuts"
                  className="grid grid-cols-10 gap-[4px] pb-2"
                >
                  {OROMO_QUBEE_SHORTCUTS.map((seq) => {
                    const formatted = formatOromoShortcutSequence(
                      seq,
                      shiftMode
                    );
                    const isHighlighted =
                      seq === 'Sh' ||
                      seq === 'Ny' ||
                      seq === 'Ch' ||
                      seq === 'Dh' ||
                      seq === 'Ph' ||
                      seq === 'Ee' ||
                      seq === 'Ii';
                    return (
                      <button
                        key={seq}
                        type="button"
                        onClick={() => handleInsertText(formatted)}
                        className={`h-[31px] rounded-[9px] text-[12.5px] font-bold flex items-center justify-center border transition-colors ${
                          isHighlighted
                            ? 'bg-[#DCEBFF] dark:bg-[#192336] text-[#0145F2] dark:text-[#8AB4F8] border-[#C8DEFF] dark:border-[#263552]'
                            : 'bg-[#E5ECF6] dark:bg-[#1B1F27] text-[#111318] dark:text-[#E5E7EB] border-[#D8E2F0] dark:border-[#2A303B]'
                        } active:bg-[#0145F2] active:text-[#FFFFFF]`}
                      >
                        {formatted}
                      </button>
                    );
                  })}
                </div>
              )}

              {(prefs.activeLanguage === 'am' ||
                prefs.activeLanguage === 'ti') &&
                !numbersLayer && (
                  <div
                    aria-label="Ethiopic Fidel vowel orders"
                    className="flex items-center justify-between gap-1 pb-2"
                  >
                    <div className="flex-1 grid grid-cols-8 gap-[4px]">
                      {activeFidelFamily.orders.slice(0, 8).map((ordChar, idx) => (
                        <button
                          key={ordChar}
                          type="button"
                          onClick={() =>
                            handleSelectFidelVowelOrder(ordChar, idx)
                          }
                          title={`Order ${idx + 1}: ${ordChar}`}
                          className={`h-[32px] rounded-[9px] text-[15px] font-bold flex items-center justify-center border transition-colors ${
                            idx === 0 && justTypedFidelBase
                              ? 'bg-[#0145F2] text-[#FFFFFF] border-[#0145F2]'
                              : 'bg-[#DCEBFF] dark:bg-[#192336] text-[#0145F2] dark:text-[#8AB4F8] border-[#C8DEFF] dark:border-[#263552] active:bg-[#0145F2] active:text-[#FFFFFF]'
                          }`}
                        >
                          {ordChar}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setFidelPage((prev) => (prev === 1 ? 2 : 1))
                      }
                      className="h-[32px] px-2.5 rounded-[9px] bg-[#FFFFFF] dark:bg-[#1B1F26] border border-[#E1E7F0] dark:border-[#2A303B] text-[11.5px] font-bold text-[#0145F2] dark:text-[#68A2FF] shrink-0"
                    >
                      {fidelPage === 1 ? 'ፀ-ፐ 2/2' : 'ሀ-ጸ 1/2'}
                    </button>
                  </div>
                )}

              {prefs.activeLanguage === 'en' && !numbersLayer && (
                <div className="flex items-center justify-between gap-1 pb-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleMoveCursor('left')}
                      aria-label="Cursor left"
                      className="h-[29px] px-2.5 rounded-[8px] bg-[#E5ECF6] dark:bg-[#1B1F27] text-[#111318] dark:text-[#E5E7EB] border border-[#D8E2F0] dark:border-[#2A303B] flex items-center justify-center"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveCursor('right')}
                      aria-label="Cursor right"
                      className="h-[29px] px-2.5 rounded-[8px] bg-[#E5ECF6] dark:bg-[#1B1F27] text-[#111318] dark:text-[#E5E7EB] border border-[#D8E2F0] dark:border-[#2A303B] flex items-center justify-center"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleUndo}
                      aria-label="Undo"
                      className="h-[29px] px-2.5 rounded-[8px] bg-[#E5ECF6] dark:bg-[#1B1F27] text-[#111318] dark:text-[#E5E7EB] border border-[#D8E2F0] dark:border-[#2A303B] text-[11px] font-semibold flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Undo</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    {['.', ',', '-', '/', '@'].map((punct) => (
                      <button
                        key={punct}
                        type="button"
                        onClick={() => handleInsertText(punct)}
                        className="h-[29px] w-[28px] rounded-[8px] bg-[#E5ECF6] dark:bg-[#1B1F27] text-[#111318] dark:text-[#E5E7EB] border border-[#D8E2F0] dark:border-[#2A303B] text-[13px] font-bold flex items-center justify-center"
                      >
                        {punct}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Main Key Rows */}
              {numbersLayer ? (
                <div className="space-y-1.5 pt-0.5">
                  <div className="grid grid-cols-10 gap-[4px] pb-1">
                    {ETHIOPIC_PUNCTUATION_SHORTCUTS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handleInsertText(p)}
                        className="h-[31px] rounded-[9px] bg-[#DCEBFF] dark:bg-[#192336] text-[#0145F2] dark:text-[#8AB4F8] border border-[#C8DEFF] dark:border-[#263552] text-[14px] font-bold flex items-center justify-center"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  {NUMBERS_AND_SYMBOLS_ROWS.map((row, idx) => (
                    <div key={idx} className="grid grid-cols-10 gap-[4px]">
                      {row.map((ch) => (
                        <button
                          key={ch}
                          type="button"
                          onClick={() => handleInsertText(ch)}
                          className={`${keyHeightClass} rounded-[10px] bg-[#FFFFFF] dark:bg-[#1B1F26] active:bg-[#0145F2] active:text-[#FFFFFF] border border-[#E1E7F0] dark:border-[#2A303B] text-[16px] font-semibold text-[#111318] dark:text-[#FFFFFF] flex items-center justify-center`}
                        >
                          {ch}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              ) : prefs.activeLanguage === 'en' ? (
                renderLatinRows(ENGLISH_QWERTY_ROWS)
              ) : prefs.activeLanguage === 'om' ? (
                renderLatinRows(OROMO_QWERTY_ROWS)
              ) : (
                renderFidelRows(prefs.activeLanguage)
              )}

              {/* 4. Bottom Action Row (123 | Smile/Punctuation | Spacebar with Language Name | Backspace [in Fidel/123] | Blue Enter Arrow) */}
              <div className="flex items-center gap-1.5 pt-2">
                <button
                  type="button"
                  onClick={() => setNumbersLayer((prev) => !prev)}
                  className={`h-[44px] px-3.5 rounded-full font-bold text-[14px] border flex items-center justify-center shrink-0 transition-colors ${
                    numbersLayer
                      ? 'bg-[#0145F2] text-[#FFFFFF] border-[#0145F2]'
                      : 'bg-[#E2E8F0] dark:bg-[#232831] text-[#111318] dark:text-[#FFFFFF] border-[#D5DFEC] dark:border-[#2E3540]'
                  }`}
                >
                  {numbersLayer ? 'ABC' : '123'}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleInsertText(
                      prefs.activeLanguage === 'am' ||
                        prefs.activeLanguage === 'ti'
                        ? '።'
                        : '.'
                    )
                  }
                  aria-label="Insert period or Ethiopic full stop"
                  title={
                    prefs.activeLanguage === 'am' ||
                    prefs.activeLanguage === 'ti'
                      ? 'Insert Ethiopic Full Stop (።)'
                      : 'Insert Period (.)'
                  }
                  className="h-[44px] w-[44px] rounded-full bg-[#E2E8F0] dark:bg-[#232831] text-[#111318] dark:text-[#FFFFFF] border border-[#D5DFEC] dark:border-[#2E3540] flex items-center justify-center shrink-0"
                >
                  <Smile className="w-[20px] h-[20px] stroke-[2]" />
                </button>

                {/* Spacebar displaying the active keyboard language name */}
                <button
                  type="button"
                  onClick={() => handleInsertText(' ')}
                  aria-label={`Space (${activeLangMeta.fullName})`}
                  className="h-[44px] flex-1 rounded-full bg-[#FFFFFF] dark:bg-[#232831] active:bg-[#E2E8F0] dark:active:bg-[#313846] border border-[#E1E7F0] dark:border-[#2E3540] shadow-[0_1px_2px_rgba(17,19,24,0.05)] dark:shadow-none text-[14px] font-bold text-[#111318] dark:text-[#FFFFFF] flex items-center justify-center"
                >
                  {activeLangMeta.fullName}
                </button>

                {/* Dedicated Backspace key on bottom row when in Fidel or Numbers mode */}
                {(prefs.activeLanguage === 'am' ||
                  prefs.activeLanguage === 'ti' ||
                  numbersLayer) && (
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      startBackspaceRepeat();
                    }}
                    onMouseUp={stopBackspaceRepeat}
                    onMouseLeave={stopBackspaceRepeat}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      startBackspaceRepeat();
                    }}
                    onTouchEnd={stopBackspaceRepeat}
                    aria-label="Backspace"
                    className="h-[44px] w-[46px] rounded-full bg-[#E2E8F0] dark:bg-[#232831] text-[#111318] dark:text-[#FFFFFF] border border-[#D5DFEC] dark:border-[#2E3540] flex items-center justify-center shrink-0"
                  >
                    <Delete className="w-[19px] h-[19px] stroke-[2.1]" />
                  </button>
                )}

                {/* Primary Electric Blue Enter / Next Field Action Button */}
                <button
                  type="button"
                  onClick={handleEnterOrNext}
                  aria-label="Enter or Next Field"
                  className="h-[44px] w-[52px] rounded-full bg-[#0145F2] hover:bg-[#0039CC] active:scale-95 text-[#FFFFFF] shadow-[0_3px_10px_rgba(1,69,242,0.35)] flex items-center justify-center shrink-0 transition-transform"
                >
                  <ArrowRight className="w-[21px] h-[21px] stroke-[2.4]" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

/**
 * Reusable Keyboard Settings Section for the main Settings screen (/settings)
 */
export const AkaraiKeyboardSettingsSection: React.FC<{
  onNotify?: (msg: string) => void;
}> = ({ onNotify }) => {
  const { t } = useLanguagePreference();
  const [prefs, setPrefs] = useState<KeyboardPreferences>(() =>
    loadKeyboardPreferences()
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [testText, setTestText] = useState('');

  useEffect(() => {
    const sync = () => setPrefs(loadKeyboardPreferences());
    window.addEventListener(KEYBOARD_PREFS_EVENT, sync);
    return () => window.removeEventListener(KEYBOARD_PREFS_EVENT, sync);
  }, []);

  const handleUpdate = (updates: Partial<KeyboardPreferences>, message?: string) => {
    const next = saveKeyboardPreferences(updates);
    setPrefs(next);
    if (message) onNotify?.(message);
  };

  return (
    <div className="p-4 rounded-[20px] bg-[#FFFFFF] dark:bg-[#15181C] border border-[#E6ECF3] dark:border-[#262B31] shadow-[0_2px_10px_rgba(17,19,24,0.03)] dark:shadow-none space-y-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-[38px] h-[38px] rounded-[12px] bg-[#E7F0FF] dark:bg-[#132247] text-[#0145F2] flex items-center justify-center shrink-0">
            <KeyboardIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-[#111318] dark:text-[#FFFFFF]">
              {t.keyboardSettings.title}
            </h2>
            <p className="text-[12px] text-[#626A78] dark:text-[#98A1B2]">
              {t.keyboardSettings.subtitle}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            handleUpdate(
              { enabled: !prefs.enabled },
              `${t.keyboardSettings.title} ${!prefs.enabled ? t.common.enabled : t.common.disabled}.`
            )
          }
          className={`min-h-[32px] px-3 py-1 rounded-full text-[12px] font-bold transition-colors ${
            prefs.enabled
              ? 'bg-[#0145F2] text-[#FFFFFF]'
              : 'bg-[#E5E7EB] dark:bg-[#262B33] text-[#4B5563] dark:text-[#A1A1AA]'
          }`}
        >
          {prefs.enabled ? t.common.enabled : t.common.disabled}
        </button>
      </div>

      {/* Preferred Input Mode: In-App Keyboard vs Device Keyboard */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        {(
          [
            {
              id: 'akarai',
              label: t.keyboardSettings.inAppKeyboardLabel,
              sub: 'EN · አማ · ትግ · OR',
            },
            {
              id: 'device',
              label: t.keyboardSettings.deviceKeyboardLabel,
              sub: t.keyboardSettings.nativeAndroidIosSub,
            },
          ] as const
        ).map((mode) => {
          const active = prefs.preferredInputMode === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() =>
                handleUpdate(
                  { preferredInputMode: mode.id, enabled: true },
                  `${mode.label}`
                )
              }
              className={`p-3 rounded-[14px] border text-left transition-colors ${
                active
                  ? 'bg-[#0145F2] text-[#FFFFFF] border-[#0145F2]'
                  : 'bg-[#F5F7FA] dark:bg-[#1C1F26] text-[#111318] dark:text-[#FFFFFF] border-[#E6ECF3] dark:border-[#262B31]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold">{mode.label}</span>
                {active && <Check className="w-4 h-4 stroke-[2.5]" />}
              </div>
              <div
                className={`text-[11px] mt-0.5 ${
                  active ? 'text-white/85' : 'text-[#626A78] dark:text-[#98A1B2]'
                }`}
              >
                {mode.sub}
              </div>
            </button>
          );
        })}
      </div>

      {/* Default Keyboard Language Selector */}
      <div>
        <label className="block text-[12px] font-semibold text-[#626A78] dark:text-[#98A1B2] mb-1.5">
          {t.keyboardSettings.defaultLangLabel}
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          {KEYBOARD_LANGUAGES.map((lang) => {
            const active = prefs.activeLanguage === lang.id;
            return (
              <button
                key={lang.id}
                type="button"
                onClick={() =>
                  handleUpdate(
                    { defaultLanguage: lang.id, activeLanguage: lang.id },
                    `${lang.englishName}`
                  )
                }
                className={`h-[36px] rounded-full text-[13px] font-bold border transition-colors ${
                  active
                    ? 'bg-[#0145F2] text-[#FFFFFF] border-[#0145F2]'
                    : 'bg-[#F5F7FA] dark:bg-[#1C1F26] text-[#111318] dark:text-[#FFFFFF] border-[#E6ECF3] dark:border-[#262B31]'
                }`}
              >
                {lang.shortLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Keyboard Sandbox Field */}
      <div>
        <label className="block text-[12px] font-semibold text-[#626A78] dark:text-[#98A1B2] mb-1">
          {t.keyboardSettings.tryKeyboardLabel}
        </label>
        <input
          type="text"
          value={testText}
          onChange={(e) => setTestText(e.target.value)}
          placeholder={t.keyboardSettings.tryKeyboardPlaceholder}
          className="w-full min-h-[42px] px-3.5 py-2 rounded-[14px] border border-[#0145F2]/50 bg-[#F5F7FA] dark:bg-[#1C1F26] text-[14px] text-[#111318] dark:text-[#FFFFFF] focus:outline-none focus:border-[#0145F2]"
        />
      </div>

      {/* Clipboard History Privacy Controls */}
      <div className="pt-2 border-t border-[#EDF1F7] dark:border-[#242932] flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-[12.5px] font-semibold text-[#111318] dark:text-[#E4E7EC]">
          <input
            type="checkbox"
            checked={prefs.clipboardHistoryEnabled}
            onChange={(e) =>
              handleUpdate(
                { clipboardHistoryEnabled: e.target.checked }
              )
            }
            className="w-4 h-4 accent-[#0145F2]"
          />
          <span>{t.keyboardSettings.optInClipboardLabel}</span>
        </label>
        <button
          type="button"
          onClick={() => {
            clearAllClipboardHistory();
            onNotify?.(t.keyboardSettings.clearHistoryBtn);
          }}
          className="text-[12px] font-semibold text-[#E82C33] dark:text-[#FF5A5F] hover:underline"
        >
          {t.keyboardSettings.clearHistoryBtn}
        </button>
      </div>

      {/* Nested Advanced Keyboard Settings */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced((prev) => !prev)}
          className="text-[12px] font-semibold text-[#0145F2] dark:text-[#68A2FF] hover:underline"
        >
          {showAdvanced ? t.keyboardSettings.hideAdvancedBtn : t.keyboardSettings.showAdvancedBtn}
        </button>

        {showAdvanced && (
          <div className="mt-2.5 p-3 rounded-[14px] bg-[#F5F7FA] dark:bg-[#1C1F26] border border-[#E6ECF3] dark:border-[#262B31] space-y-2.5 text-[12px]">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{t.keyboardSettings.keySizeLabel}</span>
              <div className="flex items-center gap-1">
                {(
                  [
                    { id: 'compact', label: t.keyboardSettings.sizeCompact },
                    { id: 'standard', label: t.keyboardSettings.sizeStandard },
                    { id: 'large', label: t.keyboardSettings.sizeLarge },
                  ] as const
                ).map((sz) => (
                  <button
                    key={sz.id}
                    type="button"
                    onClick={() => handleUpdate({ keyboardSize: sz.id })}
                    className={`px-2.5 py-1 rounded-full font-semibold ${
                      prefs.keyboardSize === sz.id
                        ? 'bg-[#0145F2] text-white'
                        : 'bg-[#FFFFFF] dark:bg-[#15181C] border border-[#E6ECF3] dark:border-[#262B31]'
                    }`}
                  >
                    {sz.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center justify-between">
              <span>{t.keyboardSettings.keyPreviewLabel}</span>
              <input
                type="checkbox"
                checked={prefs.keyPreviewEnabled}
                onChange={(e) =>
                  handleUpdate({ keyPreviewEnabled: e.target.checked })
                }
                className="w-4 h-4 accent-[#0145F2]"
              />
            </label>

            <label className="flex items-center justify-between">
              <span>{t.keyboardSettings.keyVibrationLabel}</span>
              <input
                type="checkbox"
                checked={prefs.vibrationEnabled}
                onChange={(e) =>
                  handleUpdate({ vibrationEnabled: e.target.checked })
                }
                className="w-4 h-4 accent-[#0145F2]"
              />
            </label>

            <p className="text-[11px] text-[#626A78] dark:text-[#98A1B2] leading-relaxed pt-1">
              {t.keyboardSettings.inAppNote}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
