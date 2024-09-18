const cloudinary = require("../middleware/cloudinary");
const mongoose = require('mongoose')
const Diary = require("../models/Diary");
const Post = require("../models/Post")
const User= require("../models/User")


module.exports = {
  getDiary: async (req, res) => {
    console.log(req.user);
    try {
      // Fetch all posts related to the diary
      const posts = await Post.find({ diaryId: req.params.id }).exec();
      console.log(posts);
  
      // Fetch the diary document by ID
      const diary = await Diary.findById(req.params.id).exec();
      console.log(diary);
  
      // Handle case where diary is not found
      if (!diary) {
        return res.status(404).send('Diary not found');
      }
  
      // Render the diary page with the necessary data
      res.render('diary.ejs', { 
        post: posts, 
        user: req.user, 
        diaryId: req.params.id, 
        diary: diary 
      });
    } catch (err) {
      console.error('Error fetching diary or posts:', err);
      res.status(500).send('Internal Server Error');
    }
  },
  //getPost: async (req, res) => {
  //  try {
  //    //id parameter comes from the post routes
  //    //router.get("/:id", ensureAuth, postsController.getPost);
  //    //http://localhost:2121/post/631a7f59a3e56acfc7da286f
  //    //id === 631a7f59a3e56acfc7da286f
  //    const post = await Post.findById(req.params.id);
  //    res.render("post.ejs", { post: post, user: req.user});
  //  } catch (err) {
  //    console.log(err);
  //  }
  //},
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
      res.redirect("/diary");
    } catch (err) {
      console.log(err);
    }
  },
  createPost: async (req, res) => {
    try {
      console.log('Request Body:', req.body.diary); // Log request body for debugging
  
      const text= req.body.diary;
      
      // Check if the title and caption are missing
      if (!text) {
        return res.status(400).send('Text is required.');
      }
      const diaryId=req.params.id
      // Create a new post
      await Post.create({
        poster:req.user.id ,
        diaryId:diaryId,
        //likes: 0, // Default value
        text:text,
        //user: req.user ? req.user.id : null, // Ensure req.user exists
      });
  
      console.log("Post has been added!");
      res.redirect(`/diary/${diaryId}`);
    } catch (err) {
      console.error('Error creating post:', err);
      res.status(500).send('Internal Server Error');
    }
  },
  createNewDiary: async (req, res) => {
    try {
      // Ensure req.user is valid
      if (!req.user || !req.user.userName || !req.user.id) {
        return res.status(400).send('User information is missing.');
      }
  
      // Create new diary document
      const newDiary = new Diary({
        posters: [req.user.userName], // Wrap userName in an array
        postersId: [req.user.id],     // Wrap userId in an array
      });
  
      // Save the new diary document
      await newDiary.save();
  
      console.log("Diary has been created!");
      console.log(newDiary._id); // Use _id instead of id
  
      // Redirect to the new diary page
      res.redirect(`/diary/${newDiary._id}`);
    } catch (err) {
      console.error('Error creating diary:', err);
      res.status(500).send('Internal Server Error');
    }
  },
  findPal: async (req, res) => {
    try {
      const currentUserId = new mongoose.Types.ObjectId(req.user.id); // Convert to ObjectId
      const currentUserName = req.user.userName; // Current user's name
  
      // Retrieve the current user's pals list and filter valid ObjectId strings
      const currentUser = await User.findById(currentUserId).select('pals');
      if (!currentUser) {
        return res.status(404).send('Current user not found');
      }
  
      console.log(req.user.pals)
      
  
      // Find a random user who is not the current user and not in the pals array
      const result = await User.aggregate([
        {
          $match: {
            _id: { $ne: currentUserId },                // Exclude the current user
            userName: { $nin: req.user.pals } 
          }
        },
       { $sample: { size: 1 } } // Randomly select one user
      ]);
      console.log("Result from aggregation:", result);
    if (result.length === 0) {
      console.log('No suitable users found');
      return res.status(404).send('No users available to add as pal');
    }

    const randomUser = result[0];
    const randomUserId = randomUser._id;
    const randomUserName = randomUser.userName;

    console.log('Random document:', randomUser);

    // Add the random user to the current user's pals array
    await User.findByIdAndUpdate(
      currentUserId,
      { $addToSet: { pals: randomUserName } }, // Use $addToSet to avoid duplicates
      { new: true, upsert: true }
    );

    // Add the current user to the random user's pals array
    await User.findByIdAndUpdate(
      randomUserId,
      { $addToSet: { pals: currentUserName } }, // Use $addToSet to avoid duplicates
      { new: true, upsert: true }
    );
  
    //Add current user and pal to diary posters field
    const diary=await Diary.findByIdAndUpdate(
    req.params.id,
      {
        $push: {  posters: randomUserName , // Add new users if not already present
        postersId: randomUserId } // Add new IDs if not already present
      },
      { new: true }
    );
    console.log('Diary has been updated with new users!');
  
 const diaryId=req.params.id
    console.log('Pal has been assigned');
    res.redirect(`/diary/${diaryId}`);
  } catch (err) {
    console.error('Error assigning pal:', err);
    res.status(500).send('Internal Server Error');
  
  }
}
  //likePost: async (req, res) => {
  //  try {
  //    await Post.findOneAndUpdate(
  //      { _id: req.params.id },
  //      {
  //        $inc: { likes: 1 },
  //      }
  //    );
  //    console.log("Likes +1");
  //    res.redirect(`/post/${req.params.id}`);
  //  } catch (err) {
  //    console.log(err);
  //  }
  //},
  //deletePost: async (req, res) => {
  //  try {
  //    // Find post by id
  //    let post = await Post.findById({ _id: req.params.id });
  //    // Delete image from cloudinary
  //    await cloudinary.uploader.destroy(post.cloudinaryId);
  //    // Delete post from db
  //    await Post.remove({ _id: req.params.id });
  //    console.log("Deleted Post");
  //    res.redirect("/profile");
  //  } catch (err) {
  //    res.redirect("/profile");
  //  }
  //},
};