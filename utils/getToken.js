const getToken = (res, statusCode , user)=>{
    const token = user.getJWTToken()
    
    res.status(statusCode).send({success:true , authtoken:token , user  })

}

export default getToken