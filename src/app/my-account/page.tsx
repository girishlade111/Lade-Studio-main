"use client"

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Box, Home, User, PackageSearch, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuthContext } from "@/context/AuthContext";
import { getUserOrders } from "@/lib/api/orders";
import type { Order, OrderItem } from "@/types/database";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AddressList } from "@/components/address/AddressList";
import { CancelOrderDialog } from "@/components/order/CancelOrderDialog";

type OrderWithItems = Order & { order_items: OrderItem[] };

function EmptyState({ icon: Icon, title, description, buttonText, buttonLink }: { icon: React.ElementType, title: string, description: string, buttonText: string, buttonLink: string }) {
    return (
        <div className="text-center p-8 flex flex-col items-center">
            <div className="bg-primary/10 text-primary p-4 rounded-full mb-4">
                <Icon className="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-headline mb-2">{title}</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">{description}</p>
            <Button asChild>
                <Link href={buttonLink}>{buttonText}</Link>
            </Button>
        </div>
    )
}

function OrdersTab() {
    const { user } = useAuthContext();
    const [orders, setOrders] = useState<OrderWithItems[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    useEffect(() => {
        async function fetchOrders() {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                const { data, error } = await getUserOrders();
                if (error) {
                    setError(error.message);
                } else {
                    setOrders(data || []);
                }
            } catch (err) {
                setError('Failed to load orders');
            } finally {
                setLoading(false);
            }
        }

        fetchOrders();
    }, [user]);

    const refreshOrders = async () => {
        try {
            const { data, error } = await getUserOrders();
            if (error) {
                setError(error.message);
            } else {
                setOrders(data || []);
            }
        } catch (err) {
            setError('Failed to refresh orders');
        }
    };

    const handleCancelOrder = (order: Order) => {
        setSelectedOrder(order);
        setCancelDialogOpen(true);
    };

    const canCancelOrder = (status: string) => {
        return status?.toLowerCase() === 'processing';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'delivered':
                return 'text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium';
            case 'on the way':
                return 'text-purple-600 bg-purple-50 px-2 py-1 rounded-full text-xs font-medium';
            case 'in progress':
                return 'text-blue-600 bg-blue-50 px-2 py-1 rounded-full text-xs font-medium';
            case 'processing':
                return 'text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full text-xs font-medium';
            case 'cancelled':
                return 'text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs font-medium';
            default:
                return 'text-gray-600 bg-gray-50 px-2 py-1 rounded-full text-xs font-medium';
        }
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">My Orders</CardTitle>
                    <CardDescription>View your past and current orders.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span className="ml-2">Loading orders...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">My Orders</CardTitle>
                    <CardDescription>View your past and current orders.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center p-8">
                        <p className="text-red-600 mb-4">Error loading orders: {error}</p>
                        <Button onClick={() => window.location.reload()}>Retry</Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">My Orders</CardTitle>
                    <CardDescription>View your past and current orders.</CardDescription>
                </CardHeader>
                <CardContent>
                    {orders.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Items</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.map(order => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-medium">
                                            <span className="font-mono text-sm">
                                                {order.id.split('-')[0].toUpperCase()}
                                            </span>
                                        </TableCell>
                                        <TableCell>{formatDate(order.created_at)}</TableCell>
                                        <TableCell>
                                            <span className="text-sm text-muted-foreground">
                                                {order.order_items?.length || 0} item(s)
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className={getStatusColor(order.status)}>
                                                {order.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            ₹{order.total_amount.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {canCancelOrder(order.status) && (
                                                <Button 
                                                    size="sm" 
                                                    variant="destructive"
                                                    onClick={() => handleCancelOrder(order)}
                                                >
                                                    Cancel
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <EmptyState 
                            icon={PackageSearch}
                            title="No Orders Yet"
                            description="You haven't placed any orders with us. Once you do, they will appear here."
                            buttonText="Start Shopping"
                            buttonLink="/products"
                        />
                    )}
                </CardContent>
            </Card>
            
            {selectedOrder && (
                <CancelOrderDialog
                    isOpen={cancelDialogOpen}
                    onClose={() => {
                        setCancelDialogOpen(false);
                        setSelectedOrder(null);
                    }}
                    order={selectedOrder}
                    onCancelled={refreshOrders}
                />
            )}
        </>
    )
}

function ProfileTab() {
    const { user } = useAuthContext();
    
    // Get user info from authentication
    const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || '';
    const userEmail = user?.email || '';

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Profile Details</CardTitle>
                <CardDescription>View and update your personal information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" defaultValue={userName} placeholder="Your full name" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" defaultValue={userEmail} placeholder="your.email@example.com" disabled />
                    <p className="text-sm text-muted-foreground">Email cannot be changed from here. Contact support if needed.</p>
                </div>
                <Separator />
                <h3 className="text-lg font-headline">Change Password</h3>
                <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" />
                </div>
                <Button disabled>
                    Update Profile
                    <span className="ml-2 text-xs">(Coming Soon)</span>
                </Button>
            </CardContent>
        </Card>
    );
}

function AddressesTab() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">My Addresses</CardTitle>
                <CardDescription>Manage your saved shipping addresses.</CardDescription>
            </CardHeader>
            <CardContent>
                <AddressList />
            </CardContent>
        </Card>
    );
}

export default function MyAccountPage() {
    return (
        <ProtectedRoute>
            <div className="container mx-auto px-4 py-12">
                <h1 className="text-4xl md:text-5xl font-headline text-center mb-12">My Account</h1>
                <Tabs defaultValue="orders" className="flex flex-col md:flex-row gap-8">
                    <TabsList className="flex md:flex-col h-auto bg-transparent p-0 gap-2 items-start">
                        <TabsTrigger value="orders" className="w-full justify-start gap-2">
                            <Box className="h-5 w-5" /> Orders
                        </TabsTrigger>
                        <TabsTrigger value="profile" className="w-full justify-start gap-2">
                            <User className="h-5 w-5" /> Profile
                        </TabsTrigger>
                        <TabsTrigger value="addresses" className="w-full justify-start gap-2">
                            <Home className="h-5 w-5" /> Addresses
                        </TabsTrigger>
                    </TabsList>
                    <div className="flex-grow">
                        <TabsContent value="orders"><OrdersTab /></TabsContent>
                        <TabsContent value="profile"><ProfileTab /></TabsContent>
                        <TabsContent value="addresses"><AddressesTab /></TabsContent>
                    </div>
                </Tabs>
            </div>
        </ProtectedRoute>
    );
}