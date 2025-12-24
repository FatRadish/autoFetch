import {
  useGetAccountById,
  useUpdateAccount,
  useDeleteAccount,
  useGetAllAccounts,
  useCreateAccount,
  ResPonseAccount,
} from '@/api/account';
import { useGetAllPlatforms } from '@/api/platforms';
import MyTable, { Column } from '@/components/my-table';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n.ts';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export default function Account() {
  const [accountName, setAccountName] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const getAllAccounts = useGetAllAccounts({ accountName });
  const getAllPlatforms = useGetAllPlatforms();
  const createAccount = useCreateAccount();
  const deleteAccount = useDeleteAccount();
  const updateAccount = useUpdateAccount();
  const detailAccount = useGetAccountById(selectedAccountId);

  const { t } = useTranslation();

  const columns: Column<ResPonseAccount>[] = [
    { id: 'name', header: t('account.accountName'), accessor: 'name' },
    {
      id: 'platform',
      header: t('account.platformName'),
      cell: (r) => r.platform?.name ?? '-',
    },
    { id: 'userAgent', header: 'userAgent', accessor: 'userAgent' },
    {
      id: 'createdAt',
      header: t('table.common.createdAt'),
      accessor: 'createdAt',
    },
  ];

  const AccountFormData = z.object({
    name: z.string().min(1, t('validation.required')),
    platformId: z.string().min(1, t('validation.required')),
    cookies: z.string().min(1, t('validation.required')),
    userAgent: z.string().min(1, t('validation.required')),
    headers: z.string().optional(),
    refreshToken: z.string().optional(),
    id: z.string().optional(),
  });

  type AccountFormData = z.infer<typeof AccountFormData>;

  const form = useForm<AccountFormData>({
    resolver: zodResolver(AccountFormData),
    mode: 'onBlur',
    defaultValues: {
      name: '',
      platformId: '',
      cookies: '',
      userAgent: '',
      headers: '',
      refreshToken: '',
    },
  });

  const onSubmit = async (data: AccountFormData) => {
    const payload = {
      ...data,
      headers: JSON.parse(data.headers || '{}'),
    };

    if (data.id) {
      updateAccount.mutate(payload, {
        onSuccess: () => {
          form.reset();
          setOpen(false);
          setSelectedAccountId('');
        },
      });
    } else {
      createAccount.mutate(payload, {
        onSuccess: () => {
          form.reset();
          setOpen(false);
          setSelectedAccountId('');
        },
      });
    }
  };

  const editColumns = (row: ResPonseAccount) => {
    setOpen(true);
    setSelectedAccountId(row.id);
  };
  const addAccount = () => {
    setSelectedAccountId('');
    form.reset({
      name: '',
      platformId: '',
      cookies: '',
      userAgent: '',
      headers: '',
      id: undefined,
      refreshToken: '',
    });
    setOpen(true);
  };
  useEffect(() => {
    const detailData = detailAccount.data;
    if (!detailData || detailData.id !== selectedAccountId) return;
    form.reset({
      name: detailData.name,
      platformId: detailData.platform.id,
      cookies: detailData.cookies,
      userAgent: detailData.userAgent,
      refreshToken: detailData.refreshToken,
      headers:
        typeof detailData.headers === 'string'
          ? detailData.headers
          : JSON.stringify(detailData.headers ?? {}),
      id: detailData.id,
    });
  }, [detailAccount.data, selectedAccountId, form]);

  return (
    <div className="p-4">
      <div className="flex justify-between mb-2">
        <Input
          placeholder={t('form.account.accountName')}
          value={accountName}
          onChange={(event) => setAccountName(event.target.value)}
          className="max-w-1/5"
        />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={addAccount}>{t('account.addAccount')}</Button>
          </DialogTrigger>
          <DialogContent
            aria-describedby={undefined}
            className="sm:max-w-4xl w-full"
          >
            <DialogTitle>
              {selectedAccountId
                ? t('account.editAccount')
                : t('account.addAccount')}
            </DialogTitle>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="mt-4 space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('account.accountName')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('account.accountName')}
                            {...field}
                          />
                        </FormControl>
                        <div className="min-h-5">
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="platformId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('account.platformName')}</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            defaultValue={field.value}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue
                                placeholder={t('account.platformName')}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectLabel>
                                  {t('account.platformName')}
                                </SelectLabel>
                                {getAllPlatforms.data?.map((platform) => (
                                  <SelectItem
                                    key={platform.id}
                                    value={platform.id}
                                  >
                                    {platform.name}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <div className="min-h-5">
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="userAgent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>userAgent</FormLabel>
                        <FormControl>
                          <Input placeholder="userAgent" {...field} />
                        </FormControl>
                        <div className="min-h-5">
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                  {/* <FormField
                    control={form.control}
                    name="proxy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>proxy</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='proxy'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  /> */}
                  <FormField
                    control={form.control}
                    name="headers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>headers</FormLabel>
                        <FormControl>
                          <Input placeholder="headers" {...field} />
                        </FormControl>
                        <div className="min-h-5">
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cookies"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Cookies</FormLabel>
                        <FormControl>
                          <Input placeholder="Cookies" {...field} />
                        </FormControl>
                        <div className="min-h-5">
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="refreshToken"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Refresh Token</FormLabel>
                        <FormControl>
                          <Input placeholder="Refresh Token" {...field} />
                        </FormControl>
                        <div className="min-h-5">
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter className="pt-2">
                  <DialogClose asChild>
                    <Button variant="outline">{t('common.cancel')}</Button>
                  </DialogClose>
                  <Button
                    disabled={
                      createAccount.isPending || updateAccount.isPending
                    }
                    type="submit"
                  >
                    {createAccount.isPending || updateAccount.isPending
                      ? t('common.loading')
                      : t('common.confirm')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      <MyTable<ResPonseAccount>
        columns={columns}
        data={getAllAccounts.data ?? []}
        pageSize={8}
        pagination
        actions={[
          {
            label: t('form.btn.edit'),
            onClick: (row) => editColumns(row),
            variant: 'outline',
            size: 'sm',
            loading: false,
          },
          {
            label: t('form.btn.delete'),
            onClick: (row) => deleteAccount.mutate(row.id),
            variant: 'destructive',
            size: 'sm',
            loading: deleteAccount.isPending,
          },
        ]}
      />
    </div>
  );
}
