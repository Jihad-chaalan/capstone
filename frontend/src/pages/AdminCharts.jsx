import React from "react";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

const COLORS = {
  pie: ["#3B82F6", "#10B981", "#F59E0B"],
  bar: "#3B82F6",
  line: "#10B981",
};

export const UsersBreakdownChart = ({ data }) => {
  if (!data || data.length === 0) return <p>No user data available</p>;

  return (
    <div className="admin-chart-container">
      <h3 className="admin-chart-title"> Users Breakdown</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ role, count }) => `${role}: ${count}`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="count"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS.pie[index % COLORS.pie.length]}
              />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${value} users`} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const SkillsDistributionChart = ({ data }) => {
  if (!data || data.length === 0) return <p>No skills data available</p>;

  return (
    <div className="admin-chart-container">
      <h3 className="admin-chart-title"> Skills Distribution</h3>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 0, bottom: 100 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={120}
            interval={0}
          />
          <YAxis />
          <Tooltip formatter={(value) => `${value} seekers`} />
          <Bar dataKey="count" fill={COLORS.bar} radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const TechnologyDemandChart = ({ data }) => {
  if (!data || data.length === 0) return <p>No technology data available</p>;

  return (
    <div className="admin-chart-container">
      <h3 className="admin-chart-title"> Technology Demand</h3>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 0, bottom: 100 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={120}
            interval={0}
          />
          <YAxis />
          <Tooltip formatter={(value) => `${value} posts`} />
          <Bar dataKey="count" fill="#F59E0B" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const ApplicationsStatsChart = ({ data }) => {
  if (!data) return <p>No applications data available</p>;

  const chartData = [
    { name: "Total", value: data.total || 0 },
    { name: "Completed", value: data.completed || 0 },
    { name: "Applied", value: data.applied || 0 },
    { name: "Rejected", value: data.rejected || 0 },
  ];

  return (
    <div className="admin-chart-container">
      <h3 className="admin-chart-title"> Applications Status</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(value) => `${value} apps`} />
          <Bar dataKey="value" fill="#10B981" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const ActivityOverviewChart = ({ stats }) => {
  if (!stats) return <p>No activity data available</p>;

  const data = [
    { name: "Posts", value: stats.totalPosts || 0 },
    { name: "Applications", value: stats.totalApplications || 0 },
  ];

  return (
    <div className="admin-chart-container">
      <h3 className="admin-chart-title"> Activity Overview</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const UniversityRequestsChart = ({ data }) => {
  if (!data) return <p>No university requests data available</p>;

  const chartData = [
    { name: "Total", value: data.total || 0, fill: "#8B5CF6" },
    { name: "Pending", value: data.pending || 0, fill: "#F59E0B" },
    { name: "Accepted", value: data.accepted || 0, fill: "#10B981" },
    { name: "Rejected", value: data.rejected || 0, fill: "#EF4444" },
  ];

  return (
    <div className="admin-chart-container">
      <h3 className="admin-chart-title">🎓 University Requests Status</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(value) => `${value} requests`} />
          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
