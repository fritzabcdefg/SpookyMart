import React, { useState, useEffect } from 'react'
import { Link, useParams, useNavigate, } from 'react-router-dom'
import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import Sidebar from './SideBar'

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// import axios from 'axios'
// import { getToken } from '../Utils/helpers'
import { useDispatch, useSelector } from 'react-redux'
import { getOrderDetails, updateOrder, clearErrors } from '../../actions/orderActions'
import { UPDATE_ORDER_RESET } from '../../constants/orderConstants'

const ProcessOrder = () => {
    const dispatch = useDispatch();
    const { loading, order = {} } = useSelector(state => state.orderDetails)

    const { error, isUpdated } = useSelector(state => state.order)

    const [status, setStatus] = useState('')
    const [showCancelModal, setShowCancelModal] = useState(false)
    // const [loading, setLoading] = useState(true)
    // const [error, setError] = useState('')
    // const [order, setOrder] = useState({})
    // const [isUpdated, setIsUpdated] = useState(false)
    let navigate = useNavigate()

    let { id } = useParams();
    const {
        shippingInfo,
        orderItems,
        paymentInfo,
        user,
        itemsPrice,
        taxPrice,
        shippingPrice,
        orderStatus
    } = order;

    const totalPrice =
        Number(itemsPrice || 0) +
        Number(taxPrice || 0) +
        Number(shippingPrice || 0);

    const orderId = id;
    const errMsg = (message = '') => toast.error(message, {
        position: 'bottom-center'
    });

    const successMsg = (message = '') => toast.success(message, {
        position: 'bottom-center'
    });

    // const getOrderDetails = async (id) => {
    //     try {
    //         const config = {
    //             headers: {

    //                 'Authorization': `Bearer ${getToken()}`
    //             }
    //         }

    //         const { data } = await axios.get(`${import.meta.env.VITE_API}/order/${id}`, config)
    //         setOrder(data.order)
    //         setLoading(false)
    //     } catch (error) {
    //         setError(error.response.data.message)
    //     }
    // }
    // const updateOrder = async (id, formData) => {

    //     try {
    //         const config = {
    //             headers: {
    //                 'Content-Type': 'application/json',
    //                 'Authorization': `Bearer ${getToken()}`
    //             }
    //         }
    //         const { data } = await axios.put(`${import.meta.env.VITE_API}/admin/order/${id}`, formData, config)
    //         setIsUpdated(data.success)


    //     } catch (error) {
    //         setError(error.response.data.message)
    //     }
    // }

    // useEffect(() => {
    //     getOrderDetails(orderId)
    //     if (error) {
    //         errMsg(error);
    //         setError('')
    //     }
    //     if (isUpdated) {
    //         successMsg('Order updated successfully');
    //         setIsUpdated('')
    //         navigate('/admin/orders')
    //     }
    // }, [error, isUpdated, orderId])

    useEffect(() => {
        dispatch(getOrderDetails(orderId))
        if (error) {
            errMsg(error);
            dispatch(clearErrors())
            // setError('')
        }
        if (isUpdated) {
            successMsg('Order updated successfully');
            dispatch({ type: UPDATE_ORDER_RESET })

            // setIsUpdated('')
            navigate('/admin/orders')
        }
    }, [error, isUpdated, orderId])

    const updateOrderHandler = (id) => {
        const formData = new FormData();
        formData.set('status', status);
        dispatch(updateOrder(id, formData))
        setShowCancelModal(false)
    }

    const handleStatusUpdate = () => {
        if (status === 'Cancelled') { setShowCancelModal(true); return; }
        updateOrderHandler(order._id);
    }

    const shippingDetails = shippingInfo && `${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.postalCode}, ${shippingInfo.country}`
    const isPaid = paymentInfo && paymentInfo.status === 'succeeded' ? true : false
    return (
        <>
            <MetaData title={`Process Order # ${order && order._id}`} />
            <div className="row">
                <div className="col-12 col-md-2">
                    <Sidebar />
                </div>
                <div className="col-12 col-md-10">
                    <>
                        {loading ? <Loader /> : (
                            <div className="row d-flex justify-content-around">
                                <div className="col-12 col-lg-7 order-details">
                                    <h2 className="my-5">Order # {order._id}</h2>
                                    <h4 className="mb-4">Shipping Info</h4>
                                    <p><b>Name:</b> {user && user.name}</p>
                                    <p><b>Phone:</b> {shippingInfo && shippingInfo.phoneNo}</p>
                                    <p className="mb-4"><b>Address:</b>{shippingDetails}</p>
                                    <p><b>Amount:</b> ₱{totalPrice.toFixed(2)}</p>
                                    <hr />
                                    <h4 className="my-4">Payment</h4>
                                    <p className={paymentInfo?.status === 'cancelled' ? "redColor" : isPaid ? "greenColor" : "redColor"}><b>{paymentInfo?.status === 'cancelled' ? "CANCELLED" : isPaid ? "PAID" : "NOT PAID"}</b></p>
                                    <h4 className="my-4">Stripe ID</h4>
                                    <p><b>{paymentInfo && paymentInfo.id}</b></p>

                                    <h4 className="my-4">Order Status:</h4>
                                    <p className={order.orderStatus && String(order.orderStatus).includes('Delivered') ? "greenColor" : "redColor"} ><b>{orderStatus}</b></p>
                                    <h4 className="my-4">Order Items:</h4>
                                    <hr />
                                    <div className="cart-item my-1">
                                        {orderItems && orderItems.map(item => (
                                            <div key={item.product} className="row my-5">
                                                <div className="col-4 col-lg-2">
                                                    <img src={item.image} alt={item.name} height="45" width="65" />
                                                </div>

                                                <div className="col-5 col-lg-5">
                                                    <Link to={`/products/${item.product}`}>{item.name}</Link>
                                                </div>
                                                <div className="col-4 col-lg-2 mt-4 mt-lg-0">
                                                    <p>${item.price}</p>
                                                </div>
                                                <div className="col-4 col-lg-3 mt-4 mt-lg-0">
                                                    <p>{item.quantity} Piece(s)</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <hr />
                                </div>
                                <div className="col-12 col-lg-3 mt-5">
                                    <h4 className="my-4">Status</h4>
                                    <div className="form-group">
                                        <select
                                            className="form-control"
                                            name='status'
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value)}
                                        >
                                            <option value="Processing">Processing</option>
                                            <option value="Shipped">Shipped</option>
                                            <option value="Delivered">Delivered</option>
                                            {orderStatus === 'Processing' && (
                                                <option value="Cancelled">Cancelled</option>
                                            )}
                                        </select>
                                    </div>
                                    <button className="btn btn-primary btn-block" onClick={handleStatusUpdate}>
                                        Update Status
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                </div>
            </div>
            {showCancelModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px' }}
                    onClick={event => { if (event.target === event.currentTarget) setShowCancelModal(false); }}>
                    <div role="dialog" aria-modal="true" aria-labelledby="admin-cancel-title" style={{ background: '#fff', color: '#292333', borderRadius: '14px', padding: '28px', width: '100%', maxWidth: '420px', textAlign: 'center', boxShadow: '0 10px 35px rgba(0,0,0,0.3)' }}>
                        <h3 id="admin-cancel-title">Cancel this order?</h3>
                        <p style={{ margin: '16px 0 24px' }}>Are you sure you want to cancel this Processing order? The customer will be notified by email.</p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <button type="button" className="btn btn-outline-secondary" onClick={() => { setShowCancelModal(false); setStatus(orderStatus || 'Processing'); }}>No, Go Back</button>
                            <button type="button" className="btn btn-danger" onClick={() => updateOrderHandler(order._id)}>Yes, Cancel Order</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
export default ProcessOrder