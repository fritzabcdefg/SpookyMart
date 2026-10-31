import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import MetaData from '../Layout/MetaData';
import Sidebar from './SideBar';

import {
    updateProduct,
    getProductDetails,
    clearErrors
} from '../../actions/productActions';

import { UPDATE_PRODUCT_RESET } from '../../constants/productConstants';

const UpdateProduct = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id } = useParams();

    const { error, product } = useSelector(
        state => state.productDetails
    );

    const {
        loading,
        error: updateError,
        isUpdated
    } = useSelector(state => state.product);

    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Decorations');
    const [stock, setStock] = useState('');
    const [seller, setSeller] = useState('');

    const [images, setImages] = useState([]);
    const [oldImages, setOldImages] = useState([]);
    const [imagesPreview, setImagesPreview] = useState([]);
    const [removedImages, setRemovedImages] = useState([]);

    const categories = ['Decorations', 'Costumes'];

    useEffect(() => {
        dispatch(getProductDetails(id));
    }, [dispatch, id]);

    useEffect(() => {
        if (product && product._id === id) {
            setName(product.name || '');
            setPrice(product.price ?? '');
            setDescription(product.description || '');
            setCategory(product.category || 'Decorations');
            setStock(product.stock ?? '');
            setSeller(product.seller || '');
            setOldImages(product.images || []);
            setImages([]);
            setRemovedImages([]);
        }
    }, [product, id]);

    const onChange = e => {
        const files = Array.from(e.target.files);

        files.forEach(file => {
            if (!file.type.startsWith('image/')) {
                toast.error('Please select image files only');
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                toast.error(`${file.name} exceeds the 5MB limit`);
                return;
            }

            const reader = new FileReader();

            reader.onload = () => {
                setImages(old => [...old, reader.result]);
                setImagesPreview(old => [...old, reader.result]);
            };

            reader.readAsDataURL(file);
        });

        // Allow selecting the same file again.
        e.target.value = '';
    };

    const removeOldImage = (publicId) => {
        setOldImages(old =>
            old.filter(img => img.public_id !== publicId)
        );

        setRemovedImages(old => [...old, publicId]);
    };

    const removeNewImage = (image) => {
        setImages(old => old.filter(img => img !== image));
        setImagesPreview(old => old.filter(img => img !== image));
    };

    const submitHandler = (e) => {
        e.preventDefault();

        if (oldImages.length + images.length === 0) {
            toast.error('A product must have at least one image');
            return;
        }

        if (oldImages.length + images.length > 10) {
            toast.error('A product can have a maximum of 10 images');
            return;
        }

        const formData = new FormData();

        formData.set('name', name);
        formData.set('price', price);
        formData.set('description', description);
        formData.set('category', category);
        formData.set('stock', stock);
        formData.set('seller', seller);

        formData.set('removeImages', JSON.stringify(removedImages));

        images.forEach(image => {
            formData.append('images', image);
        });

        dispatch(updateProduct(product._id, formData));
    };

    useEffect(() => {
        if (error) {
            toast.error(error);
            dispatch(clearErrors());
        }

        if (updateError) {
            toast.error(updateError);
            dispatch(clearErrors());
        }

        if (isUpdated) {
            toast.success('Product updated successfully');
            dispatch({ type: UPDATE_PRODUCT_RESET });
            navigate('/admin/products');
        }
    }, [error, updateError, isUpdated, dispatch, navigate]);

    const productLoaded = product && product._id === id;

    return (
        <>
            <MetaData title="Update Product" />

            <div className="row">
                <div className="col-12 col-md-2">
                    <Sidebar />
                </div>

                <div className="col-12 col-md-10">
                    <div className="wrapper my-5">
                        {!productLoaded ? (
                            <h3 className="text-center">
                                Loading product...
                            </h3>
                        ) : (
                            <form
                                className="shadow-lg"
                                onSubmit={submitHandler}
                            >
                                <h1 className="mb-4">Update Product</h1>

                                <div className="form-group">
                                    <label htmlFor="name_field">Name</label>
                                    <input
                                        id="name_field"
                                        className="form-control"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        maxLength={100}
                                        required
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
                                        id="description_field"
                                        className="form-control"
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
                                        id="category_field"
                                        className="form-control"
                                        value={category}
                                        onChange={e => setCategory(e.target.value)}
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
                                        id="seller_field"
                                        className="form-control"
                                        value={seller}
                                        onChange={e => setSeller(e.target.value)}
                                        required
                                    />
                                </div>

                                    <div className="form-group">
                                        <label>Product Images</label>

                                        <div style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: '12px',
                                            marginTop: '12px'
                                        }}>
                                            {oldImages.map(img => (
                                                <div key={img.public_id} style={{ position: 'relative' }}>
                                                    <img
                                                        src={img.url}
                                                        alt="Existing product"
                                                        width="80"
                                                        height="80"
                                                        style={{ objectFit: 'cover' }}
                                                    />

                                                    <button
                                                        type="button"
                                                        onClick={() => removeOldImage(img.public_id)}
                                                        style={removeButtonStyle}
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}

                                            {imagesPreview.map((img, index) => (
                                                <div key={img} style={{ position: 'relative' }}>
                                                    <img
                                                        src={img}
                                                        alt="New product"
                                                        width="80"
                                                        height="80"
                                                        style={{ objectFit: 'cover' }}
                                                    />

                                                    <button
                                                        type="button"
                                                        onClick={() => removeNewImage(img)}
                                                        style={removeButtonStyle}
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        <input
                                            type="file"
                                            name="images"
                                            className="form-control mt-3"
                                            onChange={onChange}
                                            multiple
                                            accept="image/*"
                                        />
                                    </div>

                                <button
                                    type="submit"
                                    className="btn btn-block py-3"
                                    disabled={loading}
                                >
                                    {loading ? 'UPDATING...' : 'UPDATE PRODUCT'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

const removeButtonStyle = {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: 'none',
    background: '#dc3545',
    color: 'white',
    fontWeight: 'bold',
    cursor: 'pointer'
};

export default UpdateProduct