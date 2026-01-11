

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAdmin, useAdminData } from '@/context/AdminContext';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { useAudit } from '@/context/AuditContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Wrench, Save, History, Edit, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { CustomerInfo, Avaria } from '@/lib/types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';


const avariaSchema = z.object({
  customerId: z.string().min(1, 'Selecione um cliente.'),
  productId: z.string().min(1, 'Selecione um produto.'),
  description: z.string().min(10, 'A descrição da avaria é obrigatória e deve ter pelo menos 10 caracteres.'),
});

type AvariaFormValues = z.infer<typeof avariaSchema>;

export default function AvariasPage() {
    const { addAvaria, updateAvaria, deleteAvaria } = useAdmin();
    const { products } = useData();
    const { orders, avarias } = useAdminData();
    const { user } = useAuth();
    const { logAction } = useAudit();
    const { toast } = useToast();
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [avariaToEdit, setAvariaToEdit] = useState<Avaria | null>(null);

    const form = useForm<AvariaFormValues>({
        resolver: zodResolver(avariaSchema),
        defaultValues: {
            customerId: '',
            productId: '',
            description: '',
        },
    });
    
    const editForm = useForm<AvariaFormValues>({
        resolver: zodResolver(avariaSchema),
    });

    const customersWithCpf = useMemo(() => {
        if (!orders) return [];
        const customerMap = new Map<string, CustomerInfo>();
        orders.forEach(order => {
            if (order.customer.cpf && !customerMap.has(order.customer.cpf)) {
                customerMap.set(order.customer.cpf, order.customer);
            }
        });
        return Array.from(customerMap.values()).sort((a,b) => a.name.localeCompare(b.name));
    }, [orders]);
    
    const sortedProducts = useMemo(() => {
        return [...products].sort((a,b) => a.name.localeCompare(b.name));
    }, [products]);

    function onSubmit(values: AvariaFormValues) {
        if (!user) return;
        const customer = customersWithCpf.find(c => c.cpf === values.customerId);
        const product = products.find(p => p.id === values.productId);

        if (!customer || !product || !customer.cpf) {
             toast({ title: 'Erro', description: 'Cliente ou produto inválido. O cliente deve ter um CPF.', variant: 'destructive' });
            return;
        }

        addAvaria({
            customerId: customer.cpf,
            customerName: customer.name,
            productId: product.id,
            productName: product.name,
            description: values.description,
        }, logAction, user);
        
        form.reset();
    }
    
    const handleOpenEditDialog = (avaria: Avaria) => {
        setAvariaToEdit(avaria);
        editForm.reset({
            customerId: avaria.customerId,
            productId: avaria.productId,
            description: avaria.description,
        });
        setIsEditDialogOpen(true);
    };

    function onEditSubmit(values: AvariaFormValues) {
        if (!user || !avariaToEdit) return;
        const customer = customersWithCpf.find(c => c.cpf === values.customerId);
        const product = products.find(p => p.id === values.productId);
        if (!customer || !product || !customer.cpf) {
            toast({ title: 'Erro', description: 'Cliente ou produto inválido. O cliente deve ter um CPF.', variant: 'destructive' });
            return;
        }
        
        updateAvaria(avariaToEdit.id, {
            customerId: customer.cpf,
            customerName: customer.name,
            productId: product.id,
            productName: product.name,
            description: values.description,
        }, logAction, user);
        
        setIsEditDialogOpen(false);
        setAvariaToEdit(null);
    }
    
    const handleDelete = (avariaId: string) => {
        if (!user) return;
        deleteAvaria(avariaId, logAction, user);
    }

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Wrench className="h-6 w-6" />
                        Registrar Nova Avaria
                    </CardTitle>
                    <CardDescription>
                        Cadastre aqui os problemas ocorridos durante a montagem ou garantia de um produto para um cliente.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="customerId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Cliente (com CPF)</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione o cliente" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {customersWithCpf.map(c => (
                                                        <SelectItem key={c.cpf} value={c.cpf!}>{c.name} - {c.cpf}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="productId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Produto Avariado</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione o produto" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {sortedProducts.map(p => (
                                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Descrição da Avaria</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Descreva detalhadamente o problema encontrado. Ex: Porta do guarda-roupa com arranhão, pé do sofá quebrou na instalação, etc."
                                                {...field}
                                                rows={4}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit">
                                <Save className="mr-2 h-4 w-4" />
                                Registrar Avaria
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-6 w-6" />
                        Histórico de Avarias
                    </CardTitle>
                    <CardDescription>Lista de todas as avarias registradas no sistema.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Produto</TableHead>
                                    <TableHead>Descrição</TableHead>
                                    <TableHead>Registrado por</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {avarias.length > 0 ? (
                                    avarias.map(avaria => (
                                        <TableRow key={avaria.id}>
                                            <TableCell className="text-sm text-muted-foreground w-[180px]">
                                                {format(new Date(avaria.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                            </TableCell>
                                            <TableCell className="font-medium">{avaria.customerName}</TableCell>
                                            <TableCell>{avaria.productName}</TableCell>
                                            <TableCell className="text-muted-foreground">{avaria.description}</TableCell>
                                            <TableCell>{avaria.createdByName}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex gap-2 justify-end">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEditDialog(avaria)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Confirmar Exclusão?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Esta ação não pode ser desfeita. Isso irá apagar permanentemente o registro de avaria.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDelete(avaria.id)}>
                                                                    Sim, Excluir
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            Nenhuma avaria registrada ainda.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Editar Avaria</DialogTitle>
                        <DialogDescription>
                            Faça alterações nos detalhes do registro de avaria.
                        </DialogDescription>
                    </DialogHeader>
                     <Form {...editForm}>
                        <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6 py-4">
                            <div className="grid md:grid-cols-2 gap-6">
                                <FormField
                                    control={editForm.control}
                                    name="customerId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Cliente</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione o cliente" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {customersWithCpf.map(c => (
                                                        <SelectItem key={c.cpf} value={c.cpf!}>{c.name} - {c.cpf}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={editForm.control}
                                    name="productId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Produto Avariado</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione o produto" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {sortedProducts.map(p => (
                                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={editForm.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Descrição da Avaria</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Descreva detalhadamente o problema encontrado."
                                                {...field}
                                                rows={4}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button variant="outline" type="button" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
                                <Button type="submit">
                                    <Save className="mr-2 h-4 w-4" />
                                    Salvar Alterações
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

        </div>
    );
}

    
