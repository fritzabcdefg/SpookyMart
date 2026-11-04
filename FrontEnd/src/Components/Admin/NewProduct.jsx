
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';

import MetaData from '../Layout/MetaData';
import Sidebar from './SideBar';

import {
    newProduct,
    clearErrors
} from '../../actions/productActions';

import { NEW_PRODUCT_RESET } from '../../constants/productConstants';
import { getCategories } from '../../actions/categoryActions';
import './ProductForm.css';

// Yup validation rules
const productSchema = Yup.object({
    name: Yup.string()
        .trim()
        .max(100, 'Product name cannot exceed 100 characters')
        .required('Product name is required'),

    sellPrice: Yup.number().typeError('Selling price must be a number').min(0, 'Selling price cannot be negative').required('Selling price is required'),
    costPrice: Yup.number().typeError('Cost price must be a number').min(0, 'Cost price cannot be negative').required('Cost price is required'),

    description: Yup.string()
        .trim()
        .required('Product description is required'),

    category: Yup.string().required('Category is required'),

    stock: Yup.number()
        .typeError('Stock must be a number')
        .integer('Stock must be a whole number')
        .min(0, 'Stock cannot be negative')
        .required('Stock is required'),

    seller: Yup.string()
        .trim()
        .required('Seller name is required'),

    images: Yup.array()
        .min(1, 'Please upload at least one product image')
        .max(10, 'You can upload a maximum of 10 images')
});

const NewProduct = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { categories = [] } = useSelector(state => state.categories || {});
    useEffect(() => { dispatch(getCategories()); }, [dispatch]);

    const {
        loading,
        error,
        success
    } = useSelector(state => state.newProduct);

    const formik = useFormik({
        initialValues: {
            name: '',
            sellPrice: '',
            costPrice: '',
            description: '',
            category: '',
            stock: '',
            seller: '',
            images: []
        },

        validationSchema: productSchema,

        onSubmit: (values) => {
            const formData = new FormData();

            formData.set('name', values.name.trim());
            formData.set('sellPrice', values.sellPrice);
            formData.set('costPrice', values.costPrice);
            formData.set('description', values.description.trim());
            formData.set('category', values.category);
            formData.set('stock', values.stock);
            formData.set('seller', values.seller.trim());

            values.images.forEach(image => {
                formData.append('images', image);
            });

            dispatch(newProduct(formData));
        }
    });

    const {
        values,
        errors,
        touched,
        handleChange,
        handleBlur,
        handleSubmit,
        setFieldValue,
        setFieldTouched
    } = formik;

    useEffect(() => {
        if (!values.category && categories.length) setFieldValue('category', categories[0].name);
    }, [categories, values.category, setFieldValue]);

    // Convert selected images to Base64
    const onChange = async (e) => {
        const files = Array.from(e.target.files || []);

        if (!files.length) return;

        if (files.some(file => !file.type.startsWith('image/'))) {
            toast.error('Please select image files only');
            e.target.value = '';
            return;
        }

        if (files.some(file => file.size > 5 * 1024 * 1024)) {
            toast.error('Each image must be 5 MB or smaller');
            e.target.value = '';
            return;
        }

        if (values.images.length + files.length > 10) {
            toast.error('You can upload a maximum of 10 images');
            e.target.value = '';
            return;
        }

        try {
            const convertedImages = await Promise.all(
                files.map(file => new Promise((resolve, reject) => {
                    const reader = new FileReader();

                    reader.onload = () => resolve(reader.result);
                    reader.onerror = () => reject(
                        new Error(`Unable to read ${file.name}`)
                    );

                    reader.readAsDataURL(file);
                }))
            );

            const updatedImages = [
                ...values.images,
                ...convertedImages
            ];

            setFieldValue('images', updatedImages);
            setFieldTouched('images', true, false);

        } catch (error) {
            toast.error(error.message);
        }

        e.target.value = '';
    };

    const removeImage = (imageToRemove) => {
        const updatedImages = values.images.filter(
            image => image !== imageToRemove
        );

        setFieldValue('images', updatedImages);
        setFieldTouched('images', true, false);
    };

    useEffect(() => {
        if (error) {
            toast.error(error, {
                position: 'bottom-right'
            });

            dispatch(clearErrors());
        }

        if (success) {
            toast.success('Product created successfully', {
                position: 'bottom-right'
            });

            dispatch({ type: NEW_PRODUCT_RESET });
            navigate('/admin/products');
        }
    }, [error, success, dispatch, navigate]);

    const showError = (field) =>
        touched[field] && errors[field];

    return (
        <>
            <MetaData title="New Product" />

            <div className="row">
                <div className="col-12 col-md-2">
                    <Sidebar />
                </div>

                <div className="col-12 col-md-10">
                    <div className="product-admin-page">
                        <form
                            className="product-admin-form"
                            onSubmit={handleSubmit}
                            noValidate
                        >
                            <div className="product-form-heading">
                                <div className="product-form-heading-icon"><i className="fa fa-cube" /></div>
                                <div>
                                    <span className="product-form-eyebrow">INVENTORY MANAGEMENT</span>
                                    <h1>New Product</h1>
                                    <p>Add a product to your SpookyMart catalog.</p>
                                </div>
                            </div>
                            <div className="product-form-section-title">
                                <i className="fa fa-info-circle" /> Product information
                            </div>

                            {/* Product Name */}
                            <div className="form-group product-form-field">
                                <label htmlFor="name_field">
                                    Name
                                </label>

                                <input
                                    type="text"
                                    id="name_field"
                                    name="name"
                                    className="form-control"
                                    value={values.name}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    maxLength={100}
                                />

                                {showError('name') && (
                                    <small className="text-danger">
                                        {errors.name}
                                    </small>
                                )}
                            </div>

                            {/* Cost and selling prices */}
                            <div className="form-group">
                                <label htmlFor="cost_price_field">Cost Price (₱)</label>
                                <input type="number" id="cost_price_field" name="costPrice" className="form-control" value={values.costPrice} onChange={handleChange} onBlur={handleBlur} min="0" step="0.01" />
                                {showError('costPrice') && <small className="text-danger">{errors.costPrice}</small>}
                            </div>
                            <div className="form-group">
                                <label htmlFor="sell_price_field">
                                    Selling Price (₱)
                                </label>

                                <input
                                    type="number"
                                    id="sell_price_field"
                                    name="sellPrice"
                                    className="form-control"
                                    value={values.sellPrice}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    min="0"
                                    step="0.01"
                                />

                                {showError('sellPrice') && (
                                    <small className="text-danger">
                                        {errors.sellPrice}
                                    </small>
                                )}
                            </div>

                            {/* Description */}
                            <div className="form-group">
                                <label htmlFor="description_field">
                                    Description
                                </label>

                                <textarea
                                    className="form-control"
                                    id="description_field"
                                    name="description"
                                    rows="8"
                                    value={values.description}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                />

                                {showError('description') && (
                                    <small className="text-danger">
                                        {errors.description}
                                    </small>
                                )}
                            </div>

                            {/* Category */}
                            <div className="form-group">
                                <label htmlFor="category_field">
                                    Category
                                </label>

                                <select
                                    className="form-control"
                                    id="category_field"
                                    name="category"
                                    value={values.category}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    disabled={categories.length === 0}
                                >
                                    <option value="">Select a category</option>
                                    {categories.map(item => <option key={item._id} value={item.name}>{item.name}</option>)}
                                </select>

                                {showError('category') && (
                                    <small className="text-danger">
                                        {errors.category}
                                    </small>
                                )}
                            </div>

                            {/* Stock */}
                            <div className="form-group">
                                <label htmlFor="stock_field">
                                    Stock
                                </label>

                                <input
                                    type="number"
                                    id="stock_field"
                                    name="stock"
                                    className="form-control"
                                    value={values.stock}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    min="0"
                                    step="1"
                                />

                                {showError('stock') && (
                                    <small className="text-danger">
                                        {errors.stock}
                                    </small>
                                )}
                            </div>

                            {/* Seller */}
                            <div className="form-group">
                                <label htmlFor="seller_field">
                                    Seller Name
                                </label>

                                <input
                                    type="text"
                                    id="seller_field"
                                    name="seller"
                                    className="form-control"
                                    value={values.seller}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                />

                                {showError('seller') && (
                                    <small className="text-danger">
                                        {errors.seller}
                                    </small>
                                )}
                            </div>

                            {/* Product Images */}
                            <div className="form-group">
                                <label htmlFor="customFile">
                                    Product Images (Maximum 10)
                                </label>

                                <input
                                    type="file"
                                    name="images"
                                    className="form-control"
                                    id="customFile"
                                    accept="image/*"
                                    onChange={onChange}
                                    multiple
                                />

                                <small className="form-text text-muted">
                                    Maximum 10 images, 5 MB per image.
                                </small>

                                {touched.images && errors.images && (
                                    <small className="text-danger d-block">
                                        {errors.images}
                                    </small>
                                )}

                                <div className="d-flex flex-wrap">
                                    {values.images.map((img, index) => (
                                        <div
                                            key={index}
                                            className="mt-3 mr-2"
                                            style={{
                                                position: 'relative',
                                                marginRight: '10px'
                                            }}
                                        >
                                            <img
                                                src={img}
                                                alt={`Product preview ${index + 1}`}
                                                width="80"
                                                height="80"
                                                style={{
                                                    objectFit: 'cover'
                                                }}
                                            />

                                            <button
                                                type="button"
                                                className="btn btn-danger btn-sm"
                                                onClick={() => removeImage(img)}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="product-form-submit"
                                disabled={loading}
                            >
                                {loading ? 'CREATING...' : 'CREATE PRODUCT'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default NewProduct;
