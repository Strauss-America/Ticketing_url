# ⚡ QUICK START - 5 Minute Setup

Follow these steps IN ORDER. Don't skip any!

## ✅ STEP 1: Set Up Airtable (2 minutes)

1. Go to **airtable.com** → Sign up (free)
2. Create base → Name it "Strauss America Tickets"
3. Rename "Table 1" to "Tickets"
4. Add these 14 fields (click + button):
   - Ticket ID (text)
   - Requester Name (text)
   - Requester Email (email)
   - Department (text)
   - Request Type (single select: Data Analysis, Report Creation, Dashboard Update, Data Export, Other)
   - Urgency (single select: Low, Medium, High, Critical)
   - Status (single select: New, In Progress, Completed, Closed)
   - Deadline (date with time)
   - Description (long text)
   - Estimated Hours (number)
   - Actual Hours (number)
   - Notes (long text)
   - Created At (date with time)
   - Updated At (date with time)

5. Get API token: Profile → Developer hub → Create token
   - Name: "Netlify Ticketing"
   - Scopes: data.records:read, data.records:write, schema.bases:read
   - Add your base
   - **SAVE THE TOKEN!**

6. Get Base ID from URL (starts with `app`)
   - **SAVE THIS TOO!**

## ✅ STEP 2: Deploy to Netlify (2 minutes)

1. Go to **app.netlify.com** → Log in (free)
2. "Add new site" → "Deploy manually"
3. Drag the **strauss-ticketing-updated** folder
4. Wait 60 seconds
5. **SAVE YOUR SITE URL!**

## ✅ STEP 3: Add Environment Variables (1 minute)

IN NETLIFY:
1. Site configuration → Environment variables
2. Add these 3 variables:
   - `AIRTABLE_API_KEY` = [your token from Step 1]
   - `AIRTABLE_BASE_ID` = [your base ID from Step 1]
   - `ADMIN_EMAIL` = [your email]
3. Deploys → "Trigger deploy" → "Clear cache and deploy"
4. Wait 2 minutes

## ✅ STEP 4: Test It! (1 minute)

1. Visit your site URL
2. Submit a test ticket
3. Click "Admin Dashboard"
4. Password: `strauss2024`
5. See your ticket? **YOU'RE DONE!** 🎉

## 🎯 What You Just Fixed

**Before:** Tickets only visible on computer where submitted (localStorage)
**After:** ALL tickets visible to ALL admins from ANY device (Airtable)

## 🆘 Problems?

- **"Failed to submit"** → Check environment variables are set correctly
- **Tickets not showing** → Verify table name is exactly "Tickets"
- **Password wrong** → It's `strauss2024` (no spaces, lowercase)

## 📖 Need More Help?

Read the detailed guides:
- **VISUAL-GUIDE.md** - Complete walkthrough with explanations
- **SETUP-CHECKLIST.md** - Detailed checklist
- **README.md** - Full documentation

---

**That's it!** Share your site URL with Charlotte and your team.
