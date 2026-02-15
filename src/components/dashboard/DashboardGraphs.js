import React, { useEffect, useState } from "react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import services from "../../services";

/**
 * Dashboard Graphs Component (Modular)
 * This component can be easily removed by:
 * 1. Removing the import in DashboardPage.js
 * 2. Removing the <DashboardGraphs /> component usage
 * 3. Optionally deleting this file
 * 
 * See ROLLBACK_INSTRUCTIONS.md for details
 */
function DashboardGraphs({ summary }) {
    const [consumptionTrendsData, setConsumptionTrendsData] = useState([]);
    const [lowStockTimelineData, setLowStockTimelineData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadGraphData = async () => {
            try {
                setLoading(true);
                const [consumption, lowStock] = await Promise.all([
                    services.analyticsService.getConsumptionTrends(10),
                    services.analyticsService.getLowStockTimeline(10),
                ]);

                setConsumptionTrendsData(consumption);
                setLowStockTimelineData(lowStock);
            } catch (error) {
                console.error("Failed to load graph data:", error);
            } finally {
                setLoading(false);
            }
        };

        loadGraphData();
    }, [summary]); // Reload when summary changes (indicates data update)

    if (!summary) return null;

    if (loading) {
        return (
            <section className="dashboard-graphs">
                <div className="graphs-grid">
                    <div className="card graph-card">
                        <p style={{ textAlign: "center", padding: "20px", color: "#999" }}>
                            Loading graphs...
                        </p>
                    </div>
                </div>
            </section>
        );
    }

    // Show placeholder if no data available yet
    const hasConsumptionData = consumptionTrendsData.length > 0;
    const hasLowStockData = lowStockTimelineData.length > 0;

    return (
        <section className="dashboard-graphs">
            <div className="graphs-grid">
                {/* Consumption Trends */}
                <div className="card graph-card">
                    <h3>Component Consumption Trends</h3>
                    <div className="graph-container">
                        {hasConsumptionData ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={consumptionTrendsData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="consumed" stroke="#ff6b6b" strokeWidth={2} name="Consumed" />
                                    <Line type="monotone" dataKey="produced" stroke="#0b5fff" strokeWidth={2} name="Produced" />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <p style={{ textAlign: "center", padding: "80px 20px", color: "#999" }}>
                                No production data available yet. Create production entries to see trends.
                            </p>
                        )}
                    </div>
                </div>

                {/* Low Stock Timeline */}
                <div className="card graph-card">
                    <h3>Low Stock Components Over Time</h3>
                    <div className="graph-container">
                        {hasLowStockData ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <AreaChart data={lowStockTimelineData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Area type="monotone" dataKey="lowStock" stroke="#ffa500" fill="#ffe4b5" strokeWidth={2} name="Low Stock Items" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <p style={{ textAlign: "center", padding: "80px 20px", color: "#999" }}>
                                No low stock history available yet. Data will appear as stock levels change.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}

export default DashboardGraphs;
