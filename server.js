const express = require('express');
const path = require('path');
try {
  require('dotenv').config();
} catch (e) {
  // Ignore error in serverless environments where environment variables are injected directly
}

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint: GET /api/config (Exposes public configurations like chatbot URL)
app.get('/api/config', (req, res) => {
  res.json({
    chatWebhookUrl: process.env.CHAT_WEBHOOK_URL || ''
  });
});

// Endpoint: POST /api/leads (Captures inquiries and pushes to GHL API)
app.post('/api/leads', async (req, res) => {
  const { name, business, phone, email, volume, ticketSize, savings } = req.body;

  // Simple validation
  if (!name || !business || !phone || !email) {
    return res.status(400).json({
      success: false,
      message: 'Missing required lead details (name, business, phone, email).'
    });
  }

  const ghlApiKey = process.env.GHL_API_KEY;
  const ghlLocationId = process.env.GHL_LOCATION_ID;

  // Check if GHL API Key is set in environment
  if (!ghlApiKey || ghlApiKey.trim() === '') {
    // --- SANDBOX / SIMULATED MODE ---
    console.log('\n======================================================');
    console.log('⚡ [ZEND BACKEND: GHL SIMULATOR ACTIVE]');
    console.log('No GHL_API_KEY found in .env. Running sandbox logs.');
    console.log('------------------------------------------------------');
    console.log('Incoming Payload:');
    console.log({ name, business, phone, email, volume, ticketSize, savings });
    console.log('\nGenerating target GHL API v2 Payload Structure:');
    console.log('1. POST https://services.leadconnectorhq.com/contacts/');
    console.log('   Headers: { Version: "2021-04-15", Authorization: "Bearer [HIDDEN]" }');
    console.log('   Body:', JSON.stringify({
      name,
      email,
      phone,
      companyName: business,
      tags: ['Zend Lead', `Volume: $${volume}`, `Ticket: $${ticketSize}`]
    }, null, 2));
    
    console.log('2. POST https://services.leadconnectorhq.com/opportunities/');
    console.log('   Body:', JSON.stringify({
      pipelineId: process.env.GHL_PIPELINE_ID || 'zend_merchant_pipeline',
      stageId: process.env.GHL_STAGE_ID || 'lead_inflow_stage',
      title: `${business} - Zend Lead`,
      contactId: 'mock_contact_id_9912',
      status: 'open',
      monetaryValue: savings
    }, null, 2));
    console.log('======================================================\n');

    return res.status(200).json({
      success: true,
      mode: 'sandbox_simulation',
      message: 'Demo lead logged successfully on local console.'
    });
  }

  // --- REAL GHL API INTEGRATION ---
  try {
    console.log(`[GHL API] Sending lead ${name} to GoHighLevel...`);

    // 1. Create or Update GHL Contact
    // API docs: https://highlevel.stoplight.io/docs/integrations/0072eeaa2427a-create-contact
    const contactResponse = await fetch('https://services.leadconnectorhq.com/contacts/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ghlApiKey}`,
        'Version': '2021-04-15'
      },
      body: JSON.stringify({
        name,
        email,
        phone,
        companyName: business,
        locationId: ghlLocationId, // required for some v2 scopes
        tags: ['Zend Lead', `Volume: $${volume}`, `Ticket: $${ticketSize}`, `Savings: $${savings}/mo`]
      })
    });

    const contactData = await contactResponse.json();

    if (!contactResponse.ok) {
      console.error('[GHL Contact Error]:', contactData);
      return res.status(contactResponse.status).json({
        success: false,
        message: 'GHL Contact endpoint returned an error.',
        details: contactData
      });
    }

    const contactId = contactData.contact ? contactData.contact.id : contactData.id;
    console.log(`[GHL API] Contact created/updated successfully with ID: ${contactId}`);

    // 2. Create Opportunity under target Pipeline & Stage
    // API docs: https://highlevel.stoplight.io/docs/integrations/7c75691c3d1aa-create-opportunity
    const opportunityResponse = await fetch('https://services.leadconnectorhq.com/opportunities/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ghlApiKey}`,
        'Version': '2021-04-15'
      },
      body: JSON.stringify({
        pipelineId: process.env.GHL_PIPELINE_ID || 'zend_merchant_pipeline',
        stageId: process.env.GHL_STAGE_ID || 'lead_inflow_stage',
        title: `${business} - Zend Lead Opportunity`,
        contactId: contactId,
        status: 'open',
        monetaryValue: savings // Set deal value to estimated monthly savings!
      })
    });

    const opportunityData = await opportunityResponse.json();

    if (!opportunityResponse.ok) {
      console.error('[GHL Opportunity Error]:', opportunityData);
      return res.status(opportunityResponse.status).json({
        success: false,
        message: 'GHL Opportunity endpoint returned an error.',
        details: opportunityData
      });
    }

    console.log(`[GHL API] Opportunity created successfully! ID: ${opportunityData.id}`);

    return res.status(200).json({
      success: true,
      mode: 'live_ghl_api',
      contactId,
      opportunityId: opportunityData.id,
      message: 'Lead and Opportunity synchronized with GoHighLevel!'
    });

  } catch (error) {
    console.error('[Zend Server Exception Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server exception occurred during GHL synchronization.',
      error: error.message
    });
  }
});

// Start listening if run directly (local development)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Zend server is online!`);
    console.log(`👉 Access public site at: http://localhost:${PORT}`);
    console.log(`👉 Access dashboard at:   http://localhost:${PORT}/dashboard.html`);
    console.log(`======================================================\n`);
  });
}

module.exports = app;
