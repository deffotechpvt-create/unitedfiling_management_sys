const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Service = require('./models/Service');
const Compliance = require('./models/Compliance');
const Company = require('./models/Company');
const Client = require('./models/Client');
const User = require('./models/User');

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/unitedfillings';

const services = [
    {
        title: "Private Limited Incorporation",
        description: "Start your business with the most popular legal structure.",
        category: "Licenses",
        price: "₹14,999",
        benefits: ["Limited Liability", "Easy Funding", "Perpetual Succession"],
        processSteps: [
            { title: "Name Approval", description: "Submit 2 unique names" },
            { title: "DSC & DIN", description: "Director signatures" },
            { title: "Incorporation", description: "File SPICe+ form" }
        ]
    },
    {
        title: "Trademark Registration",
        description: "Protect your brand identity.",
        category: "Trademarks",
        price: "₹6,999",
        benefits: ["Brand Protection", "Legal Rights", "Asset Creation"],
        processSteps: [
            { title: "Search", description: "Check availability" },
            { title: "Filing", description: "Submit application" }
        ]
    },
    {
        title: "GST Registration",
        description: "Get your GSTIN within 7 days.",
        category: "Taxation",
        price: "₹1,499",
        benefits: ["Legal Compliance", "Input Tax Credit"],
        processSteps: [
            { title: "Docs", description: "Upload PAN/Aadhaar" },
            { title: "Filing", description: "Submit to Portal" }
        ]
    }
];

const seedData = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Seed Services
        await Service.deleteMany();
        const createdServices = await Service.insertMany(services);
        console.log('Services seeded');

        // Get a company and client for mock compliances
        const company = await Company.findOne();
        const client = await Client.findOne();
        const superAdmin = await User.findOne({ role: 'SUPER_ADMIN' });

        if (company && client && superAdmin) {
            const compliances = [
                {
                    company: company._id,
                    client: client._id,
                    serviceType: "Annual Filing",
                    expertName: "Amit Sharma",
                    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
                    stage: "DOCUMENTATION",
                    status: "PENDING",
                    createdBy: superAdmin._id
                },
                {
                    company: company._id,
                    client: client._id,
                    serviceType: "GST Return",
                    expertName: "Priya V",
                    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                    stage: "FILING_DONE",
                    status: "COMPLETED",
                    createdBy: superAdmin._id
                }
            ];
            await Compliance.deleteMany();
            await Compliance.insertMany(compliances);
            console.log('Compliances seeded');
        } else {
            console.log('Skipping compliance seeding: No company/client/superadmin found. Run seed-all.js first.');
        }

        mongoose.connection.close();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedData();
