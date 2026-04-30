# 🚀 SIRAJ – RUN THESE COMMANDS (Copy & Paste)

## ⚡ Quick Start (5 minutes)

### Windows
```powershell
# 1. Install dependencies
npm install

# 2. Copy environment template
copy .env.example .env.local

# 3. (Optional) Open and edit .env.local with your Supabase credentials
# NEXT_PUBLIC_SUPABASE_URL=
# NEXT_PUBLIC_SUPABASE_ANON_KEY=
# SUPABASE_SERVICE_ROLE_KEY=
# NEXT_PUBLIC_BASE_URL=http://localhost:3000

# 4. Initialize shadcn/ui
npx shadcn-ui@latest init

# 5. Add shadcn/ui components
npx shadcn-ui@latest add button input label textarea select card table badge dialog

# 6. Start development server
npm run dev
```

### Linux/Mac
```bash
# 1. Install dependencies
npm install

# 2. Copy environment template
cp .env.example .env.local

# 3. (Optional) Edit .env.local with your Supabase credentials
# nano .env.local
# or
# vim .env.local

# 4. Initialize shadcn/ui
npx shadcn-ui@latest init

# 5. Add shadcn/ui components
npx shadcn-ui@latest add button input label textarea select card table badge dialog

# 6. Start development server
npm run dev
```

---

## ✅ What Each Command Does

| Command | Purpose |
|---------|---------|
| `npm install` | Installs all dependencies from package.json |
| `copy/cp .env.example .env.local` | Creates environment config file |
| `npx shadcn-ui@latest init` | Initializes shadcn/ui component library |
| `npx shadcn-ui@latest add [components]` | Installs shadcn/ui components |
| `npm run dev` | Starts development server at http://localhost:3000 |

---

## 🔧 Before You Start

### 1. Supabase Setup
- Create account at https://supabase.com
- Create new project
- Get these from your project settings:
  - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
  - Anon Key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Service Role Key → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Database Schema
In Supabase SQL Editor, run:
```sql
-- Copy content from migrations/001_initial_schema.sql
```

### 3. Environment File (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## 🎯 What Happens When You Run Commands

### npm install
```
✅ Creates node_modules/
✅ Installs Next.js 14
✅ Installs React 18
✅ Installs Tailwind CSS
✅ Installs Supabase client
✅ Installs all dependencies
```

### npx shadcn-ui@latest init
```
✅ Creates components/ui/ directory
✅ Creates lib/utils.ts
✅ Configures tailwind paths
✅ Sets up component library
```

### npx shadcn-ui@latest add [components]
```
✅ Creates components/ui/button.tsx
✅ Creates components/ui/input.tsx
✅ Creates components/ui/label.tsx
✅ Creates components/ui/textarea.tsx
✅ Creates components/ui/select.tsx
✅ Creates components/ui/card.tsx
✅ Creates components/ui/table.tsx
✅ Creates components/ui/badge.tsx
✅ Creates components/ui/dialog.tsx
```

### npm run dev
```
✅ Starts Next.js dev server
✅ Compiles TypeScript
✅ Starts watching for changes
✅ Opens at http://localhost:3000
```

---

## 📝 Project URLs After Running

Once `npm run dev` is running:

- **Home Page** → http://localhost:3000
- **Create RFQ** → http://localhost:3000/rfqs/new
- **View RFQs** → http://localhost:3000/rfqs
- **RFQ Detail** → http://localhost:3000/rfqs/[id]
- **Supplier Form** → http://localhost:3000/form/[rfq_id]?token=[token]

---

## 🧪 Test the Flow

### 1. Create an RFQ
- Go to http://localhost:3000/rfqs/new
- Fill in title and add suppliers
- Click "Create RFQ"
- Copy generated supplier link

### 2. Submit a Response
- Open supplier link in new tab/window
- Fill in price, delivery days, notes
- Click "Submit Response"

### 3. View RFQ
- Go to http://localhost:3000/rfqs/[id]
- See all invites and responses
- View comparison table

---

## 🔄 Available npm Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## 📂 File Structure After Setup

```
node_modules/                    (created by npm install)
├── next/
├── react/
├── tailwindcss/
├── @supabase/
└── ... (all dependencies)

components/ui/                   (created by shadcn-ui)
├── button.tsx
├── input.tsx
├── label.tsx
├── textarea.tsx
├── select.tsx
├── card.tsx
├── table.tsx
├── badge.tsx
├── dialog.tsx
└── ... (more shadcn components)

lib/
└── utils.ts                     (created by shadcn-ui)

.env.local                       (created by copy command)
```

---

## ⚠️ Common Issues & Fixes

### Issue: "npm: command not found"
→ Install Node.js from nodejs.org

### Issue: ".env.local not found"
→ Run: `copy .env.example .env.local` (Windows) or `cp .env.example .env.local` (Mac/Linux)

### Issue: "Cannot find module @/components/ui/button"
→ Run: `npx shadcn-ui@latest add button input label textarea select card table badge dialog`

### Issue: "Supabase connection error"
→ Check .env.local has correct credentials

### Issue: Port 3000 already in use
→ Run: `npm run dev -- -p 3001` (or another port)

---

## 🎉 Success Indicators

After running all commands, you should see:

✅ npm install finishes without errors
✅ .env.local file created
✅ shadcn-ui components installed
✅ Development server starts at http://localhost:3000
✅ Page loads with "Welcome to SIRAJ"
✅ Can navigate to /rfqs/new
✅ Can create new RFQ

---

## 📞 Need Help?

1. Check **README.md** for overview
2. Read **SETUP_GUIDE.md** for detailed steps
3. Review **PROJECT_SETUP_CHECKLIST.md** for verification
4. See **PROJECT_READY.md** for complete status

---

## 🚀 You're Ready!

That's it! The project will be running at **http://localhost:3000**

Have fun building with SIRAJ! 🎉
