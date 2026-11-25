"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Mic, 
  MicOff, 
  Send, 
  Volume2, 
  VolumeX, 
  X, 
  Sparkles, 
  AlertTriangle, 
  PhoneCall, 
  Trash2,
  Globe,
  CheckCircle2
} from "lucide-react";
import { PulseoraIcon } from "@/components/brand/Logo";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  isEmergency?: boolean;
  timestamp: string;
}

interface AICompanionModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId?: string;
}

export const AICompanionModal: React.FC<AICompanionModalProps> = ({
  isOpen,
  onClose,
  patientId
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m-0",
      sender: "assistant",
      text: "Namaskara! I am your PULSEORA AI Health Companion. Ask me 'How is my health today?', ask about your heart rate, check recent alerts, or speak in Kannada or Tulu.",
      timestamp: "Just now"
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeLang, setActiveLang] = useState<string>("en");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("pulseora_lang");
    if (saved) setActiveLang(saved);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (!isOpen) return null;

  // Web Speech API Voice Recognition (STT)
  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Web Speech recognition is not supported in this browser. Please type your message.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = activeLang === "kn" ? "kn-IN" : activeLang === "tcy" ? "kn-IN" : "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      handleSendMessage(transcript);
    };

    recognition.start();
  };

  // Text-To-Speech (TTS)
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = activeLang === "kn" ? "kn-IN" : activeLang === "tcy" ? "kn-IN" : "en-IN";
    utterance.rate = 0.95;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/v1/companion/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: textToSend,
          patient_id: patientId || localStorage.getItem("pulseora_patient_id"),
          language: activeLang
        })
      });

      const data = await res.json();
      const botMsg: Message = {
        id: `a-${Date.now()}`,
        sender: "assistant",
        text: data.response,
        isEmergency: data.is_emergency,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);

      // If voice enabled, speak the answer
      speakText(data.response);
    } catch (err) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: "assistant",
        text: "I am having trouble connecting to the health intelligence server. Please check your network.",
        timestamp: "Now"
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const suggestedQuestions = [
    activeLang === "kn" ? "ನನ್ನ ಆರೋಗ್ಯ ಹೇಗಿದೆ?" : activeLang === "tcy" ? "ಎಂಚ ಉಂಡು ಆರೋಗ್ಯ?" : "How is my health today?",
    activeLang === "kn" ? "ಹೃದಯ ಬಡಿತ ಎಷ್ಟಿದೆ?" : "How is my heart rate?",
    activeLang === "kn" ? "ಎಚ್ಚರಿಕೆ ವಿವರಣೆ ನೀಡಿ" : "Explain my latest alert",
    activeLang === "kn" ? "ಆಯಾಸವಾಗಿದೆ ಎಂದು ಲಾಗ್ ಮಾಡಿ" : "Log mild fatigue symptom"
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full h-full sm:h-[88vh] sm:max-w-2xl bg-white sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-surface-border">
        
        {/* Modal Header */}
        <div className="bg-emerald-deep text-white px-4 py-3.5 flex items-center justify-between border-b border-emerald-aurora/30">
          <div className="flex items-center gap-3">
            <div className="relative">
              <PulseoraIcon size={34} />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-aurora ring-2 ring-emerald-deep animate-ping" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-heading font-bold text-base leading-tight">PULSEORA AI Health Companion</h3>
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-aurora text-emerald-deep font-bold">2.0</span>
              </div>
              <p className="text-[11px] text-emerald-mint/80">Every Beat. Every Signal. Continuous Medical Intelligence</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switch */}
            <div className="flex items-center bg-emerald-dark/80 rounded-full p-0.5 border border-emerald-aurora/30 text-xs">
              <button
                onClick={() => setActiveLang("en")}
                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all ${
                  activeLang === "en" ? "bg-emerald-aurora text-emerald-deep" : "text-emerald-mint hover:text-white"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setActiveLang("kn")}
                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all ${
                  activeLang === "kn" ? "bg-emerald-aurora text-emerald-deep" : "text-emerald-mint hover:text-white"
                }`}
              >
                ಕನ್ನಡ
              </button>
              <button
                onClick={() => setActiveLang("tcy")}
                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all ${
                  activeLang === "tcy" ? "bg-emerald-aurora text-emerald-deep" : "text-emerald-mint hover:text-white"
                }`}
              >
                ತುಳು
              </button>
            </div>

            {/* Clear Chat */}
            <button
              onClick={() => setMessages([messages[0]])}
              className="p-1.5 text-emerald-mint/70 hover:text-white rounded-lg transition-colors"
              title="Clear conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 text-emerald-mint/70 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Audio Speech Waveform Indicator */}
        {(isListening || isSpeaking) && (
          <div className="bg-emerald-dark/95 text-emerald-mint px-4 py-2 flex items-center justify-between text-xs border-b border-emerald-aurora/30 animate-pulse">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-aurora animate-ping" />
              <span>{isListening ? "Listening to your voice..." : "Speaking response..."}</span>
            </div>
            <div className="flex items-center gap-1">
              {[4, 8, 14, 6, 12, 16, 8, 4].map((h, i) => (
                <span
                  key={i}
                  className="w-1 bg-emerald-aurora rounded-full animate-bounce"
                  style={{ height: `${h}px`, animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
            {isSpeaking && (
              <button onClick={stopSpeaking} className="text-white hover:text-rose-300">
                <VolumeX className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-surface-ivory">
          {messages.map((m) => {
            const isUser = m.sender === "user";
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-sm leading-relaxed shadow-sm ${
                    isUser
                      ? "bg-emerald-primary text-white rounded-tr-none"
                      : m.isEmergency
                      ? "bg-rose-50 border-2 border-rose-500 text-rose-950 rounded-tl-none"
                      : "bg-white border border-surface-border text-brandtext-primary rounded-tl-none"
                  }`}
                >
                  {m.isEmergency && (
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-rose-200 text-rose-700 font-bold">
                      <AlertTriangle className="w-4 h-4 text-rose-600 animate-bounce" />
                      <span>HIGH PRIORITY CLINICAL EMERGENCY DETECTED</span>
                    </div>
                  )}

                  <div className="whitespace-pre-line">{m.text}</div>

                  {m.isEmergency && (
                    <div className="mt-3 pt-2 flex flex-wrap gap-2">
                      <a
                        href="tel:108"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs hover:bg-rose-700"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Call 108 Ambulance</span>
                      </a>
                      <a
                        href="tel:112"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-deep text-white font-bold text-xs"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Call 112 National Police / Fire</span>
                      </a>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-black/5 text-[10px] text-brandtext-secondary">
                    <span>{m.timestamp}</span>
                    {!isUser && (
                      <button
                        onClick={() => speakText(m.text)}
                        className="text-emerald-primary hover:text-emerald-dark"
                        title="Read aloud"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-brandtext-secondary p-2">
              <span className="w-2 h-2 rounded-full bg-emerald-primary animate-ping" />
              <span>PULSEORA AI is consulting personal baselines...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions Pills */}
        <div className="px-4 py-2 bg-surface-muted border-t border-surface-border flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
          <span className="text-[10px] font-bold text-brandtext-secondary uppercase shrink-0">Ask:</span>
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              className="px-2.5 py-1 rounded-full bg-white border border-surface-border hover:border-emerald-primary text-brandtext-primary hover:text-emerald-primary shrink-0 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <div className="p-3 bg-white border-t border-surface-border flex items-center gap-2">
          <button
            onClick={toggleListening}
            className={`p-2.5 rounded-xl transition-all ${
              isListening
                ? "bg-rose-500 text-white animate-pulse"
                : "bg-surface-muted text-emerald-primary hover:bg-emerald-mint/40"
            }`}
            title="Speech to Text (Microphone)"
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder={
              activeLang === "kn"
                ? "ನಿಮ್ಮ ಆರೋಗ್ಯದ ಬಗ್ಗೆ ಕೇಳಿ (ಉದಾ: ನನ್ನ ಹೃದಯ ಬಡಿತ ಹೇಗಿದೆ?)..."
                : activeLang === "tcy"
                ? "ಆರೋಗ್ಯದ ಬಗೆಟ್ ಕೇನ್ಲೆ (ಉದಾ: ಗುಂಡಿಗೆ ಬಡಿತ ಎಂಚ ಉಂಡು?)..."
                : "Ask about your vitals, alerts, or symptoms..."
            }
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-surface-border focus:outline-none focus:border-emerald-primary text-sm"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || loading}
            className="p-2.5 rounded-xl bg-emerald-primary text-white hover:bg-emerald-aurora hover:text-emerald-deep disabled:opacity-40 transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom Safety Disclaimer */}
        <div className="px-3 py-1.5 bg-surface-muted text-center text-[10px] text-brandtext-secondary">
          PULSEORA is an AI early warning support tool. Not a clinical diagnostic device. Consult a qualified doctor.
        </div>
      </div>
    </div>
  );
};
