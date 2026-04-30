# SIRAJ – Step 3: Public Supplier Form + Response Submission

## ✅ Completed Components

### 1. API Route: `POST /api/responses`

**Location:** `app/api/responses/route.ts`

**Functionality:**
- Validates token from request body
- Finds matching record in `rfq_invites`
- Checks for duplicate submission (returns error if `responded = true`)
- Validates price and delivery_days (positive numbers)
- Creates response in `responses` table with:
  - invite_id (links to the invitation)
  - rfq_id (links to the RFQ)
  - supplier_email (from invite)
  - price, delivery_days, answers (JSON)
- Updates `rfq_invites.responded = true` and sets `responded_at`
- Returns response_id and success message

**Request Format:**
```json
{
  "token": "uuid",
  "supplier_name": "Acme Inc",
  "price": "1500.00",
  "delivery_days": "14",
  "answers": {
    "notes": "Optional delivery notes..."
  }
}
```

**Response Format:**
```json
{
  "success": true,
  "response_id": "uuid",
  "message": "Response submitted successfully"
}
```

**Error Handling:**
- 400: Missing/invalid token, already responded, invalid price/delivery
- 401: Invalid or expired token
- 500: Server error

### 2. Page: `/form/[rfq_id]?token=...`

**Location:** `app/form/[rfq_id]/page.tsx`

**Purpose:**
- Server-rendered page for public supplier access
- No authentication required
- Token is the only access control

**Logic:**
1. Validates token presence in query string
2. Queries `rfq_invites` for matching token + rfq_id
3. Checks if response already submitted (prevents duplicate)
4. Fetches RFQ details from `rfqs` table
5. Renders form with RFQ context or error

**Error Scenarios:**
- Missing token → "Missing access token" error
- Invalid token → "Invalid or expired token" error
- Already responded → "Response already submitted" error
- RFQ not found → "Request not found" error

### 3. Components

#### `SupplierResponseForm.tsx`
- Uncontrolled form for price, delivery, notes
- Validates inputs before submission
- Shows loading state during submission
- Displays success confirmation with auto-redirect
- Field validation:
  - Price: required, must be > 0
  - Delivery Days: required, must be > 0
  - Supplier Name: optional (falls back to email)
  - Notes: optional

#### `InvalidTokenError.tsx`
- Reusable error display for invalid access
- Shows reason for access denial
- Button to return home
- Red theme for visual error indication

#### `SupplierFormPageClient.tsx`
- Client wrapper for the form page
- Handles submission state
- Routes between form and success states
- Passes token to form component

## 🔐 Security

✅ **Token-based Access** - Only valid tokens grant access  
✅ **Duplicate Prevention** - One response per invitation  
✅ **No Authentication** - Suppliers don't need accounts  
✅ **Token Validation** - Checked on both backend and page load  
✅ **Data Validation** - All inputs validated server-side  
✅ **Email Privacy** - Supplier email stored, not exposed to public  

## 🎨 UI/UX

- Clean, minimal interface following `ui_system.md`
- Dark theme with professional styling
- Shows RFQ title and ID for context
- Clear form labels with helpful descriptions
- Error messages guide users
- Success confirmation with visual feedback
- Responsive design

## 📋 Form Fields

1. **RFQ Title** (read-only) - Shows what they're quoting on
2. **Supplier Name** (optional) - Company name or uses email
3. **Price** (required) - Quoted price with $ indicator
4. **Delivery Days** (required) - Timeline in days
5. **Notes** (optional) - Additional terms/conditions

## 🔄 Data Flow

```
Supplier receives link: /form/[rfq_id]?token=[token]
    ↓
Page validates token against rfq_invites
    ↓
If valid: Load RFQ details and render form
If invalid: Show error and block access
    ↓
Supplier fills form and clicks "Submit Response"
    ↓
POST /api/responses with token + form data
    ↓
API validates token again
    ↓
Create response record + update rfq_invites.responded = true
    ↓
Show success confirmation
    ↓
Page auto-redirects after 2 seconds
```

## 📝 Database Operations

### Insert Response
- Table: `responses`
- Uses: invite_id (FK), rfq_id (FK), supplier_email
- Unique constraint: one response per invite

### Update Invite
- Table: `rfq_invites`
- Sets: responded = true, responded_at = now()
- Purpose: Prevent duplicate submissions

## ✅ Features Implemented

✅ Token validation (two-stage: page load + API)  
✅ Duplicate submission prevention  
✅ Comprehensive error messages  
✅ Form validation (client + server)  
✅ No authentication required  
✅ RFQ context display  
✅ Success confirmation  
✅ Auto-redirect after submission  
✅ Optional company name (defaults to email)  
✅ Notes/additional comments field  
✅ Clean, accessible form UI  

## 🚀 Next Steps (Step 4)

According to execution_plan.md:
- **RFQ Detail Page** - Show invites and responses
- **Response comparison** - Side-by-side supplier responses
- **Basic dashboard** - Recent RFQs, responses

## 📝 Code Quality

✅ TypeScript for type safety  
✅ Server/client separation (async page + client component)  
✅ Proper error handling and logging  
✅ Input validation on both sides  
✅ RESTful API design  
✅ Clean component composition  
✅ Follows shadcn/ui patterns  
✅ Production-ready code  

## 🧪 Testing Scenarios

1. Valid token + new response → Success
2. Invalid token → Error page
3. Valid token but already responded → Error
4. Missing token → Error
5. Invalid price/delivery → Form error
6. RFQ not found → Error page
