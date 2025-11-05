// update-ticket.js — Airtable update + Gmail SMTP (nodemailer), Node 18 global fetch

const nodemailer = require('nodemailer');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const data = JSON.parse(event.body || "{}");
    const { airtableId, status, estimatedHours, actualHours, notes, ticketId, ticketFields } = data;
    if (!airtableId) return { statusCode: 400, body: JSON.stringify({ error: 'Airtable record ID is required' }) };

    const nowIso = new Date().toISOString();

    // ----- Airtable: update record -----
    const updateFields = { 'Status': status, 'Updated At': nowIso };
    if (estimatedHours !== undefined && estimatedHours !== null) updateFields['Estimated Hours'] = estimatedHours;
    if (actualHours !== undefined && actualHours !== null) updateFields['Actual Hours'] = actualHours;
    if (notes !== undefined && notes !== null) updateFields['Notes'] = notes;

    const atResp = await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Tickets/${airtableId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields: updateFields })
    });

    if (!atResp.ok) {
      const errBody = await atResp.text();
      console.error('Airtable error (update):', atResp.status, errBody);
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to update ticket in Airtable' }) };
    }

    // ----- Email body -----
    const body =
`Hello ${ticketFields['Requester Name']},

Your ticket #${ticketId} status has been updated to: ${status}

Department: ${ticketFields['Department']}
Request Type: ${ticketFields['Request Type']}
Urgency: ${ticketFields['Urgency']}
Deadline: ${ticketFields['Deadline']}

Description:
${ticketFields['Description']}

If you have any questions, please reply to this email.

Thank you,
Strauss America Analytics Team`;

    // ----- Gmail SMTP via nodemailer -----
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });

    const FROM = process.env.EMAIL_FROM || 'Strauss America Analytics Team <whinebrick@gmail.com>';
    const ADMIN = process.env.ADMIN_EMAIL || 'william.hinebrick@strauss.com';

    await transport.sendMail({
      from: FROM,
      to: ticketFields['Requester Email'],
      replyTo: ADMIN,
      subject: `Ticket Update - #${ticketId} - ${status}`,
      text: body
    });

    return { statusCode: 200, body: JSON.stringify({ success: true, message: 'Ticket updated successfully' }) };
  } catch (error) {
    console.error('update-ticket error:', error && (error.response?.body || error.message || error));
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to send email', message: error.message || String(error) }) };
  }
};
