// components/AdminManagementComponent.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { RoleGuard } from '../AuthContext';
import { fetchAllAdmins, createAdmin, updateAdminPermissions, deleteAdmin } from '../api';
import { Pencil, Trash2, Plus } from 'lucide-react';

const AdminManagementComponent = ({ isDarkTheme }) => {
  const { admin: currentAdmin } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    permissions: [],
    role: 'admin',
  });

  useEffect(() => {
    const fetchAdmins = async () => {
      setIsLoading(true);
      setError('');
      try {
        const adminsData = await fetchAllAdmins();
        console.log("admindata", adminsData);
        setAdmins(adminsData);
      } catch (err) {
        setError('Failed to fetch admins. Please try again.');
        console.error('Fetch admins error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdmins();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePermissionChange = (e) => {
    const { value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      permissions: checked
        ? [...prev.permissions, value]
        : prev.permissions.filter((perm) => perm !== value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      if (selectedAdmin) {
        // Update existing admin
        await updateAdminPermissions(selectedAdmin._id, {
          ...formData,
          password: formData.password || undefined, // Only send password if provided
        });
        setAdmins((prev) =>
          prev.map((admin) =>
            admin._id === selectedAdmin._id ? { ...admin, ...formData } : admin
          )
        );
      } else {
        // Create new admin
        const response = await createAdmin(formData);
        setAdmins((prev) => [...prev, response]);
      }
      setIsFormOpen(false);
      setSelectedAdmin(null);
      setFormData({ email: '', password: '', name: '', permissions: [], role: 'admin' });
    } catch (err) {
      setError(selectedAdmin ? 'Failed to update admin.' : 'Failed to create admin.');
      console.error('Admin action error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (admin) => {
    setSelectedAdmin(admin);
    setFormData({
      email: admin.email,
      password: '', // Leave password empty for edit
      name: admin.name,
      permissions: admin.permissions || [],
      role: admin.role || 'admin',
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (adminId) => {
    if (window.confirm('Are you sure you want to delete this admin?')) {
      setIsLoading(true);
      setError('');
      try {
        await deleteAdmin(adminId);
        setAdmins((prev) => prev.filter((admin) => admin._id !== adminId));
      } catch (err) {
        setError('Failed to delete admin.');
        console.error('Delete admin error:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <RoleGuard role="superadmin" fallback={<div className="p-6 text-center">Access denied. Only superadmins can manage admins.</div>}>
      <div className={`p-6 ${isDarkTheme ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Admin Management</h2>
          <button
            onClick={() => {
              setSelectedAdmin(null);
              setFormData({ email: '', password: '', name: '', permissions: [], role: 'admin' });
              setIsFormOpen(true);
            }}
            className={`flex items-center px-4 py-2 rounded ${isDarkTheme ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
          >
            <Plus className="w-5 h-5 mr-2" /> Add Admin
          </button>
        </div>

        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className={`w-full ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <thead>
                  <tr className={isDarkTheme ? 'bg-gray-600' : 'bg-gray-100'}>
                    <th className={`p-3 text-left ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Name</th>
                    <th className={`p-3 text-left ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Email</th>
                    <th className={`p-3 text-left ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Role</th>
                    <th className={`p-3 text-left ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Permissions</th>
                    <th className={`p-3 text-left ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Actions</th>
                  </tr>
                </thead>
                <tbody className={isDarkTheme ? 'divide-gray-600' : 'divide-gray-200'}>
                  {admins.map((admin) => (
                    <tr key={admin._id} className={isDarkTheme ? 'hover:bg-gray-600' : 'hover:bg-gray-100'}>
                      <td className={`p-3 ${isDarkTheme ? 'text-gray-300' : 'text-gray-800'}`}>{admin.name}</td>
                      <td className={`p-3 ${isDarkTheme ? 'text-gray-300' : 'text-gray-800'}`}>{admin.email}</td>
                      <td className={`p-3 ${isDarkTheme ? 'text-gray-300' : 'text-gray-800'}`}>{admin.role}</td>
                      <td className={`p-3 ${isDarkTheme ? 'text-gray-300' : 'text-gray-800'}`}>
                        {admin.permissions?.join(', ') || 'None'}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleEdit(admin)}
                          className={`mr-2 p-2 rounded ${isDarkTheme ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-yellow-500 hover:bg-yellow-600'} text-white`}
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        {currentAdmin._id !== admin._id && (
                          <button
                            onClick={() => handleDelete(admin._id)}
                            className={`p-2 rounded ${isDarkTheme ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white`}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {isFormOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className={`p-6 rounded-lg ${isDarkTheme ? 'bg-gray-700' : 'bg-white'}`}>
                  <h3 className="text-xl font-bold mb-4">
                    {selectedAdmin ? 'Edit Admin' : 'Add New Admin'}
                  </h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Name"
                      className={`w-full p-2 border rounded ${isDarkTheme ? 'bg-gray-600 border-gray-500 text-white' : 'bg-gray-100 border-gray-300'}`}
                      required
                    />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Email"
                      className={`w-full p-2 border rounded ${isDarkTheme ? 'bg-gray-600 border-gray-500 text-white' : 'bg-gray-100 border-gray-300'}`}
                      required
                    />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Password"
                      className={`w-full p-2 border rounded ${isDarkTheme ? 'bg-gray-600 border-gray-500 text-white' : 'bg-gray-100 border-gray-300'}`}
                      required={!selectedAdmin}
                    />
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className={`w-full p-2 border rounded ${isDarkTheme ? 'bg-gray-600 border-gray-500 text-white' : 'bg-gray-100 border-gray-300'}`}
                    >
                      <option value="admin">Admin</option>
                      <option value="superadmin">Superadmin</option>
                    </select>
                    <div>
                      <label className="block mb-2">Permissions:</label>
                      {[
                        'users.read',
                        'users.write',
                        'products.read',
                        'products.write',
                        'orders.read',
                        'orders.write',
                        'travelers.read',
                        'travelers.write',
                        'transactions.read',
                        'disputes.read',
                        'disputes.write',
                        'exports.read'
                      ].map((perm) => (
                        <div key={perm} className="flex items-center">
                          <input
                            type="checkbox"
                            value={perm}
                            checked={formData.permissions.includes(perm)}
                            onChange={handlePermissionChange}
                            className="mr-2"
                            disabled={formData.role === 'superadmin'}
                          />
                          <span>{perm}</span>
                        </div>
                      ))}
                      {formData.role === 'superadmin' && (
                        <p className={`mt-2 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                          Superadmins have all permissions automatically.
                        </p>
                      )}
                    </div>
                    <div className="flex justify-end space-x-4">
                      <button
                        type="button"
                        onClick={() => setIsFormOpen(false)}
                        className={`px-4 py-2 rounded ${isDarkTheme ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-300 hover:bg-gray-400'}`}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className={`px-4 py-2 rounded ${isDarkTheme ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Saving...' : selectedAdmin ? 'Update' : 'Create'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </RoleGuard>
  );
};

export default AdminManagementComponent;