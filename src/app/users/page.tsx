'use client';

import { useState } from 'react';
import { useUsers, UserProfile, UserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, UserPlus, Shield, UserCheck, UserX, Search } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function UsersPage() {
    const { users, loading, refetch } = useUsers();
    const [searchQuery, setSearchQuery] = useState('');
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [roleToUpdate, setRoleToUpdate] = useState<UserRole | null>(null);
    const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const filteredUsers = users.filter(user =>
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleRoleChange = (user: UserProfile, newRole: UserRole) => {
        setEditingUser(user);
        setRoleToUpdate(newRole);
        setIsUpdateDialogOpen(true);
    };

    const confirmRoleUpdate = async () => {
        if (!editingUser || !roleToUpdate) return;

        setIsUpdating(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: roleToUpdate })
                .eq('id', editingUser.id);

            if (error) throw error;

            toast.success(`Rol actualizado a ${roleToUpdate} para ${editingUser.full_name}`);
            refetch();
            setIsUpdateDialogOpen(false);
        } catch (error: any) {
            toast.error('Error al actualizar rol: ' + error.message);
        } finally {
            setIsUpdating(false);
        }
    };

    const toggleUserStatus = async (user: UserProfile) => {
        try {
            const newStatus = !user.is_active;
            const { error } = await supabase
                .from('profiles')
                .update({ is_active: newStatus })
                .eq('id', user.id);

            if (error) throw error;

            toast.success(`Usuario ${newStatus ? 'activado' : 'desactivado'} correctamente`);
            refetch();
        } catch (error: any) {
            toast.error('Error al cambiar estado: ' + error.message);
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin':
                return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">Administrador</Badge>;
            case 'supervisor':
                return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">Supervisor</Badge>;
            case 'cashier':
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Cajero</Badge>;
            default:
                return <Badge variant="outline">{role}</Badge>;
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold">Gestión de Usuarios</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Administra roles y accesos del personal
                        </p>
                    </div>
                    <Link href="/admin">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Panel
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Usuarios del Sistema
                            </CardTitle>
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <div className="relative w-full md:w-64">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar por nombre o email..."
                                        className="pl-8"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                {/* Note: User creation usually requires admin backend or invite system */}
                                <Button disabled title="Para crear usuarios, regístralos en la página de login">
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Nuevo Usuario
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Usuario</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Rol Actual</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead>Fecha Registro</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
                                                        {user.full_name?.charAt(0).toUpperCase() || 'U'}
                                                    </div>
                                                    {user.full_name || 'Sin Nombre'}
                                                </div>
                                            </TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                <Select
                                                    value={user.role}
                                                    onValueChange={(value) => handleRoleChange(user, value as UserRole)}
                                                >
                                                    <SelectTrigger className="w-[140px] h-8">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="admin">Administrador</SelectItem>
                                                        <SelectItem value="supervisor">Supervisor</SelectItem>
                                                        <SelectItem value="cashier">Cajero</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={user.is_active ? 'default' : 'destructive'} className="cursor-pointer" onClick={() => toggleUserStatus(user)}>
                                                    {user.is_active ? 'Activo' : 'Inactivo'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {format(new Date(user.created_at), 'dd/MM/yyyy')}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => toggleUserStatus(user)}
                                                    className={user.is_active ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                                                >
                                                    {user.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Role Update Confirmation Dialog */}
            <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar Cambio de Rol</DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de que deseas cambiar el rol de <b>{editingUser?.full_name}</b> a <b>{roleToUpdate === 'admin' ? 'Administrador' : roleToUpdate === 'cashier' ? 'Cajero' : 'Supervisor'}</b>?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        {roleToUpdate === 'admin' && (
                            <div className="p-3 bg-yellow-50 text-yellow-800 rounded-md text-sm flex gap-2">
                                <Shield className="h-5 w-5 shrink-0" />
                                <p>Advertencia: Los administradores tienen acceso completo al sistema, incluyendo gestión de usuarios y configuración.</p>
                            </div>
                        )}
                        {roleToUpdate === 'cashier' && editingUser?.role === 'admin' && (
                            <div className="p-3 bg-blue-50 text-blue-800 rounded-md text-sm flex gap-2">
                                <Shield className="h-5 w-5 shrink-0" />
                                <p>Nota: Este usuario perderá acceso al panel de administración y solo podrá ver sus propias ventas.</p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={confirmRoleUpdate} disabled={isUpdating}>
                            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirmar Cambio
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
