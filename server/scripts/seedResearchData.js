const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/scholar_hub';

const researchSeedData = {
  'mahinderkumar@gmail.com': {
    orcidId: '0000-0002-1825-0097',
    scopusId: '57200012345',
    wosId: 'AA-1234-2020',
    googleScholarUrl: 'https://scholar.google.com/citations?user=MahinderKumarHPU',
    vidwanId: '154892',
    hIndex: 22,
    i10Index: 35,
    scopusCitations: 1840,
    googleScholarCitations: 3120,
    publications: [
      {
        title: 'Deep Learning Approaches for Distributed Cloud Resource Allocation in Smart Grids',
        journalName: 'IEEE Transactions on Industrial Informatics',
        year: '2023',
        doi: '10.1109/TII.2023.3245678',
        volume: '19',
        issue: '4',
        openAccessType: 'Gold OA',
        citationCount: 142,
        category: 'Journal Article'
      },
      {
        title: 'Optimized Energy Management Framework for IoT-Enabled Wireless Sensor Networks',
        journalName: 'Journal of Network and Computer Applications',
        year: '2022',
        doi: '10.1016/j.jnca.2022.103456',
        volume: '201',
        issue: '1',
        openAccessType: 'Green OA',
        citationCount: 98,
        category: 'Journal Article'
      },
      {
        title: 'Cybersecurity Threat Detection in Next-Generation Industrial Control Systems',
        journalName: 'ACM Computing Surveys',
        year: '2021',
        doi: '10.1145/3456789',
        volume: '54',
        issue: '3',
        openAccessType: 'Bronze OA',
        citationCount: 215,
        category: 'Journal Article'
      },
      {
        title: 'Blockchain-Assisted Secure Data Transfer Protocol for Smart City Infrastructures',
        journalName: 'IEEE International Conference on Communications (ICC)',
        year: '2020',
        doi: '10.1109/ICC.2020.9123456',
        volume: '1',
        issue: '1',
        openAccessType: 'Closed',
        citationCount: 64,
        category: 'Conference Proceeding'
      }
    ],
    projects: [
      {
        projectTitle: 'AI-Driven Smart Grid Monitoring and Load Optimization Network for Hill Regions',
        fundingAgency: 'Department of Science & Technology (DST) - SERB',
        amount: '4850000',
        duration: '2022-2025',
        role: 'Principal Investigator',
        status: 'Ongoing'
      },
      {
        projectTitle: 'Automated Cyber Threat Intelligence System for Himalayan Public Infrastructure',
        fundingAgency: 'MeitY Government of India',
        amount: '3200000',
        duration: '2020-2023',
        role: 'Principal Investigator',
        status: 'Completed'
      }
    ],
    ipr: [
      {
        title: 'Method and System for Adaptive Cryptographic Key Exchange in Low-Power IoT Devices',
        patentNumber: 'IN202211045678',
        country: 'India',
        filingDate: '2022-08-15',
        grantDate: '2024-02-10',
        status: 'Granted'
      }
    ]
  },

  'pradeepkumar@gmail.com': {
    orcidId: '0000-0001-9234-5678',
    scopusId: '57198765432',
    wosId: 'BB-5678-2019',
    googleScholarUrl: 'https://scholar.google.com/citations?user=PradeepKumarHPU',
    vidwanId: '189421',
    hIndex: 18,
    i10Index: 28,
    scopusCitations: 1450,
    googleScholarCitations: 2480,
    publications: [
      {
        title: 'Synthesis and Characterization of Novel Nanostated Semiconductor Thin Films for Solar Energy Harvesting',
        journalName: 'Solar Energy Materials and Solar Cells',
        year: '2023',
        doi: '10.1016/j.solmat.2023.112345',
        volume: '252',
        issue: '2',
        openAccessType: 'Gold OA',
        citationCount: 110,
        category: 'Journal Article'
      },
      {
        title: 'Thermal Conductivity and Structural Studies of Doped Graphene Oxide Nanocomposites',
        journalName: 'Applied Physics Letters',
        year: '2022',
        doi: '10.1063/5.0089123',
        volume: '120',
        issue: '14',
        openAccessType: 'Bronze OA',
        citationCount: 86,
        category: 'Journal Article'
      },
      {
        title: 'High-Temperature Dielectric Properties of Lead-Free Piezoelectric Ceramics',
        journalName: 'Journal of the American Ceramic Society',
        year: '2020',
        doi: '10.1111/jace.17123',
        volume: '103',
        issue: '8',
        openAccessType: 'Green OA',
        citationCount: 175,
        category: 'Journal Article'
      }
    ],
    projects: [
      {
        projectTitle: 'Development of High-Efficiency Perovskite Solar Cells using Himalayan Mineral Extracts',
        fundingAgency: 'UGC-DAE Consortium for Scientific Research',
        amount: '2800000',
        duration: '2021-2024',
        role: 'Principal Investigator',
        status: 'Ongoing'
      }
    ],
    ipr: [
      {
        title: 'Process for Fabrication of Lead-Free Thermoelectric Thin Film Sensors',
        patentNumber: 'IN202311089123',
        country: 'India',
        filingDate: '2023-04-12',
        grantDate: '',
        status: 'Published'
      }
    ]
  },

  'ayushtest@gmail.com': {
    orcidId: '0000-0003-4567-8901',
    scopusId: '57312345678',
    wosId: 'CC-9012-2022',
    googleScholarUrl: 'https://scholar.google.com/citations?user=AyushTestHPU',
    vidwanId: '204918',
    hIndex: 12,
    i10Index: 16,
    scopusCitations: 620,
    googleScholarCitations: 980,
    publications: [
      {
        title: 'Machine Learning Algorithms for Automated Detection of Plant Diseases in Apple Orchards of Himachal Pradesh',
        journalName: 'Computers and Electronics in Agriculture',
        year: '2024',
        doi: '10.1016/j.compag.2024.108912',
        volume: '218',
        issue: '1',
        openAccessType: 'Gold OA',
        citationCount: 45,
        category: 'Journal Article'
      },
      {
        title: 'Natural Language Processing Model for Multilingual Himalayan Dialects Translation',
        journalName: 'IEEE Access',
        year: '2023',
        doi: '10.1109/ACCESS.2023.3298123',
        volume: '11',
        issue: '1',
        openAccessType: 'Gold OA',
        citationCount: 78,
        category: 'Journal Article'
      },
      {
        title: 'Predictive Analytics for Landslide Susceptibility Mapping using Remote Sensing and AI',
        journalName: 'Geomorphology',
        year: '2022',
        doi: '10.1016/j.geomorph.2022.108123',
        volume: '402',
        issue: '1',
        openAccessType: 'Green OA',
        citationCount: 112,
        category: 'Journal Article'
      }
    ],
    projects: [
      {
        projectTitle: 'AI-Based Early Warning Landslide Prediction System for Shimla-Kinnaur Highway',
        fundingAgency: 'CSIR Government of India',
        amount: '1950000',
        duration: '2023-2025',
        role: 'Co-Principal Investigator',
        status: 'Ongoing'
      }
    ],
    ipr: [
      {
        title: 'System and Handheld Device for Real-Time Soil Moisture and Crop Disease Analytics',
        patentNumber: 'IN202311034123',
        country: 'India',
        filingDate: '2023-11-20',
        grantDate: '2025-01-15',
        status: 'Granted'
      }
    ]
  }
};

async function seedResearchData() {
  try {
    console.log('Connecting to MongoDB:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully.');

    for (const [email, data] of Object.entries(researchSeedData)) {
      const user = await User.findOne({ username: email });
      if (!user) {
        console.warn(`User ${email} not found in database. Skipping.`);
        continue;
      }

      user.profile = user.profile || {};
      user.profile.orcidId = data.orcidId;
      user.profile.scopusId = data.scopusId;
      user.profile.wosId = data.wosId;
      user.profile.googleScholarUrl = data.googleScholarUrl;
      user.profile.vidwanId = data.vidwanId;
      user.profile.hIndex = data.hIndex;
      user.profile.i10Index = data.i10Index;
      user.profile.scopusCitations = data.scopusCitations;
      user.profile.googleScholarCitations = data.googleScholarCitations;
      user.profile.publications = data.publications;
      user.profile.projects = data.projects;
      user.profile.ipr = data.ipr;

      user.profile.metrics = {
        hIndex: data.hIndex,
        i10Index: data.i10Index,
        scopusCitations: data.scopusCitations,
        googleScholarCitations: data.googleScholarCitations
      };

      await user.save();
      console.log(`Successfully seeded research data for ${email} (${user.name})`);
    }

    console.log('All research data seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding research data:', err);
    process.exit(1);
  }
}

seedResearchData();
