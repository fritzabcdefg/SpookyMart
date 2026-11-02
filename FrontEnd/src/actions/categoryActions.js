import axios from 'axios';
import {CATEGORIES_REQUEST,CATEGORIES_SUCCESS,CATEGORIES_FAIL,CATEGORY_CREATE_SUCCESS,CATEGORY_UPDATE_SUCCESS,CATEGORY_DELETE_SUCCESS,CATEGORY_ACTION_FAIL} from '../constants/categoryConstants';
const api=import.meta.env.VITE_API;
export const getCategories=(admin=false)=>async dispatch=>{
 try{dispatch({type:CATEGORIES_REQUEST});const {data}=await axios.get(`${api}${admin?'/admin/categories':'/categories'}`,{withCredentials:admin});dispatch({type:CATEGORIES_SUCCESS,payload:data.categories});}
 catch(error){dispatch({type:CATEGORIES_FAIL,payload:error.response?.data?.message||error.message});}
};
export const createCategory=values=>async dispatch=>{
 try{const {data}=await axios.post(`${api}/admin/categories`,values,{withCredentials:true});dispatch({type:CATEGORY_CREATE_SUCCESS,payload:data.category});}
 catch(error){dispatch({type:CATEGORY_ACTION_FAIL,payload:error.response?.data?.message||error.message});}
};
export const updateCategory=(id,values)=>async dispatch=>{
 try{const {data}=await axios.put(`${api}/admin/category/${id}`,values,{withCredentials:true});dispatch({type:CATEGORY_UPDATE_SUCCESS,payload:data.category});}
 catch(error){dispatch({type:CATEGORY_ACTION_FAIL,payload:error.response?.data?.message||error.message});}
};
export const deleteCategory=id=>async dispatch=>{
 try{await axios.delete(`${api}/admin/category/${id}`,{withCredentials:true});dispatch({type:CATEGORY_DELETE_SUCCESS,payload:id});}
 catch(error){dispatch({type:CATEGORY_ACTION_FAIL,payload:error.response?.data?.message||error.message});}
};