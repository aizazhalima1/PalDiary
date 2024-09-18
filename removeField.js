const mongoose = require('mongoose');
const User = require('./models/User')


const removeFieldTest = async () => {
    try {
      const result = await User.updateMany(
        { }, // Add filter if needed
        { $unset: { used: "" } }
      );
      console.log('Test field "used" removal. Documents updated:', result.nModified);
    } catch (err) {
      console.error('Error in test:', err);
    } finally {
      mongoose.disconnect();
    }
  };
  
  removeFieldTest();