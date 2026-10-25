import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { DataGrid } from '@mui/x-data-grid';
import { toast } from 'react-toastify';

import MetaData from '../Layout/MetaData';
import Loader from '../Layout/Loader';
import Sidebar from './SideBar';

import {
    getAdminProducts,
    deleteProduct,
    restoreProduct,
    clearErrors
} from '../../actions/productActions';

import {DELETE_PRODUCT_RESET, RESTORE_PRODUCT_RESET} from '../../constants/productConstants';

const ProductsList = () => {
    const dispatch = useDispatch();
    const [showDeleted, setShowDeleted] = useState(false);

    const {
        loading,
        error: productsError,
        products = []
    } = useSelector((state) => state.products || {});

    const {
        error: actionError,
        isDeleted,
        isRestored
    } = useSelector((state) => state.product || {});

    useEffect(() => {
        dispatch(getAdminProducts(showDeleted));
    }, [dispatch, showDeleted]);

    useEffect(() => {
        if (productsError) {
            toast.error(productsError, { position: 'bottom-right' });
            dispatch(clearErrors());
        }

        if (actionError) {
            toast.error(actionError, { position: 'bottom-right' });
            dispatch(clearErrors());
        }
    }, [productsError, actionError, dispatch]);

    useEffect(() => {
        if (isDeleted) {
            toast.success('Product moved to Deleted Products', {
                position: 'bottom-right'
            });

            dispatch(getAdminProducts(showDeleted));
            dispatch({ type: DELETE_PRODUCT_RESET });
        }

        if (isRestored) {
            toast.success('Product restored successfully', {
                position: 'bottom-right'
            });

            dispatch(getAdminProducts(showDeleted));
            dispatch({ type: RESTORE_PRODUCT_RESET });
        }
    }, [isDeleted, isRestored, showDeleted, dispatch]);

    const deleteProductHandler = (id) => {
        const confirmed = window.confirm(
            'Move this product to Deleted Products? You can restore it later.'
        );

        if (confirmed) {
            dispatch(deleteProduct(id));
        }
    };

    const restoreProductHandler = (id) => {
        const confirmed = window.confirm(
            'Restore this product and make it available in the store again?'
        );

        if (confirmed) {
            dispatch(restoreProduct(id));
        }
    };

    const columns = [
        {
            field: 'id',
            headerName: 'Product ID',
            flex: 1,
            minWidth: 180,
            renderCell: (params) => (
                <span style={{ wordBreak: 'break-all' }}>
                    {params.value}
                </span>
            )
        },
        {
            field: 'name',
            headerName: 'Name',
            flex: 1,
            minWidth: 160
        },
        {
            field: 'price',
            headerName: 'Price',
            width: 120
        },
        {
            field: 'stock',
            headerName: 'Stock',
            width: 100
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 170,
            sortable: false,
            filterable: false,
            renderCell: (params) => (
                <>
                    {!showDeleted && (
                        <>
                            <Link
                                to={`/admin/product/${params.row.id}`}
                                className="btn btn-primary py-1 px-2"
                                title="Edit product"
                            >
                                <i className="fa fa-pencil" />
                            </Link>

                            <button
                                type="button"
                                className="btn btn-danger py-1 px-2 ml-2"
                                onClick={() => deleteProductHandler(params.row.id)}
                                title="Soft delete product"
                            >
                                <i className="fa fa-trash" />
                            </button>
                        </>
                    )}

                    {showDeleted && (
                        <button
                            type="button"
                            className="btn btn-success py-1 px-2"
                            onClick={() => restoreProductHandler(params.row.id)}
                            title="Restore product"
                        >
                            <i className="fa fa-undo" /> Restore
                        </button>
                    )}
                </>
            )
        }
    ];

    const rows = (products || []).map((product) => ({
        id: product._id,
        name: product.name,
        price: `₱${product.price}`,
        stock: product.stock
    }));

    return (
        <>
            <MetaData
                title={showDeleted ? 'Deleted Products' : 'All Products'}
            />

            <div className="row">
                <div className="col-12 col-md-2">
                    <Sidebar />
                </div>

                <div className="col-12 col-md-10">
                    <div className="d-flex flex-wrap justify-content-between align-items-center my-5">
                        <h1>
                            {showDeleted ? 'Deleted Products' : 'All Products'}
                        </h1>

                        <button
                            type="button"
                            className={`btn ${showDeleted ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setShowDeleted((current) => !current)}
                        >
                            {showDeleted
                                ? 'View Active Products'
                                : 'View Deleted Products'}
                        </button>
                    </div>

                    {loading ? (
                        <Loader />
                    ) : (
                        <div style={{ width: '100%' }}>
                            <DataGrid
                                rows={rows}
                                columns={columns}
                                pageSize={5}
                                rowsPerPageOptions={[5, 10, 25]}
                                disableSelectionOnClick
                                getRowId={(row) => row.id}
                                autoHeight
                                showToolbar
                            />
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default ProductsList;