# Texas Tailgaters - Technical Architecture & MVP Definition

## MVP Scope Definition

### Core MVP Features (Phase 1)
**Timeline**: 8-10 weeks  
**Goal**: Functional tailgate management for 2024 season

#### 1. Schedule Management
- **Automatic Schedule Population**: Daily checks from UT Athletics website
- **Manual Override**: Edit games if needed
- **Season Overview**: View all games with status
- **Game Details**: Individual game information

#### 2. Basic Potluck System
- **Food Signup**: Users can claim items by category
- **Duplicate Warnings**: Alert for similar items
- **Basic Categories**: Main, Side, Appetizer, Dessert, Drink, Other
- **Simple Assignment**: Who's bringing what

#### 3. User Management
- **Basic Profiles**: Name, email, phone
- **Dietary Restrictions**: Simple checkbox system
- **User Roles**: Admin vs Regular user

#### 4. Invitation System
- **Email Invitations**: Basic email sending
- **RSVP Tracking**: Simple yes/no responses
- **Game Links**: Direct links to game details

#### 5. Opponent Themes
- **Basic Themes**: Pre-defined themes for each opponent
- **Theme Display**: Show theme on game cards
- **Manual Theme Assignment**: Admin can assign themes

### Post-MVP Features (Phase 2+)
- Advanced dietary restriction tracking
- SMS invitations
- Theme customization
- Analytics dashboard
- Weather integration
- Equipment coordination
- Photo sharing

---

## Technical Architecture

### Frontend Architecture

#### Technology Stack
```
Framework: React 18 with TypeScript
Styling: Tailwind CSS + Headless UI
State Management: React Context + useReducer
Routing: React Router v6
HTTP Client: Axios
Build Tool: Vite
PWA: Workbox
```

#### Component Architecture
```
src/
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── BottomNav.tsx
│   │   └── Layout.tsx
│   ├── games/
│   │   ├── GameCard.tsx
│   │   ├── GameDetail.tsx
│   │   ├── SeasonOverview.tsx
│   │   └── GameForm.tsx
│   ├── potluck/
│   │   ├── PotluckItem.tsx
│   │   ├── PotluckForm.tsx
│   │   ├── CategoryFilter.tsx
│   │   └── DietaryWarnings.tsx
│   ├── users/
│   │   ├── UserProfile.tsx
│   │   ├── UserForm.tsx
│   │   └── DietaryRestrictions.tsx
│   ├── admin/
│   │   ├── AdminDashboard.tsx
│   │   ├── ScheduleManager.tsx
│   │   └── UserManager.tsx
│   └── common/
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Modal.tsx
│       └── Loading.tsx
├── pages/
│   ├── HomePage.tsx
│   ├── GameDetailPage.tsx
│   ├── PotluckPage.tsx
│   ├── ProfilePage.tsx
│   └── AdminPage.tsx
├── hooks/
│   ├── useGames.ts
│   ├── usePotluck.ts
│   ├── useUsers.ts
│   └── useAuth.ts
├── services/
│   ├── api.ts
│   ├── scheduleService.ts
│   ├── potluckService.ts
│   └── userService.ts
├── types/
│   ├── Game.ts
│   ├── User.ts
│   ├── PotluckItem.ts
│   └── Theme.ts
└── utils/
    ├── constants.ts
    ├── helpers.ts
    └── validation.ts
```

### Backend Architecture

#### Technology Stack
```
Runtime: Node.js 18+
Framework: Express.js with TypeScript
Database: PostgreSQL (Supabase free tier)
ORM: Prisma
Authentication: Supabase Auth
File Storage: Supabase Storage
Scheduling: Node-cron
Email: Resend (free tier)
Hosting: Vercel (free tier)
```

#### API Architecture
```
src/
├── controllers/
│   ├── gameController.ts
│   ├── potluckController.ts
│   ├── userController.ts
│   ├── themeController.ts
│   └── invitationController.ts
├── services/
│   ├── scheduleService.ts
│   ├── emailService.ts
│   ├── potluckService.ts
│   └── userService.ts
├── middleware/
│   ├── auth.ts
│   ├── validation.ts
│   └── errorHandler.ts
├── routes/
│   ├── games.ts
│   ├── potluck.ts
│   ├── users.ts
│   └── admin.ts
├── models/
│   ├── Game.ts
│   ├── User.ts
│   ├── PotluckItem.ts
│   └── Theme.ts
└── utils/
    ├── database.ts
    ├── logger.ts
    └── helpers.ts
```

### Database Schema

#### Core Tables
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  dietary_restrictions TEXT[],
  allergies TEXT[],
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Games table
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  time TIME,
  opponent VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  is_home BOOLEAN DEFAULT TRUE,
  theme_id UUID REFERENCES themes(id),
  status VARCHAR(50) DEFAULT 'unplanned',
  setup_time TIME,
  expected_attendance INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Themes table
CREATE TABLE themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  opponent VARCHAR(255),
  colors JSONB,
  food_suggestions TEXT[],
  is_custom BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Potluck items table
CREATE TABLE potluck_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  quantity VARCHAR(255),
  description TEXT,
  assigned_to UUID REFERENCES users(id),
  is_admin_assigned BOOLEAN DEFAULT FALSE,
  dietary_flags TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- Invitations table
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  sent_to UUID REFERENCES users(id),
  sent_via VARCHAR(20) NOT NULL, -- 'email' or 'text'
  status VARCHAR(20) DEFAULT 'sent', -- 'sent', 'delivered', 'opened', 'responded'
  rsvp_status VARCHAR(20), -- 'yes', 'no', 'maybe'
  sent_at TIMESTAMP DEFAULT NOW(),
  responded_at TIMESTAMP
);
```

### API Endpoints

#### Games
```
GET    /api/games              - Get all games
GET    /api/games/:id          - Get specific game
POST   /api/games              - Create game (admin)
PUT    /api/games/:id          - Update game (admin)
DELETE /api/games/:id          - Delete game (admin)
POST   /api/games/sync         - Sync from UT Athletics (admin)
```

#### Potluck
```
GET    /api/games/:id/potluck  - Get potluck items for game
POST   /api/potluck            - Add potluck item
PUT    /api/potluck/:id        - Update potluck item
DELETE /api/potluck/:id        - Remove potluck item
GET    /api/potluck/duplicates - Check for duplicates
```

#### Users
```
GET    /api/users              - Get all users (admin)
GET    /api/users/:id          - Get user profile
POST   /api/users              - Create user
PUT    /api/users/:id          - Update user
DELETE /api/users/:id          - Delete user (admin)
```

#### Invitations
```
POST   /api/invitations        - Send invitation
GET    /api/invitations/:id    - Get invitation status
PUT    /api/invitations/:id    - Update RSVP
```

### Data Flow Architecture

#### Schedule Sync Process
```
1. Daily Cron Job (9:00 AM)
   ↓
2. Fetch UT Athletics Schedule
   ↓
3. Parse HTML/JSON Response
   ↓
4. Compare with Database
   ↓
5. Update/Insert Games
   ↓
6. Send Notifications (if changes)
   ↓
7. Log Results
```

#### Potluck Workflow
```
1. User Signs Up for Item
   ↓
2. Check for Duplicates
   ↓
3. Validate Dietary Conflicts
   ↓
4. Save to Database
   ↓
5. Send Notifications
   ↓
6. Update Game Summary
```

### Security Architecture

#### Authentication
- **Supabase Auth** for user management
- **JWT tokens** for API authentication
- **Role-based access** (admin vs regular user)
- **Session management** with refresh tokens

#### Data Protection
- **HTTPS only** for all communications
- **Input validation** on all endpoints
- **SQL injection prevention** via Prisma ORM
- **XSS protection** via React sanitization
- **CORS configuration** for domain restrictions

#### Privacy
- **User consent** for data collection
- **Data retention** policies
- **GDPR compliance** for EU users
- **Data export/deletion** capabilities

### Performance Architecture

#### Frontend Optimization
- **Code splitting** by routes
- **Lazy loading** for components
- **Image optimization** and compression
- **Service worker** for caching
- **Bundle analysis** and optimization

#### Backend Optimization
- **Database indexing** on frequently queried fields
- **Connection pooling** for database
- **Caching layer** for schedule data
- **Rate limiting** on API endpoints
- **Compression** for API responses

#### Monitoring
- **Error tracking** with Sentry
- **Performance monitoring** with Vercel Analytics
- **Database monitoring** with Supabase
- **Uptime monitoring** with external service

### Deployment Architecture

#### Development Environment
```
Local Development:
├── Frontend: localhost:3000 (Vite dev server)
├── Backend: localhost:3001 (Express dev server)
├── Database: Supabase local or cloud
└── Environment: .env.local
```

#### Production Environment
```
Frontend: Vercel (free tier)
├── Domain: texastailgaters.com
├── SSL: Automatic via Vercel
├── CDN: Global edge network
└── Build: Automatic on git push

Backend: Vercel Functions (serverless)
├── API Routes: /api/*
├── Cron Jobs: Vercel Cron
├── Environment: Vercel env vars
└── Logs: Vercel dashboard

Database: Supabase (free tier)
├── PostgreSQL: 500MB storage
├── Auth: Built-in user management
├── Storage: File uploads
└── Backups: Automatic daily
```

### MVP Implementation Plan

#### Week 1-2: Foundation
- [ ] Project setup and configuration
- [ ] Database schema creation
- [ ] Basic authentication system
- [ ] Core API endpoints

#### Week 3-4: Schedule Management
- [ ] UT Athletics web scraping
- [ ] Schedule sync automation
- [ ] Game CRUD operations
- [ ] Season overview UI

#### Week 5-6: Potluck System
- [ ] Potluck item management
- [ ] Category system
- [ ] Duplicate detection
- [ ] Basic dietary restrictions

#### Week 7-8: User Management
- [ ] User profiles
- [ ] Dietary restrictions
- [ ] Admin controls
- [ ] Basic invitation system

#### Week 9-10: Polish & Launch
- [ ] UI/UX refinements
- [ ] Testing and bug fixes
- [ ] Performance optimization
- [ ] Production deployment

### Risk Mitigation

#### Technical Risks
- **Schedule API Changes**: Multiple data sources, manual override
- **Free Tier Limitations**: Monitor usage, plan for scaling
- **Data Loss**: Regular backups, cloud storage
- **Performance Issues**: Caching, optimization, monitoring

#### Business Risks
- **User Adoption**: Intuitive design, clear value proposition
- **Feature Creep**: Strict MVP scope, iterative development
- **Maintenance Overhead**: Automated processes, minimal manual work
- **Scalability**: Cloud-native architecture, easy scaling

### Success Metrics

#### Technical Metrics
- **Uptime**: >99% during football season
- **Load Time**: <3 seconds for all pages
- **Error Rate**: <1% of requests
- **Mobile Performance**: >90 Lighthouse score

#### User Metrics
- **Weekly Active Users**: Track during season
- **Feature Adoption**: Potluck signup rate
- **User Retention**: Return rate for games
- **Satisfaction**: User feedback scores

---

## Next Steps

1. **Set up development environment**
2. **Create project repository**
3. **Configure Supabase database**
4. **Begin frontend development**
5. **Implement schedule sync service**

This architecture provides a solid foundation for the MVP while allowing for future expansion. The cloud-native approach ensures scalability and reliability while keeping costs minimal for personal use.

