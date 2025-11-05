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
    
    // Send email notification
    await sendEmailNotification(data, ticketId);
    
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

async function sendEmailNotification(data, ticketId) {
  try {
    // Create transporter with simple SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });

    const adminEmail = process.env.EMAIL_TO || 'william.hinebrick@strauss.com';
    const requesterEmail = data.requesterEmail;
    const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER;

    // Email to admin
    const adminEmailBody = `A new data request ticket has been submitted:

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
https://strauss-america-analytics-tickets.netlify.app`;

    await transporter.sendMail({
      from: '"Strauss Analytics Ticketing" <' + fromEmail + '>',
      to: adminEmail,
      replyTo: requesterEmail,
      subject: `New Data Request - Ticket #${ticketId}`,
      text: adminEmailBody
    });

    // Confirmation email to requester
    const requesterEmailBody = `Dear ${data.requesterName},

Thank you for submitting your data request. Your ticket has been received and assigned the following number:

Ticket #: ${ticketId}

Request Summary:
- Department: ${data.department}
- Request Type: ${data.requestType}
- Urgency: ${data.urgency}
- Deadline: ${data.deadline || 'No deadline specified'}

Description:
${data.description}

Our analytics team will review your request and get back to you shortly. You will receive email updates as your ticket status changes.

If you have any questions, please reply to this email.

Thank you,
Strauss America Analytics Team`;

    await transporter.sendMail({
      from: '"Strauss Analytics Ticketing" <' + fromEmail + '>',
      to: requesterEmail,
      subject: `Ticket Confirmation - #${ticketId}`,
      text: requesterEmailBody
    });

    console.log('Email notifications sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
    // Don't throw - we still want the ticket to be saved even if email fails
  }
}