import {CATEGORIES_REQUEST,CATEGORIES_SUCCESS,CATEGORIES_FAIL,CATEGORY_CREATE_SUCCESS,CATEGORY_UPDATE_SUCCESS,CATEGORY_DELETE_SUCCESS,CATEGORY_ACTION_FAIL,CATEGORY_ACTION_RESET} from '../constants/categoryConstants';
export const categoriesReducer=(state={categories:[]},action)=>{
 switch(action.type){
 case CATEGORIES_REQUEST:return {...state,loading:true,error:null};
 case CATEGORIES_SUCCESS:return {...state,loading:false,categories:action.payload,error:null};
 case CATEGORIES_FAIL:return {...state,loading:false,error:action.payload};
 case CATEGORY_CREATE_SUCCESS:return {...state,categories:[action.payload,...state.categories],actionSuccess:'Category created successfully',actionError:null};
 case CATEGORY_UPDATE_SUCCESS:return {...state,categories:state.categories.map(c=>c._id===action.payload._id?action.payload:c),actionSuccess:'Category updated successfully',actionError:null};
 case CATEGORY_DELETE_SUCCESS:return {...state,categories:state.categories.filter(c=>c._id!==action.payload),actionSuccess:'Category deleted successfully',actionError:null};
 case CATEGORY_ACTION_FAIL:return {...state,actionError:action.payload,actionSuccess:null};
 case CATEGORY_ACTION_RESET:return {...state,actionError:null,actionSuccess:null};
 default:return state;
 }
};