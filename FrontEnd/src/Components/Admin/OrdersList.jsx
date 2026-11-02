import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DataGrid } from '@mui/x-data-grid';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import MetaData from '../Layout/MetaData';
import Loader from '../Layout/Loader';
import Sidebar from './SideBar';

import { allOrders, clearErrors } from '../../actions/orderActions';

const OrdersList = () => {
    const dispatch = useDispatch();

    const {
        loading,
        error,
        orders = []
    } = useSelector(state => state.allOrders || {});

    useEffect(() => {
        dispatch(allOrders());
    }, [dispatch]);

    useEffect(() => {
        if (error) {
            toast.error(error, {
                position: 'bottom-right'
            });

            dispatch(clearErrors());
        }
    }, [error, dispatch]);

    const columns = [
        {
            field: 'id',
            headerName: 'Order ID',
            flex: 1,
            minWidth: 190,
            renderCell: params => (
                <span style={{ wordBreak: 'break-all' }}>
                    {params.value}
                </span>
            )
        },
        {
            field: 'numofItems',
            headerName: 'Items',
            width: 100,
            align: 'center',
            headerAlign: 'center'
        },
        {
            field: 'amount',
            headerName: 'Amount',
            width: 140,
            align: 'right',
            headerAlign: 'right'
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 150,
            renderCell: params => {
                const delivered =
                    String(params.value).toLowerCase() === 'delivered';

                return (
                    <span
                        style={{
                            padding: '5px 10px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: 600,
                            background: delivered
                                ? 'rgba(34, 197, 94, 0.15)'
                                : 'rgba(245, 158, 11, 0.15)',
                            color: delivered ? '#22c55e' : '#f59e0b'
                        }}
                    >
                        {params.value}
                    </span>
                );
            }
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 110,
            sortable: false,
            filterable: false,
            renderCell: params => (
                <Link
                    to={`/admin/order/${params.row.id}`}
                    className="btn btn-primary btn-sm"
                    title="View order"
                >
                    <i className="fa fa-eye" /> View
                </Link>
            )
        }
    ];

    const rows = orders.map(order => ({
        id: order._id,
        numofItems: order.orderItems?.length || 0,
        amount: `₱${(
            Number(order.itemsPrice || 0) +
            Number(order.taxPrice || 0) +
            Number(order.shippingPrice || 0)
        ).toFixed(2)}`,
        status: order.orderStatus || 'Processing'
    }));

    return (
        <>
            <MetaData title="All Orders" />

            <div className="row">
                <div className="col-12 col-md-2">
                    <Sidebar />
                </div>

                <div className="col-12 col-md-10">
                    <div style={{ padding: '20px 24px' }}>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '12px',
                                marginBottom: '25px'
                            }}
                        >
                            <div>
                                <h1 style={{ margin: 0, color: '#f5f0ff' }}>
                                    All Orders
                                </h1>
                                <p style={{ color: '#aaa', margin: '7px 0 0' }}>
                                    Manage and review customer orders.
                                </p>
                            </div>

                            <span
                                style={{
                                    background: '#241333',
                                    color: '#d8b4fe',
                                    border: '1px solid #7134a8',
                                    borderRadius: '8px',
                                    padding: '9px 15px',
                                    fontWeight: 600
                                }}
                            >
                                {orders.length} Orders
                            </span>
                        </div>

                        {loading ? (
                            <Loader />
                        ) : (
                            <div
                                style={{
                                    width: '100%',
                                    background: '#160d22',
                                    border: '1px solid #45245e',
                                    borderRadius: '12px',
                                    padding: '12px',
                                    overflowX: 'auto'
                                }}
                            >
                                <DataGrid
                                    rows={rows}
                                    columns={columns}
                                    getRowId={row => row.id}
                                    autoHeight
                                    disableRowSelectionOnClick
                                    pageSizeOptions={[5, 10, 25]}
                                    initialState={{
                                        pagination: {
                                            paginationModel: {
                                                pageSize: 10,
                                                page: 0
                                            }
                                        }
                                    }}
                                    sx={{
                                        border: 'none',
                                        backgroundColor: '#160d22',
                                        color: '#f5f0ff',

                                        '& .MuiDataGrid-columnHeaders': {
                                            backgroundColor: '#241333',
                                            color: '#d8b4fe',
                                            borderBottom: '1px solid #7134a8',
                                        },

                                        '& .MuiDataGrid-columnHeader': {
                                            backgroundColor: '#241333',
                                        },

                                        '& .MuiDataGrid-columnHeaderTitle': {
                                            color: '#d8b4fe',
                                            fontWeight: 700,
                                        },

                                        '& .MuiDataGrid-virtualScroller': {
                                            backgroundColor: '#160d22',
                                        },

                                        '& .MuiDataGrid-row': {
                                            backgroundColor: '#160d22',
                                            color: '#f5f0ff',
                                        },

                                        '& .MuiDataGrid-row:hover': {
                                            backgroundColor: '#2a193b',
                                        },

                                        '& .MuiDataGrid-cell': {
                                            color: '#f5f0ff',
                                            borderColor: '#45245e',
                                        },

                                        '& .MuiDataGrid-footerContainer': {
                                            backgroundColor: '#241333',
                                            color: '#d8b4fe',
                                            borderTop: '1px solid #7134a8',
                                        },

                                        '& .MuiTablePagination-root': {
                                            color: '#d8b4fe',
                                        },

                                        '& .MuiSvgIcon-root': {
                                            color: '#d8b4fe',
                                        },

                                        '& .MuiDataGrid-overlay': {
                                            backgroundColor: '#160d22',
                                            color: '#f5f0ff',
                                        },
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default OrdersList;