import React, { useEffect, useState } from 'react';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';

import { getToken } from '../Utils/helpers';
import axios from 'axios';

const UserSalesChart = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const barColors = ['#a855f7', '#ec4899', '#06b6d4'];

    useEffect(() => {
        const userSales = async () => {
            try {
                const config = {
                    headers: {
                        Authorization: `Bearer ${getToken()}`
                    }
                };

                const { data } = await axios.get(
                    `${import.meta.env.VITE_API}/admin/customer-sales`,
                    config
                );

                setSales(data.customerSales || []);
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    'Unable to load customer sales.'
                );
            } finally {
                setLoading(false);
            }
        };

        userSales();
    }, []);

    return (
        <div className="sales-chart-card">
            <h3 className="sales-chart-title">Customer Sales</h3>

            {loading ? (
                <p className="text-center text-white">Loading chart...</p>
            ) : error ? (
                <p className="text-center text-danger">{error}</p>
            ) : sales.length === 0 ? (
                <p className="text-center text-white">
                    No customer sales data available.
                </p>
            ) : (
                <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                        data={sales}
                        margin={{
                            top: 10,
                            right: 10,
                            left: 0,
                            bottom: 25
                        }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#493456"
                        />

                        <XAxis
                            dataKey="userDetails.name"
                            tick={{ fill: '#ffffff', fontSize: 10 }}
                            angle={-15}
                            textAnchor="end"
                            interval={0}
                        />

                        <YAxis
                            tick={{ fill: '#ffffff', fontSize: 10 }}
                        />

                        <Tooltip
                            contentStyle={{
                                background: '#241333',
                                border: '1px solid #8b45bd',
                                borderRadius: '8px',
                                color: '#fff'
                            }}
                            itemStyle={{ color: '#fff' }}
                            labelStyle={{ color: '#fff' }}
                        />

                        <Bar
                            dataKey="total"
                            name="Total Sales"
                            radius={[5, 5, 0, 0]}
                        >
                            {sales.map((item, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={barColors[index % barColors.length]}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};

export default UserSalesChart;