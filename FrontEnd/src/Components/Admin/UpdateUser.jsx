
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import MetaData from '../Layout/MetaData';
import Sidebar from './SideBar';

import {
    updateUser,
    getUserDetails,
    clearErrors
} from '../../actions/userActions';

import { UPDATE_USER_RESET } from '../../constants/userConstants';

import 'react-toastify/dist/ReactToastify.css';

const UpdateUser = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id } = useParams();

    const { error, isUpdated } = useSelector(
        (state) => state.user || {}
    );

    const { user } = useSelector(
        (state) => state.userDetails || { user: {} }
    );

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('user');
    const [isActive, setIsActive] = useState(true);


    useEffect(() => {
        if (!user || user._id !== id) {
            dispatch(getUserDetails(id));
        } else {
            setName(user.name || '');
            setEmail(user.email || '');
            setRole(user.role || 'user');
            setIsActive(user.isActive !== false);
        }
    }, [dispatch, id, user]);


    useEffect(() => {
        if (error) {
            toast.error(error, {
                position: 'bottom-right'
            });
            dispatch(clearErrors());
        }

        if (isUpdated) {
            toast.success('User updated successfully', {
                position: 'bottom-right'
            });

            dispatch({ type: UPDATE_USER_RESET });
            navigate('/admin/users');
        }
    }, [dispatch, error, isUpdated, navigate]);

    const submitHandler = (e) => {
        e.preventDefault();

        if (!user || !user._id) {
            toast.error('User details are not loaded yet.');
            return;
        }

        dispatch(
            updateUser(user._id, {
                name,
                email,
                role,
                isActive
            })
        );
    };

    return (
        <>
            <MetaData title="Update User" />

            <div className="row">
                <div className="col-12 col-md-2">
                    <Sidebar />
                </div>

                <div className="col-12 col-md-10">
                    <div className="row wrapper">
                        <div className="col-10 col-lg-5">
                            <form
                                className="shadow-lg p-4"
                                onSubmit={submitHandler}
                            >
                                <h1 className="mt-2 mb-5">
                                    Update User
                                </h1>

                                <div className="form-group">
                                    <label htmlFor="name_field">
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={name}
                                        readOnly
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="email_field">
                                        Email
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={email}
                                        readOnly
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="role_field">
                                        Role
                                    </label>
                                    <select
                                        id="role_field"
                                        className="form-control"
                                        value={role}
                                        onChange={(e) =>
                                            setRole(e.target.value)
                                        }
                                    >
                                        <option value="user">
                                            user
                                        </option>
                                        <option value="admin">
                                            admin
                                        </option>
                                    </select>
                                </div>

                                <div className="form-group mt-4">
                                    <label
                                        htmlFor="active_toggle"
                                        className="d-block"
                                    >
                                    </label>

                                    <div className="form-group mt-3">
                                        <label htmlFor="account_status">Account Status</label>

                                        <select
                                            id="account_status"
                                            className="form-control"
                                            value={isActive ? 'true' : 'false'}
                                            onChange={(e) => setIsActive(e.target.value === 'true')}
                                        >
                                            <option value="true">Active</option>
                                            <option value="false">Inactive</option>
                                        </select>
                                    </div>
                                    <small className="form-text text-muted">
                                        {isActive
                                            ? 'This user can log in to their account.'
                                            : 'This user cannot log in while the account is inactive.'}
                                    </small>
                                </div>

                                <button
                                    type="submit"
                                    className="btn update-btn btn-block mt-4 mb-3"
                                >
                                    Update User
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default UpdateUser;
