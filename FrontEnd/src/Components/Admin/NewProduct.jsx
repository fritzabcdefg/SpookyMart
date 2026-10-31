import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import MetaData from '../Layout/MetaData';
import Sidebar from './SideBar';

import {
    newProduct,
    clearErrors
} from '../../actions/productActions';

import { NEW_PRODUCT_RESET } from '../../constants/productConstants';

const NewProduct = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const {
        loading,
        error,
        success
    } = useSelector(state => state.newProduct);

    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Decorations');
    const [stock, setStock] = useState('');
    const [seller, setSeller] = useState('');
    const [images, setImages] = useState([]);
    const [imagesPreview, setImagesPreview] = useState([]);

    const categories = [
        'Decorations',
        'Costumes'
    ];

    const onChange = async (e) => {
        const files = Array.from(e.target.files || []);

        if (files.length > 10) {
            toast.error('You can upload a maximum of 10 images');
            e.target.value = '';
            return;
        }

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

            setImages(convertedImages);
            setImagesPreview(convertedImages);

        } catch (error) {
            toast.error(error.message);
        }
    };

    const submitHandler = (e) => {
        e.preventDefault();

        if (!name.trim() || !description.trim() || !seller.trim()) {
            toast.error('Please complete all required fields');
            return;
        }

        if (Number(price) <= 0 || !Number.isFinite(Number(price))) {
            toast.error('Please enter a valid product price');
            return;
        }

        if (!Number.isInteger(Number(stock)) || Number(stock) < 0) {
            toast.error('Please enter a valid stock quantity');
            return;
        }

        const formData = new FormData();

        formData.set('name', name.trim());
        formData.set('price', price);
        formData.set('description', description.trim());
        formData.set('category', category);
        formData.set('stock', stock);
        formData.set('seller', seller.trim());

        images.forEach(image => {
            formData.append('images', image);
        });

        dispatch(newProduct(formData));
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

    return (
        <>
            <MetaData title="New Product" />

            <div className="row">
                <div className="col-12 col-md-2">
                    <Sidebar />
                </div>

                <div className="col-12 col-md-10">
                    <div className="wrapper my-5">
                        <form
                            className="shadow-lg"
                            onSubmit={submitHandler}
                        >
                            <h1 className="mb-4">New Product</h1>

                            <div className="form-group">
                                <label htmlFor="name_field">Name</label>
                                <input
                                    type="text"
                                    id="name_field"
                                    className="form-control"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    required
                                    maxLength={100}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="price_field">Price</label>
                                <input
                                    type="number"
                                    id="price_field"
                                    className="form-control"
                                    value={price}
                                    onChange={e => setPrice(e.target.value)}
                                    min="0.01"
                                    step="0.01"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="description_field">
                                    Description
                                </label>
                                <textarea
                                    className="form-control"
                                    id="description_field"
                                    rows="8"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="category_field">
                                    Category
                                </label>

                                <select
                                    className="form-control"
                                    id="category_field"
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                    required
                                >
                                    {categories.map(item => (
                                        <option key={item} value={item}>
                                            {item}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="stock_field">Stock</label>
                                <input
                                    type="number"
                                    id="stock_field"
                                    className="form-control"
                                    value={stock}
                                    onChange={e => setStock(e.target.value)}
                                    min="0"
                                    step="1"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="seller_field">
                                    Seller Name
                                </label>
                                <input
                                    type="text"
                                    id="seller_field"
                                    className="form-control"
                                    value={seller}
                                    onChange={e => setSeller(e.target.value)}
                                    required
                                />
                            </div>

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
                                    You can select multiple images. Maximum
                                    5 MB per image.
                                </small>

                                <div className="d-flex flex-wrap">
                                    {imagesPreview.map((img, index) => (
                                        <img
                                            src={img}
                                            key={index}
                                            alt={`Product preview ${index + 1}`}
                                            className="mt-3 mr-2"
                                            width="80"
                                            height="80"
                                            style={{
                                                objectFit: 'cover',
                                                marginRight: '10px'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-block py-3"
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

export default NewProduct