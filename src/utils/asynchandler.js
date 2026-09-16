 const asynchandler = (requesthadler)=>{
    (req,res,next)=>{
        Promise.resolve(requesthadler(req,res,next)).
        catch((err)=> next(err))
    }
}

// const asynchandler = (fun)=> async(req,res,next)=>{
//     try{
            //await fun(req,res,next)
//     }catch(error){
//         res.status(error.code || 5000).json({
//             success:false,
//             message: error.message
//         })
//     }
// }
export {asynchandler}