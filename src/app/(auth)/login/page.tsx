'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { signIn, signUp } from './actions';

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);

        const formData = new FormData(event.currentTarget);

        try {
            if (isSignUp) {
                const res = await signUp(formData);
                if (res?.error) {
                    toast.error(res.error);
                } else {
                    toast.success(res?.message || 'Cuenta creada');
                    setIsSignUp(false);
                }
            } else {
                const res = await signIn(formData);
                if (res?.error) {
                    toast.error(res.error);
                }
            }
        } catch (error) {
            // If it's a redirect error, it's actually a success
            // But usually Next.js handles this automatically for Server Actions
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">POS Cafetería {isSignUp ? 'Registro' : 'Iniciar Sesión'}</CardTitle>
                    <CardDescription className="text-center">
                        {isSignUp ? 'Crear una nueva cuenta' : 'Ingresa tus credenciales para acceder al sistema'}
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="cashier@coffee.com"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-2 pt-4">
                        <Button className="w-full" type="submit" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
                        </Button>
                        <Button
                            type="button"
                            variant="link"
                            className="w-full"
                            onClick={() => setIsSignUp(!isSignUp)}
                        >
                            {isSignUp ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
