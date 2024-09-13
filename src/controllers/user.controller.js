import { asyncHandler } from "../utils/asyncHandler.js"; //imported our custom wraper to handle async call
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

//setting these cookie options thoughtfully, you can significantly enhance the security of your web application and protect against a range of common web vulnerabilities.
// httpOnly flag, help ensure that cookies are protected from being accessed or modified by client-side JavaScript. 
const cookieOptions = {
    httpOnly: true,
    secure: true
}

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

const loginUser = asyncHandler(async (req, res) => {
    // get data request body
    // username or email for login 
    // find the user if exits
    // password validation check
    // generate access and referesh token
    // send tokens in cookie or response(if mobile app)
    const { email, username, password } = req.body;
    if (!(username || email)) {
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    // Use the custom method 'isPasswordCorrect' to validate the password
    // Note: 'user' refers to an instance of the User model (not the model itself)
    // 'User' is the Mongoose model, while 'user' is an instance of that model
    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User logged In Successfully"
            )
        )
})

const logoutUser = asyncHandler(async (req, res) => {
    // To log out a user, either clear the refreshToken or delete it from the database using the user's _id, which is accessible through the custom authentication middleware.
    await User.findByIdAndUpdate(
        req.user._id,
        {
            // Use $set to update or create a field with a specific value.
            // $set: {
            //In MongoDB, when you use undefined for a field in an update operation, it doesn’t actually remove the field from the document. Instead, it leaves the field as is.
            //     refreshToken: undefined
            // }
            // $set: {
            //     refreshToken: ""
            // }
            $unset: {
                refreshToken: ""
            }
        },
        {
            new: true
        }
    )

    return res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await generateAccessAndRefereshTokens(user._id)
        return res
        .status(200)
        .cookie("accessToken", newAccessToken, cookieOptions)
        .cookie("refreshToken", newRefreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200, 
                {accessToken:newAccessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}