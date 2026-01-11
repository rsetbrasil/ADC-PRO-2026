
import CheckoutForm from '@/components/CheckoutForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function CheckoutPage() {
    return (
        <div className="container mx-auto py-12 px-4">
            <Card className="max-w-4xl mx-auto shadow-lg">
                <CardHeader>
                    <CardTitle className="text-3xl font-headline text-primary">Finalizar Compra</CardTitle>
                    <CardDescription>
                        Por favor, preencha suas informações e escolha a forma de pagamento.
                    </CardDescription>
                </CardHeader>
                <Separator />
                <CardContent className="pt-6">
                    <CheckoutForm />
                </CardContent>
            </Card>
        </div>
    );
}
