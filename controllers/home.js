const Diary = require("../models/Diary");

module.exports = {
    getIndex: (req, res) => {
      res.render("index.ejs");
    },
    getProfile: async (req, res) => {
      try {
        const diary = await Diary.find({ posters: req.user.userName });
        res.render("profile.ejs", { diary: diary, user: req.user});
      } catch (err) {
        console.log(err);
      }
    },
  };