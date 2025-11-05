// submit-ticket.js — Airtable create + Gmail SMTP (nodemailer), Node 18 global fetch

const nodemailer = require('nodemailer');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const data = JSON.parse(event.body || "{}");

    // Generate ID/timestamps
    const ticketId = data.id || Date.now().toString();
    const nowIso = new Date().toISOString();

    // ----- Airtable: create record -----
    const fields = {
      'Ticket ID': ticketId,
      'Requester Name': data.requesterName,
      'Requester Email': data.requesterEmail,
      'Department': data.department,
      'Request Type': data.requestType,   // must match existing single-select options
      'Urgency': data.urgency,            // must match existing single-select options
      'Status': 'New',
      'Description': data.description,
      'Created At': nowIso,
      'Updated At': nowIso
    };
    if (data.deadline) fields['Deadline'] = data.deadline;

    const atResp = await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Tickets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields })
    });

    if (!atResp.ok) {
      const errBody = await atResp.text();
      console.error('Airtable error (create):', atResp.status, errBody);
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to save ticket to Airtable' }) };
    }

    // ----- Email bodies -----
    const adminBody =
`A new data request ticket has been submitted:

Ticket #: ${ticketId}
Requester: ${data.requesterName} (${data.requesterEmail})
Department: ${data.department}
Request Type: ${data.requestType}
Urgency: ${data.urgency}
Deadline: ${data.deadline || 'No deadline specified'}

Description:
${data.description}

Created: ${nowIso}
`;

    const requesterBody =
`Hi ${data.requesterName},

Your data request ticket has been submitted successfully!

Ticket #: ${ticketId}
Request Type: ${data.requestType}
Urgency: ${data.urgency}
Deadline: ${data.deadline || 'No deadline specified'}

Description:
${data.description}

We'll review your request and get back to you soon. You can reference ticket #${ticketId} if you need to follow up.

Thank you,
Strauss America Analytics Team
`;

    // ----- Gmail SMTP via nodemailer -----
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,               // smtp.gmail.com
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,                              // STARTTLS on 587
      auth: {
        user: process.env.SMTP_USER,             // your Gmail address
        pass: process.env.SMTP_PASSWORD          // Gmail App Password (not your normal password)
      }
    });

    const FROM = process.env.EMAIL_FROM || 'Strauss America Analytics Team <whinebrick@gmail.com>';
    const ADMIN = process.env.ADMIN_EMAIL || 'william.hinebrick@strauss.com';

    // Admin notice
    await transport.sendMail({
      from: FROM,
      to: ADMIN,
      replyTo: data.requesterEmail,
      subject: `New Data Request - Ticket #${ticketId}`,
      text: adminBody
    });

    // Requester confirmation
    await transport.sendMail({
      from: FROM,
      to: data.requesterEmail,
      replyTo: ADMIN,
      subject: `Your Data Request Ticket #${ticketId}`,
      text: requesterBody
    });

    return { statusCode: 200, body: JSON.stringify({ success: true, ticketId, message: 'Ticket submitted successfully' }) };
  } catch (error) {
    console.error('submit-ticket error:', error && (error.response?.body || error.message || error));
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to submit ticket', message: error.message || String(error) }) };
  }
};
