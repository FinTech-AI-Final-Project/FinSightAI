# FinSight AI - Deployment Guide

This guide covers deploying FinSight AI to various platforms including web, mobile, and production servers.

## 🌐 Web Deployment

### 1. Production Build
```bash
# Build frontend
cd frontend
npm run build

# Build backend
cd ../backend
mvn clean package -DskipTests
```

### 2. Static File Hosting (Netlify, Vercel, AWS S3)
```bash
# Deploy frontend build folder to:
frontend/build/

# Configure redirects for React Router
# Create _redirects file in build folder:
echo "/* /index.html 200" > frontend/build/_redirects
```

### 3. Backend Deployment (Heroku, AWS, DigitalOcean)
```bash
# Deploy the JAR file:
backend/target/finsight-ai-backend-1.0.0.jar

# Set environment variables:
DATABASE_URL=your_postgres_url
FIREBASE_SERVICE_ACCOUNT=base64_encoded_service_account
PORT=8080
```

## 📱 Mobile App Deployment

### Android App (Google Play Store)

#### 1. Setup Android Development
```bash
# Install Android Studio
# Install Android SDK (API level 33+)
# Set ANDROID_HOME environment variable

# Add Android platform
cd frontend
npm run cap:add:android
```

#### 2. Configure App Signing
```bash
# Generate signing key
keytool -genkey -v -keystore my-release-key.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias

# Configure gradle.properties
echo "MYAPP_RELEASE_STORE_FILE=my-release-key.keystore" >> android/gradle.properties
echo "MYAPP_RELEASE_KEY_ALIAS=my-key-alias" >> android/gradle.properties
echo "MYAPP_RELEASE_STORE_PASSWORD=****" >> android/gradle.properties
echo "MYAPP_RELEASE_KEY_PASSWORD=****" >> android/gradle.properties
```

#### 3. Build Release APK/AAB
```bash
# Build and sync
npm run build:mobile

# Open Android Studio
npm run cap:open:android

# In Android Studio:
# 1. Build → Generate Signed Bundle/APK
# 2. Choose Android App Bundle (recommended)
# 3. Select keystore and enter passwords
# 4. Build release version
```

#### 4. Upload to Google Play Console
1. Create developer account at https://play.google.com/console
2. Create new app
3. Upload AAB file
4. Configure store listing, content rating, pricing
5. Submit for review

### iOS App (Apple App Store)

#### 1. Setup iOS Development (macOS only)
```bash
# Install Xcode from App Store
# Install Xcode Command Line Tools
sudo xcode-select --install

# Add iOS platform
npm run cap:add:ios
```

#### 2. Configure Apple Developer Account
1. Join Apple Developer Program ($99/year)
2. Create App ID in developer portal
3. Configure provisioning profiles
4. Set up certificates

#### 3. Build and Archive
```bash
# Build and sync
npm run build:mobile

# Open Xcode
npm run cap:open:ios

# In Xcode:
# 1. Select "Any iOS Device" as target
# 2. Product → Archive
# 3. Validate and distribute to App Store
```

#### 4. Upload to App Store Connect
1. Create app in App Store Connect
2. Upload via Xcode Organizer or Application Loader
3. Configure app metadata, screenshots, descriptions
4. Submit for review

## 🤖 AI Agent Deployment (Gradient AI Platform)

### Setting Up Your AI Agent

1. **Sign up at Gradient AI Platform**
   - Go to [Gradient AI Platform](https://gradient.run/)
   - Create an account and workspace

2. **Create AI Agent**
   - Click "Create Agent"
   - Choose model (e.g., Llama 3.3 Instruct 70B, OpenAI GPT-oss-120b)
   - Configure agent instructions for financial recommendations
   - Deploy the agent

3. **Get API Credentials**
   - Copy your agent endpoint URL
   - Create an endpoint access key
   - Note down the credentials for backend integration

### Backend Integration

Update your backend configuration:

```properties
# AI Configuration - Gradient AI Agent
ai.agent.api.url=https://your-agent-id.agents.do-ai.run
ai.agent.api.key=your_gradient_api_key
```

### Cost Monitoring

- Monitor token usage in Gradient dashboard
- Set up billing alerts for cost control
- Optimize prompts for efficiency

---

## 🖥️ Production Server Deployment

### Docker Deployment

#### 1. Backend Dockerfile
```dockerfile
# Create backend/Dockerfile
FROM openjdk:17-jdk-slim
COPY target/finsight-ai-backend-1.0.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app.jar"]
```

#### 2. Frontend Dockerfile
```dockerfile
# Create frontend/Dockerfile
FROM nginx:alpine
COPY build/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
```

#### 3. Docker Compose
```yaml
# Create docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: finsight_ai
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      DATABASE_URL: jdbc:postgresql://postgres:5432/finsight_ai
      DATABASE_USERNAME: postgres
      DATABASE_PASSWORD: password
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

#### 4. Deploy with Docker
```bash
# Build and run
docker-compose up -d

# Scale services
docker-compose up -d --scale backend=3
```

### AWS Deployment

#### 1. Backend on AWS Elastic Beanstalk
```bash
# Install EB CLI
pip install awsebcli

# Initialize and deploy
cd backend
eb init
eb create production
eb deploy
```

#### 2. Frontend on AWS S3 + CloudFront
```bash
# Install AWS CLI
aws configure

# Sync to S3
aws s3 sync frontend/build/ s3://your-bucket-name/

# Create CloudFront distribution
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

#### 3. Database on AWS RDS
```bash
# Create PostgreSQL RDS instance
aws rds create-db-instance \
  --db-instance-identifier finsight-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password yourpassword \
  --allocated-storage 20
```

### Google Cloud Platform Deployment

#### 1. Backend on Google App Engine
```yaml
# Create backend/app.yaml
runtime: java17
service: backend
env_variables:
  DATABASE_URL: jdbc:postgresql://google/finsight_ai?cloudSqlInstance=your-instance&socketFactory=com.google.cloud.sql.postgres.SocketFactory
```

#### 2. Frontend on Firebase Hosting
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Initialize and deploy
cd frontend
firebase init hosting
firebase deploy
```

#### 3. Database on Cloud SQL
```bash
# Create Cloud SQL instance
gcloud sql instances create finsight-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1
```

## 🔧 Environment Configuration

### Production Environment Variables

#### Backend (.env or application-production.properties)
```properties
# Database
DATABASE_URL=your_production_database_url
DATABASE_USERNAME=your_db_username
DATABASE_PASSWORD=your_db_password

# Firebase
FIREBASE_SERVICE_ACCOUNT_PATH=path_to_service_account.json

# Security
JWT_SECRET=your_jwt_secret_key
CORS_ALLOWED_ORIGINS=https://yourdomain.com

# AI Integration
AI_AGENT_API_URL=https://lxhcfhua6qcqp3wx7qf4jx4f.agents.do-ai.run
AI_AGENT_API_KEY=W3NMm2kJPbT406AkRBUyWYJ5YQwDzA7S

# Server
SERVER_PORT=8080
SPRING_PROFILES_ACTIVE=production
```

#### Frontend (.env.production)
```env
REACT_APP_API_BASE_URL=https://api.yourdomain.com
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=your-app-id
REACT_APP_ENVIRONMENT=production
```

## 🔒 Security Checklist

### Backend Security
- [ ] Use HTTPS in production
- [ ] Configure proper CORS origins
- [ ] Set secure database credentials
- [ ] Enable SQL injection protection
- [ ] Configure rate limiting
- [ ] Set up proper logging
- [ ] Use environment variables for secrets

### Frontend Security
- [ ] Build for production (npm run build)
- [ ] Configure Content Security Policy
- [ ] Use HTTPS for all requests
- [ ] Validate user inputs
- [ ] Implement proper error handling
- [ ] Minify and obfuscate code

### Mobile Security
- [ ] Use app signing for Android
- [ ] Configure iOS provisioning profiles
- [ ] Implement certificate pinning
- [ ] Protect API keys
- [ ] Enable app transport security
- [ ] Configure proper permissions

## 📊 Monitoring and Analytics

### Application Monitoring
```bash
# Add monitoring dependencies
# Spring Boot Actuator for backend
# React error boundaries for frontend
# Mobile crash reporting (Firebase Crashlytics)
```

### Performance Monitoring
```bash
# Frontend: Web Vitals, Lighthouse CI
# Backend: APM tools (New Relic, DataDog)
# Database: Query performance monitoring
# Mobile: Firebase Performance Monitoring
```

## 🚀 CI/CD Pipeline

### GitHub Actions Example
```yaml
# Create .github/workflows/deploy.yml
name: Deploy FinSight AI

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Java
        uses: actions/setup-java@v2
        with:
          java-version: '17'
      - name: Build with Maven
        run: cd backend && mvn clean package -DskipTests
      - name: Deploy to production
        run: # Your deployment script

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install and build
        run: cd frontend && npm install && npm run build
      - name: Deploy to hosting
        run: # Your deployment script
```

## 📱 App Store Optimization

### Screenshots and Media
- Create app screenshots for all device sizes
- Design app icon following platform guidelines
- Create promotional videos/GIFs
- Write compelling app descriptions

### Keywords and Metadata
- Research relevant keywords for app store search
- Optimize app title and description
- Configure app categories appropriately
- Set up app ratings and reviews monitoring

---

For support with deployment, contact support@finsight-ai.com or create an issue in the repository.
