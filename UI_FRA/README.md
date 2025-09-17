# FRA Atlas - Forest Rights Act Portal

A comprehensive government portal for managing Forest Rights Act (FRA) claims in India. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

### 🏛️ Government Portal
- **Landing Page**: Government-styled homepage with Hindi/English bilingual support
- **Officer Authentication**: Secure login system for government officers
- **Responsive Design**: Mobile-first approach with government color scheme

### 🗺️ Interactive Mapping Dashboard
- **Claims Visualization**: Interactive map showing FRA claims with status-based markers
- **Advanced Filtering**: Filter by state, district, village, status, and date range
- **Claim Management**: View, verify, and reject claims with detailed workflows

### 📊 Data Management
- **Real-time Data**: Live integration with backend APIs
- **Export Functionality**: CSV export for claims data
- **Document Management**: View and download claim documents

### 🔐 Security & Authentication
- **JWT Authentication**: Secure token-based authentication
- **Session Management**: Auto-expiring sessions with security warnings
- **Protected Routes**: Route-level authentication guards

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 with custom government color tokens
- **UI Components**: shadcn/ui
- **State Management**: React hooks with custom utilities
- **Authentication**: JWT with localStorage
- **Icons**: Lucide React

## Project Structure

\`\`\`
├── app/
│   ├── landing/          # Government landing page
│   ├── login/            # Officer authentication
│   ├── dashboard/        # Main mapping interface
│   └── layout.tsx        # Root layout with government branding
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── hexagon-grid.tsx  # Hero section hexagon display
│   ├── notice-board.tsx  # Government notices component
│   ├── claim-modal.tsx   # Detailed claim management
│   └── protected-route.tsx # Authentication wrapper
├── lib/
│   ├── api.ts            # API client with JWT handling
│   ├── utils.ts          # Utility functions
│   └── constants.ts      # Government portal constants
└── hooks/
    └── use-auth.ts       # Authentication hook
\`\`\`

## Government Color Scheme

The portal uses official government colors:
- **Primary Green**: `#2C6E49` - Main government green
- **Government Blue**: `#0F2A44` - Official blue for headers
- **Saffron**: `#E57C04` - Accent color for CTAs
- **Teal**: `#0E9AA7` - Secondary accent color

## API Integration

The portal integrates with a backend API for:

### Authentication
- `POST /api/login` - Officer authentication
- JWT token management with auto-refresh

### Data Management
- `GET /api/villages` - Village/location data
- `GET /api/claims` - FRA claims with filtering
- `GET /api/claim/{id}` - Detailed claim information

### Claim Actions
- `POST /api/claim/{id}/verify` - Verify a claim
- `POST /api/claim/{id}/reject` - Reject a claim with reason
- `GET /api/export/csv` - Export claims data

## Environment Variables

\`\`\`env
NEXT_PUBLIC_API_BASE=http://localhost:8000
\`\`\`

## Installation & Setup

1. **Clone and Install**
   \`\`\`bash
   git clone <repository-url>
   cd fra-atlas
   npm install
   \`\`\`

2. **Environment Setup**
   \`\`\`bash
   cp .env.example .env.local
   # Update NEXT_PUBLIC_API_BASE with your backend URL
   \`\`\`

3. **Development**
   \`\`\`bash
   npm run dev
   \`\`\`

4. **Production Build**
   \`\`\`bash
   npm run build
   npm start
   \`\`\`

## Key Features Implementation

### 🔐 Authentication Flow
- Officers log in with ID/email and password
- JWT tokens stored securely in localStorage
- Automatic session expiry with warnings
- Protected routes redirect to login when unauthorized

### 🗺️ Claims Management
- Interactive map with clustered markers
- Status-based color coding (Green: Verified, Yellow: Pending, Red: Rejected)
- Detailed claim modals with tabs for overview, documents, timeline, and actions
- Bulk operations and CSV export functionality

### 📱 Responsive Design
- Mobile-first approach with collapsible sidebars
- Touch-friendly interface for tablets
- Government accessibility standards compliance
- Bilingual support (Hindi/English)

### 🎨 Government Branding
- Official color scheme and typography
- Government logos and branding elements
- Accessibility features (WCAG 2.1 AA compliant)
- Professional government portal aesthetics

## Security Considerations

- JWT tokens with expiration handling
- HTTPS enforcement in production
- Input validation and sanitization
- CORS configuration for API access
- Session timeout with user warnings

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

Government of India - Ministry of Tribal Affairs
Forest Rights Act Atlas Portal © 2025

---

**Contact Information:**
- Toll Free: 1800 180 2117
- Email: mfmb-agri[at]hry[dot]gov[dot]in
- Department: Agriculture and Farmers Welfare, Haryana
\`\`\`

```json file="" isHidden
