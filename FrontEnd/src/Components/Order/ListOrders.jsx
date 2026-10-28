
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MetaData from '../Layout/MetaData';
import Loader from '../Layout/Loader';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { myOrders } from '../../actions/orderActions';
import { Button } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

const ListOrders = () => {
    const dispatch = useDispatch();

    const { loading, error, orders = [] } = useSelector(
        state => state.myOrders
    );

    const [confirmingOrderId, setConfirmingOrderId] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    useEffect(() => {
        dispatch(myOrders());
    }, [dispatch]);

    useEffect(() => {
        if (error) {
            toast.error(error, {
                position: 'bottom-right'
            });
        }
    }, [error]);

    const openConfirmModal = (orderId) => {
        setSelectedOrderId(orderId);
        setShowConfirmModal(true);
    };

    const handleOrderReceived = async () => {
        if (!selectedOrderId) return;

        try {
            setConfirmingOrderId(selectedOrderId);

            await axios.post(
                `${import.meta.env.VITE_API}/order/${selectedOrderId}/received`,
                {},
                { withCredentials: true }
            );

            setShowConfirmModal(false);
            setSelectedOrderId(null);

            toast.success('Order marked as completed!');
            dispatch(myOrders());
        } catch (err) {
            toast.error(
                err.response?.data?.message ||
                'Unable to confirm order receipt.'
            );
        } finally {
            setConfirmingOrderId(null);
        }
    };

    const columns = [
        {
            field: 'id',
            headerName: 'Order ID',
            flex: 1,
            minWidth: 180,
            renderCell: (params) => (
                <span style={{ wordBreak: 'break-all' }}>
                    {params.value}
                </span>
            )
        },
        {
            field: 'numOfItems',
            headerName: 'Num of Items',
            type: 'number',
            width: 120,
            align: 'right',
            headerAlign: 'right'
        },
        {
            field: 'amount',
            headerName: 'Amount',
            width: 120,
            align: 'right',
            headerAlign: 'right'
        },
        {
            field: 'status',
            headerName: 'Order Status',
            width: 140,
            renderCell: (params) => (
                <span
                    style={{
                        color: params.value === 'Completed' ||
                            params.value === 'Delivered'
                            ? 'green'
                            : 'red',
                        fontWeight: 600
                    }}
                >
                    {params.value}
                </span>
            )
        },
        {
            field: 'actions',
            headerName: 'Actions',
            minWidth: 270,
            flex: 1,
            sortable: false,
            filterable: false,
            renderCell: (params) => {
                const order = params.row.order;
                const isDelivered = order.orderStatus === 'Delivered';
                const isReceived = order.isReceived === true;
                const isCompleted = isDelivered && isReceived;
                const isConfirming = confirmingOrderId === order._id;

                return (
                    <div
                        style={{
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'center'
                        }}
                    >
                        <Button
                            component={Link}
                            to={`/order/${order._id}`}
                            variant="outlined"
                            size="small"
                        >
                            View
                        </Button>

                        {isDelivered && !isReceived && (
                            <Button
                                variant="contained"
                                color="success"
                                size="small"
                                disabled={isConfirming}
                                onClick={() => openConfirmModal(order._id)}
                            >
                                {isConfirming
                                    ? 'Confirming...'
                                    : 'Order Received'}
                            </Button>
                        )}

                        {isCompleted && (
                            <Button
                                component={Link}
                                to={`/order/${order._id}`}
                                variant="contained"
                                color="primary"
                                size="small"
                            >
                                Review Order
                            </Button>
                        )}
                    </div>
                );
            }
        }
    ];

    const rows = orders.map(order => {
        const isCompleted =
            order.orderStatus === 'Delivered' &&
            order.isReceived === true;

        return {
            id: order._id,
            numOfItems: order.orderItems?.length || 0,
            amount: `₱${order.totalPrice}`,
            status: isCompleted
                ? 'Completed'
                : order.orderStatus || '',
            order
        };
    });

    return (
        <>
            <MetaData title="My Orders" />

            <h1 className="my-5">My Orders</h1>

            {loading ? (
                <Loader />
            ) : (
                <div style={{ width: '100%' }}>
                    <DataGrid
                        rows={rows}
                        columns={columns}
                        getRowId={(row) => row.id}
                        pageSize={5}
                        rowsPerPageOptions={[5, 10, 25]}
                        disableSelectionOnClick
                        showToolbar
                        autoHeight
                    />
                </div>
            )}
            {showConfirmModal && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 9999,
                        padding: '20px'
                    }}
                    onClick={(event) => {
                        if (event.target === event.currentTarget) {
                            setShowConfirmModal(false);
                            setSelectedOrderId(null);
                        }
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="confirm-received-title"
                        style={{
                            backgroundColor: '#fff',
                            color: '#222',
                            borderRadius: '12px',
                            padding: '28px',
                            width: '100%',
                            maxWidth: '420px',
                            boxShadow: '0 10px 35px rgba(0,0,0,0.25)',
                            textAlign: 'center'
                        }}
                    >
                        <h3 id="confirm-received-title">
                            Confirm Order Received
                        </h3>

                        <p style={{ margin: '18px 0 24px' }}>
                            Have you received this order? Once confirmed, your order
                            status will change to Completed, and you can review
                            the products.
                        </p>

                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                gap: '12px',
                                flexWrap: 'wrap'
                            }}
                        >
                            <Button
                                variant="outlined"
                                color="inherit"
                                disabled={confirmingOrderId !== null}
                                onClick={() => {
                                    setShowConfirmModal(false);
                                    setSelectedOrderId(null);
                                }}
                            >
                                No, Cancel
                            </Button>

                            <Button
                                variant="contained"
                                color="success"
                                disabled={confirmingOrderId !== null}
                                onClick={handleOrderReceived}
                            >
                                {confirmingOrderId !== null
                                    ? 'Confirming...'
                                    : 'Yes, Order Received'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

        </>
    );
};

export default ListOrders;
