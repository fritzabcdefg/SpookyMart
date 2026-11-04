
import React, { useEffect, useState } from 'react';
import MetaData from '../Layout/MetaData';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import {
    updateProfile,
    loadUser,
    clearErrors
} from '../../actions/userActions';

import { UPDATE_PROFILE_RESET } from '../../constants/userConstants';
import { useDispatch, useSelector } from 'react-redux';

const profileSchema = Yup.object({
    name: Yup.string()
        .trim()
        .max(30, 'Name cannot exceed 30 characters')
        .required('Name is required'),

    email: Yup.string()
        .trim()
        .email('Please enter a valid email address')
        .required('Email is required')
});

const UpdateProfile = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { user } = useSelector(state => state.auth);

    const {
        error,
        isUpdated,
        loading
    } = useSelector(state => state.user);

    const [avatarPreview, setAvatarPreview] = useState(
        '/images/default_avatar.jpg'
    );

    const [avatarError, setAvatarError] = useState('');

    const formik = useFormik({
        enableReinitialize: true,

        initialValues: {
            name: user?.name || '',
            email: user?.email || '',
            avatar: ''
        },

        validationSchema: profileSchema,

        onSubmit: values => {
            const formData = new FormData();

            formData.set('name', values.name.trim());
            formData.set('email', values.email.trim());
            formData.set('avatar', values.avatar);

            dispatch(updateProfile(formData));
        }
    });

    useEffect(() => {
        if (user) {
            setAvatarPreview(
                user.avatar?.url || '/images/default_avatar.jpg'
            );
        }
    }, [user]);

    useEffect(() => {
        if (error) {
            toast.error(error);
            dispatch(clearErrors());
        }

        if (isUpdated) {
            toast.success('Profile updated successfully');

            dispatch(loadUser());
            navigate('/me', { replace: true });

            dispatch({
                type: UPDATE_PROFILE_RESET
            });
        }
    }, [dispatch, error, isUpdated, navigate]);

    const onChange = e => {
        const file = e.target.files?.[0];

        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setAvatarError('Please select an image file');
            e.target.value = '';
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setAvatarError('Avatar image must not exceed 5MB');
            e.target.value = '';
            return;
        }

        setAvatarError('');

        const reader = new FileReader();

        reader.onload = () => {
            if (reader.readyState === 2) {
                setAvatarPreview(reader.result);
                formik.setFieldValue('avatar', reader.result);
            }
        };

        reader.onerror = () => {
            setAvatarError('Unable to read the selected image');
        };

        reader.readAsDataURL(file);
    };

    const showError = field =>
        formik.touched[field] && formik.errors[field];

    return (
        <>
            <MetaData title="Update Profile" />

            <div className="row wrapper">
                <div className="col-10 col-lg-5">
                    <form
                        className="shadow-lg"
                        onSubmit={formik.handleSubmit}
                        encType="multipart/form-data"
                        noValidate
                    >
                        <h1 className="mt-2 mb-5">Update Profile</h1>

                        <div className="form-group">
                            <label htmlFor="name_field">Name</label>

                            <input
                                type="text"
                                id="name_field"
                                name="name"
                                className="form-control"
                                value={formik.values.name}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                maxLength={30}
                            />

                            {showError('name') && (
                                <small className="text-danger">
                                    {formik.errors.name}
                                </small>
                            )}
                        </div>
                        <div className="form-group">
                            <label htmlFor="email_field">Email</label>

                            <input
                                type="email"
                                id="email_field"
                                name="email"
                                className="form-control"
                                value={formik.values.email}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                readOnly={user?.authProvider === "google" || user?.authProvider === "facebook"}
                                title={user?.authProvider === "google" || user?.authProvider === "facebook" ? "Change your email through your social sign-in provider." : ""}
                            />

                        {(user?.authProvider === 'google' || user?.authProvider === 'facebook') && <small className="text-muted d-block mb-3">This email is managed by your {user.authProvider === 'google' ? 'Google' : 'Facebook'} account and cannot be changed here.</small>}

                            {showError('email') && (
                                <small className="text-danger">
                                    {formik.errors.email}
                                </small>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="avatar_upload">Avatar</label>

                            <div className="d-flex align-items-center">
                                <div>
                                    <figure className="avatar mr-3 item-rtl">
                                        <img
                                            src={avatarPreview}
                                            className="rounded-circle"
                                            alt="Avatar Preview"
                                        />
                                    </figure>
                                </div>

                                <div className="custom-file">
                                    <input
                                        type="file"
                                        name="avatar"
                                        className="custom-file-input"
                                        id="avatar_upload"
                                        accept="image/*"
                                        onChange={onChange}
                                    />

                                    <label
                                        className="custom-file-label"
                                        htmlFor="avatar_upload"
                                    >
                                        Choose Avatar
                                    </label>
                                </div>
                            </div>

                            <small className="text-muted">
                                Maximum image size: 5MB.
                            </small>

                            {avatarError && (
                                <div className="text-danger">
                                    {avatarError}
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="btn update-btn btn-block mt-4 mb-3"
                            disabled={loading}
                        >
                            {loading ? 'UPDATING...' : 'UPDATE'}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
};

export default UpdateProfile;
