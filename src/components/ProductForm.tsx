

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAdmin } from '@/context/AdminContext';
import { useAuth } from '@/context/AuthContext';
import { PackagePlus, X, Percent, DollarSign, CalendarIcon, EyeOff } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import type { Product, Category } from '@/lib/types';
import { ScrollArea } from './ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Checkbox } from './ui/checkbox';
import { useData } from '@/context/DataContext';
import { useAudit } from '@/context/AuditContext';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from './ui/calendar';
import { ptBR } from 'date-fns/locale';

const productSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(3, 'O nome do produto é obrigatório.'),
  description: z.string().min(10, 'A descrição curta é obrigatória.'),
  longDescription: z.string().min(20, 'A descrição longa é obrigatória.'),
  price: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        return parseFloat(val.replace(/\./g, '').replace(',', '.'));
      }
      return val;
    },
    z.coerce.number({ invalid_type_error: 'Preço inválido.' }).positive('O preço deve ser positivo.')
  ),
   cost: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        return parseFloat(val.replace(/\./g, '').replace(',', '.'));
      }
      return val;
    },
    z.coerce.number({ invalid_type_error: 'Custo inválido.' }).min(0, 'O custo não pode ser negativo.').optional()
  ),
  onSale: z.boolean().optional(),
  isHidden: z.boolean().optional(),
  promotionEndDate: z.date().optional(),
  category: z.string().min(1, 'A categoria é obrigatória.'),
  subcategory: z.string().optional(),
  stock: z.coerce.number().int().min(0, 'O estoque não pode ser negativo.'),
  imageUrls: z.array(z.string()).min(1, 'Pelo menos uma imagem é obrigatória.'),
  maxInstallments: z.coerce.number().int().min(1, 'O número mínimo de parcelas é 1.'),
  paymentCondition: z.string().optional(),
  commissionType: z.enum(['percentage', 'fixed']).default('percentage'),
  commissionValue: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        return parseFloat(val.replace(/\./g, '').replace(',', '.'));
      }
      return val;
    },
    z.coerce.number({ invalid_type_error: 'Valor de comissão inválido.' }).min(0, 'A comissão não pode ser negativa.')
  ),
});


type ProductFormValues = z.infer<typeof productSchema>;

const formatCurrency = (value: number) => {
    if (isNaN(value)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
};

const formatBRL = (value: number | undefined | null) => {
  if (value === undefined || value === null || isNaN(value)) {
    return "";
  }
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};


interface ProductFormProps {
    productToEdit?: Product | null;
    onFinished: () => void;
}

export default function ProductForm({ productToEdit, onFinished }: ProductFormProps) {
  const { addProduct, updateProduct } = useAdmin();
  const { categories } = useData();
  const { user } = useAuth();
  const { logAction } = useAudit();
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: productToEdit ? {
        ...productToEdit,
        price: productToEdit.price || 0,
        cost: productToEdit.cost || 0,
        onSale: productToEdit.onSale ?? false,
        isHidden: productToEdit.isHidden ?? false,
        promotionEndDate: productToEdit.promotionEndDate ? new Date(productToEdit.promotionEndDate) : undefined,
        stock: productToEdit.stock || 0,
        maxInstallments: productToEdit.maxInstallments || 10,
        subcategory: productToEdit.subcategory || '',
        imageUrls: productToEdit.imageUrls || [],
        paymentCondition: productToEdit.paymentCondition || '',
        commissionType: productToEdit.commissionType || 'percentage',
        commissionValue: productToEdit.commissionValue || 0,
    } : {
      name: '',
      description: '',
      longDescription: '',
      price: 0,
      cost: 0,
      onSale: false,
      isHidden: false,
      promotionEndDate: undefined,
      category: categories.length > 0 ? categories[0].name : '',
      subcategory: '',
      stock: 0,
      imageUrls: [],
      maxInstallments: 10,
      paymentCondition: '',
      commissionType: 'percentage',
      commissionValue: 0,
    }
  });

  useEffect(() => {
    const defaultValues = productToEdit ? {
        ...productToEdit,
        price: productToEdit.price || 0,
        cost: productToEdit.cost || 0,
        onSale: productToEdit.onSale ?? false,
        isHidden: productToEdit.isHidden ?? false,
        promotionEndDate: productToEdit.promotionEndDate ? new Date(productToEdit.promotionEndDate) : undefined,
        stock: productToEdit.stock || 0,
        maxInstallments: productToEdit.maxInstallments || 10,
        subcategory: productToEdit.subcategory || '',
        imageUrls: productToEdit.imageUrls || [],
        paymentCondition: productToEdit.paymentCondition || '',
        commissionType: productToEdit.commissionType || 'percentage' as 'fixed' | 'percentage',
        commissionValue: productToEdit.commissionValue || 0,
    } : {
      code: '',
      name: '',
      description: '',
      longDescription: '',
      price: 0,
      cost: 0,
      onSale: false,
      isHidden: false,
      promotionEndDate: undefined,
      category: categories.length > 0 ? categories[0].name : '',
      subcategory: '',
      stock: 0,
      imageUrls: [],
      maxInstallments: 10,
      paymentCondition: '',
      commissionType: 'percentage' as 'fixed' | 'percentage',
      commissionValue: 0,
    };
    form.reset(defaultValues);
    setImagePreviews(defaultValues.imageUrls);
  }, [productToEdit, categories, form]);


  const price = form.watch('price');
  const maxInstallments = form.watch('maxInstallments');
  const selectedCategoryName = form.watch('category');
  const commissionType = form.watch('commissionType');
  const onSale = form.watch('onSale');
  const canEditCommission = user?.role === 'admin';

  const installmentValue = (price || 0) > 0 && (maxInstallments || 0) > 0 ? (price || 0) / (maxInstallments || 1) : 0;
  
  const subcategories = useMemo(() => {
    const category = categories.find(c => c.name === selectedCategoryName);
    return category?.subcategories || [];
  }, [selectedCategoryName, categories]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const currentPreviews = form.getValues('imageUrls') || [];
      const filePromises = Array.from(files).map(file => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      Promise.all(filePromises).then(newPreviews => {
        const allPreviews = [...currentPreviews, ...newPreviews];
        setImagePreviews(allPreviews);
        form.setValue('imageUrls', allPreviews, { shouldValidate: true });
      });
    }
  };
  
  const removeImage = (index: number) => {
      const updatedPreviews = imagePreviews.filter((_, i) => i !== index);
      setImagePreviews(updatedPreviews);
      form.setValue('imageUrls', updatedPreviews, { shouldValidate: true });
  }

  function onSubmit(values: ProductFormValues) {
    const productData: Partial<ProductFormValues> = { ...values };
    if (values.promotionEndDate) {
        productData.promotionEndDate = values.promotionEndDate;
    } else {
        delete productData.promotionEndDate;
    }
    
    if (productToEdit) {
        updateProduct({ ...productToEdit, ...productData, promotionEndDate: values.promotionEndDate?.toISOString() }, logAction, user);
    } else {
        addProduct({ ...values, promotionEndDate: values.promotionEndDate?.toISOString() }, logAction, user);
    }
    onFinished();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-6">
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Produto</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Smartphone Pro Z" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição Curta</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Descreva os detalhes do produto..." {...field} rows={2} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="longDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição Longa</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Forneça uma descrição completa e detalhada do produto." {...field} rows={4} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço de Venda (R$)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              inputMode="decimal"
                              value={formatBRL(field.value)}
                              onChange={(e) => {
                                const rawValue = e.target.value.replace(/\D/g, '');
                                field.onChange(Number(rawValue) / 100);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço de Custo (R$)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              inputMode="decimal"
                              value={formatBRL(field.value)}
                              onChange={(e) => {
                                const rawValue = e.target.value.replace(/\D/g, '');
                                field.onChange(Number(rawValue) / 100);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="stock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estoque</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} value={field.value ?? 0} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoria</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                                field.onChange(value);
                                const newSubs = categories.find(c => c.name === value)?.subcategories || [];
                                form.setValue('subcategory', newSubs.length > 0 ? newSubs[0] : '', { shouldValidate: true });
                            }} 
                            value={field.value}
                           >
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma categoria" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.name} className="capitalize">
                                        {cat.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {subcategories.length > 0 && (
                        <FormField
                            control={form.control}
                            name="subcategory"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Subcategoria</FormLabel>
                                <Select 
                                    onValueChange={field.onChange} 
                                    value={field.value || ""}
                                >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione uma subcategoria" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {subcategories.map((sub, index) => (
                                        <SelectItem key={`${sub}-${index}`} value={sub} className="capitalize">
                                            {sub}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                     )}
                    <FormField
                      control={form.control}
                      name="maxInstallments"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Parcelas Máximas</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" {...field} value={field.value ?? 1} />
                          </FormControl>
                          {(price || 0) > 0 && (maxInstallments || 0) > 1 && ( <p className="text-xs text-muted-foreground mt-1"> {maxInstallments}x de {formatCurrency(installmentValue)} </p> )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="onSale"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">
                                        Produto em Promoção
                                    </FormLabel>
                                    <FormDescription>
                                        Marque para exibir um selo de "Promoção" neste produto.
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={(checked) => {
                                            field.onChange(checked);
                                            if (!checked) {
                                                form.setValue('promotionEndDate', undefined);
                                            }
                                        }}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="isHidden"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">
                                        Ocultar produto do catálogo
                                    </FormLabel>
                                    <FormDescription>
                                        O produto não será exibido na loja, mas continuará no sistema.
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>
                 {onSale && (
                     <FormField
                        control={form.control}
                        name="promotionEndDate"
                        render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Data de Fim da Promoção (Opcional)</FormLabel>
                            <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                    )}
                                >
                                    {field.value ? (
                                    format(field.value, "PPP 'às' HH:mm", {locale: ptBR})
                                    ) : (
                                    <span>Escolha uma data</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                locale={ptBR}
                                />
                                <div className="p-3 border-t border-border">
                                    <Input
                                        type="time"
                                        defaultValue={field.value ? format(field.value, 'HH:mm') : '23:59'}
                                        onChange={(e) => {
                                            const time = e.target.value;
                                            const [hours, minutes] = time.split(':').map(Number);
                                            const newDate = field.value || new Date();
                                            newDate.setHours(hours, minutes);
                                            field.onChange(newDate);
                                        }}
                                    />
                                </div>
                            </PopoverContent>
                            </Popover>
                            <FormDescription>
                            Deixe em branco para uma promoção sem data de término.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                 )}
            </div>

            <div className="space-y-4">
                 <FormField
                   control={form.control}
                   name="imageUrls"
                   render={() => (
                     <FormItem>
                       <FormLabel>Imagens do Produto</FormLabel>
                       <FormControl>
                         <Input type="file" accept="image/*" onChange={handleImageChange} multiple className="file:text-primary file:font-semibold cursor-pointer"/>
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
                
                <ScrollArea className="h-80 w-full rounded-md border">
                    <div className="p-4">
                        <h4 className="mb-4 font-medium text-sm leading-none">Pré-visualização</h4>
                         {imagePreviews.length > 0 ? (
                            <div className="grid grid-cols-2 gap-4">
                                {imagePreviews.map((src, index) => (
                                    <div key={index} className="relative group">
                                        <Image src={src} alt={`Preview ${index}`} width={100} height={100} className="w-full h-auto object-contain rounded-md aspect-square" />
                                        <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeImage(index)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                         ) : (
                            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                                <p>Nenhuma imagem selecionada</p>
                            </div>
                         )}
                    </div>
                </ScrollArea>
                <FormField
                  control={form.control}
                  name="paymentCondition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condição de Pagamento (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 1ª parcela no ato da entrega..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 {canEditCommission && (
                    <div className="space-y-4 pt-4 border-t">
                        <FormLabel>Comissão do Vendedor</FormLabel>
                        <FormField
                        control={form.control}
                        name="commissionType"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                            <FormControl>
                                <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex items-center space-x-4"
                                >
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                    <RadioGroupItem value="percentage" />
                                    </FormControl>
                                    <FormLabel className="font-normal">Porcentagem (%)</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                    <RadioGroupItem value="fixed" />
                                    </FormControl>
                                    <FormLabel className="font-normal">Valor Fixo (R$)</FormLabel>
                                </FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                            control={form.control}
                            name="commissionValue"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Valor da Comissão</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input 
                                            type="number" 
                                            step="0.01" 
                                            placeholder="Ex: 5 para 5% ou 50 para R$50"
                                            {...field}
                                        />
                                        {commissionType === 'percentage' ? (
                                            <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                                        ) : (
                                            <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                                        )}
                                    </div>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                    </div>
                 )}
            </div>
        </div>

        <Button type="submit" size="lg" className="w-full">
          <PackagePlus className="mr-2 h-5 w-5" />
          {productToEdit ? 'Salvar Alterações' : 'Cadastrar Produto'}
        </Button>
      </form>
    </Form>
  );
}
