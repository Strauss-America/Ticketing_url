// Marker so we can see this in Netlify function logs
console.log('submit-ticket USING SENDGRID', {
  commit: process.env.COMMIT_REF || 'no-commit-ref',
  from: process.env.SENDGRID_FROM || 'unset'
});

const sgMail = require('@sendgrid/mail');
const fetch = require('node-fetch'); // only needed if you write to Airtable here

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const ticket = JSON.parse(event.body);

    // ---- ENV REQUIRED ----
    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    const SENDGRID_FROM    = process.env.SENDGRID_FROM || 'william.hinebrick@strauss.com';
    const ADMIN_EMAIL      = process.env.ADMIN_EMAIL   || 'william.hinebrick@strauss.com';

    if (!SENDGRID_API_KEY) throw new Error('Missing SENDGRID_API_KEY');
    sgMail.setApiKey(SENDGRID_API_KEY);

    // (Optional) normalize single-selects to Airtable labels
    const TYPE_MAP = { 'Report': 'Report Creation' };
    ticket.requestType = TYPE_MAP[ticket.requestType] || ticket.requestType;

    // ---- if you also save to Airtable here, do it and throw on error with body for debugging ----
    // (Example pattern)
    // const r = await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Tickets`, {
    //   method: 'POST',
    //   headers: { 'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ fields: { /* ... */ } })
    // });
    // if (!r.ok) { const t = await r.text(); console.error('Airtable error:', r.status, t); throw new Error('Failed to save ticket to Airtable'); }

    const adminEmailBody = `A new data request ticket has been submitted:

Ticket #: ${ticket.id}
Requester: ${ticket.requesterName} (${ticket.requesterEmail})
Department: ${ticket.department}
Request Type: ${ticket.requestType}
Urgency: ${ticket.urgency}
Deadline: ${ticket.deadline}

Description:
${ticket.description}

Created: ${ticket.createdAt}
`;

    const requesterEmailBody = `Hi ${ticket.requesterName},

Your data request ticket has been submitted successfully!

Ticket #: ${ticket.id}
Request Type: ${ticket.requestType}
Urgency: ${ticket.urgency}
Deadline: ${ticket.deadline}

Description:
${ticket.description}

Thank you,
Strauss America Analytics Team
`;

    // Send admin
    const adminMsg = {
      to: ADMIN_EMAIL,
      from: { email: SENDGRID_FROM, name: 'Strauss Analytics Ticketing' },
      replyTo: ticket.requesterEmail,
      subject: `[BY-NETLIFY] New Data Request - Ticket #${ticket.id}`,
      text: adminEmailBody
    };
    try {
      const [resp] = await sgMail.send(adminMsg);
      console.log('SG admin status', resp && resp.statusCode);
    } catch (e) {
      console.error('SG admin send error:', e.response?.body || e);
      throw e;
    }

    // Send requester
    const requesterMsg = {
      to: ticket.requesterEmail,
      from: { email: SENDGRID_FROM, name: 'Strauss Analytics Ticketing' },
      subject: `[BY-NETLIFY] Ticket Confirmation - #${ticket.id}`,
      text: requesterEmailBody
    };
    try {
      const [resp2] = await sgMail.send(requesterMsg);
      console.log('SG requester status', resp2 && resp2.statusCode);
    } catch (e) {
      console.error('SG requester send error:', e.response?.body || e);
      throw e;
    }

    return { statusCode: 200, body: JSON.stringify({ success: true, ticketId: ticket.id, message: 'Ticket submitted successfully' }) };

  } catch (error) {
    console.error('Handler error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to submit ticket', details: error.message }) };
  }
};
