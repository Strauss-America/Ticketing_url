// get-tickets.js — Airtable read, Node 18 global fetch

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const url = new URL(event.rawUrl);
    const max = Math.min(Number(url.searchParams.get('limit') || 50), 200);

    const resp = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Tickets?maxRecords=${max}&sort[0][field]=Created%20At&sort[0][direction]=desc`,
      { headers: { 'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}` } }
    );

    if (!resp.ok) {
      const errBody = await resp.text();
      console.error('Airtable error (get):', resp.status, errBody);
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to fetch tickets' }) };
    }

    const json = await resp.json();
    const tickets = json.records.map(record => ({
      airtableId: record.id,
      ticketId: record.fields['Ticket ID'],
      requesterName: record.fields['Requester Name'],
      requesterEmail: record.fields['Requester Email'],
      department: record.fields['Department'],
      requestType: record.fields['Request Type'],
      urgency: record.fields['Urgency'],
      status: record.fields['Status'] || 'New',
      deadline: record.fields['Deadline'] || null,
      description: record.fields['Description'],
      estimatedHours: record.fields['Estimated Hours'] || null,
      actualHours: record.fields['Actual Hours'] || null,
      notes: record.fields['Notes'] || '',
      createdAt: record.fields['Created At'],
      updatedAt: record.fields['Updated At']
    }));

    return { statusCode: 200, body: JSON.stringify({ success: true, tickets }) };
  } catch (error) {
    console.error('get-tickets error:', error.message || error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to fetch tickets', message: error.message || String(error) }) };
  }
};
