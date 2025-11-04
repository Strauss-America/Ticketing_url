# Quick Setup Checklist ✓

Use this checklist to ensure you complete all steps correctly.

## Phase 1: Airtable Setup ☐

- [ ] Create Airtable account at https://airtable.com
- [ ] Create new base named "Strauss America Tickets"
- [ ] Rename table to "Tickets"
- [ ] Add all required fields:
  - [ ] Ticket ID (Single line text)
  - [ ] Requester Name (Single line text)
  - [ ] Requester Email (Email)
  - [ ] Department (Single line text)
  - [ ] Request Type (Single select: Data Analysis, Report Creation, Dashboard Update, Data Export, Other)
  - [ ] Urgency (Single select: Low, Medium, High, Critical)
  - [ ] Status (Single select: New, In Progress, Completed, Closed)
  - [ ] Deadline (Date with time)
  - [ ] Description (Long text)
  - [ ] Estimated Hours (Number)
  - [ ] Actual Hours (Number)
  - [ ] Notes (Long text)
  - [ ] Created At (Date with time)
  - [ ] Updated At (Date with time)
- [ ] Create API token in Developer Hub
- [ ] Grant token these scopes:
  - [ ] data.records:read
  - [ ] data.records:write
  - [ ] schema.bases:read
- [ ] Give token access to your base
- [ ] Copy and save API token: `_________________________`
- [ ] Copy and save Base ID: `_________________________`

## Phase 2: Netlify Deployment ☐

- [ ] Log in to Netlify at https://app.netlify.com
- [ ] Deploy site (choose one method):
  - [ ] **Option A:** Drag & drop the `strauss-ticketing-updated` folder
  - [ ] **Option B:** Connect GitHub repository
- [ ] Wait for initial deployment to complete
- [ ] Note your site URL: `_________________________`

## Phase 3: Configure Environment Variables ☐

- [ ] Go to Site configuration → Environment variables
- [ ] Add `AIRTABLE_API_KEY` with your token value
- [ ] Add `AIRTABLE_BASE_ID` with your base ID
- [ ] Add `ADMIN_EMAIL` with your email
- [ ] Click "Save"
- [ ] Go to Deploys tab
- [ ] Click "Trigger deploy" → "Clear cache and deploy site"
- [ ] Wait for redeployment (1-2 minutes)

## Phase 4: Testing ☐

- [ ] Visit your site URL
- [ ] Submit a test ticket with these details:
  - Name: Test User
  - Email: test@strauss.com
  - Department: Analytics
  - Type: Data Analysis
  - Urgency: Low
  - Description: This is a test ticket
- [ ] Verify success message appears
- [ ] Click "Admin Dashboard" button
- [ ] Enter password: `strauss2024`
- [ ] Verify test ticket appears in dashboard
- [ ] Open Airtable and verify ticket is there
- [ ] Click on ticket in dashboard
- [ ] Change status to "In Progress"
- [ ] Add estimated hours: 2
- [ ] Add notes: "Working on this"
- [ ] Click "Update Ticket"
- [ ] Verify update succeeded
- [ ] Refresh Airtable to see changes

## Phase 5: Customize (Optional) ☐

- [ ] Change admin password in `index.html` line 597
- [ ] Update logo/branding if desired
- [ ] Set up SendGrid for email notifications (optional)
- [ ] Update Charlotte that she can resubmit her ticket

## Troubleshooting ☐

If something doesn't work:

- [ ] Check all environment variables are spelled correctly
- [ ] Verify Airtable field names match exactly (case-sensitive)
- [ ] Check Netlify function logs: Site → Functions → View logs
- [ ] Check browser console (press F12) for errors
- [ ] Verify Airtable table is named "Tickets" exactly
- [ ] Try clearing browser cache and reloading

## Success Criteria ✓

You're done when:

- [x] You can submit a ticket from the public form
- [x] Tickets appear in Airtable immediately
- [x] You can log into admin dashboard
- [x] All tickets are visible in the dashboard
- [x] You can update ticket status and it saves
- [x] Updates appear in both the dashboard and Airtable

---

**Estimated Total Time:** 15-20 minutes

**Need Help?** Check the full README.md file for detailed troubleshooting.
