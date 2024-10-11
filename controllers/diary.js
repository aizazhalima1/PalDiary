const cloudinary = require("../middleware/cloudinary");
const mongoose = require('mongoose')
const Diary = require("../models/Diary");
const Post = require("../models/Post")
const User= require("../models/User")
const PalRequest= require("../models/PalRequest")


module.exports = {
  getDiary: async (req, res) => {
   
    try {
        // Fetch all posts related to the diary
        const posts = await Post.find({ diaryId: req.params.id }).exec();
        const formattedPosts = posts.map(post => {
          const createdAt = post.createdAt;

          // Format the date
          const options = { day: '2-digit', month: 'short', year: 'numeric' };
          const formattedDate = createdAt.toLocaleDateString('en-GB', options);

          const hours = createdAt.getHours();
          const minutes = createdAt.getMinutes();
          const ampm = hours >= 12 ? 'PM' : 'AM';

          const formattedHours = hours % 12 || 12; // Convert to 12-hour format
          const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

          return {
              ...post._doc, // Spread operator to include existing post fields
              datePosted: `${formattedDate} ${formattedHours}:${formattedMinutes} ${ampm}` // Add formatted date
          };
      });

        
        // Fetch the diary document by ID
        const diary = await Diary.findById(req.params.id).exec();

        // Initialize variables
        let palId = null;
        let pal = null;
        const request = await PalRequest.findOne({ diaryId: req.params.id }).exec();
        //console.log(request)
        // Check if request exists and has been accepted
        if (request && request.status === 'accepted') {
            if (req.user._id.equals(request.receiverId)) {
                palId = request.requesterId;
                pal = await User.findOne({ _id: palId }).exec(); // Fetch pal details
               
              }
              else{
                palId = request.receiverId;
                pal = await User.findOne({ _id: palId }).exec();

              }
         
        }
        //console.log(pal)
        
     
        // Handle case where diary is not found
        if (!diary) {
            return res.status(404).send('Diary not found');
        }

        // Render the diary page with the necessary data
        res.render('diary.ejs', { 
            post: formattedPosts,
            user: req.user, 
            diaryId: req.params.id, 
            diary: diary,
            request: request,
            pal: pal // This will be null if not found
        });
    } catch (err) {
        //console.error('Error fetching diary or posts:', err);
        res.status(500).send('Internal Server Error');
    }
},

  createProfilePicture: 
  async (req, res) => {
    try {
        // Fetch the user based on the user ID in the session
        let user = await User.findById(req.user);
        //console.log(user);

        // If user exists and has a cloudinaryId, destroy the old image
        if (user && user.cloudinaryId) {
            await cloudinary.uploader.destroy(user.cloudinaryId);
        }

        // Upload the new image to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path);
       

        // Update the user with the new image and cloudinaryId
        const updatedUser = await User.findByIdAndUpdate(
            req.user,
            { 
                $set: { 
                    cloudinaryId: result.public_id, 
                    image: result.secure_url 
                } 
            },
            { new: true } // Return the updated user
        );

        console.log("Picture has been changed", updatedUser);
        // Redirect to the diary page with the user's ID
        res.redirect(`/diary/${req.params.id}`);
    } catch (err) {
        //console.error('Error updating profile picture:', err);
        res.status(500).send('File size too large');
    }
},

  createPost: async (req, res) => {
    try {
      //console.log('Request Body:', req.body.diary); // Log request body for debugging
  
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
  
      //console.log("Post has been added!");
      res.redirect(`/diary/${diaryId}`);
    } catch (err) {
      //console.error('Error creating post:', err);
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
  
      //console.log("Diary has been created!");
      //console.log(newDiary._id);
  
      // Redirect to the new diary page
      res.redirect(`/diary/${newDiary._id}`);
    } catch (err) {
      //console.error('Error creating diary:', err);
      res.status(500).send('Internal Server Error');
    }
  },
  findPal: async (req, res) => {
    try {
        const currentUserId = new mongoose.Types.ObjectId(req.user.id); // Convert to ObjectId
        const currentUserName = req.user.userName; // Current user's name

        // Retrieve the current user's pals list
        const currentUser = await User.findById(currentUserId).select('pals');
        if (!currentUser) {
            return res.status(404).send('Current user not found');
        }
 


        // Find existing requests where the current user is involved
        const existingRequests = await PalRequest.find({
            $or: [
                { requesterId: currentUserId, status: { $in: ['pending', 'accepted'] } },
                { receiverId: currentUserId, status: { $in: ['pending', 'accepted'] } }
            ]
        }).select('receiverId requesterId');

        const excludedUserIds = existingRequests.map(req => req.receiverId).concat(existingRequests.map(req => req.requesterId));

        // Find a random user who is not the current user, not in the pals list, and not excluded
        const result = await User.aggregate([
            {
                $match: {
                    _id: { $ne: currentUserId }, // Exclude the current user
                    userName: { $nin: currentUser.pals }, // Exclude existing pals
                    _id: { $nin: excludedUserIds } // Exclude users with pending/accepted requests
                }
            },
            { $sample: { size: 1 } } // Randomly select one user
        ]);

        if (result.length === 0) {
            //console.log('No suitable users found');
            return res.status(404).send('No users available to add as pal');
        }

        const randomUser = result[0];
        const randomUserId = randomUser._id;
        const randomUserName = randomUser.userName;

        // Ensure the selected user is not the same as the requester
        if (randomUserId.equals(currentUserId)) {
            return res.status(404).send('Selected user cannot be the same as the requester');
        }

        // Create a request to connect
        const request = new PalRequest({
            diaryId: req.params.id,
            requesterUserName: currentUserName,
            receiverUserName: randomUserName,
            requesterId: currentUserId,
            receiverId: randomUserId,
            status: 'pending' // initial status
        });

        await request.save();
        const diaryId = req.params.id;

      
        //console.log('Pal request sent to', randomUser.userName);

        res.redirect(`/diary/${diaryId}`);
    } catch (err) {
        //console.error('Error assigning pal:', err);
        res.status(500).send('Internal Server Error');
    }
},
 deletePost:async (req, res) => {
  try {
      const { id, postId } = req.params;

      // Find and delete the post by ID
      const deletedPost = await Post.findByIdAndDelete(postId);
      console.log('post deleted')
      if (!deletedPost) {
          return res.status(404).send('Post not found');
      }

   
      res.redirect(`/diary/${id}`); // Redirect to the diary view after deletion
  } catch (error) {
      //console.error(error);
      res.status(500).send('Server error');
  }
},

};