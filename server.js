// Import required packages
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');

require('dotenv').config(); // This must be at the top of your file

// Initialize Express app
const app = express();
app.use(bodyParser.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

  app.get('/' , async (req, res) => { 
    res.send("Welcome");
  });

// Define Schema for User
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hashed password
});

// Create User model
const User = mongoose.model('User', userSchema);

// Define Schema for Drug Imports
const drugImportSchema = new mongoose.Schema({
  orderNo: { type: String, required: true },
  drugName: { type: String, required: true },
  supplier: { type: String, required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  poNumber: { type: String, required: true },
  paymentMethod: { type: String, required: true },
  documents: { type: [String], required: true }, // Array of document names
  status: { type: String, required: true }, // E.g., "Shipped", "In Customs", etc.
});

// Create DrugImport model
const DrugImport = mongoose.model('DrugImport', drugImportSchema);

// Seed API for demo users (existing functionality)
app.get('/seed', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash('hp', 10); // Replace 'harshal' with desired password
    const newUser = new User({ username: 'harshal', password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'User seeded successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error seeding user', error });
  }
});

// Seed API for demo drug imports
app.get('/seed1', async (req, res) => {
  try {
    const demoData = [
      {
        orderNo: 'ORD001',
        drugName: 'Paracetamol',
        supplier: 'PharmaCorp',
        date: '2025-01-10',
        poNumber: 'PO12345',
        paymentMethod: 'Credit',
        documents: ['COA.pdf', 'Invoice.pdf'],
        status: 'Shipped',

      },
      {
        orderNo: 'ORD002',
        drugName: 'Ibuprofen',
        supplier: 'HealthCare Supplies',
        date: '2025-01-12',
        poNumber: 'PO12346',
        paymentMethod: 'Bank Transfer',
        documents: ['COA.pdf', 'Invoice.pdf'],
        status: 'In Customs',
      },
      {
        orderNo: 'ORD003',
        drugName: 'Amoxicillin',
        supplier: 'MedLife Ltd',
        date: '2025-01-15',
        poNumber: 'PO12347',
        paymentMethod: 'Cash',
        documents: ['COA.pdf', 'Invoice.pdf', 'Shipping Label.pdf'],
        status: 'Delivered',
      },
    ];

    // Insert demo data into DrugImport collection
    await DrugImport.insertMany(demoData);

    res.status(201).json({ message: 'Demo drug data seeded successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error seeding drug data', error });
  }
});

// Fetch API to get all imports
app.get('/import', async (req, res) => {
  try {
    const imports = await DrugImport.find();
    res.status(200).json(imports);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching imports', error });
  }
});

// Login API
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    // Compare the entered password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    res.status(200).json({ message: 'Login successful' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});



// Define schema for Distribution Order
const distributionSchema = new mongoose.Schema({
  orderDetails: {
    customerName: String,
    orderId: String,
    orderDate: Date,
    shippingAddress: String,
    contactPhone: String,
    contactEmail: String,
    status: String,
  },
  productInfo: {
    description: String,
    quantity: Number,
    unitWeight: String,
    totalWeight: String,
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: String,
    },
  },
  analysis: {
    weightDistribution: String,
    shippingClass: String,
    handlingRequirements: [String],
    specialInstructions: String,
  },
  documents: [
    {
      name: String,
      status: String,
      timestamp: Date,
      authorizedBy: String,
    },
  ],
});

// Create Distribution model
const Distribution = mongoose.model('Distribution', distributionSchema);

// Fetch Distribution Details API
app.get('/distribution/:orderId', async (req, res) => {
  const { orderId } = req.params;
  try {
    const distribution = await Distribution.findOne({ 'orderDetails.orderId': orderId });
    if (!distribution) {
      return res.status(404).json({ message: 'Distribution order not found' });
    }
    res.status(200).json(distribution);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching distribution details', error });
  }
});
app.get('/seed2', async (req, res) => {
  try {
    const demoDistributions = [
      {
        orderDetails: {
          customerName: 'PharmaCorp Pvt Ltd',
          orderId: 'DIST001',
          orderDate: new Date('2024-03-15'),
          shippingAddress: '123 Health St, Pharma City',
          contactPhone: '+1 (617) 555-0123',
          contactEmail: 'orders@pharmacorp.com',
          status: 'In Transit',
        },
        productInfo: {
          description: 'Paracetamol 500mg Tablets',
          quantity: 1000,
          unitWeight: '0.5 kg',
          totalWeight: '500 kg',
          dimensions: {
            length: 100,
            width: 80,
            height: 60,
            unit: 'cm',
          },
        },
        analysis: {
          weightDistribution: 'Uniform - Pallet Configuration 4x5',
          shippingClass: 'Class A - Temperature Controlled',
          handlingRequirements: [
            'Temperature control required (2-8°C)',
            'Handle with care - Fragile',
            'Keep away from direct sunlight',
            'Stack maximum 3 layers',
          ],
          specialInstructions: 'Requires cold chain verification at delivery point',
        },
        documents: [
          {
            name: 'Certificate of Analysis',
            status: 'approved',
            timestamp: new Date('2024-03-14T09:30:00'),
            authorizedBy: 'Dr. Sarah Chen',
          },
        ],
         // Add this field
      },
      {
        orderDetails: {
          customerName: 'Global Pharma Inc',
          orderId: 'DIST002',
          orderDate: new Date('2024-03-16'),
          shippingAddress: '45 Medline Rd, Drugsville',
          contactPhone: '+1 (202) 555-9876',
          contactEmail: 'sales@globalpharma.com',
          status: 'In Transit',
        },
        productInfo: {
          description: 'Ibuprofen 200mg Tablets',
          quantity: 500,
          unitWeight: '0.2 kg',
          totalWeight: '100 kg',
          dimensions: {
            length: 120,
            width: 100,
            height: 80,
            unit: 'cm',
          },
        },
        analysis: {
          weightDistribution: 'Uniform - Pallet Configuration 5x5',
          shippingClass: 'Class B',
          handlingRequirements: [
            'Keep in a cool dry place',
            'Do not stack more than 5 layers',
          ],
          specialInstructions: 'Handle with care, do not drop',
        },
        documents: [
          {
            name: 'Certificate of Analysis',
            status: 'approved',
            timestamp: new Date('2024-03-14T09:30:00'),
            authorizedBy: 'Dr. Sarah Chen',
          },
        ],
        
      },
      {
        orderDetails: {
          customerName: 'HealthPlus Ltd',
          orderId: 'DIST003',
          orderDate: new Date('2024-03-17'),
          shippingAddress: '10 Wellness Ave, Cureton',
          contactPhone: '+1 (323) 555-1234',
          contactEmail: 'contact@healthplus.com',
          status: 'Delivered', // Add this field
        },
        productInfo: {
          description: 'Amoxicillin 500mg Capsules',
          quantity: 200,
          unitWeight: '0.1 kg',
          totalWeight: '20 kg',
          dimensions: {
            length: 50,
            width: 50,
            height: 40,
            unit: 'cm',
          },
        },
        analysis: {
          weightDistribution: 'Uniform',
          shippingClass: 'Class C',
          handlingRequirements: [
            'Store in a dry and cool environment',
            'Handle with care - Fragile',
          ],
          specialInstructions: 'Requires inspection at delivery',
        },
        documents: [
          {
            name: 'Certificate of Analysis',
            status: 'approved',
            timestamp: new Date('2024-03-14T08:30:00'),
            authorizedBy: 'Dr. John Smith',
          },
        ],
        
      },
    ];

    // Insert demo data into Distribution collection
    await Distribution.insertMany(demoDistributions);

    res.status(201).json({ message: 'Demo distribution data seeded successfully' });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({
        message: 'Duplicate distribution data',
        error: error.keyValue,
      });
    } else {
      res.status(500).json({ message: 'Error seeding distribution data', error });
    }
  }
});

// Fetch API to get all distributions
app.get('/distribution-add', async (req, res) => {
  try {
    const distributions = await Distribution.find();
    res.status(200).json(distributions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching distributions', error });
  }
});


app.post("/distribution", async (req, res) => {
  try {
    // Validate incoming data
    const {
      orderDetails,
      productInfo,
      analysis,
      documents,
    } = req.body;

    // Create a new distribution order
    const newDistribution = new Distribution({
      orderDetails,
      productInfo,
      analysis,
      documents,
    });

    // Save to database
    await newDistribution.save();

    res.status(201).json({
      message: "New distribution order created successfully!",
      data: newDistribution,
    });
  } catch (error) {
    if (error.code === 11000) {
      // Handle duplicate orderId
      res.status(400).json({
        message: "Order ID already exists. Please use a unique Order ID.",
      });
    } else {
      res.status(500).json({
        message: "Failed to create distribution order.",
        error: error.message,
      });
    }
  }
});



// Start the server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
