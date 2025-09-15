# FinSight AI

[![Java](https://img.shields.io/badge/Java-17-orange)](https://openjdk.java.net/projects/jdk/17/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.0-brightgreen)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18.2.0-blue)](https://reactjs.org/)
[![Material-UI](https://img.shields.io/badge/Material--UI-5.15.1-blue)](https://mui.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)](https://www.postgresql.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10.7.1-orange)](https://firebase.google.com/)

An AI-powered personal finance management application that helps users track expenses, manage budgets, and receive intelligent financial insights through machine learning and AI-driven recommendations.

## 🌟 Features

### 💰 Core Financial Management
- **Expense Tracking**: Log and categorize daily expenses with receipt scanning
- **Budget Management**: Set monthly budgets by category with progress tracking
- **Financial Reports**: Generate comprehensive reports with charts and analytics
- **Multi-Currency Support**: Handle multiple currencies with real-time conversion

### 🤖 AI-Powered Insights
- **Smart Tips**: Three categories of AI-generated financial advice:
  - **Default Tips**: General financial wellness recommendations
  - **Crypto Tips**: Cryptocurrency market analysis and investment insights
  - **Cash Flow Tips**: Personalized cash flow forecasting and optimization
- **Intelligent Recommendations**: Context-aware suggestions based on spending patterns
- **Market Analysis**: Real-time cryptocurrency data from Blockchair and CoinGecko APIs

### 📱 Cross-Platform Experience
- **Web Application**: Responsive web interface built with React
- **Mobile Support**: Native mobile apps via Capacitor (iOS/Android)
- **Progressive Web App**: Installable PWA with offline capabilities

### 🔐 Security & Authentication
- **Firebase Authentication**: Secure user authentication and authorization
- **Role-Based Access**: Protected routes and user-specific data isolation
- **Data Encryption**: Secure storage of sensitive financial information

### 📊 Advanced Analytics
- **Interactive Charts**: Visual expense breakdowns and trends
- **Spending Analytics**: Category-wise analysis and spending patterns
- **Forecasting**: AI-driven cash flow predictions
- **Export Capabilities**: PDF reports and CSV data exports

## 🏗️ Architecture

### Backend (Spring Boot)
```
backend/
├── src/main/java/com/finsight/ai/
│   ├── config/          # Configuration classes
│   ├── controller/      # REST API endpoints
│   ├── dto/            # Data Transfer Objects
│   ├── entity/         # JPA entities
│   ├── repository/     # Data access layer
│   └── service/        # Business logic
├── src/main/resources/
│   ├── application.properties    # Main configuration
│   └── firebase-service-account.json
└── pom.xml
```

### Frontend (React)
```
frontend/
├── public/             # Static assets
├── src/
│   ├── components/     # Reusable UI components
│   ├── contexts/       # React contexts for state management
│   ├── pages/          # Main application pages
│   ├── services/       # API services and utilities
│   └── utils/          # Helper functions
├── android/            # Android Capacitor project
├── ios/                # iOS Capacitor project
└── package.json
```

## 🚀 Quick Start

### Prerequisites
- **Java 17** or higher
- **Node.js 16** or higher
- **PostgreSQL 15** or higher
- **Maven 3.6+**
- **Firebase Project** with authentication enabled

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/FinTech-AI-Final-Project/FinSightAI.git
   cd FinSightAI
   ```

2. **Configure Database**
   - Create a PostgreSQL database
   - Update `backend/src/main/resources/application.properties` with your database credentials

3. **Firebase Setup**
   - Create a Firebase project
   - Download the service account key and place it at `backend/src/main/resources/firebase-service-account.json`
   - Update Firebase configuration in `application.properties`

4. **Build and Run**
   ```bash
   cd backend
   mvn clean install
   mvn spring-boot:run
   ```

### Frontend Setup

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure Environment**
   - Copy `frontend/.env.example` to `frontend/.env`
   - Update API URLs and Firebase configuration

3. **Start Development Server**
   ```bash
   npm start
   ```

### Mobile Setup

1. **Install Capacitor CLI**
   ```bash
   npm install -g @capacitor/cli
   ```

2. **Add Platforms**
   ```bash
   npm run cap:add:android
   npm run cap:add:ios
   ```

3. **Build and Run**
   ```bash
   npm run android  # For Android
   npm run ios      # For iOS
   ```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```properties
# Database
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/finsight
SPRING_DATASOURCE_USERNAME=your_db_user
SPRING_DATASOURCE_PASSWORD=your_db_password

# Firebase
FIREBASE_SERVICE_ACCOUNT_KEY=classpath:firebase-service-account.json

# AI Services
AI_AGENT_API_URL=https://your-ai-agent-url
AI_AGENT_API_KEY=your_ai_api_key

# CORS
APP_CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8100
```

#### Frontend (.env)
```javascript
REACT_APP_API_URL=http://localhost:8081/api
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
```

## 📚 API Documentation

The API documentation is automatically generated using SpringDoc OpenAPI. Once the backend is running, visit:

- **Swagger UI**: `http://localhost:8081/api/swagger-ui.html`
- **API Docs**: `http://localhost:8081/api/v3/api-docs`

### Key Endpoints

- `GET /api/users/profile` - Get user profile
- `POST /api/expenses` - Create expense
- `GET /api/budgets` - Get user budgets
- `GET /api/ai-tips/multiple` - Get AI-generated tips
- `POST /api/chatbot/chat` - Chat with AI assistant

## 🧪 Testing

### Backend Tests
```bash
cd backend
mvn test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🚢 Deployment

### Docker Deployment
```bash
# Build backend
cd backend
mvn clean package -DskipTests
docker build -t finsight-backend .

# Build frontend
cd frontend
npm run build
docker build -t finsight-frontend .
```

### Production Checklist
- [ ] Update database credentials
- [ ] Configure production Firebase settings
- [ ] Set up SSL certificates
- [ ] Configure reverse proxy (nginx)
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow Java naming conventions for backend
- Use functional components and hooks for React
- Write comprehensive tests for new features
- Update documentation for API changes
- Ensure mobile compatibility

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Spring Boot** for the robust backend framework
- **React** for the modern frontend library
- **Material-UI** for beautiful UI components
- **Firebase** for authentication and hosting
- **Capacitor** for cross-platform mobile development
- **Chart.js** for data visualization
- **Blockchair & CoinGecko** for cryptocurrency data

## 📞 Support

For support, email support@finsight.ai or join our Discord community.

---

**Made with ❤️ by the FinSight AI Team**</content>
<filePath">c:\Users\Sandile\Desktop\Final Project\FinSightAI\README.md