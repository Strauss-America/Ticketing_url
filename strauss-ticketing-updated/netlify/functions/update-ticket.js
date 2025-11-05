const sgMail = require('@sendgrid/mail');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { ticketId, newStatus, ticketFields } = JSON.parse(event.body);

    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    const SENDGRID_FROM    = process.env.SENDGRID_FROM || 'william.hinebrick@strauss.com';
    const ADMIN_EMAIL      = process.env.ADMIN_EMAIL   || 'william.hinebrick@strauss.com';
    if (!SENDGRID_API_KEY) throw new Error('Missing SENDGRID_API_KEY');
    sgMail.setApiKey(SENDGRID_API_KEY);

    const emailBody =
`Hello ${ticketFields['Requester Name']},

Your ticket #${ticketId} status has been updated to: ${newStatus}

Department: ${ticketFields['Department']}
Request Type: ${ticketFields['Request Type']}
Urgency: ${ticketFields['Urgency']}
Deadline: ${ticketFields['Deadline']}

Description:
${ticketFields['Description']}

If you have any questions, please reply to this email.

Thank you,
Strauss America Analytics Team`;

    const msg = {
      to: ticketFields['Requester Email'],
      from: { email: SENDGRID_FROM, name: 'Strauss Analytics Ticketing' },
      replyTo: ADMIN_EMAIL,
      subject: `[BY-NETLIFY] Ticket Update - #${ticketId} - ${newStatus}`,
      text: emailBody
    };

    const [resp] = await sgMail.send(msg);
    console.log('SG update status', resp && resp.statusCode);

    return { statusCode: 200, body: JSON.stringify({ message: 'Email sent successfully' }) };

  } catch (error) {
    console.error('Error sending email:', error.response?.body || error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to send email', details: error.message }) };
  }
};
