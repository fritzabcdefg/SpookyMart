import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DataGrid } from '@mui/x-data-grid';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import MetaData from '../Layout/MetaData';
import Loader from '../Layout/Loader';
import Sidebar from './SideBar';

import {
    allUsers,
    clearErrors
} from '../../actions/userActions';

const UsersList = () => {
    const dispatch = useDispatch();

    const {
        loading,
        error,
        users = []
    } = useSelector(state => state.allUsers || {});

    useEffect(() => {
        dispatch(allUsers());
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
            headerName: 'User ID',
            flex: 1,
            minWidth: 190,
            renderCell: params => (
                <span style={{ wordBreak: 'break-all' }}>
                    {params.value}
                </span>
            )
        },
        {
            field: 'name',
            headerName: 'Name',
            flex: 1,
            minWidth: 140
        },
        {
            field: 'email',
            headerName: 'Email',
            flex: 1,
            minWidth: 190
        },
        {
            field: 'role',
            headerName: 'Role',
            width: 120,
            renderCell: params => (
                <span
                    style={{
                        padding: '5px 10px',
                        borderRadius: '20px',
                        background: '#302044',
                        color: '#d8b4fe',
                        fontSize: '12px',
                        fontWeight: 600,
                        textTransform: 'capitalize'
                    }}
                >
                    {params.value}
                </span>
            )
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 120,
            renderCell: params => {
                const active = params.value === 'Active';

                return (
                    <span
                        style={{
                            padding: '5px 10px',
                            borderRadius: '20px',
                            background: active
                                ? 'rgba(34, 197, 94, 0.15)'
                                : 'rgba(156, 163, 175, 0.15)',
                            color: active ? '#22c55e' : '#9ca3af',
                            fontSize: '12px',
                            fontWeight: 600
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
                    to={`/admin/user/${params.row.id}`}
                    className="btn btn-primary btn-sm"
                    title="Edit user"
                >
                    <i className="fa fa-pencil" /> Edit
                </Link>
            )
        }
    ];

    const rows = users.map(user => ({
        id: user._id,
        name: user.name || 'N/A',
        email: user.email || 'N/A',
        role: user.role || 'user',
        status: user.isActive === false ? 'Inactive' : 'Active'
    }));

    return (
        <>
            <MetaData title="All Users" />

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
                                    All Users
                                </h1>

                                <p style={{ color: '#aaa', margin: '7px 0 0' }}>
                                    View and manage registered users.
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
                                {users.length} Users
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

export default UsersList;