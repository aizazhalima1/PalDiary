const passport = require("passport");
const validator = require("validator");
const User = require("../models/User");
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt')


exports.getLogin = (req, res) => {
  if (req.user) {
    return res.redirect("/profile"); //renders profile page if user is logged in
  }
  res.render("login", { //renders login page
    title: "Login",
  });
};


exports.postLogin = async (req, res, next) => {
  try{
  const validationErrors = [];
  if (!validator.isEmail(req.body.email))
    validationErrors.push({ msg: "Please enter a valid email address." }); //incase email is invalid
  if (validator.isEmpty(req.body.password))
    validationErrors.push({ msg: "Password cannot be blank." }); //incase password is blank

  if (validationErrors.length) {
    req.flash("errors", validationErrors);
    return res.redirect("/login"); // if errors, redirect login page
  }
  req.body.email = validator.normalizeEmail(req.body.email, {
    gmail_remove_dots: false,
  });
//passport to authenticate
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      req.flash("errors", info);
      return res.redirect("/login");
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      req.flash("success", { msg: "Success! You are logged in." });
      res.redirect(req.session.returnTo || "/profile");
    });
  })(req, res, next);
}catch(err){
  return next(err);
}
};


exports.logout = (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    req.session.destroy((err) => {
      if (err) console.log("Error : Failed to destroy the session during logout.", err);
      req.user = null;
      res.redirect("/");
    });
  });
};

//renders signup-page
exports.getSignup = (req, res) => {
  if (req.user) {
    return res.redirect("/profile"); 
  }
  res.render("signup", {   //renders signup if no errors
    title: "Create Account",
  });
};

exports.postSignup = async (req, res, next) => {
  try {
    const validationErrors = [];
    if (!validator.isEmail(req.body.email))
      validationErrors.push({ msg: "Please enter a valid email address." });
    if (!validator.isLength(req.body.password, { min: 8 })){  //password should have atleast 8 characters
      validationErrors.push({
        msg: "Password must be at least 8 characters long"
      })};
    if (req.body.password !== req.body.confirmPassword)
      validationErrors.push({ msg: "Passwords do not match" });

    if (validationErrors.length) {
      req.flash("errors", validationErrors);
      return res.redirect("../signup");
    }

    req.body.email = validator.normalizeEmail(req.body.email, {
      gmail_remove_dots: false
    });

    const existingUser = await User.findOne({     //check if email and userName already exists
      $or: [{ email: req.body.email }, { userName: req.body.userName }]
    });

    if (existingUser) {
      req.flash("errors", {
        msg: "Account with that email address or username already exists."
      });
      return res.redirect("../signup");
    }
    //create new user document
    const user = new User({
      userName: req.body.userName,
      email: req.body.email,
      password: req.body.password,
      cloudinaryId:'v1725253996',
      image:'//res.cloudinary.com/dqh520gol/image/upload/v1725253996/blank-profile-picture-973460_1280_qei3fs.png', //no-profile-image
      pals:[] //empty pal array
    });

    await user.save(); //save user

    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      res.redirect("/profile");
    });
  } catch (err) {
    return next(err);
  }
};

exports.getRequest = (req, res) => {

  res.render("reset", {  //renders reset page
    title: "Reset",
  });
};


exports.requestReset = async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email }); //fetch user with email
  if (!user) {
    return res.status(400).send('No account with that email found.');
  }

  // Generate a reset token
  const token = crypto.randomBytes(20).toString('hex');
  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now


  await user.save();

  // Send the token via email
  const transporter = nodemailer.createTransport({
    service: process.env.SERVICE, // Configure email service
    port:process.env.PORT,
    auth: {
      user: process.env.USER,
      pass: process.env.PASS,
    
    },
  });

//email body
  const mailOptions = {
    to: user.email,
    from: process.env.USER,
    subject: 'Password Reset',
    text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
           Please click on the following link, or paste this into your browser to complete the process:\n\n
           http://${req.headers.host}/reset/${token}\n\n
           If you did not request this, please ignore this email and your password will remain unchanged.\n`,
  };

  await transporter.sendMail(mailOptions);
  res.status(200).send('Password reset link sent to your email.');
};


exports.getResetRequest = (req, res) => {

  res.render("change", {
    title: "Change Password",
    token: req.params.token,
    messages: req.flash('errors')
  });
};

exports.postResetRequest = async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  if (!validator.isLength(password, { min: 8 })) {
    req.flash('errors', { msg: 'Password must be at least 8 characters long' });
    return res.redirect(`/reset/${token}`);
  }

  if (password !== req.body.confirmPassword) {
    req.flash('errors', { msg: 'Passwords do not match' });
    return res.redirect(`/reset/${token}`);
  }

  try {
    const user = await User.findOne({  //fetch user with token
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() } //ensure token has not expired
    });

    if (!user) {
      return res.status(400).send('Password reset token is invalid or has expired.');
    }
    //update user with new password 
    user.password = password;
    user.resetPasswordToken = undefined; //token undefined
    user.resetPasswordExpires = undefined;

    await user.save(); //save user

    res.status(200).send('Password has been reset.');
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).send('An error occurred while resetting the password.');
  }
  
};
