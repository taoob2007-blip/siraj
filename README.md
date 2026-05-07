# SIRAJ – Next.js RFQ Platform

A modern, open-source platform for managing Request for Quotation (RFQ) processes.

## 🎯 What is SIRAJ?

SIRAJ transforms how companies handle supplier quotations:

- **Create RFQs** with structured requests
- **Send invitations** to multiple suppliers with unique tokens
- **Collect responses** via public forms (no authentication needed)
- **Compare quotations** side-by-side with smart highlights
- **Make decisions** based on price, delivery, and terms

## ✨ Features

- ✅ **No-Auth Supplier Forms** - Share a link, suppliers respond immediately
- ✅ **Automatic Highlights** - Best price and fastest delivery highlighted
- ✅ **Duplicate Prevention** - One response per supplier per RFQ
- ✅ **Token-Based Access** - Secure, unique links for each supplier
- ✅ **Minimal UI** - Clean, dark theme following modern design
- ✅ **Production Ready** - TypeScript, validated code, error handling

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. **Clone and install**
   ```bash
   npm install
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env.local
   # Fill in your Supabase credentials
   ```

3. **Initialize shadcn/ui**
   ```bash
   npx shadcn-ui@latest init
   npx shadcn-ui@latest add button input label textarea select card table badge dialog
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open browser**
   ```
   http://localhost:3000
   ```

## 📖 Architecture

### Database Schema

**rfqs** - User-created quotation requests
**suppliers** - Supplier contact records
**rfq_invites** - Invitation records with unique tokens
**responses** - Supplier quotations with pricing

See `migrations/001_initial_schema.sql` for full schema.

### API Routes

- `POST /api/rfqs` - Create RFQ and send invites
- `POST /api/responses` - Supplier submits quotation
- `GET /form/[rfq_id]` - Public supplier form page
- `GET /rfqs/[id]` - RFQ detail page (buyer view)

### Pages

- `/` - Home page
- `/rfqs/new` - Create new RFQ
- `/rfqs/[id]` - View RFQ with responses
- `/form/[rfq_id]?token=...` - Public supplier form

## 📁 Project Structure

```
app/                  Next.js app directory
├── api/              API routes
├── rfqs/             Buyer pages
├── form/             Public supplier form
├── layout.tsx        Root layout
├── globals.css       Global styles
└── page.tsx          Home page

components/          React components
├── RFQCreateForm.tsx
├── SupplierSelector.tsx
├── ResponseTable.tsx
├── InviteList.tsx
└── ui/              shadcn/ui components

lib/                 Utilities
├── supabase/        Supabase clients
├── types.ts         TypeScript interfaces
└── constants.ts     Configuration

migrations/          Database
└── 001_initial_schema.sql
```

## 🔧 Configuration

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Tailwind CSS

Configured with dark theme and blue accents. Scans:
- `app/` directory
- `components/` directory

## 🔐 Security

- **Token-based access** for public forms
- **Row Level Security (RLS)** on database
- **Server-side validation** for all inputs
- **User isolation** via user_id foreign keys
- **HTTPS required** for production

## 📚 Documentation

- `SETUP_GUIDE.md` - Detailed setup instructions
- `STEP_2_IMPLEMENTATION.md` - RFQ creation system
- `STEP_3_IMPLEMENTATION.md` - Supplier form
- `STEP_4_IMPLEMENTATION.md` - RFQ detail view
- `project_specs.md` - Product requirements
- `api_contract.md` - API specifications
- `ui_system.md` - UI guidelines

## 🧪 Testing

### Test RFQ Creation Flow
1. Navigate to `/rfqs/new`
2. Create RFQ with title and suppliers
3. Copy generated supplier links

### Test Supplier Submission
1. Open supplier link in new tab
2. Fill quotation (price, delivery, notes)
3. Submit response

### Test RFQ Comparison
1. Go to `/rfqs/[id]`
2. View all responses
3. See price and delivery highlights

## 🚀 Deployment

### Build
```bash
npm run build
```

### Start
```bash
npm run start
```

### Deploy to Vercel

1. Push to GitHub
2. Import to Vercel
3. Set environment variables
4. Deploy

## 📦 Tech Stack

- **Framework** - Next.js 14 (App Router)
- **Language** - TypeScript
- **Styling** - Tailwind CSS
- **Components** - shadcn/ui
- **Database** - Supabase (PostgreSQL)
- **Icons** - Lucide React
- **Validation** - Zod

## 📝 License

MIT

## 👥 Contributing

Contributions welcome! Please follow the existing code style and add tests.

## 🆘 Support

- Check `SETUP_GUIDE.md` for common issues
- Review database schema in `migrations/`
- See implementation docs for feature details

---

**Made with ❤️ for better quotation management**


for test12341