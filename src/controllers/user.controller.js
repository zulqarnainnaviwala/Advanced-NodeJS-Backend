import { asyncHandler } from "../utils/asyncHandler.js"; //imported our custom wrapper to handle async call

const registerUser = asyncHandler(async (req, res) => {
    res.status(500).json({
        message: "chai aur code"
    })
})

export {
    registerUser,
}