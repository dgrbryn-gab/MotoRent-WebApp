
  # MotoRent Dumaguete - Motorcycle Rental Web Application

A full-featured motorcycle rental platform built with React, TypeScript, Vite, and Supabase. Includes customer-facing booking system and comprehensive admin dashboard.

## 🚀 Features

### Customer Features
- 🏍️ Browse motorcycle inventory with search and filters
- 📅 Book motorcycles with date/time selection
- 💳 **Multiple payment methods (Card, GCash, Cash)** ⭐ ENHANCED
- 💰 **Secure payment processing with Stripe** ⭐ NEW
- 📧 **Email notifications for all key events** ⭐ NEW
- 👤 **Full profile management (edit, password, statistics, delete)** ⭐ NEW
- 📄 **Document upload with drag-and-drop** ⭐ NEW
- ⚙️ **Email notification preferences** ⭐ NEW
- 📊 **Real account statistics and verification status** ⭐ NEW
- 🔐 **Change password securely** ⭐ NEW
- 🧾 **Payment history and receipts** ⭐ NEW
- 🔔 Real-time in-app notifications

### Admin Features
- 📊 Dashboard with key metrics and analytics
- 🏍️ Fleet management (CRUD operations)
- 📋 Reservation approval workflow
- 💰 **Payment processing with Stripe integration** ⭐ ENHANCED
- 💳 **Process refunds (full and partial)** ⭐ NEW
- 📈 **Payment analytics and revenue tracking** ⭐ NEW
- 📄 **Document verification system with file upload** ⭐ NEW
- 📧 **Automated email notifications** ⭐ NEW
- 👥 User management
- 🗺️ GPS tracking for active rentals

## 🛠️ Tech Stack

- **Frontend**: React 18.3 + TypeScript
- **Build Tool**: Vite 6.3
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI + shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Realtime**: Supabase Realtime
- **Icons**: Lucide React
- **Forms**: React Hook Form
- **Notifications**: Sonner (toast)

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Supabase account (free tier works)

### Setup Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd MotoRent_webapp
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up Supabase**

   a. Create a new project at [supabase.com](https://supabase.com)
   
   b. Copy your project URL and anon key
   
   c. Create `.env` file in project root:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Run database migrations**
   - Open Supabase SQL Editor
   - Copy contents of `supabase/migrations/001_initial_schema.sql`
   - Paste and execute in SQL Editor
   - Verify tables created in Table Editor

5. **Start development server**
```bash
npm run dev
```

The app will open at `http://localhost:3000`

## 📁 Project Structure

```
MotoRent_webapp/
├── src/
│   ├── components/          # React components
│   │   ├── admin/          # Admin panel components
│   │   ├── ui/             # Reusable UI components (shadcn)
│   │   └── *.tsx           # Customer-facing components
│   ├── services/           # Supabase service layer
│   │   ├── userService.ts
│   │   ├── motorcycleService.ts
│   │   ├── reservationService.ts
│   │   └── ...
│   ├── lib/                # Library configuration
│   │   ├── supabase.ts     # Supabase client
│   │   └── database.types.ts # TypeScript types
│   ├── App.tsx             # Main app component
│   └── main.tsx            # Entry point
├── supabase/
│   └── migrations/         # Database migrations
├── .env.example            # Environment variables template
└── package.json
```

## 🗄️ Database Schema

The application uses 8 main tables with proper relationships:

- **users** - Customer accounts
- **admin_users** - Admin/super-admin accounts
- **motorcycles** - Fleet inventory
- **reservations** - Bookings with payment info
- **transactions** - Financial records
- **notifications** - User alerts
- **document_verifications** - ID verification
- **gps_tracking** - Real-time location data

See [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md) for detailed ER diagram and relationships.

## 📚 Documentation

- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Complete Supabase setup guide
- **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** - Step-by-step integration guide
- **[SUPABASE_REFERENCE.md](./SUPABASE_REFERENCE.md)** - Quick reference for services and queries
- **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** - Database structure and relationships
- **[AUTHENTICATION_INTEGRATION.md](./AUTHENTICATION_INTEGRATION.md)** - Real authentication setup ⭐
- **[DOCUMENT_UPLOAD_INTEGRATION.md](./DOCUMENT_UPLOAD_INTEGRATION.md)** - File upload system ⭐
- **[EMAIL_NOTIFICATIONS_INTEGRATION.md](./EMAIL_NOTIFICATIONS_INTEGRATION.md)** - Email notifications ⭐
- **[PROFILEPAGE_ENHANCEMENTS.md](./PROFILEPAGE_ENHANCEMENTS.md)** - Profile management ⭐
- **[PAYMENT_INTEGRATION.md](./PAYMENT_INTEGRATION.md)** - Stripe payment gateway ⭐ NEW
- **[ADMIN_GUIDE.md](./src/ADMIN_GUIDE.md)** - Admin panel user guide

## 🔑 Default Admin Credentials

After running migrations, use these credentials:

**Regular Admin:**
- Email: `admin@motorent.com`
- Password: (set in Supabase Auth)

**Super Admin:**
- Email: `superadmin@motorent.com`
- Password: (set in Supabase Auth)

## 🎨 Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🌐 Environment Variables

Required environment variables (create `.env` from `.env.example`):

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🚀 Deployment

### Build for production
```bash
npm run build
```

The build output will be in the `dist/` folder.

### Deploy to Vercel/Netlify
1. Connect your repository
2. Add environment variables
3. Set build command: `npm run build`
4. Set output directory: `dist`

## 🔐 Row Level Security (RLS)

The database implements RLS policies:
- Users can only view/modify their own data
- Motorcycles are publicly viewable
- Admin actions require elevated permissions

See [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md) for RLS configuration.

## 📱 Features Overview

### Customer Portal
- Landing page with featured motorcycles
- Motorcycle browsing and search
- Detailed motorcycle specifications
- Booking calendar with date/time selection
- Payment via Cash or GCash
- Reservation management
- Transaction history
- Profile settings
- Real-time booking notifications

### Admin Dashboard
- Overview statistics and metrics
- Motorcycle inventory management
- Reservation approval workflow
- Payment verification (Cash/GCash)
- Document verification system
- GPS tracking map view
- User management
- Notification system

## 🛡️ Security

- Environment variables for sensitive data
- Row Level Security on all tables
- Secure file uploads to Supabase Storage
- JWT-based authentication
- HTTPS-only in production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For issues or questions:
1. Check the documentation files
2. Review Supabase logs in dashboard
3. Check browser console for errors
4. Open an issue on GitHub

## 🎯 Roadmap

- [x] Real authentication with Supabase Auth ✅
- [x] Document upload with Supabase Storage ✅
- [x] Email notifications with Resend/SendGrid ✅
- [x] Enhanced profile management (edit, password, statistics, delete) ✅
- [x] Payment gateway integration with Stripe ✅
- [ ] SMS notifications via Twilio
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] Review and rating system
- [ ] Loyalty program
- [ ] Recurring payments / subscriptions

---

**Built with ❤️ for MotoRent Dumaguete**
  