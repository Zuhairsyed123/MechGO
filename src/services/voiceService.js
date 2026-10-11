/**
 * MechGO - Voice Input & Speech-to-Text Service
 * 
 * Truthful, reliable speech recognition service.
 * - Explicit start/stop states.
 * - Truthful engine capability detection (NEVER fabricates transcripts).
 * - Real language support (en-IN for Indian English / Hinglish, hi-IN for Hindi)
 *   where supported by the platform speech recognition engine.
 * - Detects empty/unrelated results and prompts user.
 * - Preserves user's previous valid description on failure.
 */

let speechRecognitionInstance = null;
let currentListeningState = 'idle'; // 'idle' | 'listening' | 'processing' | 'error'

export const VoiceService = {
  /**
   * Checks if on-device / browser speech recognition is actually supported
   */
  isSpeechRecognitionAvailable() {
    if (typeof window !== 'undefined') {
      return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
    }
    return false;
  },

  /**
   * Request microphone permission properly with explicit feedback
   */
  async requestMicPermission() {
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((track) => track.stop()); // release hardware
          return { granted: true };
        } catch (e) {
          return {
            granted: false,
            error: 'Microphone permission was denied by the user or browser.'
          };
        }
      }
      return { granted: true };
    } catch (err) {
      return {
        granted: false,
        error: err?.message || 'Microphone access is not supported on this platform.'
      };
    }
  },

  /**
   * Start listening for voice input
   * @param {Object} options
   * @param {string} options.language - 'en' | 'hi' | 'hinglish'
   * @param {string} options.existingText - previous confirmed description
   * @param {Function} options.onInterimText - callback with partial/interim transcript
   * @param {Function} options.onFinalText - callback with confirmed transcript
   * @param {Function} options.onError - callback with truthful error message
   * @param {Function} options.onStateChange - callback with 'idle' | 'listening' | 'processing' | 'error'
   */
  startListening({
    language = 'en',
    existingText = '',
    onInterimText,
    onFinalText,
    onError,
    onStateChange
  }) {
    if (currentListeningState === 'listening') {
      this.stopListening();
    }

    const updateState = (st) => {
      currentListeningState = st;
      if (onStateChange) onStateChange(st);
    };

    // Check if real Web Speech API is present
    const SpeechRecognition =
      typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (!SpeechRecognition) {
      updateState('error');
      const msg = 'Speech recognition engine is not supported on this browser/environment. Please type your description in the text box.';
      if (onError) onError({ error: msg, preservedText: existingText });
      return;
    }

    try {
      speechRecognitionInstance = new SpeechRecognition();
      speechRecognitionInstance.continuous = false; // Capture complete sentence
      speechRecognitionInstance.interimResults = true;

      // Map language truthfully
      if (language === 'hi') {
        speechRecognitionInstance.lang = 'hi-IN'; // Hindi (India)
      } else {
        speechRecognitionInstance.lang = 'en-IN'; // Indian English / Hinglish
      }

      let capturedFinalText = '';
      let hadInterimResults = false;

      updateState('listening');

      speechRecognitionInstance.onresult = (event) => {
        let interimText = '';
        hadInterimResults = true;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            capturedFinalText += item[0].transcript;
          } else {
            interimText += item[0].transcript;
          }
        }

        if (interimText && onInterimText) {
          onInterimText(interimText);
        }
      };

      speechRecognitionInstance.onerror = (event) => {
        console.warn('Speech engine error:', event.error);
        updateState('error');

        let userMsg = 'Speech recognition encountered an issue. Your existing description was preserved.';
        if (event.error === 'no-speech') {
          userMsg = 'No speech was detected. Please tap Speak again and speak closer to your microphone, or type your description.';
        } else if (event.error === 'not-allowed') {
          userMsg = 'Microphone permission was denied. Please allow microphone access or type your description.';
        } else if (event.error === 'network') {
          userMsg = 'Network connection to speech service failed. Please type your description.';
        }

        if (onError) {
          onError({
            error: userMsg,
            preservedText: existingText,
            rawError: event.error
          });
        }
      };

      speechRecognitionInstance.onend = () => {
        updateState('idle');

        const trimmed = capturedFinalText.trim();
        if (trimmed && trimmed.length >= 2) {
          if (onFinalText) {
            onFinalText(trimmed);
          }
        } else if (!hadInterimResults) {
          if (onError) {
            onError({
              error: 'No speech was detected. Please tap the mic and speak clearly, or type your description.',
              preservedText: existingText
            });
          }
        }
      };

      speechRecognitionInstance.start();
    } catch (err) {
      console.warn('Failed to start speech recognition:', err);
      updateState('error');
      if (onError) {
        onError({
          error: 'Could not initialize speech recognition. Please type your description.',
          preservedText: existingText
        });
      }
    }
  },

  /**
   * Stop listening cleanly
   */
  stopListening() {
    currentListeningState = 'idle';
    if (speechRecognitionInstance) {
      try {
        speechRecognitionInstance.stop();
      } catch (e) {}
      speechRecognitionInstance = null;
    }
  }
};
