import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, "username is required"],
      unique: true,
      lowercase: true,
      trim: true,
      //Setting index: true in Mongoose creates an index on the field, speeding up search performance and optimizes query operations involving that field.
      index: true,
    },
    email: {
      type: String,
      required: [true, "email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: [true, "fullName is required"],
      trim: true,
      index: true,
    },
    avatar: {
      type: String, //we will save cloudinary url
      required: [true, "avatar is required"],
    },
    coverImage: {
      type: String, //we will save cloudinary url
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true, //sets createAt and updatedAt fields
  }
);

//explore other middlewares: https://mongoosejs.com/docs/middleware.html
//using built-in middleware to encrypt pass before saving into the database
userSchema.pre("save", async function (next) {
  //check : only run when there is any change/modification made in password field
  if (!this.isModified("password")) return next();
  //if password created/modified - now this line below will run in our "changeCurrentPassword" case
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// explore other prototypes: https://mongoosejs.com/docs/api/schema.html
//custom methods to check if password is correct after decryption and inject by "schemaName.methods.methodName = .."
// Custom method to check if the provided password matches the user's hashed password
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password); //returns boolean
};
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const User = mongoose.model("User", userSchema);
