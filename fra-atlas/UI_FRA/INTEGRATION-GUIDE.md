# FRA Atlas Integration Guide

## Quick Start

### 1. Environment Setup

Create a `.env.local` file in your project root:

\`\`\`env
# Backend API Configuration
NEXT_PUBLIC_API_BASE=http://localhost:8000

# Optional: Development redirect URL for Supabase (if using auth)
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/dashboard
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 3. Development Server

\`\`\`bash
npm run dev
\`\`\`

Visit `http://localhost:3000/landing` to see the portal.

## Project Structure

\`\`\`
fra-atlas/
├── app/
│   ├── landing/          # Government landing page
│   ├── login/            # Officer authentication
│   ├── dashboard/        # Main mapping interface
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Redirect to landing
├── components/
│   ├── ui/               # shadcn/ui components (50+ components)
│   ├── claim-modal.tsx   # Detailed claim management
│   ├── error-boundary.tsx # Error handling
│   ├── hexagon-grid.tsx  # Hero section display
│   ├── loading-spinner.tsx # Loading states
│   ├── notice-board.tsx  # Government notices
│   ├── protected-route.tsx # Auth wrapper
│   └── toast-provider.tsx # Toast notifications
├── lib/
│   ├── api.ts            # API client with JWT
│   ├── constants.ts      # Government constants
│   └── utils.ts          # Utility functions
├── hooks/
│   └── use-auth.ts       # Authentication hook
└── README.md
\`\`\`

## API Integration

### Backend Requirements

Your backend should implement these endpoints:

#### Authentication
\`\`\`typescript
POST /api/login
Body: { username: string, password: string }
Response: { access_token: string, token_type: string, expires_in: number, user: object }
\`\`\`

#### Data Endpoints
\`\`\`typescript
GET /api/villages
Response: Array<{ id: string, state: string, district: string, block: string, village: string, lat: number, lon: number }>

GET /api/claims?state=&district=&village=
Response: Array<{ id: string, village_id: string, claimant: string, status: string, date: string, lat: number, lon: number, short_note: string }>

GET /api/claim/{id}
Response: { id: string, ..., documents: Array<object>, history: Array<object> }
\`\`\`

#### Claim Actions
\`\`\`typescript
POST /api/claim/{id}/verify
Body: { comment?: string }
Headers: Authorization: Bearer {token}

POST /api/claim/{id}/reject  
Body: { reason: string }
Headers: Authorization: Bearer {token}

GET /api/export/csv?state=&district=
Headers: Authorization: Bearer {token}
Response: CSV file stream
\`\`\`

### Frontend API Client

The `lib/api.ts` file provides a complete API client:

\`\`\`typescript
import { api } from '@/lib/api'

// Login
const response = await api.login({ username, password })

// Get data
const villages = await api.getVillages()
const claims = await api.getClaims({ state: 'Haryana' })

// Claim actions
await api.verifyClaim(claimId, 'Approved after review')
await api.rejectClaim(claimId, 'Insufficient documentation')
\`\`\`

## Government Styling

### Color Tokens

The portal uses official government colors defined in `app/globals.css`:

\`\`\`css
:root {
  --gov-green: #2C6E49;      /* Primary government green */
  --gov-blue: #0F2A44;       /* Official blue for headers */
  --gov-saffron: #E57C04;    /* Accent color for CTAs */
  --accent-teal: #0E9AA7;    /* Secondary accent */
}
\`\`\`

### Tailwind Classes

Use these custom classes for government branding:

\`\`\`tsx
<div className="bg-gov-green text-white">Government Header</div>
<button className="bg-gov-saffron hover:bg-gov-saffron/90">CTA Button</button>
<span className="text-gov-blue">Government Text</span>
\`\`\`

## Authentication Flow

### 1. Login Process
- User enters credentials on `/login`
- JWT token stored in localStorage as `fra_atlas_token`
- Redirect to `/dashboard` on success

### 2. Protected Routes
- `ProtectedRoute` component wraps authenticated pages
- Automatic redirect to login if no valid token
- Session expiry handling with user notifications

### 3. Logout
- Clear token from localStorage
- Redirect to login page
- Show session expired message if auto-logout

## Key Features

### 🗺️ Interactive Dashboard
- **Filter Panel**: State → District → Village cascading dropdowns
- **Claims Display**: Status-based markers on map placeholder
- **Claim Management**: Detailed modals with verify/reject actions
- **Export**: CSV download functionality

### 🏛️ Government Portal
- **Landing Page**: Bilingual (Hindi/English) with government branding
- **Notice Board**: Scrollable government announcements
- **Hexagon Grid**: Visual display of agricultural/tribal imagery
- **Contact Information**: Government helpline and department details

### 🔐 Security Features
- JWT authentication with auto-expiry
- Protected route guards
- Session timeout warnings
- Secure API communication

## Customization

### Adding New Pages
1. Create page in `app/` directory
2. Add navigation links in header components
3. Implement authentication if needed

### Extending API
1. Add new endpoints to `lib/api.ts`
2. Update TypeScript interfaces
3. Handle errors appropriately

### Styling Changes
1. Update color tokens in `app/globals.css`
2. Modify Tailwind classes throughout components
3. Ensure WCAG accessibility compliance

## Deployment

### Vercel (Recommended)
\`\`\`bash
# Connect to Vercel
vercel

# Set environment variables in Vercel dashboard
NEXT_PUBLIC_API_BASE=https://your-api-domain.com
\`\`\`

### Other Platforms
1. Build the project: `npm run build`
2. Set environment variables
3. Deploy the `.next` folder
4. Configure reverse proxy if needed

## Troubleshooting

### Common Issues

**API Connection Failed**
- Check `NEXT_PUBLIC_API_BASE` environment variable
- Verify backend is running and accessible
- Check CORS configuration on backend

**Authentication Issues**
- Clear localStorage: `localStorage.removeItem('fra_atlas_token')`
- Check JWT token expiry
- Verify backend authentication endpoint

**Styling Issues**
- Ensure Tailwind CSS is properly configured
- Check custom CSS variables in `globals.css`
- Verify component imports

### Development Tips

1. **API Testing**: Use browser dev tools Network tab to debug API calls
2. **State Debugging**: Add console.log statements in components
3. **Styling**: Use browser inspector to check applied CSS classes
4. **Authentication**: Check localStorage for token presence

## Support

For technical support or questions about the FRA Atlas portal:

- **Government Helpline**: 1800 180 2117
- **Email**: mfmb-agri[at]hry[dot]gov[dot]in
- **Department**: Agriculture and Farmers Welfare, Haryana
- **Working Hours**: Monday to Friday, 9:00AM - 5:00PM

---

**Government of India - Ministry of Tribal Affairs**  
**Forest Rights Act Atlas Portal © 2025**
