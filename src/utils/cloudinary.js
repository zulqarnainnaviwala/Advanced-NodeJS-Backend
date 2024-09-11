import { v2 as cloudinary } from "cloudinary"
import fs from "fs" //https://nodejs.org/api/fs.html

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

//function to upload file on cloudinary
const uploadOnCloudinary = async (localFilePath) => {
    try {
        //if there is no file on local return early
        if (!localFilePath) return null

        //if localFilePath=true, then upload by using "cloudinary.uploader.upload(path,{params..})"
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // file has been uploaded successfull
        // console.log(response);
        console.log("file is uploaded on cloudinary ", response.url);
        return response; //return cloudinary saved file info 

    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        console.log("Error when uploading on cloudinary :", error)
        return null;
    }
}
export { uploadOnCloudinary }