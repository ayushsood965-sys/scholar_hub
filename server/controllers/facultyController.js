const FacultyMaster = require('../models/FacultyMaster');

// Get all faculties
exports.getAllFaculties = async (req, res) => {
  try {
    const faculties = await FacultyMaster.find().sort({ name: 1 });
    res.json(faculties);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving faculties', error: error.message });
  }
};

// Create faculty
exports.createFaculty = async (req, res) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) {
      return res.status(400).json({ message: 'Name and Code are required' });
    }

    const duplicate = await FacultyMaster.findOne({
      $or: [
        { name: name.trim() },
        { code: code.trim().toUpperCase() }
      ]
    });

    if (duplicate) {
      return res.status(400).json({ message: 'Faculty Name or Code already exists' });
    }

    const faculty = await FacultyMaster.create({
      name: name.trim(),
      code: code.trim().toUpperCase()
    });

    res.status(201).json({ success: true, faculty });
  } catch (error) {
    res.status(500).json({ message: 'Error creating faculty', error: error.message });
  }
};

// Update faculty
exports.updateFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, isActive } = req.body;

    const faculty = await FacultyMaster.findById(id);
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    if (name) faculty.name = name.trim();
    if (code) faculty.code = code.trim().toUpperCase();
    if (isActive !== undefined) faculty.isActive = isActive;

    const duplicate = await FacultyMaster.findOne({
      _id: { $ne: id },
      $or: [
        { name: faculty.name },
        { code: faculty.code }
      ]
    });

    if (duplicate) {
      return res.status(400).json({ message: 'Another faculty already uses this Name or Code' });
    }

    await faculty.save();
    res.json({ success: true, faculty });
  } catch (error) {
    res.status(500).json({ message: 'Error updating faculty', error: error.message });
  }
};

// Delete faculty
exports.deleteFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    const faculty = await FacultyMaster.findById(id);
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    await FacultyMaster.findByIdAndDelete(id);
    res.json({ success: true, message: 'Faculty deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting faculty', error: error.message });
  }
};
