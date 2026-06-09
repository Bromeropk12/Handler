import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import Modal from './Modal';
import { TrashIcon } from '@heroicons/react/24/outline';


// Componentes modulares
import UserManagementHeader from './UserManagementHeader';
import UserManagementTabs from './UserManagementTabs';
import MessageBanner from './MessageBanner';
import UserManagementStats from './UserManagementStats';
import UserManagementQuickActions from './UserManagementQuickActions';
import UserManagementFilters from './UserManagementFilters';
import UserManagementTable from './UserManagementTable';
import UserManagementSecurity from './UserManagementSecurity';
import CreateUserModal from './CreateUserModal';
import ChangePasswordModal from './ChangePasswordModal';

/**
 * Componente modular de gestión de usuarios para administradores
 * Interfaz completa con estadísticas, filtros y gestión avanzada
 */
const UserManagement = ({ isOpen, onClose }) => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showPasswordForm, setShowPasswordForm] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [createFormData, setCreateFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        role: 'operator'
    });
    const [passwordFormData, setPasswordFormData] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [userToDelete, setUserToDelete] = useState(null);
    const [errors, setErrors] = useState({});

    // Validaciones de contraseña - Solo para operadores al cambiar contraseña
    const validatePassword = (password) => {
        const errors = [];
        if (password.length < 8) errors.push('Mínimo 8 caracteres');
        if (!/[A-Z]/.test(password)) errors.push('Al menos 1 mayúscula');
        if (!/[a-z]/.test(password)) errors.push('Al menos 1 minúscula');
        if (!/\d/.test(password)) errors.push('Al menos 1 número');
        if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/.test(password)) errors.push('Al menos 1 carácter especial');
        return errors;
    };

    // Cargar usuarios
    const loadUsers = async () => {
        try {
            setLoading(true);
            const response = await authAPI.listUsers();
            setUsers(response.data.data.users);
        } catch (error) {
            setMessage({ type: 'error', text: 'Error al cargar usuarios' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadUsers();
            setActiveTab('overview');
        }
    }, [isOpen]);

    // Filtrar usuarios
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    // Estadísticas
    const stats = {
        total: users.length,
        admins: users.filter(u => u.role === 'admin').length,
        operators: users.filter(u => u.role === 'operator').length,
        recent: users.filter(u => {
            const created = new Date(u.created_at);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return created > weekAgo;
        }).length
    };

    // Crear usuario - Los admins pueden crear usuarios sin validación de contraseña
    const handleCreateUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        const newErrors = {};
        if (!createFormData.username) newErrors.username = 'Usuario requerido';
        if (!createFormData.password) newErrors.password = 'Contraseña requerida';
        if (createFormData.password !== createFormData.confirmPassword) {
            newErrors.confirmPassword = 'Contraseñas no coinciden';
        }

        // Solo validar contraseña si es operador (que tendrá que cambiarla después)
        // Los admins pueden crear usuarios con cualquier contraseña
        if (createFormData.role === 'operator' && createFormData.password) {
            const passErrors = validatePassword(createFormData.password);
            if (passErrors.length > 0) newErrors.password = passErrors.join(', ');
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setLoading(false);
            return;
        }

        try {
            await authAPI.createUser({
                username: createFormData.username,
                password: createFormData.password,
                role: createFormData.role
            });

            setMessage({
                type: 'success',
                text: createFormData.role === 'operator'
                    ? 'Usuario operador creado exitosamente.'
                    : 'Usuario administrador creado exitosamente'
            });
            setCreateFormData({ username: '', password: '', confirmPassword: '', role: 'operator' });
            setShowCreateForm(false);
            loadUsers();
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Error al crear usuario' });
        } finally {
            setLoading(false);
        }
    };

    // Eliminar usuario
    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        setLoading(true);
        try {
            await authAPI.deleteUser(userToDelete.id);
            setMessage({ type: 'success', text: `Usuario ${userToDelete.username} eliminado correctamente` });
            setUserToDelete(null);
            loadUsers();
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Error al eliminar usuario' });
        } finally {
            setLoading(false);
        }
    };

    // Cambiar contraseña - Los operadores deben usar validaciones, los admins pueden cambiar libremente
    const handleChangePassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        const newErrors = {};
        if (!passwordFormData.newPassword) newErrors.newPassword = 'Contraseña requerida';
        if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
            newErrors.confirmPassword = 'Contraseñas no coinciden';
        }

        // Solo validar contraseña si es operador o si el usuario actual es operador
        const isOperator = showPasswordForm?.role === 'operator' || currentUser?.role === 'operator';
        if (isOperator && passwordFormData.newPassword) {
            const passErrors = validatePassword(passwordFormData.newPassword);
            if (passErrors.length > 0) newErrors.newPassword = passErrors.join(', ');
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setLoading(false);
            return;
        }

        try {
            await authAPI.changeUserPassword(showPasswordForm.id, {
                newPassword: passwordFormData.newPassword
            });

            setMessage({ type: 'success', text: `Contraseña de ${showPasswordForm.username} actualizada` });
            setPasswordFormData({ newPassword: '', confirmPassword: '' });
            setShowPasswordForm(null);
            loadUsers();
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Error al cambiar contraseña' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} maxWidth="7xl" noPadding>
            <div className="flex flex-col min-h-0">
                {/* Header */}
                <UserManagementHeader onClose={onClose} />

                {/* Tabs */}
                <UserManagementTabs activeTab={activeTab} setActiveTab={setActiveTab} />

                {/* Body */}
                <div className="px-8 py-6 space-y-5">
                    {/* Message */}
                    <MessageBanner message={message} />

                    {/* Tab Content */}
                    {activeTab === 'overview' && (
                        <div className="space-y-5">
                            <UserManagementStats stats={stats} />
                            <UserManagementQuickActions
                                onCreateUser={() => setShowCreateForm(true)}
                                onManageUsers={() => setActiveTab('users')}
                                onRefresh={loadUsers}
                                loading={loading}
                            />
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="space-y-5">
                            <UserManagementFilters
                                searchTerm={searchTerm}
                                setSearchTerm={setSearchTerm}
                                roleFilter={roleFilter}
                                setRoleFilter={setRoleFilter}
                                onCreateUser={() => setShowCreateForm(true)}
                            />
                            <UserManagementTable
                                users={filteredUsers}
                                currentUser={currentUser}
                                onChangePassword={setShowPasswordForm}
                                onDeleteUser={setUserToDelete}
                                onPermissionsSaved={(uid, perms) => {
                                    setUsers(prev => prev.map(u => u.id === uid ? { ...u, permissions: perms } : u));
                                    setMessage({ type: 'success', text: 'Permisos actualizados exitosamente ✓' });
                                }}
                            />
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <UserManagementSecurity />
                    )}
                </div>

                {/* Modals - outside body padding */}
                <CreateUserModal
                    isOpen={showCreateForm}
                    onClose={() => setShowCreateForm(false)}
                    formData={createFormData}
                    setFormData={setCreateFormData}
                    errors={errors}
                    loading={loading}
                    onSubmit={handleCreateUser}
                />

                <ChangePasswordModal
                    isOpen={!!showPasswordForm}
                    onClose={() => setShowPasswordForm(null)}
                    user={showPasswordForm}
                    formData={passwordFormData}
                    setFormData={setPasswordFormData}
                    errors={errors}
                    loading={loading}
                    onSubmit={handleChangePassword}
                />

                {/* Delete Confirmation Modal */}
                <Modal isOpen={!!userToDelete} onClose={() => setUserToDelete(null)} maxWidth="md" noPadding>
                    <div className="p-6 text-center">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                            <TrashIcon className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Eliminar Usuario</h3>
                        <p className="text-gray-400 text-sm mb-6">
                            ¿Estás seguro de que deseas eliminar permanentemente al usuario <span className="text-white font-semibold">{userToDelete?.username}</span>? Esta acción no se puede deshacer y eliminará su acceso al sistema.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setUserToDelete(null)}
                                disabled={loading}
                                className="flex-1 py-2.5 bg-surface-700 hover:bg-surface-600 text-white font-medium text-sm rounded-xl transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteUser}
                                disabled={loading}
                                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? 'Eliminando...' : 'Sí, Eliminar'}
                            </button>
                        </div>
                    </div>
                </Modal>
            </div>
        </Modal>
    );
};

export default UserManagement;