import db from "../models/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import otpGenerator from "otp-generator";
import { createError } from "../error.js";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
  port: 465,
  host: "smtp.gmail.com",
});

const User = db.user;

export const SignUp = async (req, res, next) => {
  const { name, email, password } = req.body;
  try {
    //check if user already exists
    const userExists = await User.findOne({
      where: { email },
    });
    if (userExists) return next(createError(409, "User already exists"));

    const user = await User.create({
      name,
      email,
      password: await bcrypt.hash(password, 10),
    });
    const token = jwt.sign({ id: user.id }, process.env.JWT, {
      expiresIn: "9999 years",
    });
    return res.status(201).json({ token, user });
  } catch (error) {
    return next(error);
  }
};

export const SignIn = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({
      where: { email },
    });
    
    if (!user) return next(createError(404, "User does not exist"));
    
    // Remove this check to allow both authentication methods
    // if (user.googleAuth)
    //   return next(createError(401, "Please login with google"));
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return next(createError(401, "Invalid password"));

    const token = jwt.sign({ id: user.id }, process.env.JWT, {
      expiresIn: "9999 years",
    });
    
    return res.status(200).json({ token, user });
  } catch (error) {
    return next(error);
  }
};
export const googleAuthSignIn = async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: {
        email: req.body.email,
      },
    });
    
    if (!user) {
      // User doesn't exist at all - reject because we require email signup first
      return next(
        createError(
          404,
          "Please sign up with email and password first before using Google login"
        )
      );
    } else if (user.googleAuth) {
      // User already has Google auth enabled - proceed with login
      const token = jwt.sign({ id: user.id }, process.env.JWT, {
        expiresIn: "9999 years",
      });
      res.status(200).json({ token, user });
    } else {
      // User exists but hasn't used Google auth before
      // Update the user to enable Google auth
      await User.update(
        { 
          googleAuth: true,
          img: req.body.img || user.img // Update profile image if provided
        },
        {
          where: {
            id: user.id,
          },
        }
      );
      
      // Get the updated user
      const updatedUser = await User.findOne({
        where: {
          id: user.id,
        },
      });
      
      // Create and send token
      const token = jwt.sign({ id: user.id }, process.env.JWT, {
        expiresIn: "9999 years",
      });
      
      res.status(200).json({ token, user: updatedUser });
    }
  } catch (err) {
    next(err);
  }
};

export const generateOTP = async (req, res, next) => {
  req.app.locals.OTP = await otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    specialChars: false,
    lowerCaseAlphabets: false,
    digits: true,
  });
  const { email, name, reason } = req.query;
  
  // Format OTP with spaces for better readability
  const formattedOTP = req.app.locals.OTP.split('').join(' ');
  
  // Account verification email
  const verifyOtp = {
    to: email,
    from: {
      name: "NoCodeLogic",
      email: "nocodelogic@gmail.com"
    },
    subject: "Your NoCodeLogic Verification Code: " + req.app.locals.OTP,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Verification Code</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f9f9f9; color: #333333;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <tr>
            <td style="padding: 20px; text-align: center; background-color: #f0f7ff;">
              <img src="https://res.cloudinary.com/dsrglevcv/image/upload/v1748323782/ciwahddllyxr9t0eig8k.png" alt="NoCodeLogic" width="150" style="margin-bottom: 10px;">
              <h1 style="color: #0066cc; margin: 0; font-size: 22px;">Account Verification</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 25px;">
              <p style="margin-top: 0; margin-bottom: 15px; font-size: 16px;">Hello ${name},</p>
              
              <p style="margin-bottom: 20px; font-size: 16px;">Thank you for creating your NoCodeLogic account. Please use the verification code below:</p>
              
              <div style="background-color: #f5f8ff; border: 1px solid #d1e1ff; border-radius: 6px; padding: 15px; margin: 25px 0; text-align: center;">
                <p style="margin: 0 0 5px; font-size: 13px; color: #666;">Your verification code is:</p>
                <div style="font-family: monospace; font-size: 32px; font-weight: bold; color: #0066cc; letter-spacing: 4px;">${formattedOTP}</div>
                <p style="margin: 5px 0 0; font-size: 13px; color: #666;">Code expires in 10 minutes</p>
              </div>
              
              <p style="margin-bottom: 10px; font-size: 16px;">Enter this code in the NoCodeLogic app to verify your account.</p>
              
              <p style="margin-bottom: 25px; font-size: 16px;">If you didn't create an account with NoCodeLogic, you can safely ignore this email.</p>
              
              <p style="margin-bottom: 5px; font-size: 16px;">Thank you,</p>
              <p style="margin-top: 0; font-weight: bold; font-size: 16px;">The NoCodeLogic Team</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px; text-align: center; background-color: #f0f7ff; font-size: 14px; color: #666666;">
              <p style="margin: 0 0 10px;">Questions? Contact us at: <a href="mailto:nocodelogic@gmail.com" style="color: #0066cc; text-decoration: none;">nocodelogic@gmail.com</a></p>
              <p style="margin: 0;">© 2025 NoCodeLogic. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    text: `Hello ${name},

Your NoCodeLogic verification code is: ${req.app.locals.OTP}

This code will expire in 10 minutes.

Enter this code in the NoCodeLogic app to verify your account.

If you didn't create an account with NoCodeLogic, you can safely ignore this email.

Thank you,
The NoCodeLogic Team

Questions? Contact us at: nocodelogic@gmail.com`
  };

  // Password reset email
  const resetPasswordOtp = {
    to: email,
    from: {
      name: "NoCodeLogic",
      email: "nocodelogic@gmail.com"
    },
    subject: "Your NoCodeLogic Password Reset Code: " + req.app.locals.OTP,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Password Reset Code</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f9f9f9; color: #333333;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <tr>
            <td style="padding: 20px; text-align: center; background-color: #f0f7ff;">
              <img src="https://res.cloudinary.com/dsrglevcv/image/upload/v1748323782/ciwahddllyxr9t0eig8k.png" alt="NoCodeLogic" width="150" style="margin-bottom: 10px;">
              <h1 style="color: #0066cc; margin: 0; font-size: 22px;">Password Reset</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 25px;">
              <p style="margin-top: 0; margin-bottom: 15px; font-size: 16px;">Hello ${name},</p>
              
              <p style="margin-bottom: 20px; font-size: 16px;">We received a request to reset your NoCodeLogic password. Please use this verification code:</p>
              
              <div style="background-color: #f5f8ff; border: 1px solid #d1e1ff; border-radius: 6px; padding: 15px; margin: 25px 0; text-align: center;">
                <p style="margin: 0 0 5px; font-size: 13px; color: #666;">Your reset code is:</p>
                <div style="font-family: monospace; font-size: 32px; font-weight: bold; color: #0066cc; letter-spacing: 4px;">${formattedOTP}</div>
                <p style="margin: 5px 0 0; font-size: 13px; color: #666;">Code expires in 10 minutes</p>
              </div>
              
              <p style="margin-bottom: 10px; font-size: 16px;">Enter this code in the NoCodeLogic app to reset your password.</p>
              
              <p style="margin-bottom: 25px; font-size: 16px;">If you didn't request a password reset, please contact our support team.</p>
              
              <p style="margin-bottom: 5px; font-size: 16px;">Thank you,</p>
              <p style="margin-top: 0; font-weight: bold; font-size: 16px;">The NoCodeLogic Team</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px; text-align: center; background-color: #f0f7ff; font-size: 14px; color: #666666;">
              <p style="margin: 0 0 10px;">Questions? Contact us at: <a href="mailto:nocodelogic@gmail.com" style="color: #0066cc; text-decoration: none;">nocodelogic@gmail.com</a></p>
              <p style="margin: 0;">© 2025 NoCodeLogic. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    text: `Hello ${name},

Your NoCodeLogic password reset code is: ${req.app.locals.OTP}

This code will expire in 10 minutes.

Enter this code in the NoCodeLogic app to reset your password.

If you didn't request a password reset, please contact our support team.

Thank you,
The NoCodeLogic Team

Questions? Contact us at: nocodelogic@gmail.com`
  };

  try {
    if (reason === "FORGOTPASSWORD") {
      await transporter.sendMail(resetPasswordOtp);
    } else {
      await transporter.sendMail(verifyOtp);
    }
    return res.status(200).send({ 
      message: "OTP sent successfully",
      success: true 
    });
  } catch (err) {
    console.error("Email sending error:", err);
    return next(new Error("Failed to send OTP email. Please try again."));
  }
};

export const verifyOTP = async (req, res, next) => {
  const { code } = req.query;
  // eslint-disable-next-line radix
  if (parseInt(code) === parseInt(req.app.locals.OTP)) {
    req.app.locals.OTP = null;
    req.app.locals.resetSession = true;
    return res.status(200).send({ message: "OTP verified" });
  }
  return next(createError(403, "Wrong OTP"));
};

export const createResetSession = async (req, res, next) => {
  if (req.app.locals.resetSession) {
    req.app.locals.resetSession = false;
    return res.status(200).send({ message: "Access granted" });
  }

  return res.status(400).send({ message: "Session expired" });
};

export const resetPassword = async (req, res, next) => {
  if (!req.app.locals.resetSession)
    return res.status(440).send({ message: "Session expired" });

  const { email, password } = req.body;

  try {
    const user = await User.findOne({
      where: {
        email: email,
      },
    });

    if (user) {
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(password, salt);

      // Update the user's password using Sequelize
      await User.update(
        { password: hashedPassword },
        {
          where: {
            email: email,
          },
        }
      );

      req.app.locals.resetSession = false;
      return res.status(200).send({
        message: "Password reset successful",
      });
    } else {
      next(createError("User not found", 404));
    }
  } catch (err) {
    next(createError(err.message, err.status));
  }
};
