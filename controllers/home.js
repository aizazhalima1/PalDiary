const Post = require("../models/Post");

module.exports = {
    getIndex: (req, res) => {
      res.render("index.ejs");
    },
    getFeed: async (req, res) => {
      try {
        const post = await Post.find();
        res.render("feed.ejs", { post: post, user: req.user});
      } catch (err) {
        console.log(err);
      }
    },
  };