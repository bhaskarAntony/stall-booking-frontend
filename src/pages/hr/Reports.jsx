// src/pages/hr/Reports.jsx
import React, { useState, useEffect } from 'react';
import { Download, FileText } from 'lucide-react';
import HRLayout from '../../components/layouts/HRLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { tripAPI, employeeAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const Reports = () => {
  const [trips, setTrips] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [reportType, setReportType] = useState('trips');
  const [selectedEmployee, setSelectedEmployee] = useState('');

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, reportType, selectedEmployee]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const tripsResponse = await tripAPI.getAll({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        employee: selectedEmployee,
      });
      setTrips(tripsResponse.data.trips || []);

      const employeesResponse = await employeeAPI.getAvailable();
      setEmployees(employeesResponse.data.employees || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error fetching report data');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadCSV = (rows, filename) => {
    if (!rows || rows.length === 0) {
      toast.error('No data available for export');
      return;
    }
    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        headers
          .map((h) => {
            const val = row[h] ?? '';
            const str = String(val).replace(/"/g, '""');
            return `"${str}"`;
          })
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // All-trips PDF (summary table)
  const generatePDFReport = () => {
    if (!trips.length) {
      toast.error('No trips to include in PDF');
      return;
    }

    const doc = new jsPDF('landscape');
    const title = 'Trip Report';
    doc.setFontSize(14);
    doc.text(title, 14, 16);
    doc.setFontSize(10);
    doc.text(
      `From ${dateRange.startDate} to ${dateRange.endDate}${
        selectedEmployee ? ` · Employee: ${selectedEmployee}` : ''
      }`,
      14,
      22
    );

    const head = [
      [
        'Trip Name',
        'Type',
        'Date',
        'Driver',
        'Vehicle',
        'Employees',
        'Status',
      ],
    ];

    const body = trips.map((trip) => [
      trip.tripName,
      trip.tripType === 'login' ? 'Login' : 'Logout',
      new Date(trip.createdAt).toLocaleDateString(),
      trip.assignedDriver?.driverId || 'N/A',
      trip.assignedVehicle?.vehicleNumber || 'N/A',
      trip.employees?.length || 0,
      trip.status
        ? trip.status.charAt(0).toUpperCase() + trip.status.slice(1)
        : '—',
    ]);

    autoTable(doc, {
      head,
      body,
      startY: 28,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 163, 74] },
    });

    doc.save(`trip-report-${dateRange.startDate}-${dateRange.endDate}.pdf`);
    toast.success('PDF report downloaded');
  };

  const generateExcelReport = () => {
    if (!trips.length) {
      toast.error('No trips to export');
      return;
    }

    const rows = trips.map((trip) => ({
      tripName: trip.tripName,
      routeName: trip.routeName,
      tripType: trip.tripType,
      date: new Date(trip.createdAt).toISOString(),
      driverId: trip.assignedDriver?.driverId || '',
      vehicleNumber: trip.assignedVehicle?.vehicleNumber || '',
      employeesCount: trip.employees?.length || 0,
      status: trip.status,
    }));

    downloadCSV(
      rows,
      `trip-report-${dateRange.startDate}-${dateRange.endDate}.csv`
    );
    toast.success('Trip data exported');
  };

  // Single-trip invoice-style PDF
  const generateTripInvoicePDF = (trip) => {
    if (!trip) return;

    const doc = new jsPDF();

    // Header
    doc.setFontSize(16);
    doc.text('Trip Invoice / Summary', 14, 16);

    doc.setFontSize(10);
    doc.text(`Trip ID: ${trip._id}`, 14, 22);
    doc.text(
      `Date: ${new Date(trip.createdAt).toLocaleString()}`,
      14,
      28
    );

    // Company / trip meta
    const companyName = trip.company?.name || 'Company';
    const companyPhone = trip.company?.contactDetails?.phone || '—';
    const companyEmail = trip.company?.contactDetails?.email || '—';

    doc.text(`Company: ${companyName}`, 14, 36);
    doc.text(`Contact: ${companyPhone}`, 14, 42);
    doc.text(`Email: ${companyEmail}`, 14, 48);

    doc.text(
      `Trip: ${trip.tripName} (${trip.tripType === 'login' ? 'Login' : 'Logout'})`,
      14,
      56
    );
    doc.text(`Route: ${trip.routeName || '—'}`, 14, 62);

    const driverLine = `Driver: ${
      trip.assignedDriver?.user?.name || trip.assignedDriver?.driverId || 'N/A'
    }`;
    const vehicleLine = `Vehicle: ${
      trip.assignedVehicle?.vehicleNumber || 'N/A'
    } (${trip.assignedVehicle?.brand || ''} ${
      trip.assignedVehicle?.model || ''
    })`;

    doc.text(driverLine, 14, 70);
    doc.text(vehicleLine, 14, 76);

    // Employees table
    const empHead = [['Employee', 'Emp ID', 'Department', 'Designation']];
    const empBody = (trip.employees || []).map((emp) => [
      emp.employee?.user?.name || 'Employee',
      emp.employee?.employeeId || '—',
      emp.employee?.department || '—',
      emp.employee?.designation || '—',
    ]);

    autoTable(doc, {
      head: empHead,
      body: empBody,
      startY: 84,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    // Footer summary
    const totalEmployees = trip.employees?.length || 0;
    const totalStops = totalEmployees + 1; // office + employees
    let finalY = doc.lastAutoTable?.finalY || 84;
    if (!finalY) finalY = 120;

    doc.setFontSize(10);
    doc.text(`Total employees on trip: ${totalEmployees}`, 14, finalY + 8);
    doc.text(`Planned stops (including office): ${totalStops}`, 14, finalY + 14);
    doc.text(
      `Status: ${
        trip.status
          ? trip.status.charAt(0).toUpperCase() + trip.status.slice(1)
          : '—'
      }`,
      14,
      finalY + 20
    );

    doc.save(`trip-${trip.tripName || 'invoice'}.pdf`);
    toast.success('Trip invoice downloaded');
  };

  if (isLoading) {
    return (
      <HRLayout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </HRLayout>
    );
  }

  return (
    <HRLayout>
      <div className="p-4 md:p-6">
        {/* Header / App bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Trip Reports
            </h1>
            <p className="text-xs text-gray-500">
              Filter, review and export cab trip history
            </p>
          </div>
          <div className="flex space-x-2 mt-3 sm:mt-0">
            <button
              onClick={generatePDFReport}
              className="bg-rose-600 text-white px-3 py-2 rounded-lg flex items-center space-x-2 text-sm hover:bg-rose-700 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>All trips PDF</span>
            </button>
            <button
              onClick={generateExcelReport}
              className="bg-emerald-600 text-white px-3 py-2 rounded-lg flex items-center space-x-2 text-sm hover:bg-emerald-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, startDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, endDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="trips">Trip Reports</option>
                <option value="attendance">Attendance Reports</option>
                <option value="distance">Distance Reports</option>
                <option value="driver">Driver Reports</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Employee
              </label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All Employees</option>
                {employees.map((employee) => (
                  <option key={employee._id} value={employee._id}>
                    {employee.user?.name} ({employee.employeeId})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Mobile cards */}
        <div className="space-y-3 mb-4 md:hidden">
          {trips.length === 0 && (
            <div className="bg-white rounded-lg border p-6 text-center">
              <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">
                No data available
              </p>
              <p className="text-xs text-gray-500">
                No trips found for the selected filters.
              </p>
            </div>
          )}

          {trips.map((trip) => (
            <div
              key={trip._id}
              className="bg-white rounded-xl border shadow-sm p-4 flex flex-col gap-2"
            >
              <div className="flex justify-between items-start gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {trip.tripName}
                  </p>
                  <p className="text-xs text-gray-500">{trip.routeName}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(trip.createdAt).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`inline-flex px-2 py-1 text-[11px] font-medium rounded-full ${
                    trip.tripType === 'login'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-orange-100 text-orange-800'
                  }`}
                >
                  {trip.tripType === 'login' ? 'Login' : 'Logout'}
                </span>
              </div>

              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>
                  Driver: {trip.assignedDriver?.driverId || 'N/A'}
                </span>
                <span>
                  Vehicle: {trip.assignedVehicle?.vehicleNumber || 'N/A'}
                </span>
              </div>

              <div className="flex justify-between text-xs text-gray-600">
                <span>Employees: {trip.employees?.length || 0}</span>
                <span>
                  Status:{' '}
                  <span
                    className={
                      trip.status === 'completed'
                        ? 'text-green-600'
                        : trip.status === 'active'
                        ? 'text-blue-600'
                        : trip.status === 'cancelled'
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }
                  >
                    {trip.status
                      ? trip.status.charAt(0).toUpperCase() +
                        trip.status.slice(1)
                      : '—'}
                  </span>
                </span>
              </div>

              <div className="flex justify-end mt-2">
                <button
                  onClick={() => generateTripInvoicePDF(trip)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                >
                  <FileText className="w-3 h-3" />
                  <span>Trip PDF</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="bg-white rounded-lg border overflow-hidden shadow-sm hidden md:block">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              {reportType.charAt(0).toUpperCase() + reportType.slice(1)} report
            </h3>
            <span className="text-[11px] text-gray-500">
              {trips.length} trips found
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-[11px] font-medium text-gray-500 uppercase">
                    Trip
                  </th>
                  <th className="px-6 py-3 text-left text-[11px] font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-[11px] font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-[11px] font-medium text-gray-500 uppercase">
                    Driver
                  </th>
                  <th className="px-6 py-3 text-left text-[11px] font-medium text-gray-500 uppercase">
                    Vehicle
                  </th>
                  <th className="px-6 py-3 text-left text-[11px] font-medium text-gray-500 uppercase">
                    Employees
                  </th>
                  <th className="px-6 py-3 text-left text-[11px] font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {trips.map((trip) => (
                  <tr key={trip._id} className="hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {trip.tripName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {trip.routeName}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-[11px] font-medium rounded-full ${
                          trip.tripType === 'login'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {trip.tripType === 'login' ? 'Login' : 'Logout'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-900">
                      {new Date(trip.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-900">
                      {trip.assignedDriver?.driverId || 'N/A'}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-900">
                      {trip.assignedVehicle?.vehicleNumber || 'N/A'}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-900">
                      {trip.employees?.length || 0}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-[11px] font-medium rounded-full ${
                          trip.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : trip.status === 'active'
                            ? 'bg-blue-100 text-blue-800'
                            : trip.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {trip.status
                          ? trip.status.charAt(0).toUpperCase() +
                            trip.status.slice(1)
                          : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => generateTripInvoicePDF(trip)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Trip PDF</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {trips.length === 0 && (
            <div className="p-8 text-center">
              <FileText className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">
                No data available
              </h3>
              <p className="text-xs text-gray-500">
                No trips found for the selected filters.
              </p>
            </div>
          )}
        </div>
      </div>
    </HRLayout>
  );
};

export default Reports;
