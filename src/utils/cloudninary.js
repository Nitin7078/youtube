import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uplodeoncloudniary = async (localFilePath)=>{
    try{
        if(!localFilePath) return ;

        const response = await  cloudinary.uploader.upload(localFilePath ,{
            resource_type:'auto'
        })

        console.log(`${response.url}`)

        return response;
    }catch(error){
        fs.unlinkSync(localFilePath) // remove the locally saved temp file as the uplode operation failed
    }
}

export {uplodeoncloudniary};

// cloudinary.v2.uploader
// .upload("dog.mp4", {
//   resource_type: "video", 
//   public_id: "my_dog",
//   overwrite: true, 
//   notification_url: "https://mysite.example.com/notify_endpoint"})
// .then(result=>console.log(result));