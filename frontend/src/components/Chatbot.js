import React, { useState, useRef, useEffect } from 'react';
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
  Psychology as PsychologyIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';

const Chatbot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      sender: 'bot', 
      text: 'Hi! I\'m your AI financial advisor. I can help you with budgeting, saving tips, expense analysis, and personalized financial advice based on your spending patterns. What would you like to know?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { currentUser } = useAuth();
  const { userProfile } = useUser();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMessage = { sender: 'user', text: input, timestamp };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      // Get auth token
      const token = await currentUser.getIdToken();
      
      // Use proper API base URL - same as other API calls
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081/api';
      
      const response = await fetch(`${API_BASE_URL}/ai-chatbot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: input,
          currency: userProfile?.currency || 'ZAR',
          region: getRegionFromCurrency(userProfile?.currency || 'ZAR'),
          userContext: {
            firstName: userProfile?.firstName || currentUser?.displayName?.split(' ')[0] || 'there',
            currency: userProfile?.currency || 'ZAR'
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }

      const data = await response.json();
      const botMessage = { 
        sender: 'bot', 
        text: data.reply || 'Sorry, I couldn\'t process that request right now.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage = { 
        sender: 'bot', 
        text: 'Sorry, I\'m having trouble connecting right now. Please try again in a moment.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setInput('');
      setLoading(false);
    }
  };

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
      {/* Floating Chat Button */}
      <Fab
        sx={{
          position: 'fixed',
          bottom: isMobile ? 20 : 24,
          right: isMobile ? 20 : 24,
          zIndex: 1300,
          backgroundColor: '#000000',
          color: '#ffffff',
          '&:hover': { 
            backgroundColor: '#333333',
            transform: 'scale(1.1)'
          },
          transition: 'all 0.3s ease',
        }}
        onClick={() => setOpen(!open)}
      >
        {open ? <CloseIcon /> : <ChatIcon />}
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
              bottom: isMobile ? 80 : 90,
              right: isMobile ? 10 : 24,
              width: isMobile ? 'calc(100vw - 20px)' : 380,
              maxWidth: 'calc(100vw - 20px)',
              height: isMobile ? 'calc(100vh - 160px)' : 500,
              zIndex: 1300,
            }}
          >
            <Paper
              elevation={8}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#ffffff',
                borderRadius: 3,
                overflow: 'hidden',
                border: '1px solid rgba(0, 0, 0, 0.12)',
              }}
            >
              {/* Header */}
              <Box
                sx={{
                  backgroundColor: '#000000',
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
                sx={{
                  flex: 1,
                  overflowY: 'auto',
                  p: 1,
                  backgroundColor: '#f8f9fa',
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
                              backgroundColor: '#000000',
                              fontSize: '14px'
                            }}
                          >
                            <PsychologyIcon sx={{ fontSize: 18 }} />
                          </Avatar>
                        )}
                        
                        <Box
                          sx={{
                            backgroundColor: msg.sender === 'user' ? '#000000' : '#ffffff',
                            color: msg.sender === 'user' ? '#ffffff' : '#000000',
                            px: 2,
                            py: 1.5,
                            borderRadius: 2,
                            maxWidth: '100%',
                            wordWrap: 'break-word',
                            border: msg.sender === 'bot' ? '1px solid rgba(0, 0, 0, 0.12)' : 'none',
                            boxShadow: 1
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
                          backgroundColor: '#000000',
                        }}
                      >
                        <PsychologyIcon sx={{ fontSize: 18 }} />
                      </Avatar>
                      <Box
                        sx={{
                          backgroundColor: '#ffffff',
                          px: 2,
                          py: 1.5,
                          borderRadius: 2,
                          border: '1px solid rgba(0, 0, 0, 0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        <CircularProgress size={16} sx={{ color: '#000000' }} />
                        <Typography variant="body2" color="text.secondary">
                          Thinking...
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
                  backgroundColor: '#ffffff',
                  borderTop: '1px solid rgba(0, 0, 0, 0.12)',
                }}
              >
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                  <TextField
                    fullWidth
                    multiline
                    maxRows={3}
                    placeholder="Ask me about your finances..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={loading}
                    variant="outlined"
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: '#f8f9fa',
                      }
                    }}
                  />
                  <IconButton
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    sx={{
                      backgroundColor: '#000000',
                      color: '#ffffff',
                      '&:hover': { backgroundColor: '#333333' },
                      '&:disabled': { 
                        backgroundColor: '#cccccc',
                        color: '#666666'
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
