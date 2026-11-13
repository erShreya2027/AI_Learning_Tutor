import axios from "axios";
import {BASE_URL} from "./apiPaths";

const axiosInstance=axios.create({
    baseURL:BASE_URL,
    timeout:80000,
    headers:{
        "Content-Type": "application/json",
        Accept:"application/json",
    },
});

//req interceptor

axiosInstance.interceptors.request.use(
    (config)=>{
        const acceessToken=localStorage.getItem("token");
        if(acceessToken){
            config.headers.Authorization=`Bearer ${acceessToken}`;
        }
        return config;
    },
    (error)=>{
        return Promise.reject(error);
    }
);

//response interceptor

axiosInstance.interceptors.response.use(
    (response)=>{
        return response;
    },
    (error)=>{
        if(error.response){
            if(error.response.status===500){
                console.error("Server error.Please tr again later.");
            }
        }else if(error.code==="ECONNABORTED"){
            console.error("Request timeout.Please try again");
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;