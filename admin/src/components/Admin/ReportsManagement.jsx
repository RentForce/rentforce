import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ReportsManagement.css';
import { Table, Button, message, Popconfirm } from 'antd';
import { DeleteOutlined, CheckOutlined } from '@ant-design/icons';

const ReportsManagement = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/reports/all');
      setReports(response.data);
    } catch (error) {
      message.error('Failed to fetch reports');
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveReport = async (reportId) => {
    try {
      await axios.put(`http://localhost:3001/api/reports/${reportId}/resolve`);
      message.success('Report resolved successfully');
      fetchReports();
    } catch (error) {
      message.error('Failed to resolve report');
      console.error('Error resolving report:', error);
    }
  };

  const handleDeleteReport = async (reportId) => {
    try {
      await axios.delete(`http://localhost:3001/api/reports/${reportId}`);
      message.success('Report deleted successfully');
      fetchReports();
    } catch (error) {
      message.error('Failed to delete report');
      console.error('Error deleting report:', error);
    }
  };

  const columns = [
    {
      title: 'Post ID',
      dataIndex: ['post', '_id'],
      key: 'postId',
    },
    {
      title: 'Reporter',
      dataIndex: ['reporter', 'username'],
      key: 'reporter',
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'date',
      render: (date) => new Date(date).toLocaleDateString(),
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
            onConfirm={() => handleResolveReport(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="primary"
              icon={<CheckOutlined />}
              disabled={record.status === 'RESOLVED'}
            >
              Resolve
            </Button>
          </Popconfirm>
          <Popconfirm
            title="Are you sure you want to delete this report?"
            onConfirm={() => handleDeleteReport(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
            >
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
      <Table
        columns={columns}
        dataSource={reports}
        loading={loading}
        rowKey="_id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} reports`,
        }}
      />
    </div>
  );
};

export default ReportsManagement;