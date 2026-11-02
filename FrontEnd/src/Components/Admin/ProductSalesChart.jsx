import React, { useState, useEffect } from 'react';
import { getToken } from "../Utils/helpers";
import axios from "axios";
import Loader from '../Layout/Loader';

import {
    PieChart,
    Pie,
    Legend,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';

export default function ProductSalesChart() {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const pieColors = [
        "#FF6633", "#FFB399", "#FF33FF", "#FFFF99",
        "#00B3E6", "#E6B333", "#3366E6", "#999966",
        "#809980", "#E6FF80", "#1AFF33", "#999933",
        "#FF3380", "#CCCC00", "#66E64D", "#4D80CC",
        "#FF4D4D", "#99E6E6", "#6666FF"
    ];

    const productSales = async () => {
        try {
            setLoading(true);
            setError('');

            const config = {
                headers: {
                    Authorization: `Bearer ${getToken()}`
                }
            };

            const { data } = await axios.get(
                `${import.meta.env.VITE_API}/admin/product-sales`,
                config
            );

            const productData = data.totalPercentage || [];

            // Normalize percentages to make the total exactly 100%.
            const totalPercent = productData.reduce(
                (sum, item) => sum + Number(item.percent || 0),
                0
            );

            const normalizedSales = productData.map(item => ({
                name: item.name,
                percent: totalPercent > 0
                    ? (Number(item.percent || 0) / totalPercent) * 100
                    : 0
            }));

            setSales(normalizedSales);

        } catch (error) {
            console.error(error);
            setError(
                error.response?.data?.message ||
                'Unable to load product sales.'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        productSales();
    }, []);

    const RADIAN = Math.PI / 180;

    const renderCustomizedLabel = ({
        cx,
        cy,
        midAngle,
        innerRadius,
        outerRadius,
        percent
    }) => {
        const radius = outerRadius + 25;

        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text
                x={x}
                y={y}
                fill="#ffffff"
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
                fontSize={12}
                fontWeight="bold"
            >
                {`${(percent * 100).toFixed(1)}%`}
            </text>
        );
    };

    if (loading) {
        return (
            <div className="sales-chart-card">
                <h3 className="sales-chart-title">Product Sales</h3>
                <Loader />
            </div>
        );
    }

    if (error) {
        return (
            <div className="sales-chart-card">
                <h3 className="sales-chart-title">Product Sales</h3>
                <p style={{ color: '#ff7777' }}>{error}</p>
            </div>
        );
    }

    if (sales.length === 0) {
        return (
            <div className="sales-chart-card">
                <h3 className="sales-chart-title">Product Sales</h3>
                <p style={{ color: '#ffffff' }}>
                    No product sales available.
                </p>
            </div>
        );
    }

    return (
        <div className="sales-chart-card">
            <h3 className="sales-chart-title">Product Sales</h3>

            <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                    <Pie
                        data={sales}
                        dataKey="percent"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={115}
                        fill="#8884d8"
                        label={renderCustomizedLabel}
                        labelLine={false}
                        isAnimationActive={true}
                    >
                        {sales.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={pieColors[index % pieColors.length]}
                            />
                        ))}
                    </Pie>

                    <Tooltip
                        formatter={(value) => [
                            `${Number(value).toFixed(2)}%`,
                            'Sales'
                        ]}
                        contentStyle={{
                            backgroundColor: '#241333',
                            border: '1px solid #8b45bd',
                            borderRadius: '8px',
                            color: '#ffffff'
                        }}
                        itemStyle={{ color: '#ffffff' }}
                    />

                    <Legend
                        layout="vertical"
                        verticalAlign="middle"
                        align="right"
                        wrapperStyle={{
                            color: '#ffffff',
                            fontSize: '12px'
                        }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}