const fetch = require('node-fetch');
const nodemailer = require('nodemailer');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const data = JSON.parse(event.body);
    
    // Generate ticket ID
    const ticketId = Date.now().toString();
    const now = new Date().toISOString();
    
    // Prepare Airtable record
    const airtableRecord = {
      fields: {
        'Ticket ID': ticketId,
        'Requester Name': data.requesterName,
        'Requester Email': data.requesterEmail,
        'Department': data.department,
        'Request Type': data.requestType,
        'Urgency': data.urgency,
        'Status': 'New',
        'Description': data.description,
        'Created At': now,
        'Updated At': now
      }
    };
    
    // Add deadline if provided
    if (data.deadline) {
      airtableRecord.fields['Deadline'] = data.deadline;
    }
    
    // Send to Airtable
    const airtableResponse = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Tickets`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(airtableRecord)
      }
    );
    
    if (!airtableResponse.ok) {
      const errorData = await airtableResponse.json();
      console.error('Airtable error:', errorData);
      throw new Error('Failed to save ticket to Airtable');
    }
    
    const airtableData = await airtableResponse.json();
    
    // Send email notifications
    try {
      await sendEmailNotifications(data, ticketId);
    } catch (emailError) {
      console.error('Email error (ticket still created):', emailError);
      // Don't fail the whole request if email fails
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        ticketId: ticketId,
        message: 'Ticket submitted successfully'
      })
    };
    
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to submit ticket',
        message: error.message
      })
    };
  }
};

async function sendEmailNotifications(data, ticketId) {
  // Create transporter using your SMTP settings
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false, // true for 465, false for 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });

  const adminEmail = process.env.ADMIN_EMAIL || 'william.hinebrick@strauss.com';
  
  // Email to admin about new ticket
  const adminEmailBody = `
A new data request ticket has been submitted:

Ticket #: ${ticketId}
Requester: ${data.requesterName} (${data.requesterEmail})
Department: ${data.department}
Request Type: ${data.requestType}
Urgency: ${data.urgency}
Deadline: ${data.deadline || 'No deadline specified'}

Description:
${data.description}

Created: ${new Date().toLocaleString()}

Please log in to the admin dashboard to view and manage this ticket:
https://strauss-america-analytics-tickets.netlify.app
  `;

  // Email to requester confirming ticket submission
  const requesterEmailBody = `
Hi ${data.requesterName},

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

  // Send email to admin
  await transporter.sendMail({
    from: '"Strauss Analytics Ticketing" <noreply@strauss.com>',
    replyTo: data.requesterEmail,
    to: adminEmail,
    subject: `New Data Request - Ticket #${ticketId}`,
    text: adminEmailBody
  });

  // Send confirmation email to requester
  await transporter.sendMail({
    from: '"Strauss America Analytics Team" <noreply@strauss.com>',
    to: data.requesterEmail,
    subject: `Your Data Request Ticket #${ticketId}`,
    text: requesterEmailBody
  });
}
