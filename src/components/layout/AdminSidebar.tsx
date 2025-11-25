'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    ShoppingBasket,
    Clock,
    Receipt,
    Package,
    Tags,
    Users,
    UserCircle,
    Trophy,
    Settings,
    LogOut,
    ChevronDown,
    ChevronRight,
    Coffee,
    Menu,
    BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useUserRole } from '@/hooks/useUserRole';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

interface SidebarItemProps {
    icon: any;
    label: string;
    href?: string;
    active?: boolean;
    subItems?: { label: string; href: string; icon?: any }[];
    isOpen?: boolean;
}

const SidebarItem = ({ icon: Icon, label, href, active, subItems, isOpen }: SidebarItemProps) => {
    const [isExpanded, setIsExpanded] = useState(active);
    const pathname = usePathname();

    useEffect(() => {
        if (active) setIsExpanded(true);
    }, [active]);

    if (subItems) {
        return (
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded} className="w-full">
                <CollapsibleTrigger asChild>
                    <Button
                        variant="ghost"
                        className={cn(
                            "w-full justify-between px-4 py-2 h-10 hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-900/20 dark:hover:text-brand-300",
                            active && "text-brand-700 font-medium bg-brand-50 dark:bg-brand-900/20 dark:text-brand-300"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <Icon className="h-4 w-4" />
                            <span className={cn("transition-all duration-200", !isOpen && "hidden")}>{label}</span>
                        </div>
                        {isOpen && (
                            isExpanded ? <ChevronDown className="h-4 w-4 opacity-50" /> : <ChevronRight className="h-4 w-4 opacity-50" />
                        )}
                    </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-4 space-y-1 overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                    {subItems.map((item) => (
                        <Link key={item.href} href={item.href} className="block">
                            <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    "w-full justify-start h-9 text-sm font-normal",
                                    pathname === item.href
                                        ? "bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200"
                                        : "text-gray-500 hover:text-brand-600 hover:bg-brand-50/50"
                                )}
                            >
                                {item.icon && <item.icon className="h-3 w-3 mr-2" />}
                                {item.label}
                            </Button>
                        </Link>
                    ))}
                </CollapsibleContent>
            </Collapsible>
        );
    }

    return (
        <Link href={href!} className="block w-full">
            <Button
                variant="ghost"
                className={cn(
                    "w-full justify-start px-4 py-2 h-10 hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-900/20 dark:hover:text-brand-300",
                    active && "bg-brand-50 text-brand-700 font-medium dark:bg-brand-900/20 dark:text-brand-300"
                )}
            >
                <Icon className="h-4 w-4 mr-3" />
                <span className={cn("transition-all duration-200", !isOpen && "hidden")}>{label}</span>
            </Button>
        </Link>
    );
};

export function AdminSidebar() {
    const [isOpen, setIsOpen] = useState(true);
    const pathname = usePathname();
    const { profile } = useUserRole();
    const router = useRouter();
    const supabase = createClientComponentClient();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const menuGroups = [
        {
            title: "Principal",
            items: [
                { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
            ]
        },
        {
            title: "Operaciones",
            items: [
                { label: "Punto de Venta", href: "/pos", icon: ShoppingBasket },
                { label: "Turnos y Caja", href: "/shifts", icon: Clock },
                { label: "Historial Ventas", href: "/sales", icon: Receipt },
                { label: "Reportes", href: "/admin/reports", icon: BarChart3 },
            ]
        },
        {
            title: "Catálogo",
            items: [
                {
                    label: "Inventario",
                    icon: Package,
                    active: pathname.startsWith('/categories') || pathname.startsWith('/products') || pathname.startsWith('/inventory') || pathname.startsWith('/suppliers'),
                    subItems: [
                        { label: "Productos", href: "/products" },
                        { label: "Categorías", href: "/categories" },
                        { label: "Movimientos", href: "/inventory" },
                        { label: "Proveedores", href: "/admin/suppliers" },
                    ]
                },
            ]
        },
        {
            title: "Gestión",
            items: [
                {
                    label: "Personas",
                    icon: Users,
                    active: pathname.startsWith('/users') || pathname.startsWith('/customers'),
                    subItems: [
                        { label: "Usuarios (Staff)", href: "/users", icon: UserCircle },
                        { label: "Clientes", href: "/customers", icon: Users },
                    ]
                },
                {
                    label: "Fidelidad",
                    icon: Trophy,
                    active: pathname.startsWith('/admin/loyalty') || pathname.startsWith('/loyalty'),
                    subItems: [
                        { label: "Dashboard", href: "/loyalty" },
                        { label: "Reglas", href: "/admin/loyalty" },
                    ]
                },
            ]
        },
        {
            title: "Sistema",
            items: [
                { label: "Configuración", href: "/admin/settings", icon: Settings },
            ]
        },
    ];

    return (
        <div
            className={cn(
                "flex flex-col h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300",
                isOpen ? "w-64" : "w-16"
            )}
        >
            {/* Header */}
            <div className="h-16 flex items-center px-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 w-full overflow-hidden">
                    <div className="bg-brand-500 text-white p-1.5 rounded-lg shrink-0">
                        <Coffee className="h-5 w-5" />
                    </div>
                    <span className={cn(
                        "font-bold text-lg tracking-tight text-gray-900 dark:text-white whitespace-nowrap transition-all duration-200",
                        !isOpen && "opacity-0 w-0"
                    )}>
                        Anti-Coffee
                    </span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto shrink-0 h-8 w-8"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <Menu className="h-4 w-4" />
                </Button>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full py-4">
                    <div className="space-y-6 px-3 pb-4">
                        {menuGroups.map((group, idx) => (
                            <div key={idx}>
                                {isOpen && (
                                    <h4 className="mb-2 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        {group.title}
                                    </h4>
                                )}
                                <div className="space-y-1">
                                    {group.items.map((item: any) => (
                                        <SidebarItem
                                            key={item.label}
                                            {...item}
                                            active={item.active || pathname === item.href}
                                            isOpen={isOpen}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* Footer / User Profile */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                <div className={cn("flex items-center gap-3", !isOpen && "justify-center")}>
                    <div className="h-9 w-9 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-700 dark:text-brand-300 font-medium shrink-0">
                        {profile?.full_name?.[0] || 'U'}
                    </div>
                    {isOpen && (
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium truncate">{profile?.full_name || 'Usuario'}</p>
                            <p className="text-xs text-gray-500 capitalize">{profile?.role || 'Staff'}</p>
                        </div>
                    )}
                    {isOpen && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-red-500" onClick={handleSignOut}>
                            <LogOut className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
