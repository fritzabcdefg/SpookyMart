import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { DataGrid } from '@mui/x-data-grid';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

import MetaData from '../Layout/MetaData';
import Loader from '../Layout/Loader';
import Sidebar from './SideBar';

import {
    getAdminProducts,
    deleteProduct,
    deleteProducts,
    restoreProduct,
    clearErrors
} from '../../actions/productActions';

import {
    DELETE_PRODUCT_RESET,
    RESTORE_PRODUCT_RESET
} from '../../constants/productConstants';

const ProductsList = () => {
    const dispatch = useDispatch();

    const [showDeleted, setShowDeleted] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);

    const {
        loading,
        error: productsError,
        products = []
    } = useSelector(state => state.products || {});

    const {
        error: actionError,
        isDeleted,
        isRestored
    } = useSelector(state => state.product || {});

    useEffect(() => {
        dispatch(getAdminProducts(showDeleted));
        setSelectedIds([]);
    }, [dispatch, showDeleted]);

    useEffect(() => {
        if (productsError) {
            toast.error(productsError);
            dispatch(clearErrors());
        }

        if (actionError) {
            toast.error(actionError);
            dispatch(clearErrors());
        }
    }, [productsError, actionError, dispatch]);

    useEffect(() => {
        if (isDeleted) {
            toast.success('Product(s) moved to Deleted Products');

            setSelectedIds([]);
            dispatch(getAdminProducts(showDeleted));
            dispatch({ type: DELETE_PRODUCT_RESET });
        }

        if (isRestored) {
            toast.success('Product restored successfully');

            dispatch(getAdminProducts(showDeleted));
            dispatch({ type: RESTORE_PRODUCT_RESET });
        }
    }, [
        isDeleted,
        isRestored,
        showDeleted,
        dispatch
    ]);

    const deleteProductHandler = async (id) => {
        const result = await Swal.fire({
            title: 'Move product to Deleted Products?',
            text: 'You can restore this product later.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, delete it',
            cancelButtonText: 'Cancel',
            reverseButtons: true
        });

        if (result.isConfirmed) {
            dispatch(deleteProduct(id));
        }
    }

    const bulkDeleteHandler = async () => {
        if (selectedIds.length === 0) {
            Swal.fire({
                title: 'No products selected',
                text: 'Please select products first.',
                icon: 'info'
            });

            return;
        }

        const result = await Swal.fire({
            title: 'Delete selected products?',
            text: `${selectedIds.length} product(s) will be moved to Deleted Products. You can restore them later.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, delete selected',
            cancelButtonText: 'Cancel',
            reverseButtons: true
        });

        if (result.isConfirmed) {
            dispatch(deleteProducts(selectedIds));
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
            renderCell: params => (
                <span style={{ wordBreak: 'break-all' }}>
                    {params.value}
                </span>
            )
        },
        {
            field: 'name',
            headerName: 'Product Name',
            flex: 1,
            minWidth: 180
        },
        {
            field: 'category',
            headerName: 'Category',
            width: 140
        },
        {
            field: 'price',
            headerName: 'Price',
            width: 120,
            valueFormatter: value => `₱${value}`
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
            renderCell: params => (
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
                                title="Move product to deleted products"
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
                        >
                            <i className="fa fa-undo" /> Restore
                        </button>
                    )}
                </>
            )
        }
    ];

    const rows = products.map(product => ({
        id: product._id,
        name: product.name,
        category: product.category,
        price: Number(product.price),
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
                            className={`btn ${
                                showDeleted ? 'btn-primary' : 'btn-secondary'
                            }`}
                            onClick={() => setShowDeleted(current => !current)}
                        >
                            {showDeleted
                                ? 'View Active Products'
                                : 'View Deleted Products'}
                        </button>
                    </div>

                    {!showDeleted && (
                        <div className="mb-3">
                            <button
                                type="button"
                                className="btn btn-danger"
                                onClick={bulkDeleteHandler}
                                disabled={selectedIds.length === 0}
                            >
                                <i className="fa fa-trash" /> Delete Selected
                                ({selectedIds.length})
                            </button>
                        </div>
                    )}

                    {loading ? (
                        <Loader />
                    ) : (
                        <div style={{ width: '100%' }}>
                            <DataGrid
                                rows={rows}
                                columns={columns}
                                checkboxSelection={!showDeleted}
                                disableRowSelectionOnClick
                                rowSelectionModel={{
                                    type: 'include',
                                    ids: new Set(selectedIds)
                                }}
                                onRowSelectionModelChange={model => {
                                    setSelectedIds(
                                        Array.from(model.ids || []).map(String)
                                    );
                                }}
                                pageSizeOptions={[5, 10, 25]}
                                initialState={{
                                    pagination: {
                                        paginationModel: {
                                            pageSize: 5,
                                            page: 0
                                        }
                                    }
                                }}
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