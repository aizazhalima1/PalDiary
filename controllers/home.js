const Diary = require("../models/Diary");

module.exports = {
    getIndex: (req, res) => {
      res.render("index.ejs");
    },
  };