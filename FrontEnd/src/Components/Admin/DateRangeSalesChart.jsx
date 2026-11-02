import React, { useEffect, useState } from 'react';
import axios from 'axios';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

const getToday = () => {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(new Date());
};

const today = getToday();

const initialRange = {
    startDate: `${today.slice(0, 7)}-01`,
    endDate: today
};

const currency = value =>
    `₱${Number(value || 0).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;

const DateRangeSalesChart = () => {
    const [range, setRange] = useState(initialRange);
    const [appliedRange, setAppliedRange] = useState(initialRange);
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadSales = async () => {
            try {
                setLoading(true);
                setError('');

                const config = {
                    withCredentials: true,
                    params: {
                        startDate: appliedRange.startDate,
                        endDate: appliedRange.endDate
                    }
                };

                const { data } = await axios.get(
                    `${import.meta.env.VITE_API}/admin/sales-date-range`,
                    config
                );

                const salesMap = new Map(
                    (data.salesByDate || []).map(item => [
                        item.date,
                        item
                    ])
                );

                const chartData = [];
                const current = new Date(
                    `${appliedRange.startDate}T00:00:00.000Z`
                );
                const last = new Date(
                    `${appliedRange.endDate}T00:00:00.000Z`
                );

                while (current <= last) {
                    const date = current.toISOString().slice(0, 10);
                    const record = salesMap.get(date);

                    chartData.push({
                        date,
                        label: new Intl.DateTimeFormat('en-PH', {
                            month: 'short',
                            day: 'numeric',
                            timeZone: 'Asia/Manila'
                        }).format(new Date(`${date}T12:00:00+08:00`)),
                        totalSales: record?.totalSales || 0,
                        totalOrders: record?.totalOrders || 0
                    });

                    current.setUTCDate(current.getUTCDate() + 1);
                }

                setSales(chartData);
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    'Unable to load sales data.'
                );
                setSales([]);
            } finally {
                setLoading(false);
            }
        };

        loadSales();
    }, [appliedRange]);

    const handleSubmit = event => {
        event.preventDefault();

        if (!range.startDate || !range.endDate) {
            setError('Please select both dates.');
            return;
        }

        if (range.startDate > range.endDate) {
            setError('The start date cannot be later than the end date.');
            return;
        }

        setAppliedRange({ ...range });
    };

    const totalSales = sales.reduce(
        (total, item) => total + Number(item.totalSales || 0),
        0
    );

    const totalOrders = sales.reduce(
        (total, item) => total + Number(item.totalOrders || 0),
        0
    );

    return (
        <div className="sales-chart-card">
            <h3 className="sales-chart-title">Sales Report</h3>

            <form onSubmit={handleSubmit} className="row align-items-end mb-3">
                <div className="col-6 mb-2">
                    <label className="form-label">Start Date</label>
                    <input
                        type="date"
                        className="form-control"
                        value={range.startDate}
                        max={range.endDate || undefined}
                        onChange={e =>
                            setRange({
                                ...range,
                                startDate: e.target.value
                            })
                        }
                        required
                    />
                </div>

                <div className="col-6 mb-2">
                    <label className="form-label">End Date</label>
                    <input
                        type="date"
                        className="form-control"
                        value={range.endDate}
                        min={range.startDate || undefined}
                        max={today}
                        onChange={e =>
                            setRange({
                                ...range,
                                endDate: e.target.value
                            })
                        }
                        required
                    />
                </div>

                <div className="col-12 mb-2">
                    <button
                        type="submit"
                        className="btn btn-primary btn-sm w-100"
                        disabled={loading}
                    >
                        Apply Date Filter
                    </button>
                </div>
            </form>

            {error && (
                <p className="text-danger small">{error}</p>
            )}

            <div className="row mb-3">
                <div className="col-6">
                    <div className="sales-chart-summary">
                        <h6>Total Sales</h6>
                        <h4>{currency(totalSales)}</h4>
                    </div>
                </div>

                <div className="col-6">
                    <div className="sales-chart-summary">
                        <h6>Total Orders</h6>
                        <h4>{totalOrders}</h4>
                    </div>
                </div>
            </div>

            {loading ? (
                <p className="text-center text-white p-3">
                    Loading sales data...
                </p>
            ) : (
                <ResponsiveContainer width="100%" height={210}>
                    <BarChart
                        data={sales}
                        margin={{
                            top: 5,
                            right: 5,
                            left: 0,
                            bottom: 5
                        }}
                    >
                        <CartesianGrid
                            stroke="#493456"
                            strokeDasharray="3 3"
                        />

                        <XAxis
                            dataKey="label"
                            tick={{ fill: '#ffffff', fontSize: 10 }}
                        />

                        <YAxis
                            tick={{ fill: '#ffffff', fontSize: 10 }}
                            tickFormatter={value =>
                                `₱${Number(value).toLocaleString('en-PH')}`
                            }
                        />

                        <Tooltip
                            formatter={value => currency(value)}
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
                            dataKey="totalSales"
                            name="Sales"
                            fill="#f28c28"
                            radius={[5, 5, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};

export default DateRangeSalesChart;