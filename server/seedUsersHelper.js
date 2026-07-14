const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Thesis = require('./models/Thesis');
const Milestone = require('./models/Milestone');
const Publication = require('./models/Publication');
const RACReview = require('./models/RACReview');
const DRCMeeting = require('./models/DRCMeeting');
const Department = require('./models/Department');
const Notification = require('./models/Notification');
const ChangeRequest = require('./models/ChangeRequest');

// Realistic name lists
const FIRST_NAMES_MALE = [
  'Rajesh', 'Amit', 'Vikram', 'Mahinder', 'Pradeep', 'Rohan', 'Ayush', 'Deepak', 'Sanjay', 'Suresh',
  'Ramesh', 'Rahul', 'Vivek', 'Sandeep', 'Manoj', 'Vijay', 'Anil', 'Sunil', 'Arjun', 'Karan',
  'Pankaj', 'Abhishek', 'Harish', 'Manish', 'Satish', 'Tarun', 'Varun', 'Alok', 'Ashish', 'Gaurav'
];
const FIRST_NAMES_FEMALE = [
  'Sunita', 'Pooja', 'Ritu', 'Priya', 'Sneha', 'Neha', 'Jyoti', 'Anjali', 'Kiran', 'Aarti',
  'Meena', 'Preeti', 'Divya', 'Shweta', 'Monika', 'Renu', 'Kavita', 'Suman', 'Reema', 'Payal',
  'Nisha', 'Rashmi', 'Kajal', 'Sapna', 'Poonam', 'Shalini', 'Kirti', 'Anisha', 'Bhawna', 'Nidhi'
];
const LAST_NAMES = [
  'Sood', 'Kumar', 'Sharma', 'Singh', 'Verma', 'Gupta', 'Patel', 'Mehta', 'Das', 'Malhotra',
  'Joshi', 'Nair', 'Prasad', 'Yadav', 'Reddy', 'Sen', 'Choudhary', 'Bose', 'Rao', 'Mishra',
  'Pandey', 'Trivedi', 'Bahl', 'Sinha', 'Thakur', 'Kapoor', 'Gill', 'Jha', 'Bhatt', 'Nayan'
];

function generateDeterministicName(role, deptCode, index, gender) {
  // Generate deterministic name using code and index
  const combinedCode = deptCode + role + index;
  let codeSum = 0;
  for (let i = 0; i < combinedCode.length; i++) {
    codeSum += combinedCode.charCodeAt(i) * (i + 1);
  }

  const fNames = gender === 'Male' ? FIRST_NAMES_MALE : FIRST_NAMES_FEMALE;
  const firstName = fNames[codeSum % fNames.length];
  const lastName = LAST_NAMES[(codeSum + 7) % LAST_NAMES.length];

  let fullName = `${firstName} ${lastName}`;
  if (role === 'HOD') {
    fullName = `Prof. ${firstName} ${lastName}`;
  } else if (role === 'FACULTY') {
    fullName = `Dr. ${firstName} ${lastName}`;
  }

  return {
    firstName,
    lastName,
    fullName,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${deptCode.toLowerCase()}.${role.toLowerCase()}${index}@gmail.com`
  };
}

// Generate realistic thesis titles based on department code
function generateThesisDetails(deptName, deptCode, index) {
  const topics = {
    CHEM: [
      'Synthesis of Green Catalysts for Organic Reactions',
      'Quantum Chemical Modeling of Molecular Structures',
      'Kinetics of Biodegradable Polymer Decomposition',
      'Synthesis of Biocompatible Nanomaterials for Drug Delivery',
      'Evaluation of Heavy Metal Removal from Waste Water using Organo-clays'
    ],
    CS: [
      'Optimizing Deep Learning Architectures for Resource-Constrained Edge Devices',
      'Secure Blockchain consensus protocols for Decentralized Identity Management',
      'Natural Language Processing models for Translation of Low-Resource Dialects',
      'Explainable AI Frameworks for Automated Medical Image Diagnostics',
      'Robust Federated Learning Protocols under Non-IID Data Distribution'
    ],
    DSAI: [
      'Predictive Analytics for Cancer Prognosis using Multimodal Genomic Data',
      'Generative Adversarial Networks for Synthetic Medical Data Generation',
      'Deep Reinforcement Learning for Dynamic Portfolio Optimization',
      'Scalable Graph Neural Networks for Large-Scale Social Network Analysis',
      'Self-Supervised Representation Learning for Audio Signals'
    ],
    FORS: [
      'Advanced Forensic DNA Phenotyping for Complex Human Identification',
      'Isotopic Analysis of Soil and Water in Forensic Criminal Investigation',
      'Chemical Characterization of Novel Psychoactive Substances in Seized Samples',
      'Digital Forensic Reconstruction of Encrypted Communication Channels',
      'Forensic Ballistics Analysis using Three-Dimensional Scanning Technology'
    ]
  };

  const code = deptCode.toUpperCase();
  const titleList = topics[code] || [
    `Advanced Studies in ${deptName} and its Applications`,
    `A Multi-dimensional Analysis of Current Paradigms in ${deptName}`,
    `Experimental Evaluation of Modern Methods in ${deptName}`,
    `Theoretical Foundations and Mathematical Models of ${deptName}`,
    `Novel Approaches and Comparative Evaluation in ${deptName}`
  ];

  const title = titleList[index % titleList.length];
  const abstract = `This research project titled "${title}" aims to provide a comprehensive investigation into this topic within the field of ${deptName}. By leveraging state-of-the-art methodology, numerical models, and robust experimental validation, this doctoral thesis attempts to solve critical research questions and establish a new benchmark in scientific literature.`;
  const keywords = `${deptName}, ${deptCode}, Research, Investigation, Optimization, Analysis`;

  return { title, abstract, keywords };
}

async function seedUserData(selectedDepartments, studentCount = 10, facultyCount = 5) {
  console.log('Starting custom dynamic user seeding database process...');
  console.log('Params:', { selectedDepartments, studentCount, facultyCount });

  // 1. Copy sample.pdf to server/uploads/sample.pdf
  const sampleSrc = path.join(__dirname, '../sample/sample.pdf');
  const uploadsDir = path.join(__dirname, 'uploads');
  const sampleDest = path.join(uploadsDir, 'sample.pdf');

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  if (fs.existsSync(sampleSrc)) {
    fs.copyFileSync(sampleSrc, sampleDest);
    console.log('📁 sample.pdf copied to server/uploads/sample.pdf successfully.');
  } else {
    console.warn('⚠️ Warning: sample/sample.pdf was not found at root.');
    fs.writeFileSync(sampleDest, '%PDF-1.4 ... dummy content ...');
    console.log('📁 Created a fallback dummy PDF file.');
  }

  // 2. Hash password once to reuse
  const passwordHash = await bcrypt.hash('password', 10);
  console.log('🔑 Password "password" pre-hashed successfully.');

  // 3. Clear database collections (Wipe out everything for a clean seed)
  console.log('🧹 Clearing old collections...');
  await User.deleteMany({});
  await Thesis.deleteMany({});
  await Milestone.deleteMany({});
  await Publication.deleteMany({});
  await RACReview.deleteMany({});
  await DRCMeeting.deleteMany({});
  await Notification.deleteMany({});
  await ChangeRequest.deleteMany({});
  await Department.deleteMany({});
  console.log('🧹 Cleanup complete.');

  // 4. Seed academic departments list
  const departmentsToSeed = [
    { name: 'Department of Chemistry', code: 'CHEM' },
    { name: 'Department of Computer Science', code: 'CS' },
    { name: 'Department of Data Science and Artificial Intelligence', code: 'DSAI' },
    { name: 'Department of Electronics', code: 'ELEX' },
    { name: 'Department of Geography', code: 'GEOG' },
    { name: 'Department of Mathematics', code: 'MATH' },
    { name: 'Department of Physics', code: 'PHYS' },
    { name: 'Department of Archaeology (Ancient History & Archaeology)', code: 'ARCH' },
    { name: 'Department of Defence and Strategic Studies', code: 'DSS' },
    { name: 'Department of Economics', code: 'ECON' },
    { name: 'Department of History', code: 'HIST' },
    { name: 'Department of Journalism and Mass Communications', code: 'JMC' },
    { name: 'Department of Library and Information Science', code: 'LIS' },
    { name: 'Department of Life Long Learning', code: 'LLL' },
    { name: 'Department of Political Science', code: 'POL' },
    { name: 'Department of Population Studies', code: 'POPS' },
    { name: 'Department of Psychology', code: 'PSY' },
    { name: 'Department of Public Administration', code: 'PA' },
    { name: 'Department of Sociology and Social Work', code: 'SSW' },
    { name: 'Department of Yoga Studies', code: 'YS' },
    { name: 'Department of Bio Sciences', code: 'BIOS' },
    { name: 'Department of Bio Technology', code: 'BIOT' },
    { name: 'Department of Environmental Science', code: 'ENVS' },
    { name: 'Department of Forensic Science', code: 'FORS' },
    { name: 'Department of Microbiology', code: 'MICRO' },
    { name: 'Centre for Buddhist Studies', code: 'CBS' },
    { name: 'Department of English', code: 'ENG' },
    { name: 'Department of Hindi', code: 'HIN' },
    { name: 'Department of Modern European and Foreign Languages', code: 'MEFL' },
    { name: 'Department of Sanskrit', code: 'SKT' },
    { name: 'Department of Applied Sciences & Humanities', code: 'ASH' },
    { name: 'Department of Civil Engineering', code: 'CIVIL' },
    { name: 'Department of Computer Science Engineering', code: 'CSE' },
    { name: 'Department of Electrical Engineering', code: 'EE' },
    { name: 'Department of Electronics and Communication', code: 'ECE' },
    { name: 'Department of Information Technology', code: 'IT' },
    { name: 'Department of Commerce', code: 'COMM' },
    { name: 'Institute of Vocational Studies', code: 'IVS' },
    { name: 'International Institute of Management Studies (HPU Business School)', code: 'IIMS' },
    { name: 'Department of Education', code: 'EDU' },
    { name: 'Department of Physical Education', code: 'PE' },
    { name: 'Department of Teacher Education', code: 'TE' },
    { name: 'Department of Performing Arts (Music, Dance, and Dramatics)', code: 'DPA' },
    { name: 'Department of Visual Arts (Painting, Commercial Art, and Sculpture)', code: 'DVA' },
    { name: 'Department of Law', code: 'LAW' },
    { name: 'Department of Interdisciplinary Studies', code: 'IDS' }
  ];
  await Department.insertMany(departmentsToSeed);
  console.log(`🏛️ Seeded ${departmentsToSeed.length} academic departments.`);

  // 5. Ensure Super Admin exists
  await User.create({
    name: 'Super Administrator',
    username: 'admin',
    password: 'password',
    role: 'SUPER_ADMIN',
    isActive: true,
    isVerified: true, isEmailVerified: true,
    profileCompleted: true,
    profile: {
      email: 'admin@scholarsync.com',
      phoneNumber: '+91 99999-88888'
    }
  });
  console.log('👑 Super Admin user seeded (admin/password).');

  // Parse limits
  const S = Math.max(3, parseInt(studentCount) || 10);
  const F = Math.max(3, parseInt(facultyCount) || 5);

  // Determine target departments
  let targetDeptNames = Array.isArray(selectedDepartments) && selectedDepartments.length > 0
    ? selectedDepartments
    : [];

  if (targetDeptNames.length === 0) {
    targetDeptNames = departmentsToSeed.map(d => d.name);
  }

  const depts = await Department.find({ name: { $in: targetDeptNames } });

  // Ensure Forensic Science staff is always generated so the 3 special students have their HOD/Supervisor
  let staffDepts = [...depts];
  if (!staffDepts.some(d => d.code === 'FORS')) {
    const forsDept = await Department.findOne({ code: 'FORS' });
    if (forsDept) {
      staffDepts.push(forsDept);
    }
  }
  
  // Storage arrays for bulk insertions
  const usersToInsert = [];
  const facultyByDept = {}; // deptCode -> array of faculty user objects
  const hodByDept = {};     // deptCode -> HOD user object

  console.log('Generating HOD and Faculty user objects...');
  for (const dept of staffDepts) {
    const code = dept.code;
    const deptName = dept.name;

    facultyByDept[code] = [];

    // HOD details
    let hodDetails;
    if (code === 'FORS') {
      hodDetails = {
        name: 'Prof. Mahinder Kumar',
        username: 'mahinderkumar@gmail.com'
      };
    } else {
      const details = generateDeterministicName('HOD', code, 0, 'Male');
      hodDetails = {
        name: details.fullName,
        username: details.email
      };
    }

    const hodObj = {
      name: hodDetails.name,
      username: hodDetails.username,
      password: passwordHash,
      role: 'HOD',
      subRole: 'HOD',
      department: deptName,
      isActive: true,
      isVerified: true, isEmailVerified: true,
      profileCompleted: true,
      profile: {
        phoneNumber: '+91 94180-11111',
        designation: 'Professor & Head',
        specialization: `Advanced Research in ${deptName}`,
        officeRoom: `Room 101, HOD Office, ${deptName} Block`,
        yearsOfService: 15,
        dob: '1970-05-15',
        gender: 'Male',
        nationality: 'Indian'
      }
    };
    usersToInsert.push(hodObj);

    // F Faculty details (minimum 3)
    for (let f = 0; f < F; f++) {
      let facDetails;
      const gender = f % 2 === 0 ? 'Male' : 'Female';
      if (code === 'FORS' && f === 0) {
        facDetails = {
          name: 'Prof. Pradeep Kumar',
          username: 'pradeepkumar@gmail.com'
        };
      } else {
        const details = generateDeterministicName('FACULTY', code, f, gender);
        facDetails = {
          name: details.fullName,
          username: details.email
        };
      }

      const facultyObj = {
        name: facDetails.name,
        username: facDetails.username,
        password: passwordHash,
        role: 'FACULTY',
        subRole: 'SUPERVISOR',
        department: deptName,
        isActive: true,
        isVerified: true, isEmailVerified: true,
        profileCompleted: true,
        profile: {
          phoneNumber: `+91 98160-2222${f}`,
          designation: f === 0 ? 'Professor' : f < 3 ? 'Associate Professor' : 'Assistant Professor',
          specialization: `Specialized study in ${deptName}`,
          officeRoom: `Room 20${f + 1}, ${deptName} Block`,
          yearsOfService: 10 - f,
          dob: `198${f}-08-12`,
          gender,
          nationality: 'Indian'
        }
      };
      usersToInsert.push(facultyObj);
    }
  }

  console.log(`Inserting ${usersToInsert.length} HOD and Faculty accounts...`);
  const insertedStaff = await User.insertMany(usersToInsert);
  
  // Categorize staff
  for (const staff of insertedStaff) {
    const deptObj = departmentsToSeed.find(d => d.name === staff.department);
    if (!deptObj) continue;
    const code = deptObj.code;
    
    if (!facultyByDept[code]) {
      facultyByDept[code] = [];
    }

    if (staff.role === 'HOD') {
      hodByDept[code] = staff;
    } else if (staff.role === 'FACULTY') {
      facultyByDept[code].push(staff);
    }
  }

  // Generate students
  const studentsToInsert = [];
  console.log(`Generating Student user objects (${S} per department)...`);

  for (const dept of depts) {
    const code = dept.code;
    const deptName = dept.name;

    for (let s = 0; s < S; s++) {
      const gender = s % 2 === 0 ? 'Male' : 'Female';
      const details = generateDeterministicName('STUDENT', code, s, gender);
      const studDetails = {
        name: details.fullName,
        username: details.email
      };

      const assignedFaculty = facultyByDept[code][s % F]; // map s to s % F dynamically
      const thesisMeta = generateThesisDetails(deptName, code, s);

      // Determine proportional milestone status
      const statusMod = s % 3;
      let admissionDate = '2025-09-01';
      if (statusMod === 0) {
        // Degree Completed (AWARDED): 3.5 years ago
        admissionDate = '2022-09-01';
      } else if (statusMod === 1) {
        // Active Research: 1.5 years ago
        admissionDate = '2024-12-01';
      } else {
        // Coursework: 5 months ago
        admissionDate = '2026-01-15';
      }

      const shNo = Math.floor(100000000 + Math.random() * 900000000).toString();

      const studentObj = {
        name: studDetails.name,
        username: studDetails.username,
        password: passwordHash,
        role: 'STUDENT',
        department: deptName,
        isActive: true,
        isVerified: true, isEmailVerified: true,
        profileCompleted: true,
        profile: {
          shNo,
          phoneNumber: `+91 98765-333${s}0`,
          dob: `199${s}-04-10`,
          gender,
          category: s % 3 === 0 ? 'OBC' : s % 4 === 0 ? 'SC' : 'General',
          fatherName: `Shri R. K. ${LAST_NAMES[s % LAST_NAMES.length]}`,
          motherName: `Smt. Asha ${LAST_NAMES[(s + 2) % LAST_NAMES.length]}`,
          nationality: 'Indian',
          admissionDate,
          enrollmentNumber: `${code}/2022/0${s + 1}`,
          phdMode: s % 5 === 0 ? 'PART_TIME' : 'FULL_TIME',
          preferredGuideId: assignedFaculty ? assignedFaculty._id.toString() : '',
          thesisTitle: thesisMeta.title,
          thesisSummary: thesisMeta.abstract,
          thesisKeywords: thesisMeta.keywords,
          qualifications: {
            class10: { board: 'CBSE', year: 2012, percentage: 90 },
            class12: { board: 'CBSE', year: 2014, percentage: 88 },
            graduation: { degree: `B.Sc. ${deptName.replace('Department of ', '')}`, university: 'HPU', year: 2017, percentage: 80 },
            postGraduation: { degree: `M.Sc. ${deptName.replace('Department of ', '')}`, university: 'HPU', year: 2019, percentage: 83 }
          }
        }
      };

      studentsToInsert.push(studentObj);
    }
  }

  // Always seed the additional 3 ID's in forensic science
  const forsDeptObj = await Department.findOne({ code: 'FORS' });
  if (forsDeptObj) {
    const code = 'FORS';
    const deptName = forsDeptObj.name;
    const assignedFaculty = facultyByDept[code] ? facultyByDept[code][0] : null;

    const specialStudents = [
      {
        name: 'Mr. Ayush Sood',
        username: 'ayushsood@gmail.com',
        password: passwordHash,
        role: 'STUDENT',
        department: deptName,
        isActive: true,
        isVerified: true, isEmailVerified: true,
        profileCompleted: true,
        profile: {
          shNo: Math.floor(100000000 + Math.random() * 900000000).toString(),
          phoneNumber: '+91 98765-33300',
          dob: '1990-04-10',
          gender: 'Male',
          category: 'General',
          fatherName: 'Shri R. K. Sood',
          motherName: 'Smt. Asha Sood',
          nationality: 'Indian',
          admissionDate: '2024-11-01', // 19 months ago (active research, has mphil)
          enrollmentNumber: 'FORS/2024/001',
          phdMode: 'FULL_TIME',
          preferredGuideId: assignedFaculty ? assignedFaculty._id.toString() : '',
          thesisTitle: 'Advanced Forensic DNA Phenotyping for Complex Human Identification',
          thesisSummary: 'This research project focuses on advanced genetic markers to predict visible physical traits from DNA.',
          thesisKeywords: 'Forensic Science, DNA, Phenotyping, Genetics',
          qualifications: {
            class10: { board: 'CBSE', year: 2012, percentage: 90 },
            class12: { board: 'CBSE', year: 2014, percentage: 88 },
            graduation: { degree: 'B.Sc. Forensic Science', university: 'HPU', year: 2017, percentage: 80 },
            postGraduation: { degree: 'M.Sc. Forensic Science', university: 'HPU', year: 2019, percentage: 83 },
            mphil: {
              done: true,
              university: 'Delhi University',
              passingYear: '2021',
              totalMarks: '1000',
              marksObtained: '850',
              percentage: '85.00',
              certificateUrl: '/uploads/sample.pdf'
            }
          }
        }
      },
      {
        name: 'Suman Thakur',
        username: 'sumanthakur@gmail.com',
        password: passwordHash,
        role: 'STUDENT',
        department: deptName,
        isActive: true,
        isVerified: true, isEmailVerified: true,
        profileCompleted: true,
        profile: {
          shNo: Math.floor(100000000 + Math.random() * 900000000).toString(),
          phoneNumber: '+91 98765-33301',
          dob: '1992-05-12',
          gender: 'Female',
          category: 'OBC',
          fatherName: 'Shri S. K. Thakur',
          motherName: 'Smt. Renu Thakur',
          nationality: 'Indian',
          admissionDate: '2025-12-01', // coursework phase
          enrollmentNumber: 'FORS/2025/002',
          phdMode: 'FULL_TIME',
          preferredGuideId: assignedFaculty ? assignedFaculty._id.toString() : '',
          thesisTitle: 'Chemical Characterization of Novel Psychoactive Substances',
          thesisSummary: 'Identifying designer drugs in seized materials using advanced spectroscopy.',
          thesisKeywords: 'Forensic, Chemical, Toxicology, Spectroscopy',
          qualifications: {
            class10: { board: 'CBSE', year: 2014, percentage: 88 },
            class12: { board: 'CBSE', year: 2016, percentage: 86 },
            graduation: { degree: 'B.Sc. Chemistry', university: 'HPU', year: 2019, percentage: 78 },
            postGraduation: { degree: 'M.Sc. Forensic Science', university: 'HPU', year: 2021, percentage: 81 },
            mphil: {
              done: false
            }
          }
        }
      },
      {
        name: 'Gaurav Patel',
        username: 'gauravpatel@gmail.com',
        password: passwordHash,
        role: 'STUDENT',
        department: deptName,
        isActive: true,
        isVerified: true, isEmailVerified: true,
        profileCompleted: true,
        profile: {
          shNo: Math.floor(100000000 + Math.random() * 900000000).toString(),
          phoneNumber: '+91 98765-33302',
          dob: '1989-08-15',
          gender: 'Male',
          category: 'General',
          fatherName: 'Shri A. K. Patel',
          motherName: 'Smt. Sunita Patel',
          nationality: 'Indian',
          admissionDate: '2022-09-01', // awarded phase
          enrollmentNumber: 'FORS/2022/003',
          phdMode: 'FULL_TIME',
          preferredGuideId: assignedFaculty ? assignedFaculty._id.toString() : '',
          thesisTitle: 'Digital Forensic Reconstruction of Encrypted Communication Channels',
          thesisSummary: 'Decrypting trace communication artifacts from mobile forensic acquisitions.',
          thesisKeywords: 'Digital Forensics, Encryption, Security, Cryptography',
          qualifications: {
            class10: { board: 'CBSE', year: 2010, percentage: 92 },
            class12: { board: 'CBSE', year: 2012, percentage: 90 },
            graduation: { degree: 'B.Tech IT', university: 'HPU', year: 2016, percentage: 82 },
            postGraduation: { degree: 'M.Tech IT', university: 'HPU', year: 2018, percentage: 84 },
            mphil: {
              done: false
            }
          }
        }
      }
    ];

    for (const specStud of specialStudents) {
      studentsToInsert.push(specStud);
    }
  }

  console.log(`Inserting ${studentsToInsert.length} Scholar accounts...`);
  const insertedStudents = await User.insertMany(studentsToInsert);

  // Storage arrays for progress/lifecycle seeding
  const thesesToInsert = [];
  const milestonesToInsert = [];
  const publicationsToInsert = [];
  const reviewsToInsert = [];
  const meetingsToInsert = [];
  const notificationsToInsert = [];

  // Map students by dept
  // Map students by dept
  const studentsByDeptCode = {};
  for (const student of insertedStudents) {
    const deptObj = departmentsToSeed.find(d => d.name === student.department);
    if (!deptObj) continue;
    const code = deptObj.code;
    if (!studentsByDeptCode[code]) {
      studentsByDeptCode[code] = [];
    }
    studentsByDeptCode[code].push(student);
  }

  // Timeline insertion
  const allDeptCodes = Object.keys(studentsByDeptCode);
  for (const code of allDeptCodes) {
    const deptObj = departmentsToSeed.find(d => d.code === code);
    if (!deptObj) continue;
    const deptName = deptObj.name;
    const deptStudents = studentsByDeptCode[code] || [];
    const deptFaculty = facultyByDept[code] || [];
    const deptHOD = hodByDept[code];

    for (let s = 0; s < deptStudents.length; s++) {
      const student = deptStudents[s];
      const supervisor = deptFaculty.length > 0 ? deptFaculty[s % deptFaculty.length] : null;
      if (!supervisor) continue;
      
      let statusMod = s % 3;
      if (student.username === 'ayushsood@gmail.com') statusMod = 1;
      else if (student.username === 'sumanthakur@gmail.com') statusMod = 2;
      else if (student.username === 'gauravpatel@gmail.com') statusMod = 0;

      let status = 'COURSEWORK';
      let courseworkCompleted = false;
      let enrollmentVerified = true;
      let startDate = null;
      let submittedAt = null;
      let awardedAt = null;
      
      let vivaDate = null;
      let vivaTime = '';
      let vivaVenue = '';
      let vivaPanel = '';
      let vivaStatus = 'NOT_SCHEDULED';
      let vivaRemarks = '';
      let dispatchDate = null;
      let dispatchMethod = '';
      let dispatchTrackingNumber = '';

      const auditLog = [];
      const regDate = new Date(student.profile.admissionDate);
      const regDateString = regDate.toDateString();

      if (statusMod === 0) {
        // 🎓 AWARDED Timeline (Degree completed)
        status = 'AWARDED';
        courseworkCompleted = true;
        startDate = new Date(regDate.getTime() + 45 * 24 * 60 * 60 * 1000);
        submittedAt = new Date('2026-05-15');
        awardedAt = new Date('2026-06-10');

        vivaDate = new Date('2026-06-05');
        vivaTime = '11:00 AM';
        vivaVenue = `${deptName} Board Room`;
        vivaPanel = `Prof. R.K. Sen (External Examiner), ${deptHOD ? deptHOD.name : 'HOD'} (HOD), ${supervisor ? supervisor.name : 'Supervisor'} (Supervisor)`;
        vivaStatus = 'SUCCESSFUL';
        vivaRemarks = 'The candidate defended the thesis exceptionally well. Highly recommended for Ph.D. award.';
        
        dispatchDate = new Date('2026-05-20');
        dispatchMethod = 'DHL Express';
        dispatchTrackingNumber = `DHL-${code}-2026-000${s}`;

        auditLog.push(
          { action: 'REGISTRATION_SUBMITTED', note: `Profile submitted on ${regDateString}`, date: regDate },
          { action: 'ENROLLMENT_VERIFIED', note: `Verified by HOD on ${new Date(regDate.getTime() + 10 * 24 * 60 * 60 * 1000).toDateString()}`, date: new Date(regDate.getTime() + 10 * 24 * 60 * 60 * 1000) },
          { action: 'SUPERVISOR_ASSIGNED', note: `Supervisor ${supervisor.name} assigned by HOD`, date: new Date(regDate.getTime() + 10 * 24 * 60 * 60 * 1000) },
          { action: 'COURSEWORK_CLEARED', note: `Coursework completed on 2023-04-15`, date: new Date('2023-04-15') },
          { action: 'DRC_APPROVED', note: `DRC approved synopsis. Active research started.`, date: new Date('2023-05-20') },
          { action: 'SEMINAR_CLEARED', note: `Pre-submission seminar presentation was successful.`, date: new Date('2026-05-10') },
          { action: 'FINAL_APPROVED', note: `Final digital approval by supervisor.`, date: new Date('2026-05-15') },
          { action: 'THESIS_DISPATCHED', note: `Thesis dispatched to external examiners.`, date: new Date('2026-05-20') },
          { action: 'VIVA_OUTCOME_LOGGED', note: `Viva-Voce successfully defended.`, date: new Date('2026-06-05') },
          { action: 'DEGREE_AWARDED', note: `Formally awarded Ph.D. degree.`, date: new Date('2026-06-10') }
        );
      } else if (statusMod === 1) {
        // 🔬 ACTIVE_RESEARCH Timeline
        status = 'ACTIVE_RESEARCH';
        courseworkCompleted = true;
        startDate = new Date(regDate.getTime() + 45 * 24 * 60 * 60 * 1000);

        auditLog.push(
          { action: 'REGISTRATION_SUBMITTED', note: `Profile submitted on ${regDateString}`, date: regDate },
          { action: 'ENROLLMENT_VERIFIED', note: `Verified by HOD`, date: new Date(regDate.getTime() + 10 * 24 * 60 * 60 * 1000) },
          { action: 'COURSEWORK_CLEARED', note: `Coursework completed`, date: new Date(regDate.getTime() + 180 * 24 * 60 * 60 * 1000) },
          { action: 'DRC_APPROVED', note: `DRC approved synopsis. Active research started.`, date: new Date(regDate.getTime() + 220 * 24 * 60 * 60 * 1000) }
        );
      } else {
        // 📖 COURSEWORK Timeline
        status = 'COURSEWORK';
        courseworkCompleted = false;

        auditLog.push(
          { action: 'REGISTRATION_SUBMITTED', note: `Profile submitted on ${regDateString}`, date: regDate },
          { action: 'ENROLLMENT_VERIFIED', note: `Verified by HOD`, date: new Date(regDate.getTime() + 10 * 24 * 60 * 60 * 1000) }
        );
      }

      const thesisObj = {
        scholarId: student._id,
        supervisorId: supervisor._id,
        department: deptName,
        title: student.profile.thesisTitle,
        enrollmentNumber: student.profile.enrollmentNumber,
        abstract: student.profile.thesisSummary,
        keywords: student.profile.thesisKeywords,
        status,
        courseworkCompleted,
        enrollmentVerified,
        startDate,
        submittedAt,
        awardedAt,
        vivaDate,
        vivaTime,
        vivaVenue,
        vivaPanel,
        vivaStatus,
        vivaRemarks,
        dispatchDate,
        dispatchMethod,
        dispatchTrackingNumber,
        auditLog
      };

      thesesToInsert.push(thesisObj);
    }
  }

  console.log(`Inserting ${thesesToInsert.length} Thesis documents...`);
  const insertedTheses = await Thesis.insertMany(thesesToInsert);

  const thesisByScholar = {};
  for (const thesis of insertedTheses) {
    thesisByScholar[thesis.scholarId.toString()] = thesis;
  }

  console.log('Generating Milestone, Review, Publication, and Meeting objects...');
  for (const dept of depts) {
    const code = dept.code;
    const deptName = dept.name;
    const deptStudents = studentsByDeptCode[code] || [];
    const deptFaculty = facultyByDept[code] || [];
    const deptHOD = hodByDept[code];

    for (let s = 0; s < deptStudents.length; s++) {
      const student = deptStudents[s];
      const supervisor = deptFaculty[s % F];
      const thesis = thesisByScholar[student._id.toString()];
      if (!thesis) continue;

      const baseDate = new Date(student.profile.admissionDate);
      const statusMod = s % 3;

      if (statusMod === 0) {
        // 🎓 AWARDED Scholar records

        // A. Synopsis
        const synopsisMilestone = {
          thesisId: thesis._id,
          type: 'SYNOPSIS',
          title: 'Research Synopsis',
          sequence: 1,
          status: 'APPROVED',
          documentUrl: '/uploads/sample.pdf',
          submittedAt: new Date(baseDate.getTime() + 250 * 24 * 60 * 60 * 1000),
          reviewedAt: new Date(baseDate.getTime() + 255 * 24 * 60 * 60 * 1000),
          comments: [{
            authorId: supervisor._id,
            authorName: supervisor.name,
            text: 'Excellent research synopsis proposal.'
          }]
        };

        meetingsToInsert.push({
          scholarId: student._id,
          thesisId: thesis._id,
          title: 'DRC Synopsis Approval Meeting',
          scheduledDate: new Date(baseDate.getTime() + 260 * 24 * 60 * 60 * 1000),
          scheduledTime: '11:00 AM',
          venue: `${deptName} Board Room`,
          committeeMembers: `${deptHOD ? deptHOD.name : 'HOD'}, ${supervisor.name}`,
          isSynopsisApproval: true,
          agenda: 'Review research synopsis.',
          status: 'APPROVED',
          remarks: 'Synopsis approved.'
        });

        // B. 6 progress reports and 6 RAC reviews
        for (let r = 1; r <= 6; r++) {
          const reportDate = new Date(baseDate.getTime() + (260 + r * 180) * 24 * 60 * 60 * 1000);
          milestonesToInsert.push({
            thesisId: thesis._id,
            type: '6_MONTH_REPORT',
            title: `Research Progress Report #${r}`,
            sequence: r,
            status: 'APPROVED',
            documentUrl: '/uploads/sample.pdf',
            dueDate: new Date(reportDate.getTime() + 15 * 24 * 60 * 60 * 1000),
            submittedAt: reportDate,
            reviewedAt: new Date(reportDate.getTime() + 3 * 24 * 60 * 60 * 1000),
            comments: [{
              authorId: supervisor._id,
              authorName: supervisor.name,
              text: `Semester ${r} progress report approved.`
            }]
          });

          reviewsToInsert.push({
            scholarId: student._id,
            thesisId: thesis._id,
            racNumber: r,
            scheduledDate: reportDate,
            committeeMembers: `${supervisor.name}, Dr. Anil Sharma`,
            progressReportUrl: '/uploads/sample.pdf',
            remarks: `Satisfactory work in Semester ${r}.`,
            status: 'SATISFACTORY',
            researchProgress: 'Satisfactory.',
            nextMilestones: r === 6 ? 'Pre-submission draft' : `Semester ${r + 1} progress`,
            committeeChairedBy: supervisor.name
          });
        }

        // C. Publications (2 Journals, 2 Conferences)
        publicationsToInsert.push(
          {
            scholarId: student._id,
            thesisId: thesis._id,
            type: 'JOURNAL',
            title: `Journal Article on ${thesis.title.slice(0, 40)}`,
            journalName: `International Journal of ${deptName.replace('Department of ', '')}`,
            issn: `1092-000${s}`,
            paperLink: 'https://doi.org/10.1016/j.gen.2026.01',
            doiUrl: '10.1016/j.gen.2026.01',
            documentUrl: '/uploads/sample.pdf',
            status: 'VERIFIED',
            remarks: 'Verified.'
          },
          {
            scholarId: student._id,
            thesisId: thesis._id,
            type: 'JOURNAL',
            title: `Experimental Methods in ${deptName.replace('Department of ', '')}`,
            journalName: `IEEE Transactions on ${deptName.replace('Department of ', '')}`,
            issn: `1092-000${s + 1}`,
            paperLink: 'https://doi.org/10.1109/trans.2026.02',
            doiUrl: '10.1109/trans.2026.02',
            documentUrl: '/uploads/sample.pdf',
            status: 'VERIFIED',
            remarks: 'Verified.'
          },
          {
            scholarId: student._id,
            thesisId: thesis._id,
            type: 'CONFERENCE',
            title: `Conference Paper on ${thesis.title.slice(0, 30)}`,
            journalName: `National Symposium on Advanced ${deptName.replace('Department of ', '')}`,
            paperLink: 'https://conference-systems.org/paper-01',
            documentUrl: '/uploads/sample.pdf',
            status: 'VERIFIED',
            remarks: 'Verified.'
          },
          {
            scholarId: student._id,
            thesisId: thesis._id,
            type: 'CONFERENCE',
            title: `Comparative benchmarks in ${deptName.replace('Department of ', '')}`,
            journalName: `Annual International Conference on ${deptName.replace('Department of ', '')}`,
            paperLink: 'https://conference-systems.org/paper-02',
            documentUrl: '/uploads/sample.pdf',
            status: 'VERIFIED',
            remarks: 'Verified.'
          }
        );

        // D. Pre-Submission
        milestonesToInsert.push({
          thesisId: thesis._id,
          type: 'PRE_SUBMISSION',
          title: 'Pre-Submission Thesis Draft & Plagiarism Package',
          sequence: 99,
          status: 'APPROVED',
          documentUrl: '/uploads/sample.pdf',
          plagiarismReportUrl: '/uploads/sample.pdf',
          submittedAt: new Date('2026-05-01'),
          reviewedAt: new Date('2026-05-05'),
          comments: [{
            authorId: supervisor._id,
            authorName: supervisor.name,
            text: 'Pre-submission draft cleared.'
          }]
        });

        meetingsToInsert.push({
          scholarId: student._id,
          thesisId: thesis._id,
          title: 'Pre-Submission Thesis Seminar',
          scheduledDate: new Date('2026-05-10'),
          scheduledTime: '10:00 AM',
          venue: `${deptName} Seminar Hall`,
          committeeMembers: `${deptHOD ? deptHOD.name : 'HOD'}, ${supervisor.name}`,
          isSynopsisApproval: false,
          agenda: 'Evaluate pre-submission seminar.',
          status: 'APPROVED',
          remarks: 'Seminar approved.'
        });

        // E. Final Submission
        milestonesToInsert.push({
          thesisId: thesis._id,
          type: 'FINAL_SUBMISSION',
          title: 'Final Thesis Submission Package',
          sequence: 100,
          status: 'APPROVED',
          documentUrl: '/uploads/sample.pdf',
          plagiarismReportUrl: '/uploads/sample.pdf',
          submittedAt: new Date('2026-05-15'),
          reviewedAt: new Date('2026-05-18'),
          comments: [{
            authorId: supervisor._id,
            authorName: supervisor.name,
            text: 'Final signed thesis approved.'
          }]
        });

        milestonesToInsert.push(synopsisMilestone);

        notificationsToInsert.push({
          recipient: student._id,
          title: '🎓 Ph.D. Degree Awarded! Congratulations Doctor!',
          message: `Congratulations, Dr. ${student.name}! Your Ph.D. degree has been awarded!`,
          type: 'SUCCESSFUL_ACTION',
          link: 'overview'
        });

      } else if (statusMod === 1) {
        // 🔬 ACTIVE_RESEARCH Scholar records

        // A. Synopsis
        milestonesToInsert.push({
          thesisId: thesis._id,
          type: 'SYNOPSIS',
          title: 'Research Synopsis',
          sequence: 1,
          status: 'APPROVED',
          documentUrl: '/uploads/sample.pdf',
          submittedAt: new Date(baseDate.getTime() + 250 * 24 * 60 * 60 * 1000),
          reviewedAt: new Date(baseDate.getTime() + 255 * 24 * 60 * 60 * 1000)
        });

        meetingsToInsert.push({
          scholarId: student._id,
          thesisId: thesis._id,
          title: 'DRC Synopsis Approval Meeting',
          scheduledDate: new Date(baseDate.getTime() + 260 * 24 * 60 * 60 * 1000),
          scheduledTime: '11:00 AM',
          venue: `${deptName} Seminar Hall`,
          committeeMembers: `${deptHOD ? deptHOD.name : 'HOD'}, ${supervisor.name}`,
          isSynopsisApproval: true,
          status: 'APPROVED',
          remarks: 'Synopsis approved.'
        });

        // B. 2 progress reports & RAC reviews
        for (let r = 1; r <= 2; r++) {
          const reportDate = new Date(baseDate.getTime() + (260 + r * 180) * 24 * 60 * 60 * 1000);
          milestonesToInsert.push({
            thesisId: thesis._id,
            type: '6_MONTH_REPORT',
            title: `Research Progress Report #${r}`,
            sequence: r,
            status: 'APPROVED',
            documentUrl: '/uploads/sample.pdf',
            submittedAt: reportDate,
            reviewedAt: new Date(reportDate.getTime() + 3 * 24 * 60 * 60 * 1000)
          });

          reviewsToInsert.push({
            scholarId: student._id,
            thesisId: thesis._id,
            racNumber: r,
            scheduledDate: reportDate,
            remarks: 'Satisfactory.',
            status: 'SATISFACTORY'
          });
        }
      }
      // COURSEWORK (statusMod === 2) has no milestones/reviews yet!
    }
  }

  console.log(`Inserting ${milestonesToInsert.length} Milestone documents...`);
  const insertedMilestones = await Milestone.insertMany(milestonesToInsert);

  // Map milestones to RAC reviews
  for (const milestone of insertedMilestones) {
    if (milestone.type === '6_MONTH_REPORT') {
      const thesisObj = insertedTheses.find(t => t._id.toString() === milestone.thesisId.toString());
      if (thesisObj) {
        const matchingReview = reviewsToInsert.find(r => 
          r.scholarId.toString() === thesisObj.scholarId.toString() && 
          r.racNumber === milestone.sequence
        );
        if (matchingReview) {
          matchingReview.milestoneId = milestone._id;
          const assignedFaculty = insertedStaff.find(f => f._id.toString() === thesisObj.supervisorId?.toString());
          if (assignedFaculty) {
            matchingReview.reviewerId = assignedFaculty._id;
          }
        }
      }
    }
  }

  console.log(`Inserting ${reviewsToInsert.length} RACReview documents...`);
  await RACReview.insertMany(reviewsToInsert);

  console.log(`Inserting ${publicationsToInsert.length} Publication documents...`);
  await Publication.insertMany(publicationsToInsert);

  console.log(`Inserting ${meetingsToInsert.length} DRCMeeting documents...`);
  await DRCMeeting.insertMany(meetingsToInsert);

  console.log(`Inserting ${notificationsToInsert.length} Notification documents...`);
  await Notification.insertMany(notificationsToInsert);

  console.log('🎉 Seeding successfully completed!');
  return {
    users: insertedStudents.length + insertedStaff.length + 1,
    theses: insertedTheses.length,
    milestones: insertedMilestones.length,
    reviews: reviewsToInsert.length,
    publications: publicationsToInsert.length,
    meetings: meetingsToInsert.length
  };
}

module.exports = {
  seedUserData
};

