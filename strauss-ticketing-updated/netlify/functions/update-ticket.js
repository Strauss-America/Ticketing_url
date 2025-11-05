const sgMail = require('@sendgrid/mail');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const data = JSON.parse(event.body);
    const { airtableId, status, estimatedHours, actualHours, notes, ticketId, ticketFields } = data;
    if (!airtableId) return { statusCode: 400, body: JSON.stringify({ error: 'Airtable record ID is required' }) };

    const nowIso = new Date().toISOString();

    // ----- Airtable update -----
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
      const err = await atResp.text();
      console.error('Airtable error:', atResp.status, err);
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to update ticket in Airtable' }) };
    }

    // ----- SendGrid -----
    const API = process.env.SENDGRID_API_KEY;
    const FROM_EMAIL = process.env.SENDGRID_FROM || process.env.ADMIN_EMAIL || 'whinebrick@gmail.com';
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || FROM_EMAIL;
    if (!API) return { statusCode: 500, body: JSON.stringify({ error: 'Missing SENDGRID_API_KEY' }) };
    sgMail.setApiKey(API);

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

    await sgMail.send({
      to: ticketFields['Requester Email'],
      from: { email: FROM_EMAIL, name: 'Strauss America Analytics Team' },
      replyTo: ADMIN_EMAIL,
      subject: `Ticket Update - #${ticketId} - ${status}`,
      text: body
    });

    return { statusCode: 200, body: JSON.stringify({ success: true, message: 'Ticket updated successfully' }) };
  } catch (error) {
    console.error('update-ticket error:', error.response?.body || error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to send email', message: error.message }) };
  }
};
