const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const COUCHDB_URL = process.env.COUCHDB_URL || 'http://admin:adminpassword@localhost:5984';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwttokenkey12345';

// Mock Users Database for demo authentication
const USERS = [
  { id: 'user:surveyor_alpha', username: 'surveyor1', password: 'password', role: 'field_surveyor', name: 'Field Surveyor 1' },
  { id: 'user:surveyor_beta', username: 'surveyor2', password: 'password', role: 'field_surveyor', name: 'Field Surveyor 2' },
  { id: 'user:admin', username: 'admin', password: 'admin', role: 'project_manager', name: 'Project Manager' }
];

// Wait for CouchDB to be ready and initialize the databases
async function initCouchDB() {
  console.log('Connecting to CouchDB at:', COUCHDB_URL.replace(/:[^:@]+@/, ':****@')); // Hide password in logs
  
  const dbs = ['_users', '_replicator', '_global_changes', 'humanitysync'];
  
  for (const db of dbs) {
    let success = false;
    let attempts = 0;
    while (!success && attempts < 10) {
      try {
        attempts++;
        await axios.put(`${COUCHDB_URL}/${db}`);
        console.log(`Database '${db}' initialized successfully.`);
        success = true;
      } catch (err) {
        if (err.response && err.response.status === 412) {
          console.log(`Database '${db}' already exists.`);
          success = true;
        } else {
          console.error(`Attempt ${attempts}: Failed to initialize database '${db}'. Retrying in 3 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
    }
  }

  // Make humanitysync database public so client replication works
  try {
    await axios.put(`${COUCHDB_URL}/humanitysync/_security`, {
      admins: { names: [], roles: [] },
      members: { names: [], roles: [] }
    });
    console.log("Database 'humanitysync' security updated to public.");
  } catch (err) {
    console.error("Failed to update database 'humanitysync' security:", err.message);
  }

  // Upload the design document for replication filtering
  try {
    const ddocUrl = `${COUCHDB_URL}/humanitysync/_design/app`;
    let existingRev = null;
    
    try {
      const response = await axios.get(ddocUrl);
      existingRev = response.data._rev;
    } catch (err) {
      // Doesn't exist, ignore
    }

    const ddoc = {
      _id: '_design/app',
      filters: {
        by_surveyor: `function(doc, req) {
          if (doc.type === 'template') {
            return true;
          }
          if (req.query.role === 'project_manager') {
            return true;
          }
          if (doc.type === 'submission') {
            return doc.metadata && doc.metadata.surveyor_id === req.query.surveyor_id;
          }
          return false;
        }`
      }
    };

    if (existingRev) {
      ddoc._rev = existingRev;
    }

    await axios.put(ddocUrl, ddoc);
    console.log("Design document '_design/app' with replication filter uploaded successfully.");
  } catch (err) {
    console.error("Failed to upload design document:", err.message);
  }

  // Upload some default templates if empty
  try {
    const templates = [
      {
        _id: "template:needs_assessment_v1",
        type: "template",
        version: 2,
        title: "Needs Assessment Camp Alpha (Winter 2026)",
        metadata: {
          created_at: new Date().toISOString(),
          author: "system",
          target_region: "Region Alpha"
        },
        fields: [
          { id: "sec_head", type: "section", label: "1. Head of Household Information", section_icon: "person", hint: "Basic demographics of the primary contact" },
          { id: "family_head_name", type: "text", label: "Name of Family Head", required: true, placeholder: "e.g. John Doe" },
          { id: "assessment_date", type: "date", label: "Assessment Date", required: true },
          { id: "family_size", type: "number", label: "Number of Family Members", required: true, placeholder: "e.g. 5" },
          { id: "sec_needs", type: "section", label: "2. Urgent Relief & Health Needs", section_icon: "local_hospital", hint: "Select all urgent aid supplies required" },
          { 
            id: "urgent_needs", 
            type: "multiselect", 
            label: "Urgent Relief Items Required", 
            required: true,
            options: [
              { value: "winterization", label: "Winter Heater / Heating Fuel" },
              { value: "food_basket", label: "Monthly Food Basket" },
              { value: "hygiene_kit", label: "Hygiene & Sanitation Kit" },
              { value: "medical", label: "Medical & Health Kit" }
            ]
          },
          { id: "has_infants", type: "boolean", label: "Are there infants/toddlers (0-2 years)?", required: true },
          { 
            id: "infant_food_required", 
            type: "boolean", 
            label: "Baby food/formula required?",
            conditions: [{ field: "has_infants", operator: "equals", value: true }]
          },
          { id: "sec_shelter", type: "section", label: "3. Shelter Condition & Geolocation", section_icon: "place", hint: "GPS verification and physical structure damage inspection" },
          {
            id: "shelter_condition",
            type: "select",
            label: "Shelter Condition",
            required: true,
            options: [
              { value: "good", label: "Good (Dry, weather-proof)" },
              { value: "damaged", label: "Damaged (Torn structure)" },
              { value: "critical", label: "Critical (No protection from weather)" }
            ]
          },
          { id: "shelter_location", type: "location", label: "Shelter GPS Coordinates", required: false, hint: "Acquire precise GPS location at entrance" },
          { id: "shelter_photo", type: "image", label: "Shelter Damage Photo", required: false, hint: "Attach photo proof if shelter is damaged or critical" },
          { id: "additional_notes", type: "textarea", label: "Surveyor Field Notes", required: false, placeholder: "Special vulnerability comments, medical conditions..." }
        ]
      },
      {
        _id: "template:registration_camp_v1",
        type: "template",
        version: 2,
        title: "Camp Registration & Personal Data",
        metadata: {
          created_at: new Date().toISOString(),
          author: "system",
          target_region: "Region Beta"
        },
        fields: [
          { id: "sec_personal", type: "section", label: "Personal Information", section_icon: "badge" },
          { id: "first_name", type: "text", label: "First Name", required: true },
          { id: "last_name", type: "text", label: "Last Name", required: true },
          { id: "date_of_birth", type: "date", label: "Date of Birth", required: false },
          { id: "phone_number", type: "text", label: "Phone Number", required: false, placeholder: "+1 555 XXX XXXX" },
          {
            id: "origin_district",
            type: "select",
            label: "Area of Origin",
            required: true,
            options: [
              { value: "district_1", label: "District Alpha" },
              { value: "district_2", label: "District Beta" },
              { value: "district_3", label: "District Gamma" },
              { value: "other", label: "Other Region" }
            ]
          },
          { id: "id_photo", type: "image", label: "ID Card / Registration Document Photo", required: false }
        ]
      }
    ];

    for (const t of templates) {
      try {
        await axios.put(`${COUCHDB_URL}/humanitysync/${t._id}`, t);
        console.log(`Default template '${t._id}' uploaded.`);
      } catch (err) {
        if (err.response && err.response.status === 409) {
          // Already exists
        } else {
          console.error(`Failed to upload default template ${t._id}:`, err.message);
        }
      }
    }
  } catch (err) {
    console.error("Error setting up default templates:", err.message);
  }
}

// Authentication route
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = USERS.find(u => u.username === username && u.password === password);
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const token = jwt.sign({
    id: user.id,
    role: user.role,
    name: user.name
  }, JWT_SECRET, { expiresIn: '7d' });
  
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      role: user.role
    }
  });
});

// Middleware to verify JWT
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Protected endpoint to get current user details
app.get('/api/auth/me', authenticateJWT, (req, res) => {
  res.json({ user: req.user });
});

// Admin-only route to view all submissions
app.get('/api/admin/submissions', authenticateJWT, async (req, res) => {
  if (req.user.role !== 'project_manager') {
    return res.status(403).json({ error: 'Accessible only to administrators' });
  }

  try {
    const response = await axios.get(`${COUCHDB_URL}/humanitysync/_all_docs`, {
      params: {
        include_docs: true,
        conflicts: true,
        startkey: JSON.stringify('submission:'),
        endkey: JSON.stringify('submission:\ufff0')
      }
    });

    const submissions = response.data.rows
      .map(row => row.doc)
      .filter(doc => doc && doc.type === 'submission');

    res.json({ submissions });
  } catch (err) {
    console.error('Failed to fetch submissions:', err.message);
    res.status(500).json({ error: 'Failed to retrieve entries from CouchDB' });
  }
});

// Admin-only route to create/update form templates
app.post('/api/admin/templates', authenticateJWT, async (req, res) => {
  if (req.user.role !== 'project_manager') {
    return res.status(403).json({ error: 'Accessible only to administrators' });
  }

  const template = req.body;
  if (!template._id || !template._id.startsWith('template:')) {
    return res.status(400).json({ error: 'Template _id must start with template:' });
  }

  template.type = 'template';
  template.metadata = {
    ...template.metadata,
    updated_at: new Date().toISOString(),
    author: req.user.name
  };

  try {
    const response = await axios.put(`${COUCHDB_URL}/humanitysync/${template._id}`, template);
    res.json(response.data);
  } catch (err) {
    console.error('Failed to create/update template:', err.message);
    res.status(500).json({ error: 'Failed to save template in CouchDB' });
  }
});

app.listen(PORT, () => {
  console.log(`Gateway server is running on port ${PORT}`);
  initCouchDB();
});
