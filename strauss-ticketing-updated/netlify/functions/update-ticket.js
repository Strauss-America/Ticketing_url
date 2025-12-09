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

    // Prepare requester email body (HTML format)
    const createdDate = ticketFields['Created At'] ? new Date(ticketFields['Created At']).toLocaleString() : 'N/A';

    let requesterEmailHtml = `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <p><strong>Ticket #${ticketFields['Ticket ID']} has been updated:</strong></p>

        <p><strong>Status:</strong> ${data.status}</p>
        <p><strong>Department:</strong> ${ticketFields['Department']}</p>
        <p><strong>Request Type:</strong> ${ticketFields['Request Type']}</p>
        <p><strong>Urgency:</strong> ${ticketFields['Urgency']}</p>`;

    if (ticketFields['Deadline']) {
      requesterEmailHtml += `<p><strong>Deadline:</strong> ${ticketFields['Deadline']}</p>`;
    }

    if (data.estimatedHours) {
      requesterEmailHtml += `<p><strong>Estimated Hours:</strong> ${data.estimatedHours}</p>`;
    }

    if (data.actualHours) {
      requesterEmailHtml += `<p><strong>Actual Hours:</strong> ${data.actualHours}</p>`;
    }

    if (data.notes) {
      requesterEmailHtml += `
        <br>
        <p><strong>Update:</strong></p>
        <p style="white-space: pre-wrap;">${data.notes}</p>`;
    }

    requesterEmailHtml += `
        <p><strong>Updated:</strong> ${new Date().toLocaleString()}</p>

        <hr style="border: none; border-top: 3px solid #333; margin: 20px 0;">

        <div style="font-size: 0.9em; color: #666; font-style: italic;">
          <p><strong>Original message:</strong><br>
          <strong>Created:</strong> ${createdDate}</p>

          <p><strong>Description:</strong></p>
          <p style="white-space: pre-wrap;">${ticketFields['Description']}</p>
        </div>

        <br>
        <p>If you have any questions, please reply to this email.</p>
        <p>Thank you,<br>Strauss America Analytics Team</p>
      </div>
    `;

    // Plain text version for email clients that don't support HTML
    let requesterEmailText = `Hello ${data.requesterName},\n\n`;
    requesterEmailText += `Your ticket #${ticketFields['Ticket ID']} status has been updated to: ${data.status}\n\n`;
    requesterEmailText += `Ticket Details:\n`;
    requesterEmailText += `Department: ${ticketFields['Department']}\n`;
    requesterEmailText += `Request Type: ${ticketFields['Request Type']}\n`;
    requesterEmailText += `Urgency: ${ticketFields['Urgency']}\n`;

    if (ticketFields['Deadline']) {
      requesterEmailText += `Deadline: ${ticketFields['Deadline']}\n`;
    }

    if (data.estimatedHours) {
      requesterEmailText += `Estimated Hours: ${data.estimatedHours}\n`;
    }

    if (data.actualHours) {
      requesterEmailText += `Actual Hours: ${data.actualHours}\n`;
    }

    if (data.notes) {
      requesterEmailText += `\nUpdate:\n${data.notes}\n`;
    }

    requesterEmailText += `\nUpdated: ${new Date().toLocaleString()}\n\n`;
    requesterEmailText += `${'='.repeat(77)}\n\n`;
    requesterEmailText += `Original message:\nCreated: ${createdDate}\n\n`;
    requesterEmailText += `Description:\n${ticketFields['Description']}\n\n`;
    requesterEmailText += `If you have any questions, please reply to this email.\n\n`;
    requesterEmailText += `Thank you,\nStrauss America Analytics Team`;

    // Send email to requester
    await transporter.sendMail({
      from: '"Strauss Analytics Ticketing" <' + fromEmail + '>',
      replyTo: adminEmail,
      to: requesterEmail,
      subject: `Ticket Update - #${ticketFields['Ticket ID']} - ${data.status}`,
      text: requesterEmailText,
      html: requesterEmailHtml
    });

    console.log(`Update email sent to ${requesterEmail} for ticket ${ticketFields['Ticket ID']}`);

    // Prepare admin email body (HTML format)
    const createdDate = ticketFields['Created At'] ? new Date(ticketFields['Created At']).toLocaleString() : 'N/A';

    let adminEmailHtml = `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <p><strong>Ticket #${ticketFields['Ticket ID']} has been updated:</strong></p>

        <p><strong>Status:</strong> ${data.status}</p>
        <p><strong>Requester:</strong> ${data.requesterName} (${requesterEmail})</p>
        <p><strong>Department:</strong> ${ticketFields['Department']}</p>
        <p><strong>Request Type:</strong> ${ticketFields['Request Type']}</p>
        <p><strong>Urgency:</strong> ${ticketFields['Urgency']}</p>`;

    if (ticketFields['Deadline']) {
      adminEmailHtml += `<p><strong>Deadline:</strong> ${ticketFields['Deadline']}</p>`;
    }

    if (data.estimatedHours) {
      adminEmailHtml += `<p><strong>Estimated Hours:</strong> ${data.estimatedHours}</p>`;
    }

    if (data.actualHours) {
      adminEmailHtml += `<p><strong>Actual Hours:</strong> ${data.actualHours}</p>`;
    }

    if (data.notes) {
      adminEmailHtml += `
        <br>
        <p><strong>Update:</strong></p>
        <p style="white-space: pre-wrap;">${data.notes}</p>`;
    }

    adminEmailHtml += `
        <p><strong>Updated:</strong> ${new Date().toLocaleString()}</p>

        <hr style="border: none; border-top: 3px solid #333; margin: 20px 0;">

        <div style="font-size: 0.9em; color: #666; font-style: italic;">
          <p><strong>Original message:</strong><br>
          <strong>Created:</strong> ${createdDate}</p>

          <p><strong>Description:</strong></p>
          <p style="white-space: pre-wrap;">${ticketFields['Description']}</p>
        </div>

        <br>
        <p style="font-size: 0.9em; color: #666;">View ticket at: <a href="https://strauss-america-analytics-tickets.netlify.app">https://strauss-america-analytics-tickets.netlify.app</a></p>
      </div>
    `;

    // Plain text version for email clients that don't support HTML
    let adminEmailText = `Ticket #${ticketFields['Ticket ID']} has been updated:\n\n`;
    adminEmailText += `Status: ${data.status}\n`;
    adminEmailText += `Requester: ${data.requesterName} (${requesterEmail})\n`;
    adminEmailText += `Department: ${ticketFields['Department']}\n`;
    adminEmailText += `Request Type: ${ticketFields['Request Type']}\n`;
    adminEmailText += `Urgency: ${ticketFields['Urgency']}\n`;

    if (ticketFields['Deadline']) {
      adminEmailText += `Deadline: ${ticketFields['Deadline']}\n`;
    }

    if (data.estimatedHours) {
      adminEmailText += `Estimated Hours: ${data.estimatedHours}\n`;
    }

    if (data.actualHours) {
      adminEmailText += `Actual Hours: ${data.actualHours}\n`;
    }

    if (data.notes) {
      adminEmailText += `\nUpdate:\n${data.notes}\n`;
    }

    adminEmailText += `\nUpdated: ${new Date().toLocaleString()}\n\n`;
    adminEmailText += `${'='.repeat(77)}\n\n`;
    adminEmailText += `Original message:\nCreated: ${createdDate}\n\n`;
    adminEmailText += `Description:\n${ticketFields['Description']}\n\n`;
    adminEmailText += `View ticket at: https://strauss-america-analytics-tickets.netlify.app`;

    // Send email to admin
    await transporter.sendMail({
      from: '"Strauss Analytics Ticketing" <' + fromEmail + '>',
      to: adminEmail,
      replyTo: requesterEmail,
      subject: `Ticket Update - #${ticketFields['Ticket ID']} - ${data.status}`,
      text: adminEmailText,
      html: adminEmailHtml
    });

    console.log(`Update email sent to admin ${adminEmail} for ticket ${ticketFields['Ticket ID']}`);
  } catch (error) {
    console.error('Error sending update email:', error);
    // Don't throw - we still want the update to succeed even if email fails
  }
}