const sgMail = require('@sendgrid/mail');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const ticket = JSON.parse(event.body);

    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    const FROM_EMAIL = process.env.SENDGRID_FROM || process.env.ADMIN_EMAIL || 'whinebrick@gmail.com';
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || FROM_EMAIL;
    if (!SENDGRID_API_KEY) throw new Error('Missing SENDGRID_API_KEY');
    sgMail.setApiKey(SENDGRID_API_KEY);

    // Optional normalization for Airtable single-selects
    const TYPE_MAP = { 'Report': 'Report Creation' };
    ticket.requestType = TYPE_MAP[ticket.requestType] || ticket.requestType;

    // Build bodies
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

We'll review your request and get back to you soon. You can reference ticket #${ticket.id} if you need to follow up.

Thank you,
Strauss America Analytics Team
`;

    // Send admin notice
    await sgMail.send({
      to: ADMIN_EMAIL,
      from: { email: FROM_EMAIL, name: 'Strauss America Analytics Team' },
      replyTo: ticket.requesterEmail,
      subject: `New Data Request - Ticket #${ticket.id}`,
      text: adminEmailBody
    });

    // Send requester confirmation
    await sgMail.send({
      to: ticket.requesterEmail,
      from: { email: FROM_EMAIL, name: 'Strauss America Analytics Team' },
      replyTo: ADMIN_EMAIL,
      subject: `Your Data Request Ticket #${ticket.id}`,
      text: requesterEmailBody
    });

    return { statusCode: 200, body: JSON.stringify({ success: true, ticketId: ticket.id, message: 'Ticket submitted successfully' }) };
  } catch (error) {
    console.error('submit-ticket error:', error.response?.body || error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to submit ticket', details: error.message }) };
  }
};
