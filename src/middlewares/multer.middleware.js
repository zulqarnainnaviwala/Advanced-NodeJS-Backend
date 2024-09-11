import multer from "multer";

// Set up Multer storage configuration
const storage = multer.diskStorage({
    // Define the destination for file uploads
    destination: function (req, file, cb) {
        // Save files to the 'public/temp' directory
        // Change to '../../public/temp' if needed
        cb(null, "./public/temp");
    },
    // Define the filename for uploaded files
    filename: function (req, file, cb) {
        // Use the original name of the uploaded file
        // console.log(file)
        cb(null, file.originalname);
    }
});

// Create a Multer instance with the storage configuration
export const upload = multer({
    storage,
}); 
