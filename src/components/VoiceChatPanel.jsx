"use client";

import { useState, useEffect, useRef } from 'react';
import { useVoiceChat } from '@/hooks/useVoiceChat';

export const VoiceChatPanel = ({ 
  onTranscript, 
  onResponse, 
  onAudioChunk,
  isVisible = true,
  onToggleVisibility,
  position = 'right' // 'left' or 'right'
}) => {
  const {
    isConnected,
    connectionStatus,
    isRecording,
    vadActive,
    latency,
    connect,
    disconnect,
    toggleVoiceChat,
    setCallbacks,
    audioVisualizerData
  } = useVoiceChat();

  const [partialTranscript, setPartialTranscript] = useState('');
  const [lastTranscript, setLastTranscript] = useState('');
  const [waitingForResponse, setWaitingForResponse] = useState(false);
  const [conversation, setConversation] = useState([
    { role: 'assistant', text: 'Welcome! I\'m Alex from Auburn University at Montgomery. Click "Start Call" to begin our conversation.' }
  ]);
  // Audio visualizer data comes from useVoiceChat hook
  const messagesEndRef = useRef(null);
  
  // Drag functionality state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null);

  // Set up callbacks for integration
  useEffect(() => {
    setCallbacks({
      onTranscript: (text, isPartial) => {
        if (isPartial) {
          setPartialTranscript(text);
        } else {
          setPartialTranscript('');
          setLastTranscript(text);
          setWaitingForResponse(true);
          setConversation(prev => [...prev, { role: 'user', text }]);
          if (onTranscript) onTranscript(text, isPartial);
        }
      },
      onResponse: (text) => {
        setWaitingForResponse(false);
        setConversation(prev => [...prev, { role: 'assistant', text }]);
        if (onResponse) onResponse(text);
      },
      onAudioChunk: (audioData) => {
        if (onAudioChunk) onAudioChunk(audioData);
      },
      onAudioVisualizer: (data) => {
        // Real-time audio visualization data from voice input
        const maxLevel = Math.max(...data);
        if (maxLevel > 0.1) {
          console.log('🎵 Audio input detected - Max level:', maxLevel.toFixed(3));
        }
      }
    });
  }, [setCallbacks, onTranscript, onResponse, onAudioChunk]);

  // Auto-connect on mount and keep connected
  useEffect(() => {
    connect();
    // Don't disconnect on unmount to maintain connection
  }, [connect]);

  // Auto-scroll to bottom when conversation updates
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation, partialTranscript]);

  // Drag event handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    const rect = dragRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Constrain to viewport
    const maxX = window.innerWidth - 420; // panel width
    const maxY = window.innerHeight - 600; // panel height
    
    setDragPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500/30 border-green-400/50';
      case 'connecting': return 'bg-yellow-500/30 border-yellow-400/50';
      case 'listening': return 'bg-blue-500/30 border-blue-400/50';
      case 'speaking': return 'bg-purple-500/30 border-purple-400/50';
      case 'processing': return 'bg-orange-500/30 border-orange-400/50';
      default: return 'bg-red-500/30 border-red-400/50';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected - Ready for voice chat';
      case 'connecting': return 'Connecting...';
      case 'listening': return 'Listening... Speak naturally!';
      case 'speaking': return 'Speaking detected...';
      case 'processing': return 'Processing...';
      default: return 'Disconnected - Click Connect to start';
    }
  };

  const getContainerStyle = () => {
    if (dragPosition.x !== 0 || dragPosition.y !== 0) {
      // Custom dragged position
      return {
        position: 'fixed',
        left: `${dragPosition.x}px`,
        top: `${dragPosition.y}px`,
        bottom: 'auto',
        right: 'auto',
        height: '600px'
      };
    }
    // Default position based on prop
    return position === 'left' 
      ? { position: 'fixed', top: '16px', left: '16px', bottom: '16px' }
      : { position: 'fixed', top: '16px', right: '16px', bottom: '16px' };
  };

  const getToggleButtonStyle = () => {
    if (dragPosition.x !== 0 || dragPosition.y !== 0) {
      return {
        position: 'fixed',
        left: `${dragPosition.x}px`,
        top: `${dragPosition.y}px`
      };
    }
    return position === 'left'
      ? { position: 'fixed', top: '16px', left: '16px' }
      : { position: 'fixed', top: '16px', right: '16px' };
  };

  if (!isVisible) {
    return (
      <div 
        ref={dragRef}
        style={getToggleButtonStyle()}
        className="z-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-xl backdrop-blur-md border border-white/30 flex items-center overflow-hidden min-w-[220px] select-none"
      >
        {/* Drag Handle Area */}
        <div 
          className="px-2 py-3 cursor-move hover:bg-white/10 transition-all duration-300 flex items-center"
          onMouseDown={handleMouseDown}
          title="Drag to move"
        >
          <svg className="w-4 h-4 text-white/60" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
          </svg>
        </div>
        
        {/* Separator */}
        <div className="w-px bg-white/20 h-8"></div>
        
        {/* Main Panel Button */}
        <button
          onClick={(e) => {
            if (!isDragging) {
              onToggleVisibility();
            }
          }}
          className="flex-1 px-4 py-3 hover:bg-white/10 transition-all duration-300 flex items-center gap-2"
          title="Show AUM Admission Counsellor"
        >
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
            }`}></div>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.9 1 3 1.9 3 3V21C3 22.1 3.9 23 5 23H19C20.1 23 21 22.1 21 21V9M19 21H5V3H13V9H19Z"/>
            </svg>
            <span className="text-sm font-medium">AUM Counsellor</span>
          </div>
          <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
          </svg>
        </button>
        
        {/* Separator */}
        <div className="w-px bg-white/20 h-8"></div>
        
        {/* Call Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!isDragging) {
              toggleVoiceChat();
            }
          }}
          disabled={!isConnected}
          className={`px-3 py-3 transition-all duration-300 flex items-center justify-center ${
            isRecording
              ? 'bg-red-500/80 hover:bg-red-500 animate-pulse'
              : 'hover:bg-green-500/20 hover:bg-green-500/30'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={isRecording ? "End Call" : "Start Call"}
        >
          {isRecording ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h12v12H6z"/>
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
            </svg>
          )}
        </button>
      </div>
    );
  }

  return (
    <div 
      ref={dragRef}
      style={getContainerStyle()}
      className="w-full sm:w-[380px] md:w-[420px] z-10 select-none"
    >
      <div className="h-full flex flex-col bg-gradient-to-br from-slate-800/90 via-slate-700/90 to-slate-800/90 backdrop-blur-md border border-white/20 shadow-2xl rounded-xl">
        
        {/* Header - Draggable */}
        <div 
          className="p-4 border-b border-white/10 cursor-move"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white text-lg font-semibold flex items-center gap-2 pointer-events-none">
              🎓 AUM Admission Councellor
            </h3>
            <div className="flex items-center gap-2">
              {/* Connection Indicator */}
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                }`}></div>
                {isConnected ? 'Connected' : 'Disconnected'}
              </div>
              <button
                onClick={onToggleVisibility}
                className="text-white/60 hover:text-white/90 p-1 rounded transition-colors"
                title="Hide Voice Chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
        </div>

        {/* Controls */}
        <div className="p-4 border-b border-white/10">
          <div className="flex justify-center">
            <button
              onClick={toggleVoiceChat}
              disabled={!isConnected}
              className={`px-6 py-3 rounded-full font-medium transition-all flex items-center gap-2 ${
                isRecording
                  ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white animate-pulse shadow-lg shadow-red-500/25'
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 shadow-lg shadow-green-500/25'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isRecording ? (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 6h12v12H6z"/>
                  </svg>
                  End Call
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
                  </svg>
                  Start Call
                </>
              )}
            </button>
          </div>
        </div>

        {/* Voice Activity & Latency */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-white/80">Voice Activity:</span>
              <div className={`w-3 h-3 rounded-full transition-all ${
                vadActive ? 'bg-green-400 shadow-lg shadow-green-400/50' : 'bg-white/30'
              }`}></div>
              <span className="text-white/60">
                {vadActive ? 'Speaking' : 'Inactive'}
              </span>
            </div>
            <div className="text-white/60">
              Latency: {latency}ms
            </div>
          </div>
          
          {/* Audio Visualizer - Real-time from voice input */}
          <div className="flex justify-center items-center gap-1 mt-3 h-8">
            {audioVisualizerData.map((height, i) => (
              <div
                key={i}
                className="w-1 rounded-full transition-all duration-100"
                style={{ 
                  height: `${Math.max(2, height * 28 + 4)}px`,
                  opacity: isRecording ? (height > 0.02 ? 1 : 0.3) : 0.2,
                  backgroundColor: isRecording 
                    ? (height > 0.3 ? '#10b981' : height > 0.1 ? '#3b82f6' : '#6366f1')
                    : '#6b7280'
                }}
              />
            ))}
          </div>
          
          {/* Recording Status */}
          {isRecording && (
            <div className="text-center mt-2">
              <div className="text-xs text-green-400 font-medium flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                Recording Audio Input
              </div>
              <div className="text-xs text-white/60 mt-1">
                {vadActive ? '🎤 Voice detected!' : 'Speak to test microphone...'}
              </div>
            </div>
          )}
          
          {/* Connection Debug Info */}
          {!isConnected && (
            <div className="text-center mt-2">
              <div className="text-xs text-red-400">
                ⚠️ Not connected to voice server (port 8766)
              </div>
            </div>
          )}
        </div>

        {/* Conversation */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="space-y-3">
            {conversation.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-2 rounded-xl text-sm shadow-lg ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                      : 'bg-white/10 text-white border border-white/20'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            
            {/* Partial transcript */}
            {partialTranscript && (
              <div className="flex justify-end">
                <div className="max-w-[85%] px-4 py-2 rounded-xl text-sm bg-yellow-500/20 text-yellow-200 border border-yellow-400/30 italic">
                  {partialTranscript}
                </div>
              </div>
            )}
            {/* Auto-scroll target */}
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {/* Custom Scrollbar Styles */}
        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, #3b82f6, #8b5cf6);
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(180deg, #2563eb, #7c3aed);
          }
        `}</style>

      </div>
    </div>
  );
};
