const Department = require('../models/Department');

// Get all departments
exports.getAllDepartments = async (req, res) => {
  try {
    let depts = await Department.find().sort({ name: 1 });
    if (depts.length === 0) {
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
      depts = await Department.find().sort({ name: 1 });
    }
    res.json(depts);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving departments', error: error.message });
  }
};

// Create a department
exports.createDepartment = async (req, res) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) {
      return res.status(400).json({ message: 'Name and Code are required' });
    }

    // Check if duplicate name or code exists
    const duplicate = await Department.findOne({
      $or: [
        { name: name.trim() },
        { code: code.trim().toUpperCase() }
      ]
    });

    if (duplicate) {
      return res.status(400).json({ message: 'Department Name or Short Code already exists' });
    }

    const dept = await Department.create({
      name: name.trim(),
      code: code.trim().toUpperCase()
    });

    res.status(201).json({ success: true, department: dept });
  } catch (error) {
    res.status(500).json({ message: 'Error creating department', error: error.message });
  }
};

// Update a department
exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code } = req.body;

    const dept = await Department.findById(id);
    if (!dept) {
      return res.status(404).json({ message: 'Department not found' });
    }

    if (name) dept.name = name.trim();
    if (code) dept.code = code.trim().toUpperCase();

    // Check duplicate values if changing
    const duplicate = await Department.findOne({
      _id: { $ne: id },
      $or: [
        { name: dept.name },
        { code: dept.code }
      ]
    });

    if (duplicate) {
      return res.status(400).json({ message: 'Another department already uses this Name or Short Code' });
    }

    await dept.save();
    res.json({ success: true, department: dept });
  } catch (error) {
    res.status(500).json({ message: 'Error updating department', error: error.message });
  }
};

// Delete a department
exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const dept = await Department.findById(id);
    if (!dept) {
      return res.status(404).json({ message: 'Department not found' });
    }

    await Department.findByIdAndDelete(id);
    res.json({ success: true, message: 'Department deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting department', error: error.message });
  }
};
