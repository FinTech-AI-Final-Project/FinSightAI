# 🔐 Security Configuration Guide

## ⚠️ CRITICAL: Secrets Found in Your Repository

Your repository currently contains **exposed secrets and sensitive information** that should never be committed to version control. This guide helps you secure your application properly.

## 🚨 Immediate Actions Required

### 1. **Exposed Secrets Detected:**
- ✅ Gemini API Key: `AIzaSyDsqySZPeAKoqstWW4wyYU-DtNAG0LhMUE`
- ✅ Firebase API Key: `AIzaSyAvD3orIAsVuRf-bu9S-i-8iqO_x9l5LMY`
- ✅ Database credentials: `postgres/admin`
- ✅ Firebase Service Account JSON file
- ✅ Firebase Project Configuration

### 2. **Immediate Steps:**
1. **Rotate all exposed API keys immediately**
2. **Remove sensitive files from git history**
3. **Set up proper environment configuration**

## 🛡️ Proper Security Setup

### Backend Configuration

1. **Copy the example file:**
   ```bash
   cp backend/src/main/resources/application.properties.example backend/src/main/resources/application.properties
   ```

2. **Update with your actual values:**
   ```properties
   # Replace with your actual database credentials
   spring.datasource.username=your_actual_username
   spring.datasource.password=your_actual_password
   
   # Replace with your actual Gemini API key
   gemini.api.key=your_new_gemini_api_key
   
   # Update CORS with your actual IP addresses
   app.cors.allowed-origins=http://localhost:3000,http://YOUR_ACTUAL_IP:3000
   ```

3. **Set up Firebase Service Account:**
   ```bash
   cp backend/src/main/resources/firebase-service-account.json.example backend/src/main/resources/firebase-service-account.json
   ```
   Then replace with your actual Firebase service account JSON.

### Frontend Configuration

1. **Copy the example file:**
   ```bash
   cp frontend/src/firebase.js.example frontend/src/firebase.js
   ```

2. **Update with your Firebase configuration:**
   ```javascript
   const firebaseConfig = {
     apiKey: "your-new-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     // ... other config
   };
   ```

3. **Set up environment variables:**
   ```bash
   cp frontend/env.example frontend/.env
   ```

## 🔄 Regenerate Compromised Keys

### 1. Google Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Delete the exposed key: `AIzaSyDsqySZPeAKoqstWW4wyYU-DtNAG0LhMUE`
3. Generate a new API key
4. Update `application.properties` with the new key

### 2. Firebase Configuration
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Project Settings → General → Your apps
3. Regenerate API keys
4. Download new `google-services.json` for Android
5. Update web configuration
6. Generate new service account key:
   - Go to Project Settings → Service Accounts
   - Click "Generate new private key"
   - Replace the JSON file

### 3. Database Security
1. Change your PostgreSQL password:
   ```sql
   ALTER USER postgres PASSWORD 'new_secure_password';
   ```
2. Update `application.properties` with new credentials

## 🧹 Clean Git History

**Warning:** These commands rewrite git history. Coordinate with your team first.

1. **Remove sensitive files from history:**
   ```bash
   # Remove the files from git tracking first
   git rm --cached backend/src/main/resources/application.properties
   git rm --cached frontend/src/firebase.js
   git rm --cached backend/src/main/resources/firebase-service-account.json
   git rm --cached finsight-ai-*-firebase-adminsdk-*.json
   git rm --cached finsight-report-*.pdf
   
   # Commit the removal
   git commit -m "Remove sensitive files from tracking"
   
   # Clean history (DANGEROUS - backup first!)
   git filter-branch --force --index-filter \
   'git rm --cached --ignore-unmatch backend/src/main/resources/application.properties' \
   --prune-empty --tag-name-filter cat -- --all
   ```

2. **Force push (coordinate with team):**
   ```bash
   git push origin --force --all
   ```

## ✅ Security Checklist

- [ ] Rotated all exposed API keys
- [ ] Updated Firebase configuration
- [ ] Changed database credentials
- [ ] Removed sensitive files from git tracking
- [ ] Added proper `.gitignore` rules
- [ ] Created template/example files
- [ ] Cleaned git history (if necessary)
- [ ] Verified no secrets in current repository
- [ ] Set up environment-based configuration
- [ ] Documented setup process for team members

## 🔍 Future Prevention

### 1. **Pre-commit hooks:**
   ```bash
   # Install git-secrets
   npm install -g git-secrets
   git secrets --install
   git secrets --register-aws
   ```

### 2. **Environment Variables:**
   Always use environment variables for sensitive data:
   ```bash
   export GEMINI_API_KEY=your_key_here
   export DATABASE_PASSWORD=your_password_here
   ```

### 3. **Regular Security Audits:**
   - Use tools like `truffleHog` or `git-secrets`
   - Review commits before pushing
   - Set up automated secret scanning

## 📞 Emergency Response

If secrets are already exposed in a public repository:

1. **Immediately rotate all keys**
2. **Monitor for unauthorized usage**
3. **Check logs for suspicious activity**
4. **Consider temporary service shutdown if necessary**
5. **Follow your incident response plan**

## 🎯 Best Practices Going Forward

1. **Never commit secrets directly**
2. **Use environment variables**
3. **Encrypt sensitive configuration files**
4. **Regular key rotation**
5. **Implement proper access controls**
6. **Monitor for secret exposure**
7. **Team security training**

---

**Remember:** Security is an ongoing process, not a one-time setup. Stay vigilant and keep your secrets safe! 🛡️
