const cloudinary = require("../middleware/cloudinary");
const Post = require("../models/Post");
const User= require("../models/User")


module.exports = {
  getProfile: async (req, res) => { 
    console.log(req.user)
    try {
      //Since we have a session each request (req) contains the logged-in users info: req.user
      //console.log(req.user) to see everything
      //Grabbing just the posts of the logged-in user
      const posts = await Post.find({ user: req.user.id });
      console.log(posts)
      //const user = await User.find({ _id: req.user.id });
      //Sending post data from mongodb and user data to ejs template
      res.render("profile.ejs", { posts: posts, user: req.user });
    } catch (err) {
      console.log(err);
    }
  },
  getPost: async (req, res) => {
    try {
      //id parameter comes from the post routes
      //router.get("/:id", ensureAuth, postsController.getPost);
      //http://localhost:2121/post/631a7f59a3e56acfc7da286f
      //id === 631a7f59a3e56acfc7da286f
      const post = await Post.findById(req.params.id);
      res.render("post.ejs", { post: post, user: req.user});
    } catch (err) {
      console.log(err);
    }
  },
  createProfilePicture: async (req, res) => {
    try {
      let user = await User.findOne({ _id: req.user })
      console.log(user)
      await cloudinary.uploader.destroy(user.cloudinaryId)
      // Upload image to cloudinary
      const result = await cloudinary.uploader.upload(req.file.path);
      console.log(result)
      //media is stored on cloudainary - the above request responds with url to media and the media id that you will need when deleting content 
      await User.findOneAndUpdate(
        { _id: req.user },
        { $set: { cloudinaryId: result.public_id, image: result.secure_url } },
        { new: true },
        console.log(req.user)
        //(err, user) => {
        //  if (err) {
        //    console.error(err);
        //    return;
        //  }
        //  console.log(user);
        //}
      )
      console.log("Picture has been changed");
      res.redirect("/profile");
    } catch (err) {
      console.log(err);
    }
  },
  createPost: async (req, res) => {
    try {
      console.log('Request Body:', req.body); // Log request body for debugging
  
      const { diary } = req.body;
  
      // Check if the title and caption are missing
      if (!diary) {
        return res.status(400).send('Title and caption are required.');
      }
  
      // Create a new post
      await Post.create({
        diary: diary,
        likes: 0, // Default value
        user: req.user ? req.user.id : null, // Ensure req.user exists
      });
  
      console.log("Post has been added!");
      res.redirect("/profile");
    } catch (err) {
      console.error('Error creating post:', err);
      res.status(500).send('Internal Server Error');
    }
  },
  findPal: async (req, res) => {
    try {

      const result = await User.aggregate([
        { $match: { used: false, userName: { $ne: req.user.userName } } },
        { $sample: { size: 1 } }
      ]);

      if (result.length > 0) {
        console.log('Random document:', result[0])
        
      } else {
        console.log('No documents found');
      }
      await User.findOneAndUpdate(
       { _id: req.user },
       { $set: { pal: result[0].userName,used: true } },
       { new: true },
       { upsert: true })

       await User.findOneAndUpdate(
        { userName: result[0].userName },
        { $set: { pal: req.user.userName,used: true } },
        { new: true },
        { upsert: true })
      
      console.log("Pal has been assigned");
      res.redirect("/profile");
    } catch (err) {
      console.error('Error assigning pal:', err);
      res.status(500).send('Internal Server Error');
    }
  },
  likePost: async (req, res) => {
    try {
      await Post.findOneAndUpdate(
        { _id: req.params.id },
        {
          $inc: { likes: 1 },
        }
      );
      console.log("Likes +1");
      res.redirect(`/post/${req.params.id}`);
    } catch (err) {
      console.log(err);
    }
  },
  deletePost: async (req, res) => {
    try {
      // Find post by id
      let post = await Post.findById({ _id: req.params.id });
      // Delete image from cloudinary
      await cloudinary.uploader.destroy(post.cloudinaryId);
      // Delete post from db
      await Post.remove({ _id: req.params.id });
      console.log("Deleted Post");
      res.redirect("/profile");
    } catch (err) {
      res.redirect("/profile");
    }
  },
};