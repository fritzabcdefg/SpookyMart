import React, { useEffect, useState } from 'react';

import {
    LineChart,
    Line,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

import { getToken } from '../Utils/helpers';
import axios from 'axios';

const MonthlySalesChart = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const monthlySales = async () => {
            try {
                const config = {
                    headers: {
                        Authorization: `Bearer ${getToken()}`
                    }
                };

                const { data } = await axios.get(
                    `${import.meta.env.VITE_API}/admin/sales-per-month`,
                    config
                );

                setSales(data.salesPerMonth || []);
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    'Unable to load monthly sales.'
                );
            } finally {
                setLoading(false);
            }
        };

        monthlySales();
    }, []);

    return (
        <div className="sales-chart-card">
            <h3 className="sales-chart-title">Monthly Sales</h3>

            {loading ? (
                <p className="text-center text-white">Loading chart...</p>
            ) : error ? (
                <p className="text-center text-danger">{error}</p>
            ) : sales.length === 0 ? (
                <p className="text-center text-white">
                    No monthly sales data available.
                </p>
            ) : (
                <ResponsiveContainer width="100%" height={280}>
                    <LineChart
                        data={sales}
                        margin={{
                            top: 10,
                            right: 15,
                            left: 0,
                            bottom: 5
                        }}
                    >
                        <CartesianGrid
                            stroke="#493456"
                            strokeDasharray="3 3"
                        />

                        <XAxis
                            dataKey="month"
                            tick={{ fill: '#ffffff', fontSize: 11 }}
                        />

                        <YAxis
                            tick={{ fill: '#ffffff', fontSize: 11 }}
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

                        <Line
                            type="monotone"
                            dataKey="total"
                            name="Total Sales"
                            stroke="#c084fc"
                            strokeWidth={3}
                            dot={{
                                r: 4,
                                fill: '#ec4899',
                                stroke: '#ffffff'
                            }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};

export default MonthlySalesChart;