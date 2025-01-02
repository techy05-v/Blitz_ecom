

import {axiosInstance} from "../axiosConfig.js"
export const addressService={
    getAllAddress:async ()=>{

        try{
            const response=  await axiosInstance.get("/user/getalladdress")
            return response.data
        }
        catch(error){
            throw error.response?.data||error.message
        }

    },
    createAddress: async(addressData)=>{
        try{
            const response = await axiosInstance.post("/user/addAddress",addressData)
            return response.data
        }
        catch(error){
            throw error.response?.data||error.message
        }
    },
    updateAddress:async(addressId,addressData)=>{
        try{
            const response = await axiosInstance.put(`/user/editAddress/${addressId}`,addressData)
            return response.data
        }
        catch(error){
            throw error.response?.data||error.message
        }
    },
    deletAddress:async(addressId)=>{
        try{
            const response= await axiosInstance.delete(`/user/deleteaddress/${addressId}`)
            return response.data
        }
        catch(error){
            throw error.response?.data||error.message
        }
    }
}