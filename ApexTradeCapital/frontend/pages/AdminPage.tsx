import React from 'react';
import { useAppContext } from '../context/AppContext';
import AdminLoginPage from './admin/AdminLoginPage';
import AdminDashboardPage from './admin/AdminDashboardPage';

const AdminPage = () => {
    const { isAdmin } = useAppContext();

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {isAdmin ? <AdminDashboardPage /> : <AdminLoginPage />}
        </div>
    );
};

export default AdminPage;

