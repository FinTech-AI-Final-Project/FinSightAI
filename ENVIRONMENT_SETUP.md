# 🔧 Environment Setup Guide

This guide will help you set up the environment variables for both frontend and backend to fix the mobile connection issues and secure your application.

## 🚨 **IMMEDIATE FIX FOR MOBILE CONNECTION**

Your mobile app is trying to connect to `192.168.106.25:8081` but your backend is running on `192.168.1.91:8081`.

### **Step 1: Create Frontend Environment File**

1. Copy the example file:
   ```bash
   cd frontend
   copy env.example .env
   ```

2. Update the `.env` file with your IP addresses:
   ```env
   REACT_APP_API_URL_MOBILE=http://192.168.1.91:8081/api
   REACT_APP_API_URL_MOBILE_FALLBACK=http://192.168.106.25:8081/api
   REACT_APP_LOCAL_IP=192.168.1.91
   REACT_APP_LOCAL_IP_FALLBACK=192.168.106.25
   REACT_APP_GRADIENT_AI_API_KEY=W3NMm2kJPbT406AkRBUyWYJ5YQwDzA7S
   ```

### **Step 2: Create Backend Environment File**

1. Copy the example file:
   ```bash
   cd backend/src/main/resources
   copy application.properties.example application.properties
   ```

2. Update the `application.properties` file with your database credentials and IP addresses:
   ```properties
   spring.datasource.username=your_actual_database_username
   spring.datasource.password=your_actual_database_password
   app.cors.allowed-origins=http://localhost:3000,http://localhost:8100,capacitor://localhost,https://localhost,http://192.168.1.91:3000,http://192.168.1.91:8100,http://192.168.106.25:3000,http://192.168.106.25:8100
   ai.agent.api.key=W3NMm2kJPbT406AkRBUyWYJ5YQwDzA7S
   gradient.ai.agent.api.key=W3NMm2kJPbT406AkRBUyWYJ5YQwDzA7S
   ```

### **Step 3: Rebuild and Test**

1. **Rebuild the frontend:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Rebuild the mobile app:**
   ```bash
   npx cap sync android
   npx cap run android
   ```

## 🔐 **Security Improvements Made**

### **Frontend Security:**
- ✅ **Firebase config moved to environment variables**
- ✅ **API URLs configurable via environment**
- ✅ **Local IP address configurable**
- ✅ **All secrets removed from hardcoded values**

### **Backend Security:**
- ✅ **Database credentials in environment file**
- ✅ **API keys configurable**
- ✅ **CORS origins configurable**
- ✅ **Comprehensive security notes added**

### **AI Improvements:**
- ✅ **AI now knows about app capabilities**
- ✅ **AI won't suggest external apps/tools**
- ✅ **AI will focus on built-in features**

## 📱 **Mobile Connection Troubleshooting**

If you still have connection issues:

1. **Check your current IP:**
   ```bash
   ipconfig | findstr "IPv4"
   ```

2. **Update the `.env` file** with the correct IP address

3. **Update the network security config** in `frontend/android/app/src/main/res/xml/network_security_config.xml`

4. **Rebuild the mobile app** after any IP changes

## 🛡️ **Security Best Practices**

### **Environment Files:**
- ❌ **NEVER commit `.env` or `application.properties` to git**
- ✅ **Use `.env.example` and `application.properties.example` as templates**
- ✅ **Rotate API keys regularly**
- ✅ **Use different configurations for development and production**

### **API Keys:**
- ✅ **Store all API keys in environment variables**
- ✅ **Use different Firebase projects for dev/prod**
- ✅ **Monitor API usage and costs**
- ✅ **Keep service account keys secure**

## 🔄 **When Your IP Changes**

If your local IP address changes (common with DHCP):

1. **Update frontend `.env`** - Add the new IP as primary, keep old as fallback:
   ```env
   REACT_APP_API_URL_MOBILE=http://NEW_IP:8081/api
   REACT_APP_API_URL_MOBILE_FALLBACK=http://192.168.1.91:8081/api
   REACT_APP_LOCAL_IP=NEW_IP
   REACT_APP_LOCAL_IP_FALLBACK=192.168.1.91
   ```

2. **Update backend `application.properties`** - Add new IP to CORS:
   ```properties
   app.cors.allowed-origins=http://localhost:3000,http://localhost:8100,capacitor://localhost,https://localhost,http://NEW_IP:3000,http://NEW_IP:8100,http://192.168.1.91:3000,http://192.168.1.91:8100,http://192.168.106.25:3000,http://192.168.106.25:8100
   ```

3. **Update network security config** with the new IP

4. **Rebuild both frontend and mobile app**

## 🎯 **Dual IP Support Benefits**

- ✅ **Automatic fallback** - If primary IP fails, app tries secondary IP
- ✅ **Network resilience** - Works even when your IP changes
- ✅ **Development flexibility** - Supports multiple development environments
- ✅ **Reduced connection issues** - Better mobile connectivity

## 🎯 **Expected Results After Setup**

- ✅ **Mobile app connects to backend successfully**
- ✅ **AI tips load properly**
- ✅ **Chatbot works without timeouts**
- ✅ **All features accessible on mobile**
- ✅ **No more "external app" suggestions from AI**
- ✅ **Secure configuration with no hardcoded secrets**

## 📞 **Support**

If you encounter any issues:

1. Check the console logs for specific error messages
2. Verify your IP address hasn't changed
3. Ensure both backend and frontend are running
4. Check that environment files are properly configured
5. Rebuild the mobile app after any configuration changes

---

**Remember:** Always keep your environment files secure and never commit them to version control! 🔒
