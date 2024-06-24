import React, { useEffect, useState } from "react";
import Layout from "./../../components/Layout";
import axios from "axios";
import { Table } from "antd";
const Users = () => {
    const [users, setUsers] = useState([]);

    //getUsers
    const getUsers = async () => {
      try {
        const res = await axios.get("/api/v1/admin/getAllUsers", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (res.data.success) {
          setUsers(res.data.data);
        }
      } catch (error) {
        console.log(error);
      }
    };
  
    useEffect(() => {
      getUsers();
    }, []);
  
    // antD table col
    const columns = [
      {
        title: "Name",
        dataIndex: "name",
      },
      {
        title: "Email",
        dataIndex: "email",
      },
      {
        title: "Doctor",
        dataIndex: "isDoctor",
        render: (_text, _record) => <span>{_record.isDoctor ? "Yes" : "No"}</span>,
      },
      {
        title: "Actions",
        dataIndex: "actions",
        
      },
    ];
  
  return (
    <Layout>
      <h1 className="text-center m-2">Users</h1>
      <Table columns={columns} dataSource={users} />
    </Layout>
  );
};

export default Users;