const Department = require('../models/Department');

// Get all departments
exports.getAllDepartments = async (req, res) => {
  try {
    let depts = await Department.find().populate('facultyId').sort({ name: 1 });
    res.json(depts);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving departments', error: error.message });
  }
};

// Create a department
exports.createDepartment = async (req, res) => {
  try {
    const { name, code, facultyId } = req.body;
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
      code: code.trim().toUpperCase(),
      facultyId: facultyId || null
    });

    const populatedDept = await Department.findById(dept._id).populate('facultyId');
    res.status(201).json({ success: true, department: populatedDept });
  } catch (error) {
    res.status(500).json({ message: 'Error creating department', error: error.message });
  }
};

// Update a department
exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, facultyId } = req.body;

    const dept = await Department.findById(id);
    if (!dept) {
      return res.status(404).json({ message: 'Department not found' });
    }

    if (name) dept.name = name.trim();
    if (code) dept.code = code.trim().toUpperCase();
    if (facultyId !== undefined) dept.facultyId = facultyId || null;

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
    const populatedDept = await Department.findById(dept._id).populate('facultyId');
    res.json({ success: true, department: populatedDept });
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
