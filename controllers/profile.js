const Diary = require("../models/Diary");
const PalRequest= require("../models/PalRequest");
const User= require("../models/User")
const Post= require("../models/Post")

module.exports = {
    getProfile: async (req, res) => {
      try {
        const diary = await Diary.find({ posters: req.user.userName });
        //fetch requests using receiverId and status pending
        const requests= await PalRequest.find({receiverId:req.user.id, status: 'pending'})
        res.render("profile.ejs", { diary: diary, user: req.user, requests:requests});
      } catch (err) {
        //console.log(err);
      }
    },
    deleteDiary:async (req, res) => {
        try {
            const diaryId = req.params.diaryId;
            //console.log(diaryId)
            const deletedPost = await Post.deleteMany({ diaryId: diaryId }); //delete all posts for the diary
            if (deletedPost.deletedCount > 0) {
                //console.log( `${deletedPost.deletedCount} posts deleted successfully.` );
            } else {
               // console.log('No posts found with the provided diaryIds.' );
            }
            
            const deletedDiary = await Diary.findByIdAndDelete(diaryId); // Find and delete the post by ID
            console.log('diary deleted')
            if (!deletedDiary) {
                //console.log('Diary not found');
            }
            
            res.redirect(`/profile`); // Redirect to the profile after deletion
        } catch (error) {
            //console.error(error);
            res.status(500).send('Server error');
        }
      },
      
    getPalNotification: async (req, res) => {
        try {
            const userId = req.params.userId;
             //fetch requests using receiverId and status pending
            const requests = await PalRequest.find({ receiverId: userId, status: 'pending' })
            //console.log(requests)
            res.render("palrequest.ejs", {request:requests ,user: req.user}); 
           
        } catch (err) {
            //console.error('Error retrieving pal requests:', err);
            res.status(500).send('Internal Server Error');
        }
    },
    acceptRequest: async (req, res) => {
        try {
            const requestId = req.params.requestId;
            //console.log(`Accepting request ID: ${requestId}`);
    
            // Update the PalRequest status
            const request = await PalRequest.findByIdAndUpdate(
                requestId,
                { status: 'accepted' },
                { new: true }
            );
    
            if (!request) {
                return res.status(404).send('Request not found');
            }
            const updatedUser = await User.findByIdAndUpdate(
                req.user.id,
                { $push: { pals: request.requesterUserName } }, // Push friendId to the friends array
                { new: true } // Return the updated document
            );
            const updatedUser1 = await User.findByIdAndUpdate(
                request.requesterId,
                { $push: { pals: request.receiverUserName } }, // Push friendId to the friends array
                { new: true } // Return the updated document
            );


            const diaryId = request.diaryId;
            console.log(`Diary ID: ${diaryId}`);
    
            // Ensure diaryId exists before proceeding
            if (!diaryId) {
                return res.status(400).send('Diary ID not found on the request');
            }
    
            // Update the Diary
            const diary = await Diary.findByIdAndUpdate(
                diaryId,
                {
                    $push: {
                        posters: req.user.userName,
                        postersId: req.user.id
                    }
                },
                { new: true }
            );
    
            if (!diary) {
                return res.status(404).send('Diary not found');
            }
    
            // Redirect to the desired route after acceptance
            res.redirect('/profile'); // Adjust to your actual redirect route
    
        } catch (err) {
            //console.error('Error accepting pal request:', err);
            res.status(500).send('Internal Server Error');
        }
    },
    rejectRequest: async (req, res) => {
        try {
            const requestId = req.params.requestId;
            //console.log(`Rejecting request ID: ${requestId}`);
    
            // Update the PalRequest status
            const request = await PalRequest.findByIdAndDelete(
                requestId)
        
                    //console.log('Document deleted');
            
                    res.redirect('/profile')
    
        } catch (err) {
            //console.error('Error rejecting pal request:', err);
            res.status(500).send('Internal Server Error');
        }
    },
  };