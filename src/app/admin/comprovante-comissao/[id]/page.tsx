

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useAdmin, useAdminData } from '@/context/AdminContext';
import { useSettings } from '@/context/SettingsContext';
import { useMemo, useRef } from 'react';
import type { Order, CommissionPayment } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft } from 'lucide-react';
import Logo from '@/components/Logo';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';


const formatCurrency = (value: number) => {
  if (typeof value !== 'number') return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export default function CommissionReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const { commissionPayments, orders } = useAdminData();
  const { settings } = useSettings();
  const receiptRef = useRef<HTMLDivElement>(null);

  const { payment, relatedOrders } = useMemo(() => {
    if (!commissionPayments || !orders) {
        return { payment: null, relatedOrders: [] };
    }
    const paymentId = params.id as string;
    const foundPayment = commissionPayments.find(p => p.id === paymentId);

    if (!foundPayment) {
        return { payment: null, relatedOrders: [] };
    }
    
    const foundOrders = orders.filter(o => foundPayment.orderIds.includes(o.id));

    return { payment: foundPayment, relatedOrders: foundOrders };
  }, [commissionPayments, orders, params.id]);


  if (!payment) {
    return (
      <div className="container mx-auto py-24 text-center">
        <h1 className="text-2xl font-bold">Comprovante não encontrado</h1>
      </div>
    );
  }

  return (
    <div className="bg-muted/30 print:bg-white py-8">
      <div className="container mx-auto px-4 max-w-4xl print:p-0">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-8 print-hidden gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div className="text-center">
             <h1 className="text-2xl font-bold">Comprovante de Pagamento</h1>
             <p className="text-muted-foreground">ID: {payment.id}</p>
          </div>
          <Button onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
        </header>

        <main ref={receiptRef} id="receipt-content" className="bg-background rounded-lg border shadow-sm p-8 break-inside-avoid print:shadow-none print:border-none print:p-0">
           <div className="flex justify-between items-start pb-4 border-b">
             <div className="flex items-center">
                <Logo />
                <div className="w-2" />
                <div className="text-xs">
                    <p className="font-bold">{settings.storeName}</p>
                    <p className="whitespace-pre-line">{settings.storeAddress}</p>
                </div>
            </div>
             <div className="text-right">
                <p className="font-bold text-lg">Recibo de Comissão</p>
                <p className="text-sm text-muted-foreground">Data do Pagamento: {format(parseISO(payment.paymentDate), 'dd/MM/yyyy', { locale: ptBR })}</p>
             </div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-6">
               <div className="sm:col-span-1">
                   <p className="text-xs text-muted-foreground">VENDEDOR(A)</p>
                   <p className="font-semibold text-lg">{payment.sellerName}</p>
               </div>
               <div className="sm:col-span-1">
                   <p className="text-xs text-muted-foreground">PERÍODO DE REFERÊNCIA</p>
                   <p className="font-semibold text-lg capitalize">{payment.period}</p>
               </div>
               <div className="text-right sm:col-span-1">
                   <p className="text-xs text-muted-foreground">VALOR TOTAL PAGO</p>
                   <p className="font-bold text-2xl text-primary">{formatCurrency(payment.amount)}</p>
               </div>
           </div>
           
            <div className="mt-6">
                <h3 className="font-semibold mb-2">Pedidos Incluídos neste Pagamento:</h3>
                <div className="border rounded-md print:border-none overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 print:bg-gray-100">
                            <tr className="border-b">
                                <th className="p-2 text-left font-medium">Data</th>
                                <th className="p-2 text-left font-medium">Pedido</th>
                                <th className="p-2 text-left font-medium">Cliente</th>
                                <th className="p-2 text-right font-medium">Valor Pedido</th>
                                <th className="p-2 text-right font-medium">Comissão</th>
                            </tr>
                        </thead>
                        <tbody>
                            {relatedOrders.map(order => (
                                <tr key={order.id} className="border-b last:border-none">
                                    <td className="p-2 whitespace-nowrap">{format(parseISO(order.date), 'dd/MM/yy')}</td>
                                    <td className="p-2 font-mono">{order.id}</td>
                                    <td className="p-2">{order.customer.name}</td>
                                    <td className="p-2 text-right">{formatCurrency(order.total)}</td>
                                    <td className="p-2 text-right font-semibold">{formatCurrency(order.commission || 0)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-12 text-center">
                <div className="inline-block">
                    <div className="border-t w-64 pt-2">
                        <p className="text-sm font-semibold">{payment.sellerName}</p>
                        <p className="text-xs text-muted-foreground">Assinatura do Vendedor(a)</p>
                    </div>
                </div>
            </div>
        </main>
      </div>
    </div>
  );
}
