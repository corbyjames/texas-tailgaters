# 🔥 Texas Tailgaters

A modern web application for managing UT football tailgate events, potluck coordination, and team organization.

## 🏈 Features

- **Automatic Schedule Management**: Syncs with UT Athletics website
- **Potluck Coordination**: Evite-style food signup with categories
- **Opponent Themes**: UT colors + opponent-specific theming
- **User Management**: Profiles with dietary restrictions
- **Invitation System**: Email invitations with RSVP tracking
- **Mobile-First Design**: Optimized for smartphone use

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (free tier)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd texas-tailgaters
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url_here
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   VITE_APP_NAME=Texas Tailgaters
   VITE_APP_URL=http://localhost:3000
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── layout/         # Layout components (Header, Navigation)
│   ├── games/          # Game-related components
│   ├── potluck/        # Potluck management components
│   ├── users/          # User profile components
│   ├── admin/          # Admin dashboard components
│   └── common/         # Shared components (Button, Card, etc.)
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── services/           # API and external service integrations
├── types/              # TypeScript type definitions
└── utils/              # Utility functions and helpers
```

## 🎨 Design System

### Colors
- **Primary**: UT Burnt Orange (#BF5700)
- **Secondary**: UT White (#FFFFFF)
- **Accent**: UT Dark Gray (#333F48)
- **Success**: Green (#10B981)
- **Warning**: Yellow (#F59E0B)
- **Error**: Red (#EF4444)

### Typography
- **Font**: Inter (Google Fonts)
- **Weights**: 400, 500, 600, 700

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Supabase** for authentication and database

### Backend
- **Supabase** (PostgreSQL database)
- **Vercel Functions** (serverless API)
- **Resend** (email service)

### Deployment
- **Vercel** (frontend hosting)
- **Supabase** (database and auth)
- **Custom Domain**: texastailgaters.com

## 📱 Mobile-First Design

The app is designed with a mobile-first approach:
- Responsive design for all screen sizes
- Touch-friendly interface
- Bottom navigation for easy thumb access
- Progressive Web App (PWA) features

## 🔐 Authentication

- **Supabase Auth** for user management
- **Email/password** authentication
- **Role-based access** (admin vs regular user)
- **Protected routes** for authenticated users

## 🗄️ Database Schema

### Core Tables
- **users**: User profiles and preferences
- **games**: Football game information
- **themes**: Opponent-specific themes
- **potluck_items**: Food signup items
- **invitations**: Email invitation tracking

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Deploy to Vercel
```bash
npm run deploy
```

## 📋 MVP Roadmap

### Phase 1: Foundation (Weeks 1-2) ✅
- [x] Project setup and configuration
- [x] Database schema creation
- [x] Basic authentication system
- [x] Core API endpoints

### Phase 2: Schedule Management (Weeks 3-4)
- [ ] UT Athletics web scraping
- [ ] Schedule sync automation
- [ ] Game CRUD operations
- [ ] Season overview UI

### Phase 3: Potluck System (Weeks 5-6)
- [ ] Potluck item management
- [ ] Category system
- [ ] Duplicate detection
- [ ] Basic dietary restrictions

### Phase 4: User Management (Weeks 7-8)
- [ ] User profiles
- [ ] Dietary restrictions
- [ ] Admin controls
- [ ] Basic invitation system

### Phase 5: Polish & Launch (Weeks 9-10)
- [ ] UI/UX refinements
- [ ] Testing and bug fixes
- [ ] Performance optimization
- [ ] Production deployment

## 🤝 Contributing

This is a personal project for UT football tailgate management. Contributions are welcome for:
- Bug fixes
- Feature enhancements
- Documentation improvements
- Performance optimizations

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🏆 Success Metrics

### Technical
- App load time <3 seconds
- 99% uptime during football season
- Mobile performance score >90

### User
- 80% potluck signup completion rate
- 70% RSVP rate for invitations
- Weekly active usage during season

## 🆘 Support

For support or questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Hook 'em! 🤘**
