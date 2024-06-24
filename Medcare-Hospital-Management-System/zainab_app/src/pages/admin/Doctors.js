import React, { useState, useEffect } from "react";
import Layout from "./../../components/Layout";
import axios from "axios";
import { message, Table } from "antd";

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  //getUsers
  const getDoctors = async () => {
    try {
      const res = await axios.get("/api/v1/admin/getAllDoctors", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (res.data.success) {
        setDoctors(res.data.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // handle account
  const handleAccountStatus = async (record, status) => {
    try {
      const res = await axios.post(
        "/api/v1/admin/changeAccountStatus",
        { doctorId: record._id, userId: record.userId, status: status },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (res.data.success) {
        message.success(res.data.message);
        window.location.reload();
      }
    } catch (error) {
      message.error("Something Went Wrong");
    }
  };

  useEffect(() => {
    getDoctors();
  }, []);

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      render: (_text, record) => (
        <span>
          {record.firstName} {record.lastName}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
    },
    {
      title: "Phone No",
      dataIndex: "phone",
    },
    {
      title: "Actions",
      dataIndex: "actions",
      render: (_text, record) => (
        <div className="d-flex">
           {record.status === "pending" && (
            <div className="d-flex">
              <button
                className="btn btn-success"
                onClick={() => handleAccountStatus(record, "approved")}
              >
                Approve
              </button>
              <button
                className="btn btn-danger ms-2"
                onClick={() => handleAccountStatus(record, "rejected")}
              >
                Reject
              </button>
            </div>
          )}
            </div>
       
      ),
    },
  ];

  return (
    <Layout>
      <h1 className="text-center m-3">All Doctors</h1>
      <Table columns={columns} dataSource={doctors} />
    </Layout>
  );
};

export default Doctors;