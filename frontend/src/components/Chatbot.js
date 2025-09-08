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
      text: 'Hello! I\'m FinSight AI, your financial assistant. I can help you with budgeting, expense tracking, financial planning, and answer questions about your spending patterns. How can I assist you today?',
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
        text: data.reply || 'I\'m having difficulty processing your request. Please try rephrasing your question.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage = { 
        sender: 'bot', 
        text: 'I\'m currently experiencing technical difficulties. Please try again in a moment.',
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
          bottom: isMobile ? 90 : 24, // Higher on mobile to avoid bottom nav
          right: isMobile ? 16 : 24,
          zIndex: 1200, // Lower than navbar/modals but higher than content
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          color: '#ffffff',
          '&:hover': { 
            background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
            transform: 'scale(1.1)'
          },
          transition: 'all 0.3s ease',
          // Make it smaller on mobile to be less intrusive
          width: isMobile ? 48 : 56,
          height: isMobile ? 48 : 56,
        }}
        onClick={() => setOpen(!open)}
      >
        {open ? <CloseIcon sx={{ fontSize: isMobile ? 20 : 24 }} /> : <ChatIcon sx={{ fontSize: isMobile ? 20 : 24 }} />}
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
              bottom: isMobile ? 90 : 90, // Position above the FAB
              right: isMobile ? 8 : 24,
              width: isMobile ? 'calc(100vw - 16px)' : 380,
              maxWidth: 'calc(100vw - 16px)',
              height: isMobile ? 'calc(100vh - 170px)' : 500, // Account for navbar + bottom nav + FAB
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
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                  <TextField
                    fullWidth
                    multiline
                    maxRows={3}
                    placeholder="Type your financial question here..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={loading}
                    variant="outlined"
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : '#f8f9fa',
                        color: theme.palette.text.primary,
                        '& fieldset': {
                          borderColor: theme.palette.divider,
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
                        color: theme.palette.text.secondary,
                        opacity: 1,
                      }
                    }}
                  />
                  <IconButton
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
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
