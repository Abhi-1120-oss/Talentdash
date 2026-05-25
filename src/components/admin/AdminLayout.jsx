import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { base44 } from '@/api/base44Client';

export default function AdminLayout() {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    base44.entities.SalaryRecord.filter({ review_status: 'pending' }, '-created_date', 100)
      .then((records) => setPendingCount(records.length))
      .catch(() => {});
  }, []);

  return (
    <div className="flex min-h-screen bg-[#0B1120]">
      <AdminSidebar pendingCount={pendingCount} />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}