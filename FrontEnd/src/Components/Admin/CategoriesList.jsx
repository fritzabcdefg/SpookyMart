import React,{useEffect,useState} from 'react';
import {useDispatch,useSelector} from 'react-redux';
import {DataGrid} from '@mui/x-data-grid';
import {toast} from 'react-toastify';
import Swal from 'sweetalert2';
import MetaData from '../Layout/MetaData';
import Loader from '../Layout/Loader';
import Sidebar from './SideBar';
import {getCategories,createCategory,updateCategory,deleteCategory} from '../../actions/categoryActions';
import {CATEGORY_ACTION_RESET} from '../../constants/categoryConstants';
import './CategoriesList.css';

const CategoriesList=()=>{
 const dispatch=useDispatch();
 const {categories=[],loading,error,actionError,actionSuccess}=useSelector(state=>state.categories||{});
 const [name,setName]=useState(''),[description,setDescription]=useState(''),[editingId,setEditingId]=useState(null);
 useEffect(()=>{dispatch(getCategories(true));},[dispatch]);
 useEffect(()=>{
  if(error||actionError){toast.error(error||actionError);dispatch({type:CATEGORY_ACTION_RESET});}
  if(actionSuccess){toast.success(actionSuccess);setName('');setDescription('');setEditingId(null);dispatch({type:CATEGORY_ACTION_RESET});dispatch(getCategories(true));}
 },[error,actionError,actionSuccess,dispatch]);
 const submit=e=>{e.preventDefault();const values={name:name.trim(),description:description.trim()};if(!values.name)return toast.error('Category name is required');dispatch(editingId?updateCategory(editingId,values):createCategory(values));};
 const edit=c=>{setEditingId(c._id);setName(c.name);setDescription(c.description||'');window.scrollTo({top:0,behavior:'smooth'});};
 const remove=async c=>{const result=await Swal.fire({title:'Delete this category?',text:`“${c.name}” will be deleted. Categories assigned to active products cannot be deleted.`,icon:'warning',showCancelButton:true,confirmButtonColor:'#dc3545',confirmButtonText:'Delete category',cancelButtonText:'Cancel',reverseButtons:true});if(result.isConfirmed)dispatch(deleteCategory(c._id));};
 const columns=[
  {field:'name',headerName:'Category Name',flex:1,minWidth:170},
  {field:'slug',headerName:'Slug',flex:1,minWidth:150},
  {field:'description',headerName:'Description',flex:1.3,minWidth:190,valueGetter:value=>value||'—'},
  {field:'isActive',headerName:'Status',width:115,renderCell:p=><span style={{padding:'5px 10px',borderRadius:20,fontSize:12,fontWeight:700,color:p.value?'#22c55e':'#f59e0b',background:p.value?'rgba(34,197,94,.14)':'rgba(245,158,11,.14)'}}>{p.value?'Active':'Inactive'}</span>},
  {field:'actions',headerName:'Actions',width:150,sortable:false,filterable:false,renderCell:p=><div style={{display:'flex',gap:8,alignItems:'center',height:'100%'}}>
   <button className="btn category-primary-btn btn-sm" onClick={()=>edit(p.row)} title="Edit"><i className="fa fa-pencil"/></button>
   <button className={`btn btn-sm ${p.row.isActive?'btn-warning':'btn-success'}`} onClick={()=>dispatch(updateCategory(p.row._id,{isActive:!p.row.isActive}))} title={p.row.isActive?'Deactivate':'Activate'}><i className={`fa ${p.row.isActive?'fa-eye-slash':'fa-eye'}`}/></button>
   <button className="btn btn-danger btn-sm" onClick={()=>remove(p.row)} title="Delete"><i className="fa fa-trash"/></button>
  </div>}
 ];
 const rows=categories.map(c=>({...c,id:c._id}));
 return <>
  <MetaData title="Manage Categories"/>
  <div className="row"><div className="col-12 col-md-2"><Sidebar/></div><div className="col-12 col-md-10">
   <div style={{padding:24}}>
    <h1 style={{color:'#f5f0ff',marginBottom:8}}>Categories</h1>
    <p style={{color:'#aaa',marginBottom:24}}>Create, edit, activate, and remove product categories.</p>
    <form onSubmit={submit} style={{background:'#160d22',border:'1px solid #45245e',borderRadius:12,padding:20,marginBottom:24}}>
     <h4 style={{color:'#d8b4fe',marginBottom:16}}>{editingId?'Edit Category':'Add New Category'}</h4>
     <div className="row">
      <div className="col-12 col-lg-4 form-group"><label htmlFor="category-name" style={{color:'#f5f0ff'}}>Name</label><input id="category-name" className="form-control" value={name} onChange={e=>setName(e.target.value)} maxLength={60} placeholder="e.g. Halloween Props" required/></div>
      <div className="col-12 col-lg-6 form-group"><label htmlFor="category-description" style={{color:'#f5f0ff'}}>Description</label><input id="category-description" className="form-control" value={description} onChange={e=>setDescription(e.target.value)} placeholder="Optional category description" maxLength={250}/></div>
      <div className="col-12 col-lg-2 d-flex align-items-end mb-3" style={{gap:8}}><button type="submit" className="btn category-primary-btn" style={{flex:1}}>{editingId?'Save':'Add'}</button>{editingId&&<button type="button" className="btn btn-secondary" onClick={()=>{setEditingId(null);setName('');setDescription('');}}>Cancel</button>}</div>
     </div>
    </form>
    <div style={{color:'#d8b4fe',marginBottom:12,fontWeight:600}}>{categories.length} categor{categories.length===1?'y':'ies'}</div>
    {loading?<Loader/>:<div style={{width:'100%',background:'#160d22',border:'1px solid #45245e',borderRadius:12,padding:12}}>
     <DataGrid rows={rows} columns={columns} getRowId={r=>r.id} autoHeight disableRowSelectionOnClick pageSizeOptions={[5,10,25]} initialState={{pagination:{paginationModel:{pageSize:10,page:0}}}} sx={{border:'none',backgroundColor:'#160d22',color:'#f5f0ff','& .MuiDataGrid-columnHeaders':{backgroundColor:'#241333',color:'#d8b4fe',borderBottom:'1px solid #7134a8'},'& .MuiDataGrid-columnHeader':{backgroundColor:'#241333'},'& .MuiDataGrid-columnHeaderTitle':{color:'#d8b4fe',fontWeight:700},'& .MuiDataGrid-virtualScroller':{backgroundColor:'#160d22'},'& .MuiDataGrid-row':{backgroundColor:'#160d22',color:'#f5f0ff'},'& .MuiDataGrid-row:hover':{backgroundColor:'#2a193b'},'& .MuiDataGrid-cell':{color:'#f5f0ff',borderColor:'#45245e'},'& .MuiDataGrid-footerContainer':{backgroundColor:'#241333',color:'#d8b4fe',borderTop:'1px solid #45245e'},'& .MuiTablePagination-root, & .MuiSvgIcon-root':{color:'#d8b4fe'},'& .MuiDataGrid-overlay':{backgroundColor:'#160d22',color:'#f5f0ff'}}}/>
    </div>}
   </div>
  </div></div>
 </>;
};
export default CategoriesList;