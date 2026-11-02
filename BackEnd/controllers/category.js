const Category = require('../models/category');
const Product = require('../models/product');
const slugify = value => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

exports.getCategories = async (req,res) => {
 try { const categories=await Category.find({isActive:true}).sort({name:1}); return res.status(200).json({success:true,categories}); }
 catch(error){ return res.status(500).json({success:false,message:'Unable to load categories'}); }
};
exports.getAdminCategories = async (req,res) => {
 try { const categories=await Category.find().sort({createdAt:-1}); return res.status(200).json({success:true,categories}); }
 catch(error){ return res.status(500).json({success:false,message:'Unable to load categories'}); }
};
exports.createCategory = async (req,res) => {
 try {
  const name=String(req.body.name||'').trim(), description=String(req.body.description||'').trim(), slug=slugify(name);
  if(!name||!slug) return res.status(400).json({success:false,message:'A valid category name is required'});
  const category=await Category.create({name,description,slug});
  return res.status(201).json({success:true,category});
 } catch(error){ if(error.code===11000)return res.status(409).json({success:false,message:'A category with this name already exists'}); return res.status(500).json({success:false,message:error.message||'Unable to create category'}); }
};
exports.updateCategory = async (req,res) => {
 try {
  const category=await Category.findById(req.params.id);
  if(!category)return res.status(404).json({success:false,message:'Category not found'});
  const oldName=category.name, name=String(req.body.name??category.name).trim();
  if(!name)return res.status(400).json({success:false,message:'Category name is required'});
  category.name=name; category.slug=slugify(name); category.description=String(req.body.description??category.description).trim();
  if(typeof req.body.isActive==='boolean')category.isActive=req.body.isActive;
  await category.save();
  if(oldName!==name)await Product.updateMany({category:oldName},{$set:{category:name}});
  return res.status(200).json({success:true,category});
 } catch(error){ if(error.code===11000)return res.status(409).json({success:false,message:'A category with this name already exists'}); return res.status(500).json({success:false,message:error.message||'Unable to update category'}); }
};
exports.deleteCategory = async (req,res) => {
 try {
  const category=await Category.findById(req.params.id);
  if(!category)return res.status(404).json({success:false,message:'Category not found'});
  const inUse=await Product.exists({category:category.name,isDeleted:{$ne:true}});
  if(inUse)return res.status(409).json({success:false,message:'This category is assigned to active products. Move those products to another category before deleting it.'});
  await category.deleteOne();
  return res.status(200).json({success:true,message:'Category deleted successfully'});
 } catch(error){ return res.status(500).json({success:false,message:error.message||'Unable to delete category'}); }
};