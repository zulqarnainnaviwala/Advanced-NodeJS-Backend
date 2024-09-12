import { asyncHandler } from "../utils/asyncHandler.js"; //imported our custom wraper to handle async call
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
    // res.status(500).json({
    //     message: "Zulqarnain Naviwala"
    // })

    // get user details from frontend
    // apply validation - not empty
    // check if user already exists by username, email
    // check for images, check for avatar (which is required)
    // upload them to cloudinary, avatar(atleast)
    // create user object - create entry in database
    // remove password and refresh token field from response
    // check for successful user creation 
    // return response
    const { fullName, email, username, password } = req.body
    if (
        [fullName, email, username, password].some(field => field?.trim() === "" || !field)
    ) {
        // Behavior of "!field"
        // undefined: !undefined evaluates to true.
        // null: !null evaluates to true.
        // "" (empty string): !"" evaluates to true.
        // 0: !0 evaluates to true.
        // false: !false evaluates to true.
        // NaN: !NaN evaluates to true.
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    //multer gives us files access in "req.files"
    // const avatarLocalPath = req.files?.avatar[0]?.path; //return undefined if user forgot to upload avatar, so we will follow classic check (this a required field)
    let avatarLocalPath;
    if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0) {
        avatarLocalPath = req.files.avatar[0].path
    }
    // const coverImageLocalPath = req.files?.coverImage[0]?.path; //returns undefined if there is no cover, so we will follow classic check (this a not required field in our case but should be handled properly)
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar Local file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar cloudinary file is required")

    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )
})

export {
    registerUser,
}