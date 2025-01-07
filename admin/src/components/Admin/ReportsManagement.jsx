import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ReportsManagement.css';
import { Table, Button, message, Popconfirm, Card, Row, Col, Input, DatePicker, Select, Space, Statistic } from 'antd';
import { DeleteOutlined, CheckOutlined, DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';

const { RangePicker } = DatePicker;
const { Option } = Select;

const ReportsManagement = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [statistics, setStatistics] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
    critical: 0,
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/reports/all');
      setReports(response.data);
      updateStatistics(response.data);
    } catch (error) {
      message.error('Failed to fetch reports');
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatistics = (data) => {
    const stats = {
      total: data.length,
      pending: data.filter((r) => r.status === 'PENDING').length,
      resolved: data.filter((r) => r.status === 'RESOLVED').length,
      critical: data.filter((r) => r.severity === 'HIGH').length,
    };
    setStatistics(stats);
  };

  const handleResolveReport = async (reportId) => {
    console.log('Resolving report:', reportId);
    try {
      await axios.put(`http://localhost:5000/reports/${reportId}/resolve`);
      message.success('Report resolved successfully');
      fetchReports();
    } catch (error) {
      message.error('Failed to resolve report');
      console.error('Error resolving report:', error);
    }
  };

  const handleDeleteReport = async (reportId) => {
    console.log('Deleting report:', reportId);
    try {
      await axios.delete(`http://localhost:5000/reports/${reportId}`);
      message.success('Report deleted successfully');
      fetchReports();
    } catch (error) {
      message.error('Failed to delete report');
      console.error('Error deleting report:', error);
    }
  };

  const exportToExcel = () => {
    const exportData = reports.map((report) => ({
      'Post ID': report.post?.id,
      Reporter: `${report.user.firstName} ${report.user.lastName}`,
      Details: report.details,
      Status: report.status,
      Date: new Date(report.createdAt).toLocaleDateString(),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reports');
    XLSX.writeFile(wb, 'reports_export.xlsx');
  };

  const getFilteredReports = () => {
    return reports.filter((report) => {
      const matchesSearch =
        report.details?.toLowerCase().includes(searchText.toLowerCase()) ||
        `${report.user.firstName} ${report.user.lastName}`.toLowerCase().includes(searchText.toLowerCase());

      const matchesStatus = selectedStatus === 'ALL' || report.status === selectedStatus;

      const matchesDate =
        !dateRange ||
        (new Date(report.createdAt) >= dateRange[0].startOf('day') &&
          new Date(report.createdAt) <= dateRange[1].endOf('day'));

      return matchesSearch && matchesStatus && matchesDate;
    });
  };

  const columns = [
    {
      title: 'Post ID',
      dataIndex: ['post', 'id'],
      key: 'postId',
      sorter: (a, b) => (a.post?.id || 0) - (b.post?.id || 0),
    },
    {
      title: 'Reporter',
      key: 'reporter',
      render: (_, record) => `${record.user.firstName} ${record.user.lastName}`,
      sorter: (a, b) =>
        `${a.user.firstName} ${a.user.lastName}`.localeCompare(`${b.user.firstName} ${b.user.lastName}`),
    },
    {
      title: 'Details',
      dataIndex: 'details',
      key: 'details',
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'date',
      render: (date) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <span className={`status-badge ${status.toLowerCase()}`}>
          {status}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div className="action-buttons">
          <Popconfirm
            title="Are you sure you want to resolve this report?"
            onConfirm={() => handleResolveReport(record._id || record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="primary" icon={<CheckOutlined />} disabled={record.status === 'RESOLVED'}>
              Resolve
            </Button>
          </Popconfirm>
          <Popconfirm
            title="Are you sure you want to delete this report?"
            onConfirm={() => handleDeleteReport(record._id || record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="primary" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="reports-management">
      <h1>Reports Management</h1>

      {/* Statistics Cards */}
      <Row gutter={16} className="stats-row">
        <Col span={6}>
          <Card>
            <Statistic title="Total Reports" value={statistics.total} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Pending Reports" value={statistics.pending} className="pending-stat" />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Resolved Reports" value={statistics.resolved} className="resolved-stat" />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Critical Reports" value={statistics.critical} className="critical-stat" />
          </Card>
        </Col>
      </Row>

      {/* Filters Section */}
      <Space className="filters-section" size="middle">
        <Input
          placeholder="Search reports..."
          prefix={<SearchOutlined />}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 200 }}
        />
        <RangePicker onChange={setDateRange} />
        <Select defaultValue="ALL" style={{ width: 120 }} onChange={setSelectedStatus}>
          <Option value="ALL">All Status</Option>
          <Option value="PENDING">Pending</Option>
          <Option value="RESOLVED">Resolved</Option>
        </Select>
        <Button type="primary" icon={<DownloadOutlined />} onClick={exportToExcel}>
          Export to Excel
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={getFilteredReports()}
        loading={loading}
        rowKey={(record) => record._id || record.id}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} reports`,
        }}
        className="reports-table"
      />
    </div>
  );
};

export default ReportsManagement;
