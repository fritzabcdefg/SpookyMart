
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
    const [cancellingOrderId, setCancellingOrderId] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [showCancelModal, setShowCancelModal] = useState(false);

    useEffect(() => {
        dispatch(myOrders());
    }, [dispatch]);

    useEffect(() => {
        if (error) {
            toast.error(
                typeof error === 'string'
                    ? error
                    : 'Unable to load your orders.',
                { position: 'bottom-right' }
            );
        }
    }, [error]);

    const formatDate = date => {
        if (!date) return 'Not available';

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return 'Not available';
        }

        return parsedDate.toLocaleString('en-PH', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    };

    const formatPaymentMethod = paymentInfo => {
        if (paymentInfo?.method === 'COD') {
            return 'Cash on Delivery';
        }

        if (paymentInfo?.method === 'Card') {
            return 'Card';
        }

        return paymentInfo?.method || 'Not specified';
    };

    const formatPaymentStatus = paymentInfo => {
        if (paymentInfo?.status === 'succeeded') {
            return 'Paid';
        }

        if (paymentInfo?.status === 'pending') {
            return 'Pending';
        }

        return 'Not paid';
    };

    const openConfirmModal = orderId => {
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

    


    const handleCancelOrder = async orderId => {
        try {
            setCancellingOrderId(orderId);
            const { data } = await axios.post(
                `${import.meta.env.VITE_API}/order/${orderId}/cancel`,
                {},
                { withCredentials: true }
            );
            setShowCancelModal(false);
            setSelectedOrderId(null);
            toast.success(data.message || 'Order cancelled successfully.');
            dispatch(myOrders());
        } catch (err) {
            toast.error(err.response?.data?.message || 'Unable to cancel this order.');
        } finally {
            setCancellingOrderId(null);
        }
    };

const columns = [
    {
        field: 'actions',
        headerName: 'Actions',
        width: 300,
        minWidth: 300,
        sortable: false,
        filterable: false,
        renderCell: params => {
            const order = params.row.order;

            const isDelivered =
                String(order.orderStatus || '').toLowerCase() === 'delivered';
            const canCancel = order.orderStatus === 'Processing';

            const isReceived =
                order.isReceived === true ||
                String(order.isReceived).toLowerCase() === 'true';

            const isCompleted = isDelivered && isReceived;
            const isConfirming = confirmingOrderId === order._id;
            const isCancelling = cancellingOrderId === order._id;

            return (
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center',
                    height: '100%'
                }}>
                    <Button
                        component={Link}
                        to={`/order/${order._id}`}
                        variant="outlined"
                        size="small"
                    >
                        View
                    </Button>

                    {canCancel && (
                        <Button variant="outlined" color="error" size="small" disabled={isCancelling} onClick={() => { setSelectedOrderId(order._id); setShowCancelModal(true); }}>
                            {isCancelling ? 'Cancelling...' : 'Cancel Order'}
                        </Button>
                    )}

                    {isDelivered && !isReceived && (
                        <Button
                            variant="contained"
                            color="success"
                            size="small"
                            disabled={isConfirming}
                            onClick={() => openConfirmModal(order._id)}
                        >
                            {isConfirming ? 'Confirming...' : 'Order Received'}
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
    },
    {
        field: 'id',
        headerName: 'Order ID',
        flex: 1,
        minWidth: 180,
        renderCell: params => (
            <span style={{ wordBreak: 'break-all' }}>
                {params.value}
            </span>
        )
    },
    {
        field: 'orderDate',
        headerName: 'Order Date',
        minWidth: 175,
        flex: 1
    },
    {
        field: 'numOfItems',
        headerName: 'Items',
        type: 'number',
        width: 85,
        align: 'right',
        headerAlign: 'right'
    },
    {
        field: 'amount',
        headerName: 'Total Amount',
        minWidth: 125,
        align: 'right',
        headerAlign: 'right'
    },
    {
        field: 'paymentMethod',
        headerName: 'Payment Method',
        minWidth: 145,
        flex: 1
    },
    {
        field: 'cardDetails',
        headerName: 'Card Details',
        minWidth: 155,
        flex: 1
    },
    {
        field: 'paymentStatus',
        headerName: 'Payment Status',
        minWidth: 125,
        renderCell: params => (
            <span style={{
                color: params.value === 'Paid' ? 'green' : 'red',
                fontWeight: 600
            }}>
                {params.value}
            </span>
        )
    },
    {
        field: 'status',
        headerName: 'Order Status',
        minWidth: 130,
        renderCell: params => (
            <span style={{
                color:
                    params.value === 'Completed' || params.value === 'Delivered'
                        ? 'green'
                        : params.value === 'Cancelled' ? '#dc2626' : '#d97706',
                fontWeight: 600
            }}>
                {params.value}
            </span>
        )
    }
];



    const rows = orders.map(order => {
        const isCompleted =
            order.orderStatus === 'Delivered' &&
            order.isReceived === true;

        const paymentInfo = order.paymentInfo || {};

        const isCard = paymentInfo.method === 'Card';

        return {
            id: order._id,

            orderDate: formatDate(order.createdAt),

            numOfItems: order.orderItems?.length || 0,

            amount: `₱${(
                Number(order.itemsPrice || 0) +
                Number(order.taxPrice || 0) +
                Number(order.shippingPrice || 0)
            ).toFixed(2)}`,

            paymentMethod: formatPaymentMethod(paymentInfo),

            cardDetails: isCard
                ? `${paymentInfo.brand || 'Card'} **** ${paymentInfo.last4 || '----'}`
                : '—',

            paymentStatus: formatPaymentStatus(paymentInfo),

            status: isCompleted
                ? 'Completed'
                : order.orderStatus || '',

            order
        };
    });

    return (
        <>
            <MetaData title="My Orders" />

            <div className="container">
                <h1 className="my-5">My Orders</h1>

                {loading ? (
                    <Loader />
                ) : (
                    <div style={{ width: '100%', overflowX: 'auto' }}>
                        <DataGrid
                                rows={rows}
                                columns={columns}
                                getRowId={row => row.id}
                                pageSize={5}
                                rowsPerPageOptions={[5, 10, 25]}
                                disableSelectionOnClick
                                autoHeight
                                rowHeight={65}
                        />
                    </div>
                )}
            </div>

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
                    onClick={event => {
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
                            Have you received this order? Once confirmed,
                            your order status will change to Completed,
                            and you can review the products.
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
            {showCancelModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px' }}
                    onClick={event => { if (event.target === event.currentTarget && !cancellingOrderId) { setShowCancelModal(false); setSelectedOrderId(null); } }}>
                    <div role="dialog" aria-modal="true" aria-labelledby="cancel-order-title" style={{ background: '#fff', color: '#292333', borderRadius: '14px', padding: '28px', width: '100%', maxWidth: '420px', textAlign: 'center', boxShadow: '0 10px 35px rgba(0,0,0,0.3)' }}>
                        <h3 id="cancel-order-title">Cancel this order?</h3>
                        <p style={{ margin: '16px 0 24px' }}>Are you sure you want to cancel this order? This action cannot be undone.</p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <Button variant="outlined" color="inherit" disabled={cancellingOrderId !== null} onClick={() => { setShowCancelModal(false); setSelectedOrderId(null); }}>No, Keep Order</Button>
                            <Button variant="contained" color="error" disabled={!selectedOrderId || cancellingOrderId !== null} onClick={() => handleCancelOrder(selectedOrderId)}>{cancellingOrderId ? 'Cancelling...' : 'Yes, Cancel Order'}</Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ListOrders;
