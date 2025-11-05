# 🎯 Strauss Ticketing System - Complete Setup Guide

## Overview

This guide will walk you through fixing your ticketing system so that ALL tickets are visible to ALL admins, no matter which computer they use.

**Time Required:** 15-20 minutes  
**Difficulty:** Easy  
**Cost:** $0 (using free tiers)

---

## 📦 What You're Getting

Your download includes:

```
strauss-ticketing-updated/
├── index.html                    ← Your new ticketing webpage
├── netlify.toml                  ← Netlify configuration
├── package.json                  ← Dependencies
├── .env.example                  ← Environment variables template
├── README.md                     ← Detailed documentation
├── SETUP-CHECKLIST.md           ← Quick checklist
└── netlify/functions/           ← Backend code (3 files)
    ├── submit-ticket.js
    ├── get-tickets.js
    └── update-ticket.js
```

---

## 🚀 PHASE 1: Set Up Airtable Database (5 minutes)

### Why Airtable?
Airtable will store ALL your tickets in one centralized place. Think of it like a smart spreadsheet that everyone can access.

### Step 1.1: Create Your Airtable Account

1. Go to **https://airtable.com**
2. Click **"Sign up for free"**
3. Use your Strauss email
4. Verify your email

### Step 1.2: Create Your Base

1. Once logged in, click **"Create a base"** or **"Start from scratch"**
2. Name it: **Strauss America Tickets**
3. Click to create

### Step 1.3: Set Up Your Table

You'll see a table called "Table 1" - let's set it up:

1. **Rename the table:**
   - Click on "Table 1" at the top
   - Rename to: **Tickets**

2. **Delete the default fields:**
   - You'll see fields like "Name", "Notes", etc.
   - Click the dropdown arrow next to each field → Delete

3. **Add these fields exactly** (click the + button to add each):

| Field Name | Field Type | Settings |
|------------|------------|----------|
| Ticket ID | Single line text | - |
| Requester Name | Single line text | - |
| Requester Email | Email | - |
| Department | Single line text | - |
| Request Type | Single select | Add options: Data Analysis, Report Creation, Dashboard Update, Data Export, Other |
| Urgency | Single select | Add options: Low, Medium, High, Critical |
| Status | Single select | Add options: New, In Progress, Completed, Closed |
| Deadline | Date | Check "Include time" |
| Description | Long text | - |
| Estimated Hours | Number | Precision: Integer or Decimal |
| Actual Hours | Number | Precision: Integer or Decimal |
| Notes | Long text | - |
| Created At | Date | Check "Include time" |
| Updated At | Date | Check "Include time" |

**IMPORTANT:** The field names must match EXACTLY (including capitals and spaces)

### Step 1.4: Get Your API Token

1. Click your **profile picture** (top right corner)
2. Select **"Developer hub"**
3. Click **"Create token"**
4. Name it: **Netlify Ticketing System**
5. Under **"Add scopes"**, check these boxes:
   - ✅ `data.records:read`
   - ✅ `data.records:write`
   - ✅ `schema.bases:read`
6. Under **"Add bases"**, click **"Add a base"**
7. Select your **"Strauss America Tickets"** base
8. Click **"Create token"**
9. **COPY THE TOKEN** and save it somewhere safe (you'll need it soon)
   - It looks like: `patAbCdEfGhIjKlMnOpQrStUvWxYz.1234567890abcdef`

### Step 1.5: Get Your Base ID

1. Go back to your Airtable base (click "Strauss America Tickets" at top)
2. Look at the URL in your browser - it should look like:
   ```
   https://airtable.com/appXa1b2c3d4e5f6g7/tblXXXXXXXXXXX/...
   ```
3. Copy the part that starts with **`app`** (e.g., `appXa1b2c3d4e5f6g7`)
4. **SAVE THIS** - you'll need it in Phase 2

**✅ Phase 1 Complete!** You now have:
- ✅ Airtable account
- ✅ Database table set up
- ✅ API token
- ✅ Base ID

---

## 🌐 PHASE 2: Deploy to Netlify (5 minutes)

### Why Netlify?
Netlify will host your ticketing website for free and handle all the backend functions.

### Step 2.1: Extract Your Files

1. Download the `strauss-ticketing-updated.zip` file
2. Extract it to your computer
3. You should see a folder called `strauss-ticketing-updated`

### Step 2.2: Deploy to Netlify

**Option A: Drag & Drop (Easiest)**

1. Go to **https://app.netlify.com**
2. Log in (or create free account with your Strauss email)
3. Click **"Add new site"** → **"Deploy manually"**
4. Drag the entire `strauss-ticketing-updated` folder onto the upload area
5. Wait 30-60 seconds for deployment
6. You'll see a random URL like: `https://sparkly-unicorn-123456.netlify.app`
7. **Copy and save this URL**

**Option B: GitHub (Better for future updates)**

1. Create a GitHub account if you don't have one
2. Create a new repository
3. Upload all files from `strauss-ticketing-updated` folder
4. In Netlify, click **"Add new site"** → **"Import from Git"**
5. Connect your GitHub account
6. Select your repository
7. Click **"Deploy site"**

### Step 2.3: Configure Environment Variables

This is THE MOST IMPORTANT STEP - without this, nothing will work!

1. In Netlify, click on your site
2. Go to **"Site configuration"** (in the left menu)
3. Click **"Environment variables"**
4. Click **"Add a variable"** and add these THREE variables:

**Variable 1:**
- Key: `AIRTABLE_API_KEY`
- Value: [Paste your API token from Phase 1, Step 1.4]
- Click "Create variable"

**Variable 2:**
- Key: `AIRTABLE_BASE_ID`
- Value: [Paste your Base ID from Phase 1, Step 1.5]
- Click "Create variable"

**Variable 3:**
- Key: `ADMIN_EMAIL`
- Value: [Your email address for notifications]
- Click "Create variable"

### Step 2.4: Redeploy with New Variables

1. Go to **"Deploys"** tab (in the left menu)
2. Click **"Trigger deploy"** → **"Clear cache and deploy site"**
3. Wait 1-2 minutes for redeployment
4. Once complete, your site is LIVE and READY!

**✅ Phase 2 Complete!** Your ticketing system is now live!

---

## ✅ PHASE 3: Test Everything (5 minutes)

### Step 3.1: Test Ticket Submission

1. Go to your Netlify site URL
2. You should see the "Submit a Data Request" form
3. Fill out a test ticket:
   - Your Name: **Test User**
   - Your Email: **test@strauss.com**
   - Department: **Analytics**
   - Request Type: **Data Analysis**
   - Urgency: **Low**
   - Description: **This is a test to verify the system works**
4. Click **"Submit Request"**
5. You should see a green success message

### Step 3.2: Verify in Airtable

1. Open your Airtable base in a new tab
2. You should see your test ticket appear immediately!
3. This proves the submission is working ✅

### Step 3.3: Test Admin Dashboard

1. Go back to your ticketing site
2. Click **"Admin Dashboard"** button
3. Enter password: **strauss2024**
4. You should see:
   - Total Tickets: 1
   - New Tickets: 1
   - Your test ticket in the table

### Step 3.4: Test Updating a Ticket

1. Click on your test ticket in the dashboard
2. A modal should pop up with details
3. Change Status to: **In Progress**
4. Set Estimated Hours: **2**
5. Add Notes: **Testing the update functionality**
6. Click **"Update Ticket"**
7. You should see "Ticket updated successfully!"
8. Refresh your Airtable tab - changes should be there!

### Step 3.5: Test Charlotte's Ticket

Now, ask Charlotte to resubmit her original ticket:
- Her name, email, department
- Request Type: Report Creation
- Urgency: Medium
- Deadline: 2025-11-19
- Description: Her original request about Equip Sales report

Once she submits:
1. You should see it appear in the admin dashboard
2. It will also be in Airtable
3. You can update it from any computer

**✅ Phase 3 Complete!** Everything is working!

---

## 🎨 PHASE 4: Customize (Optional)

### Change the Admin Password

1. Download your `index.html` file from Netlify or open it locally
2. Find line 597 (Ctrl+F and search for "ADMIN_PASSWORD")
3. Change `'strauss2024'` to your desired password
4. Save the file
5. Re-upload to Netlify (drag & drop or push to GitHub)

### Update Admin Email for Notifications

1. In Netlify → Site configuration → Environment variables
2. Update `ADMIN_EMAIL` to your preferred email
3. Redeploy the site

---

## 🎓 How to Use Going Forward

### For Regular Users:
1. Go to the site URL
2. Click "New Request"
3. Fill out the form
4. Submit
5. Done! They'll see a success message

### For Admins:
1. Go to the site URL
2. Click "Admin Dashboard"
3. Enter password
4. View all tickets
5. Click any ticket to update status, add notes, etc.
6. Use filters to find specific tickets
7. Export to CSV when needed

### Managing in Airtable:
- You can also view/edit tickets directly in Airtable
- Create custom views (e.g., "High Priority", "This Week")
- Set up automations (notify team members)
- Generate reports

---

## 🆘 Troubleshooting

### Problem: "Failed to submit ticket"

**Solution:**
1. Check environment variables are set correctly in Netlify
2. Verify Base ID starts with `app`
3. Check Netlify function logs: Site → Functions → View logs

### Problem: Tickets not appearing in dashboard

**Solution:**
1. Check that Airtable table is named exactly "Tickets"
2. Verify all field names match exactly
3. Check API token has correct permissions
4. Clear browser cache and reload

### Problem: Admin password not working

**Solution:**
1. Password is case-sensitive: `strauss2024`
2. Make sure there are no spaces
3. Check if you changed it in the code

### Problem: Updates not saving

**Solution:**
1. Check Netlify function logs
2. Verify API token has `data.records:write` permission
3. Try redeploying the site

---

## 📊 Understanding the System

### How It Works:

```
User submits form
      ↓
Netlify Function processes it
      ↓
Saves to Airtable
      ↓
All admins can see it (because it's in Airtable, not browser)
```

### What's Different from Before:

**OLD SYSTEM:**
- Stored tickets in browser localStorage
- Only visible on that specific computer
- No central database

**NEW SYSTEM:**
- Stores tickets in Airtable (cloud database)
- Visible from ANY computer
- Everyone sees the same data

---

## 🎉 You're Done!

You now have a fully functional, centralized ticketing system where:

✅ All tickets are stored in one place (Airtable)
✅ All admins can see all tickets
✅ Updates sync in real-time
✅ Works from any device
✅ Free to host and use

**Next Steps:**
1. Share the site URL with your team
2. Update Charlotte that she can resubmit her ticket
3. Bookmark the admin dashboard
4. Consider setting up email notifications (see README.md)

**Questions?** Check the README.md file for more details.

---

**Need Help?** 
- Check Netlify function logs
- Verify Airtable setup
- Review environment variables
- Check browser console (F12)
