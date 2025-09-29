import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  IconButton,
  TextField,
  Paper,
  Typography,
  CircularProgress,
  Avatar,
  Fab,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Chat as ChatIcon,
  Send as SendIcon,
  Close as CloseIcon,
  Psychology as PsychologyIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import { sendChatMessage } from '../services/api';
import { auth } from '../firebase';

const Chatbot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      sender: 'bot', 
      text: 'Hello! I\'m FinSight AI, your financial assistant. I can help you with budgeting, expense tracking, financial planning, and answer questions about your spending patterns. How can I assist you today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const { currentUser } = useAuth();
  const { userProfile } = useUser();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);


  // Speech synthesis function with better voice quality
  const speakText = useCallback((text) => {
    console.log('🔊 speakText called with:', text);
    console.log('🔊 Speech enabled:', speechEnabled);
    console.log('🔊 Is mobile device:', isMobileDevice);
    
    if (!speechEnabled) {
      console.log('🔊 Speech output is disabled');
      return;
    }
    
    try {
      if (!window.speechSynthesis || !window.speechSynthesis.getVoices) {
        console.log('🔊 Speech synthesis not supported on this device');
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
             // Always use Google UK English Female voice
             const voices = window.speechSynthesis.getVoices();
             console.log('🔊 Available voices for speaking:', voices.length);

             let selectedVoice = null;

             // Look for Google UK English Female specifically
             if (voices.length > 0) {
               selectedVoice = voices.find(voice => 
                 voice.name.includes('Google') && 
                 voice.name.includes('English') && 
                 (voice.name.includes('Female') || voice.name.includes('UK'))
               );

               if (selectedVoice) {
                 console.log('🔊 Using Google UK English Female:', selectedVoice.name);
               } else {
                 // Fallback to any Google English voice
                 selectedVoice = voices.find(voice => 
                   voice.name.includes('Google') && voice.lang.startsWith('en')
                 );

                 if (selectedVoice) {
                   console.log('🔊 Using Google English fallback:', selectedVoice.name);
                 } else {
                   // Final fallback to any English voice
                   selectedVoice = voices.find(voice => voice.lang.startsWith('en'));
                   if (selectedVoice) {
                     console.log('🔊 Using English voice fallback:', selectedVoice.name);
                   }
                 }
               }
             }
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log('🔊 Voice set to:', selectedVoice.name);
      } else {
        console.log('🔊 No voice found, using system default');
      }
    
    // Optimized settings for natural speech
    utterance.rate = 1.0;   // Normal speaking speed (faster than before)
    utterance.pitch = 1.0;  // Normal pitch (more natural)
    utterance.volume = 1.0; // Maximum volume

    utterance.onstart = () => {
      console.log('🔊 Speech started');
      setIsSpeaking(true);
    };
    
    utterance.onend = () => {
      console.log('🔊 Speech ended');
      setIsSpeaking(false);
    };
    
      utterance.onerror = (event) => {
        console.error('🔊 Speech error:', event.error);
        setIsSpeaking(false);
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.error('🔊 Error speaking text:', error);
        setIsSpeaking(false);
      }
    } catch (error) {
      console.error('🔊 Speech synthesis error:', error);
    }
  }, [speechEnabled, isMobileDevice]);

  // Voice control functions
  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const newSpeechState = !speechEnabled;
      setSpeechEnabled(newSpeechState);
      
             // Test speech when enabling
             if (newSpeechState) {
               console.log('🔊 Speech enabled, testing...');
               console.log('🔊 Device type:', isMobileDevice ? 'Mobile' : 'Desktop');
               setTimeout(() => {
                 speakText("Speech output is now enabled. I can speak to you!");
               }, 100);
             }
    }
  };


  const handleSendWithText = useCallback(async (textToSend) => {
    if (!textToSend.trim()) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMessage = { sender: 'user', text: textToSend, timestamp };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      // Use the centralized API service (same as AI tips)
      const userContext = {
        firstName: userProfile?.firstName || currentUser?.displayName?.split(' ')[0] || 'there',
        currency: userProfile?.currency || 'ZAR',
        region: getRegionFromCurrency(userProfile?.currency || 'ZAR')
      };

      console.log('🤖 Sending chat message via API service:', textToSend);
      const data = await sendChatMessage(textToSend, userContext, auth);

      const botMessage = {
        sender: 'bot',
        text: data.reply || 'I\'m having difficulty processing your request. Please try rephrasing your question.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMessage]);
      
      // Speak the response if speech is enabled (only on desktop)
      if (!isMobileDevice) {
        speakText(botMessage.text);
      }
    } catch (error) {
      console.error('🚨 Chatbot error:', error);
      
      // Provide more specific error messages based on the error type
      let errorText = 'I\'m currently experiencing technical difficulties. Please try again in a moment.';
      
      if (error.message === 'Chatbot request timeout') {
        errorText = 'The request is taking longer than expected. Please try again with a simpler question.';
      } else if (error.message && error.message.includes('Failed to fetch')) {
        errorText = 'Unable to connect to the server. Please check your internet connection.';
      } else if (error.message && error.message.includes('token')) {
        errorText = 'Your session has expired. Please refresh the page and try again.';
      } else if (error.message && error.message.includes('network')) {
        errorText = 'Network connection issue. Please check your internet connection and try again.';
      } else if (error.message && error.message.includes('Authentication failed')) {
        errorText = 'Authentication issue. Please refresh the page to re-authenticate.';
      }
      
      const errorMessage = {
        sender: 'bot',
        text: errorText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setInput('');
      setLoading(false);
    }
  }, [isMobileDevice, userProfile, currentUser, speakText]);

  const handleSend = async () => {
    if (!input.trim()) return;
    await handleSendWithText(input);
  };

  // Initialize speech recognition and load voices
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if we're on mobile or if speech APIs are available
      if (isMobileDevice) {
        console.log('🔊 Mobile device detected - speech features disabled');
        return;
      }

      // Check if speech APIs are available (not on mobile)
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          setIsListening(false);

          // Automatically send the message after speech recognition
          if (transcript.trim()) {
            setTimeout(() => {
              handleSendWithText(transcript);
            }, 300); // Small delay to show the transcribed text briefly
          }
        };

        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      } else {
        console.log('🔊 Speech recognition not supported on this device');
      }

      // Load voices for speech synthesis (only if available)
      const loadVoices = () => {
        try {
          if (window.speechSynthesis && window.speechSynthesis.getVoices) {
            const voices = window.speechSynthesis.getVoices();
            console.log('🔊 Voices loaded:', voices.length);

            voices.forEach(voice => {
              console.log(`🔊 Voice: ${voice.name} (${voice.lang}) - ${voice.default ? 'Default' : ''}`);
            });
          } else {
            console.log('🔊 Speech synthesis not supported on this device');
          }
        } catch (error) {
          console.error('🔊 Error loading voices:', error);
        }
      };

      // Load voices immediately and on change
      loadVoices();
      if (window.speechSynthesis && window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isMobileDevice, handleSendWithText]);

  const getRegionFromCurrency = (currency) => {
    const currencyToRegion = {
      'ZAR': 'ZA', 'USD': 'US', 'EUR': 'EU', 'GBP': 'UK',
      'JPY': 'JP', 'CAD': 'CA', 'AUD': 'AU'
    };
    return currencyToRegion[currency] || 'ZA';
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}
      </style>
      {/* Floating Chat Button */}
      <Fab
        sx={{
          position: 'fixed',
          bottom: isMobile ? 16 : 24, // Adjusted for mobile without bottom nav
          right: isMobile ? 16 : 24,
          zIndex: 1200, // Lower than navbar/modals but higher than content
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          color: '#ffffff',
          '&:hover': { 
            background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
            transform: 'scale(1.05)' // Reduced scale effect
          },
          transition: 'all 0.3s ease',
          // Smaller size for less intrusion
          width: isMobile ? 44 : 52,
          height: isMobile ? 44 : 52,
        }}
        onClick={() => setOpen(!open)}
      >
        {open ? <CloseIcon sx={{ fontSize: isMobile ? 18 : 22 }} /> : <ChatIcon sx={{ fontSize: isMobile ? 18 : 22 }} />}
      </Fab>

      {/* Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{
              position: 'fixed',
              bottom: isMobile ? 16 : 90, // Adjusted for mobile without bottom nav
              right: isMobile ? 8 : 24,
              width: isMobile ? 'calc(100vw - 16px)' : 350, // Smaller on desktop
              maxWidth: 'calc(100vw - 16px)',
              height: isMobile ? 'calc(100vh - 120px)' : 450, // Adjusted for mobile without bottom nav
              maxHeight: isMobile ? 'calc(100vh - 120px)' : 450, // Adjusted for mobile without bottom nav
              top: isMobile ? 'auto' : 'auto', // Let it position naturally from bottom
              zIndex: 1200,
            }}
          >
            <Paper
              elevation={8}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: theme.palette.background.paper,
                borderRadius: 3,
                overflow: 'hidden',
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              {/* Header */}
              <Box
                sx={{
                  background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                  color: '#ffffff',
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <PsychologyIcon />
                <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
                  FinSight AI Assistant
                </Typography>
                {(isListening || speechEnabled || isSpeaking) && (
                  <Box sx={{ display: 'flex', gap: 0.5, mr: 1 }}>
                    {isListening && (
                      <Box sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        backgroundColor: '#f44336',
                        animation: 'pulse 1.5s infinite'
                      }} />
                    )}
                    {(speechEnabled || isSpeaking) && (
                      <Box sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        backgroundColor: isSpeaking ? '#ff9800' : '#4caf50',
                        animation: 'pulse 1.5s infinite'
                      }} />
                    )}
                  </Box>
                )}
                <IconButton 
                  size="small" 
                  onClick={() => setOpen(false)}
                  sx={{ color: '#ffffff' }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>

              {/* Messages */}
              <Box
                className="chatbot-messages"
                sx={{
                  flex: 1,
                  overflowY: 'auto',
                  p: 1,
                  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[900] : '#f8f9fa',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1
                }}
              >
                {messages.map((msg, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                        mb: 1
                      }}
                    >
                      <Box
                        sx={{
                          maxWidth: '75%',
                          display: 'flex',
                          flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row',
                          alignItems: 'flex-end',
                          gap: 1
                        }}
                      >
                        {msg.sender === 'bot' && (
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                              fontSize: '14px'
                            }}
                          >
                            <PsychologyIcon sx={{ fontSize: 18 }} />
                          </Avatar>
                        )}
                        
                        <Box
                          sx={{
                            backgroundColor: msg.sender === 'user' 
                              ? 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)' 
                              : theme.palette.background.paper,
                            color: msg.sender === 'user' ? '#ffffff' : theme.palette.text.primary,
                            px: 2,
                            py: 1.5,
                            borderRadius: 2,
                            maxWidth: '100%',
                            wordWrap: 'break-word',
                            border: msg.sender === 'bot' ? `1px solid ${theme.palette.divider}` : 'none',
                            boxShadow: 1,
                            background: msg.sender === 'user' 
                              ? 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)' 
                              : theme.palette.background.paper,
                          }}
                        >
                          <Typography variant="body2" sx={{ lineHeight: 1.4 }}>
                            {msg.text}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              opacity: 0.7, 
                              mt: 0.5, 
                              display: 'block',
                              fontSize: '10px'
                            }}
                          >
                            {msg.timestamp}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </motion.div>
                ))}
                
                {loading && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                        }}
                      >
                        <PsychologyIcon sx={{ fontSize: 18 }} />
                      </Avatar>
                      <Box
                        sx={{
                          backgroundColor: theme.palette.background.paper,
                          px: 2,
                          py: 1.5,
                          borderRadius: 2,
                          border: `1px solid ${theme.palette.divider}`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        <CircularProgress size={16} sx={{ color: '#1976d2' }} />
                        <Typography variant="body2" color="text.secondary">
                          Thinking...
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}
                
                {isSpeaking && !loading && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                        }}
                      >
                        <PsychologyIcon sx={{ fontSize: 18 }} />
                      </Avatar>
                      <Box
                        sx={{
                          backgroundColor: theme.palette.background.paper,
                          px: 2,
                          py: 1.5,
                          borderRadius: 2,
                          border: `1px solid ${theme.palette.divider}`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        <VolumeUpIcon sx={{ fontSize: 16, color: '#4caf50', animation: 'pulse 1.5s infinite' }} />
                        <Typography variant="body2" color="text.secondary">
                          Speaking...
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}
                <div ref={messagesEndRef} />
              </Box>

              {/* Input */}
              <Box
                sx={{
                  p: 2,
                  backgroundColor: theme.palette.background.paper,
                  borderTop: `1px solid ${theme.palette.divider}`,
                }}
              >
                {/* Voice Controls - Hidden on mobile */}
                {!isMobileDevice && (
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 1 }}>
                    <IconButton
                      onClick={isListening ? stopListening : startListening}
                      disabled={!recognitionRef.current}
                      size="small"
                      sx={{
                        backgroundColor: isListening
                          ? '#f44336'
                          : theme.palette.mode === 'dark'
                            ? theme.palette.grey[700]
                            : theme.palette.grey[200],
                        color: isListening
                          ? '#ffffff'
                          : theme.palette.mode === 'dark'
                            ? theme.palette.grey[200]
                            : theme.palette.text.primary,
                        '&:hover': {
                          backgroundColor: isListening
                            ? '#d32f2f'
                            : theme.palette.mode === 'dark'
                              ? theme.palette.grey[600]
                              : theme.palette.grey[300],
                        },
                        '&:disabled': {
                          backgroundColor: theme.palette.action.disabled,
                          color: theme.palette.action.disabled
                        }
                      }}
                    >
                      {isListening ? <MicOffIcon /> : <MicIcon />}
                    </IconButton>
                    <IconButton
                      onClick={toggleSpeech}
                      size="small"
                      sx={{
                        backgroundColor: speechEnabled
                          ? '#4caf50'
                          : theme.palette.mode === 'dark'
                            ? theme.palette.grey[700]
                            : theme.palette.grey[200],
                        color: speechEnabled
                          ? '#ffffff'
                          : theme.palette.mode === 'dark'
                            ? theme.palette.grey[200]
                            : theme.palette.text.primary,
                        '&:hover': {
                          backgroundColor: speechEnabled
                            ? '#388e3c'
                            : theme.palette.mode === 'dark'
                              ? theme.palette.grey[600]
                              : theme.palette.grey[300],
                        }
                      }}
                    >
                      {isSpeaking ? <VolumeOffIcon /> : <VolumeUpIcon />}
                    </IconButton>
                  </Box>
                )}

                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                  <TextField
                    fullWidth
                    multiline
                    maxRows={3}
                           placeholder={isMobileDevice ? "Type your financial question" : (isListening ? "Listening... speak now" : "Type your financial question here or use voice input")}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={loading || isListening}
                    variant="outlined"
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : '#f8f9fa',
                        color: theme.palette.text.primary,
                        '& fieldset': {
                          borderColor: isListening ? '#f44336' : theme.palette.divider,
                        },
                        '&:hover fieldset': {
                          borderColor: theme.palette.primary.main,
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: theme.palette.primary.main,
                        },
                        '& input': {
                          color: theme.palette.text.primary,
                        },
                        '& textarea': {
                          color: theme.palette.text.primary,
                        }
                      },
                      '& .MuiInputBase-input::placeholder': {
                        color: isListening ? '#f44336' : theme.palette.text.secondary,
                        opacity: 1,
                      }
                    }}
                  />
                  <IconButton
                    onClick={handleSend}
                    disabled={loading || !input.trim() || isListening}
                    sx={{
                      background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                      color: '#ffffff',
                      '&:hover': { 
                        background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
                      },
                      '&:disabled': { 
                        backgroundColor: theme.palette.action.disabled,
                        color: theme.palette.action.disabled
                      },
                      borderRadius: 2,
                      p: 1
                    }}
                  >
                    <SendIcon />
                  </IconButton>
                </Box>
              </Box>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;
