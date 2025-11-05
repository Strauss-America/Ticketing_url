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
    const { airtableId, status, estimatedHours, actualHours, notes } = data;
    
    if (!airtableId) {
      throw new Error('Airtable record ID is required');
    }
    
    const now = new Date().toISOString();
    
    // Prepare update fields
    const updateFields = {
      'Status': status,
      'Updated At': now
    };
    
    // Add optional fields if provided
    if (estimatedHours !== null && estimatedHours !== undefined) {
      updateFields['Estimated Hours'] = estimatedHours;
    }
    
    if (actualHours !== null && actualHours !== undefined) {
      updateFields['Actual Hours'] = actualHours;
    }
    
    if (notes !== null && notes !== undefined) {
      updateFields['Notes'] = notes;
    }
    
    // Update in Airtable
    const airtableResponse = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Tickets/${airtableId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: updateFields
        })
      }
    );
    
    if (!airtableResponse.ok) {
      const errorData = await airtableResponse.json();
      console.error('Airtable error:', errorData);
      throw new Error('Failed to update ticket in Airtable');
    }
    
    const airtableData = await airtableResponse.json();
    
    // Send email notification to requester about status update
    if (data.requesterEmail && data.requesterName) {
      await sendUpdateEmailNotification(data, airtableData.fields);
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Ticket updated successfully'
      })
    };
    
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to update ticket',
        message: error.message
      })
    };
  }
};

async function sendUpdateEmailNotification(data, ticketFields) {
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

    // Prepare email body
    let emailBody = `Hello ${data.requesterName},\n\n`;
    emailBody += `Your ticket #${ticketFields['Ticket ID']} status has been updated to: ${data.status}\n\n`;
    emailBody += `Ticket Details:\n`;
    emailBody += `Department: ${ticketFields['Department']}\n`;
    emailBody += `Request Type: ${ticketFields['Request Type']}\n`;
    emailBody += `Urgency: ${ticketFields['Urgency']}\n`;
    
    if (ticketFields['Deadline']) {
      emailBody += `Deadline: ${ticketFields['Deadline']}\n`;
    }
    
    if (data.estimatedHours) {
      emailBody += `Estimated Hours: ${data.estimatedHours}\n`;
    }
    
    if (data.actualHours) {
      emailBody += `Actual Hours: ${data.actualHours}\n`;
    }
    
    emailBody += `\nDescription:\n${ticketFields['Description']}\n\n`;
    
    if (data.notes) {
      emailBody += `Admin Notes:\n${data.notes}\n\n`;
    }
  
    emailBody += `If you have any questions, please reply to this email.\n\n`;
    emailBody += `Thank you,\nStrauss America Analytics Team`;

    // Send email to requester
    await transporter.sendMail({
      from: '"Strauss Analytics Ticketing" <' + fromEmail + '>',
      replyTo: adminEmail,
      to: requesterEmail,
      subject: `Ticket Update - #${ticketFields['Ticket ID']} - ${data.status}`,
      text: emailBody
    });
    
    console.log(`Update email sent to ${requesterEmail} for ticket ${ticketFields['Ticket ID']}`);
  } catch (error) {
    console.error('Error sending update email:', error);
    // Don't throw - we still want the update to succeed even if email fails
  }
}