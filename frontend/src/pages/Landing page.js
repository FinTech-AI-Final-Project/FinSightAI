import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Capacitor } from '@capacitor/core';

const FinSightLanding = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [theme, setTheme] = useState('light');

  // Redirect to app if already logged in
  useEffect(() => {
    if (currentUser) {
      const isNative = Capacitor.isNativePlatform();
      if (isNative || window.innerWidth <= 768) {
        navigate('/home');
      } else {
        navigate('/dashboard');
      }
    }
  }, [currentUser, navigate]);

  const handleLogin = () => {
    navigate('/login');
  };

  const handleSignup = () => {
    navigate('/register');
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const scrollToSection = (sectionId) => {
    const target = document.querySelector(sectionId);
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      const header = document.querySelector('header');
      
      if (header) {
        if (scrolled > 100) {
          header.style.backgroundColor = 'var(--bg-primary)';
          header.style.boxShadow = '0 2px 20px var(--shadow)';
        } else {
          header.style.backgroundColor = 'var(--bg-primary)';
          header.style.boxShadow = 'none';
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{ 
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      lineHeight: 1.6,
      color: 'var(--text-primary)',
      background: 'var(--bg-primary)',
      transition: 'all 0.3s ease',
      '--primary-gradient': 'linear-gradient(135deg, #4A90E2 0%, #1E88E5 100%)',
      '--secondary-gradient': 'linear-gradient(135deg, #42A5F5 0%, #1976D2 100%)',
      '--accent-color': '#4A90E2',
      '--text-primary': theme === 'dark' ? '#ffffff' : '#1a1a1a',
      '--text-secondary': theme === 'dark' ? '#cbd5e1' : '#363535',
      '--text-icon': theme === 'dark' ? 'black' : 'white',
      '--bg-primary': theme === 'dark' ? '#0f172a' : '#ffffff',
      '--bg-secondary': theme === 'dark' ? '#1f1f20' : '#f8fafc',
      '--border-color': theme === 'dark' ? '#334155' : '#e2e8f0',
      '--shadow': theme === 'dark' ? 'rgba(49, 39, 39, 0.3)' : 'rgba(0, 0, 0, 0.1)',
      '--shadow-hover': theme === 'dark' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.15)'
    }}>
      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 40px;
        }

        header {
          background: var(--bg-primary);
          border-bottom: 1px solid var(--border-color);
          position: fixed;
          width: 100%;
          top: 0;
          z-index: 1000;
          backdrop-filter: blur(10px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          padding: 0.5rem 0;
        }

        nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 0;
          min-height: 80px;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 16px;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-logo);
          text-decoration: none;
          padding: 0.5rem 0;
        }

        .logo img {
          width: auto;
          height: 60px;
        }

        .nav-links {
          display: flex;
          gap: 2rem;
          list-style: none;
          align-items: center;
        }

        .nav-links a {
          color: var(--text-secondary);
          text-decoration: none;
          font-weight: 500;
          transition: color 0.3s;
          cursor: pointer;
        }

        .nav-links a:hover {
          color: var(--accent-color);
        }

        .auth-buttons {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .login-btn {
          color: var(--accent-color);
          background: transparent;
          border: 2px solid var(--accent-color);
          padding: 0.5rem 1.5rem;
          border-radius: 25px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .signup-btn {
          color: white;
          background: var(--accent-color);
          border: none;
          padding: 0.5rem 1.5rem;
          border-radius: 25px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .login-btn:hover {
          background: var(--accent-color);
          color: white;
        }

        .signup-btn:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .theme-toggle {
          background: none;
          border: 2px solid var(--border-color);
          border-radius: 50px;
          padding: 8px 12px;
          cursor: pointer;
          color: var(--text-primary);
          transition: all 0.3s;
          font-size: 16px;
        }

        .theme-toggle:hover {
          border-color: var(--accent-color);
        }

        .hero {
          background: var(--bg-primary);
          padding: 120px 0 80px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .hero::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 50% 50%, rgba(74, 144, 226, 0.1) 0%, transparent 50%);
          z-index: -1;
        }

        .hero h1 {
          font-size: 3.5rem;
          font-weight: 800;
          margin-bottom: 1rem;
          background: var(--primary-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero p {
          font-size: 1.25rem;
          color: var(--text-secondary);
          margin-bottom: 2rem;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .cta-button {
          display: inline-block;
          background: var(--primary-gradient);
          color: white;
          padding: 16px 32px;
          border-radius: 50px;
          text-decoration: none;
          font-weight: 600;
          font-size: 1.1rem;
          transition: transform 0.3s, box-shadow 0.3s;
          box-shadow: 0 4px 15px rgba(74, 144, 226, 0.3);
          cursor: pointer;
          border: none;
        }

        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(74, 144, 226, 0.4);
        }

        .features {
          padding: 80px 0;
          background: var(--bg-secondary);
        }

        .section-title {
          text-align: center;
          margin-bottom: 3rem;
        }

        .section-title h2 {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .section-title p {
          color: var(--text-secondary);
          font-size: 1.1rem;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          margin-top: 3rem;
        }

        .feature-card {
          background: var(--bg-primary);
          padding: 2rem;
          border-radius: 20px;
          box-shadow: 0 4px 20px var(--shadow);
          transition: transform 0.3s, box-shadow 0.3s;
          border: 1px solid var(--border-color);
        }

        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 30px var(--shadow-hover);
        }

        .feature-icon {
          width: 60px;
          height: 60px;
          background: var(--primary-gradient);
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
          font-size: 1.5rem;
        }

        .feature-card h3 {
          font-size: 1.3rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .feature-card p {
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .ai-features {
          padding: 80px 0;
          background: var(--bg-primary);
        }

        .ai-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2rem;
          margin-top: 3rem;
        }

        .ai-card {
          background: var(--bg-secondary);
          padding: 2.5rem;
          border-radius: 25px;
          border: 2px solid var(--border-color);
          transition: all 0.3s;
          position: relative;
          overflow: hidden;
        }

        .ai-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: var(--secondary-gradient);
        }

        .ai-card:hover {
          border-color: var(--accent-color);
          transform: translateY(-3px);
        }

        .ai-card h3 {
          font-size: 1.4rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: var(--accent-color);
        }

        .stats {
          background: var(--primary-gradient);
          color: white;
          padding: 60px 0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 2rem;
          text-align: center;
        }

        .stat-item h3 {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
        }

        .stat-item p {
          font-size: 1.1rem;
          opacity: 0.9;
        }

        .final-cta {
          padding: 80px 0;
          background: var(--bg-secondary);
          text-align: center;
        }

        .final-cta h2 {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .final-cta p {
          font-size: 1.2rem;
          color: var(--text-secondary);
          margin-bottom: 2rem;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .about-section {
          background: var(--bg-secondary);
          padding: 100px 0;
        }

        .about-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
          margin-top: 3rem;
        }

        .about-content h2 {
          font-size: 2.5rem;
          margin-bottom: 1.5rem;
          color: var(--text-primary);
        }

        .about-content p {
          font-size: 1.1rem;
          color: var(--text-secondary);
          margin-bottom: 1.5rem;
          line-height: 1.8;
        }

        .about-image {
          position: relative;
          padding: 2rem;
        }

        .about-image img {
          width: 100%;
          height: auto;
          border-radius: 20px;
          box-shadow: 0 20px 40px var(--shadow);
        }

        .video-demo {
          margin-top: 6rem;
          text-align: center;
        }

        .video-demo h2 {
          font-size: 2rem;
          margin-bottom: 1.5rem;
          color: var(--text-primary);
        }

        .video-demo p {
          font-size: 1.1rem;
          color: var(--text-secondary);
          max-width: 800px;
          margin: 0 auto 2rem;
        }

        .video-container {
          position: relative;
          width: 100%;
          max-width: 1000px;
          margin: 0 auto;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 40px var(--shadow);
        }

        .video-wrapper {
          position: relative;
          padding-bottom: 56.25%;
          height: 0;
        }

        .video-wrapper iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: none;
          border-radius: 20px;
        }

        .feature-list {
          display: flex;
          flex-wrap: wrap;
          gap: 2rem;
          justify-content: center;
          margin-top: 3rem;
        }

        .feature-highlight {
          flex: 0 1 280px;
          text-align: left;
          padding: 1.5rem;
          background: var(--bg-primary);
          border-radius: 15px;
          box-shadow: 0 5px 15px var(--shadow);
        }

        .feature-highlight h3 {
          font-size: 1.2rem;
          margin-bottom: 1rem;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .feature-highlight p {
          font-size: 0.95rem;
          color: var(--text-secondary);
          margin: 0;
          text-align: left;
        }

        .store-badge {
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--text-secondary);
          color: var(--text-icon);
          padding: 12px 24px;
          border-radius: 12px;
          text-decoration: none;
          transition: all 0.3s ease;
          min-width: 180px;
          justify-content: center;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 8px var(--shadow);
        }

        .store-badge:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px var(--shadow-hover);
        }

        .store-badge:hover {
          opacity: 0.9;
        }

        .store-badge i {
          font-size: 24px;
        }

         .store-badge .badge-store {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
        }

        .store-badge .badge-text {
            font-size: 0.7rem;
            opacity: 0.8;
        }

        .store-badge .badge-store {
            font-size: 1.1rem;
            font-weight: 500;
        }

        footer {
          background: var(--bg-primary);
          border-top: 1px solid var(--border-color);
          padding: 40px 0;
          text-align: center;
        }

        .footer-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .footer-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-logo);
          text-decoration: none;
        }

        .footer-logo img {
          width: auto;
          height: 60px;
        }

        .footer-links {
          display: flex;
          gap: 2rem;
          list-style: none;
        }

        .footer-links a {
          color: var(--text-secondary);
          text-decoration: none;
          transition: color 0.3s;
          cursor: pointer;
        }

        .footer-links a:hover {
          color: var(--accent-color);
        }

        @media (max-width: 768px) {
          .hero h1 {
            font-size: 2.5rem;
          }
          
          .nav-links {
            display: none;
          }
          
          .features-grid {
            grid-template-columns: 1fr;
          }
          
          .ai-grid {
            grid-template-columns: 1fr;
          }
          
          .footer-content {
            flex-direction: column;
            text-align: center;
          }

          .about-grid {
            grid-template-columns: 1fr;
          }
        }

        .fade-in {
          animation: fadeIn 0.8s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <header>
        <nav className="container">
          <div className="logo">
            <img src="/logo.png" alt="FinSight AI" style={{ height: '40px', width: 'auto', marginRight: '8px' }} />
            FinSight AI
          </div>
          <ul className="nav-links">
            <li><a onClick={() => scrollToSection('#features')}>Features</a></li>
            <li><a onClick={() => scrollToSection('#ai')}>AI Insights</a></li>
            <li><a onClick={() => scrollToSection('#about')}>About</a></li>
            <li><button className="theme-toggle" onClick={toggleTheme}>🌓</button></li>
            <li className="auth-buttons">
              <button className="login-btn" onClick={handleLogin}>Login</button>
              <button className="signup-btn" onClick={handleSignup}>Sign Up</button>
            </li>
          </ul>
        </nav>
      </header>

      <main>
        <section className="hero fade-in">
          <div className="container">
            <h1>Smart Finance Management with AI</h1>
            <p>Track expenses, manage budgets, and receive intelligent financial insights through machine learning and AI-driven recommendations</p>
            <button className="cta-button" onClick={handleSignup}>Get Started Free</button>
          </div>
        </section>

        <section className="features" id="features">
          <div className="container">
            <div className="section-title">
              <h2>Core Financial Management</h2>
              <p>Everything you need to manage your finances in one place</p>
            </div>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">💰</div>
                <h3>Expense Tracking</h3>
                <p>Log and categorize daily expenses with advanced receipt scanning technology</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📊</div>
                <h3>Budget Management</h3>
                <p>Set monthly budgets by category with real-time progress tracking and alerts</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📈</div>
                <h3>Financial Reports</h3>
                <p>Generate comprehensive reports with interactive charts and detailed analytics</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🌍</div>
                <h3>Multi-Currency Support</h3>
                <p>Handle multiple currencies with real-time conversion and exchange rates</p>
              </div>
            </div>
          </div>
        </section>

        <section className="ai-features" id="ai">
          <div className="container">
            <div className="section-title">
              <h2>🤖 AI-Powered Insights</h2>
              <p>Harness the power of artificial intelligence for smarter financial decisions</p>
            </div>
            <div className="ai-grid">
              <div className="ai-card">
                <h3>🎯 Default Tips</h3>
                <p>General financial wellness recommendations tailored to your spending patterns and financial goals</p>
              </div>
              <div className="ai-card">
                <h3>₿ Crypto Tips</h3>
                <p>Cryptocurrency market analysis and investment insights powered by real-time data from Blockchair and CoinGecko APIs</p>
              </div>
              <div className="ai-card">
                <h3>💸 Cash Flow Tips</h3>
                <p>Personalized cash flow forecasting and optimization recommendations based on your financial behavior</p>
              </div>
            </div>
          </div>
        </section>

        <section className="stats">
          <div className="container">
            <div className="stats-grid">
              <div className="stat-item">
                <h3>99.9%</h3>
                <p>Uptime Reliability</p>
              </div>
              <div className="stat-item">
                <h3>256-bit</h3>
                <p>Encryption Security</p>
              </div>
              <div className="stat-item">
                <h3>24/7</h3>
                <p>AI Monitoring</p>
              </div>
              <div className="stat-item">
                <h3>Real-time</h3>
                <p>Market Data</p>
              </div>
            </div>
          </div>
        </section>

        <section className="features" style={{ background: 'var(--bg-primary)' }}>
          <div className="container">
            <div className="section-title">
              <h2>📱 Cross-Platform Experience</h2>
              <p>Access your finances anywhere, anytime</p>
            </div>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">💻</div>
                <h3>Web Application</h3>
                <p>Responsive web interface built with React for seamless desktop experience</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📱</div>
                <h3>Mobile Support</h3>
                <p>Native mobile apps via Capacitor for iOS and Android devices</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🔄</div>
                <h3>Progressive Web App</h3>
                <p>Installable PWA with offline capabilities and push notifications</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🔒</div>
                <h3>Enterprise Security</h3>
                <p>Firebase authentication with role-based access and data encryption</p>
              </div>
            </div>
          </div>
        </section>

        <section className="about-section" id="about">
          <div className="container">
            <div className="about-grid">
              <div className="about-content">
                <h2>Transforming Personal Finance with AI</h2>
                <p>Founded in 2025, FinSight AI has been at the forefront of revolutionizing personal finance management through artificial intelligence. Our mission is to make financial decision-making smarter, easier, and more accessible for everyone.</p>
                <p>We combine cutting-edge AI technology with intuitive design to provide personalized financial insights and recommendations that help our users achieve their financial goals.</p>
              </div>
              <div className="about-image">
                <div style={{ 
                  width: '100%', 
                  height: '300px', 
                  background: 'var(--primary-gradient)', 
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '1.2rem',
                  fontWeight: '600'
                }}>
                  FinSight AI Platform Interface
                </div>
              </div>
            </div>

            <div className="video-demo">
              <h2>See FinSight AI in Action</h2>
              <p>Watch how our AI-powered platform transforms personal finance management with intelligent insights, smart budgeting, and real-time analytics.</p>
              
              <div className="video-container">
                <div className="video-wrapper">
                  <div style={{
                    width: '100%',
                    height: '100%',
                    background: 'var(--bg-secondary)',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.1rem',
                    color: 'var(--text-secondary)'
                  }}>
                    Demo Video Coming Soon
                  </div>
                </div>
              </div>

              <div className="feature-list">
                <div className="feature-highlight">
                  <h3>🤖 AI-Powered Insights</h3>
                  <p>Smart financial tips in three categories: Default Tips, Crypto Tips, and Cash Flow Tips, powered by advanced machine learning algorithms.</p>
                </div>
                <div className="feature-highlight">
                  <h3>📊 Advanced Analytics</h3>
                  <p>Interactive charts, spending analytics, AI-driven forecasting, and comprehensive export capabilities for detailed financial analysis.</p>
                </div>
                <div className="feature-highlight">
                  <h3>📱 Cross-Platform</h3>
                  <p>Access your finances anywhere with our responsive web app, native mobile apps (iOS/Android), and offline-capable Progressive Web App.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="final-cta">
          <div className="container">
            <h2>Ready to Transform Your Finances?</h2>
            <p>Join thousands of users who are already making smarter financial decisions with FinSight AI</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '24px' }}>
              <button className="store-badge">
                <i className="fab fa-google-play" style={{ fontSize: '24px' }}></i>
                <div className="badge-content">
                  <span className="badge-text">COMING SOON ON</span>
                  <span className="badge-store">Google Play</span>
                </div>
              </button>
              <button className="store-badge">
                <i className="fab fa-apple" style={{ fontSize: '24px' }}></i>
                <div className="badge-content">
                  <span className="badge-text">COMING SOON ON</span>
                  <span className="badge-store">App Store</span>
                </div>
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="container">
          <div className="footer-content">
            <div className="footer-logo">
              <img src="/logo.png" alt="FinSight AI" style={{ height: '30px', width: 'auto', marginRight: '8px' }} />
              FinSight AI
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <ul className="footer-links">
                <li><a>Privacy Policy</a></li>
                <li><a>Terms of Service</a></li>
                <li><a>Support</a></li>
                <li><a>API Docs</a></li>
              </ul>
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>© 2024 FinSight AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default FinSightLanding;