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
import { getToken } from '../Utils/helpers';

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

    const loadSales = async (startDate, endDate) => {
        try {
            setLoading(true);
            setError('');

            const config = {
                withCredentials: true,
                params: { startDate, endDate }
            };

            const { data } = await axios.get(
                `${import.meta.env.VITE_API}/admin/sales-date-range`,
                config
            );

            // Convert the API results into a date map.
            const salesMap = new Map(
                data.salesByDate.map(item => [
                    item.date,
                    item
                ])
            );

            // Include dates with no orders so the chart shows zero.
            const chartData = [];
            const current = new Date(`${startDate}T00:00:00.000Z`);
            const last = new Date(`${endDate}T00:00:00.000Z`);

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
            console.error('Sales chart error:', err);

            setError(
                err.response?.data?.message ||
                'Unable to load sales data. Please try again.'
            );

            setSales([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSales(
            appliedRange.startDate,
            appliedRange.endDate
        );
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
        <div className="card shadow-sm my-4">
            <div className="card-body">
                <h3 className="mb-3">Sales Report</h3>

                <form
                    onSubmit={handleSubmit}
                    className="row align-items-end mb-4"
                >
                    <div className="col-md-4 mb-3">
                        <label className="form-label">
                            Start Date
                        </label>

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

                    <div className="col-md-4 mb-3">
                        <label className="form-label">
                            End Date
                        </label>

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

                    <div className="col-md-4 mb-3">
                        <button
                            type="submit"
                            className="btn btn-primary w-100"
                            disabled={loading}
                        >
                            Apply Date Filter
                        </button>
                    </div>
                </form>

                {error && (
                    <div className="alert alert-danger">
                        {error}
                    </div>
                )}

                <div className="row mb-4">
                    <div className="col-md-6 mb-2">
                        <div className="card bg-light">
                            <div className="card-body">
                                <h6>Total Sales</h6>
                                <h4>{currency(totalSales)}</h4>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-6 mb-2">
                        <div className="card bg-light">
                            <div className="card-body">
                                <h6>Total Orders</h6>
                                <h4>{totalOrders}</h4>
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center p-5">
                        Loading sales data...
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={380}>
                        <BarChart
                            data={sales}
                            margin={{
                                top: 10,
                                right: 20,
                                left: 10,
                                bottom: 10
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />

                            <XAxis
                                dataKey="label"
                                tick={{ fontSize: 12 }}
                            />

                            <YAxis
                                tickFormatter={value =>
                                    `₱${Number(value).toLocaleString('en-PH')}`
                                }
                            />

                            <Tooltip
                                formatter={(value, name) => [
                                    name === 'totalSales'
                                        ? currency(value)
                                        : value,
                                    name === 'totalSales'
                                        ? 'Sales'
                                        : 'Orders'
                                ]}
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

                {!loading && sales.length > 0 && totalOrders === 0 && (
                    <p className="text-center text-muted mt-3">
                        No orders were found in this date range.
                    </p>
                )}
            </div>
        </div>
    );
};

export default DateRangeSalesChart;