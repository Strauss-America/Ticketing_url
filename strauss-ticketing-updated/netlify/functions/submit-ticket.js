const sgMail = require('@sendgrid/mail');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const data = JSON.parse(event.body);

    // Generate ID/timestamps
    const ticketId = Date.now().toString();
    const nowIso = new Date().toISOString();

    // ----- Airtable create -----
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
      const err = await atResp.text();
      console.error('Airtable error:', atResp.status, err);
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to save ticket to Airtable' }) };
    }

    // ----- SendGrid -----
    const API = process.env.SENDGRID_API_KEY;
    const FROM_EMAIL = process.env.SENDGRID_FROM || process.env.ADMIN_EMAIL || 'whinebrick@gmail.com';
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || FROM_EMAIL;
    if (!API) return { statusCode: 500, body: JSON.stringify({ error: 'Missing SENDGRID_API_KEY' }) };
    sgMail.setApiKey(API);

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

    await sgMail.send({
      to: ADMIN_EMAIL,
      from: { email: FROM_EMAIL, name: 'Strauss America Analytics Team' },
      replyTo: data.requesterEmail,
      subject: `New Data Request - Ticket #${ticketId}`,
      text: adminBody
    });

    await sgMail.send({
      to: data.requesterEmail,
      from: { email: FROM_EMAIL, name: 'Strauss America Analytics Team' },
      replyTo: ADMIN_EMAIL,
      subject: `Your Data Request Ticket #${ticketId}`,
      text: requesterBody
    });

    return { statusCode: 200, body: JSON.stringify({ success: true, ticketId, message: 'Ticket submitted successfully' }) };
  } catch (error) {
    console.error('submit-ticket error:', error.response?.body || error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to submit ticket', message: error.message }) };
  }
};
