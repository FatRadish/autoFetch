import {
  useGetAllTasks,
  ResPonseTask,
  useCreateTask,
  useDeleteTask,
  useGetTaskById,
  useUpdateTask,
} from '@/api/task';
import { useGetAllPlatforms, useGetPlatformTasks } from '@/api/platforms';
import { useGetAccountsByPlatformId } from '@/api/account';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
import { CronPicker } from '@/components/cron-picker';
import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n.ts';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export default function Account() {
  const [taskName, setTaskName] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [selectedPlatformId, setSelectedPlatformId] = useState('');
  const getAllTasks = useGetAllTasks({ taskName });
  const getAllPlatforms = useGetAllPlatforms();
  const getAllAccounts = useGetAccountsByPlatformId(selectedPlatformId);
  const createTask = useCreateTask();
  const deleteTask = useDeleteTask();
  const updateTask = useUpdateTask();
  const getPlatformTasks = useGetPlatformTasks(selectedPlatformId);
  const detailTask = useGetTaskById(selectedTaskId);

  const { t } = useTranslation();

  const columns: Column<ResPonseTask>[] = [
    { id: 'name', header: t('task.name'), accessor: 'name' },
    {
      id: 'platform',
      header: t('account.platformName'),
      cell: (r) => r.account.platform?.name ?? '-',
    },
    {
      id: 'accountName',
      header: t('account.accountName'),
      cell: (r) => r.account?.name ?? '-',
    },
    {
      id: 'nextRunAt',
      header: t('task.nextRun'),
      accessor: 'nextRunAt',
    },
    {
      id: 'lastRunAt',
      header: t('task.lastRun'),
      accessor: 'lastRunAt',
    },
  ];

  const TaskFormData = z.object({
    name: z.string().min(1, t('validation.required')),
    accountId: z.string().min(1, t('validation.required')),
    platformTaskId: z.string().min(1, t('validation.required')),
    platformId: z.string().min(1, t('validation.required')),
    schedule: z.string().min(1, t('validation.required')),
    id: z.string().optional(),
  });

  type TaskFormData = z.infer<typeof TaskFormData>;

  const form = useForm<TaskFormData>({
    resolver: zodResolver(TaskFormData),
    mode: 'onBlur',
    defaultValues: {
      name: '',
      accountId: '',
      platformTaskId: '',
      platformId: '',
      schedule: '',
      id: undefined,
    },
  });

  const onSubmit = async (data: TaskFormData) => {
    if (data.id) {
      updateTask.mutate(
        { id: data.id, data },
        {
          onSuccess: () => {
            form.reset();
            setOpen(false);
            setSelectedTaskId('');
          },
        }
      );
    } else {
      createTask.mutate(data, {
        onSuccess: () => {
          form.reset();
          setOpen(false);
          setSelectedTaskId('');
        },
      });
    }
  };

  const editColumns = (row: ResPonseTask) => {
    setOpen(true);
    setSelectedTaskId(row.id);
  };
  const addTask = () => {
    setSelectedTaskId('');
    form.reset({
      name: '',
      accountId: '',
      platformTaskId: '',
      platformId: '',
      schedule: '',
      id: undefined,
    });
    setOpen(true);
  };

  useEffect(() => {
    const detailData = detailTask.data;
    if (!detailData || detailData.id !== selectedTaskId) return;

    setSelectedPlatformId(detailData.account.platformId);
  }, [detailTask.data, selectedTaskId]);

  useEffect(() => {
    const detailData = detailTask.data;
    if (!detailData || detailData.id !== selectedTaskId) return;
    const reSetForm = async () => {
      form.reset({
        name: detailData.name,
        platformTaskId: detailData.platformTaskId,
        platformId: detailData.account.platformId,
        accountId: detailData.accountId,
        schedule: detailData.schedule,
        id: detailData.id,
      });
    };
    reSetForm();
  }, [getAllAccounts.data, getPlatformTasks.data]);

  return (
    <div className="p-4">
      <div className="flex justify-between mb-2">
        <Input
          placeholder={t('task.title')}
          value={taskName}
          onChange={(event) => setTaskName(event.target.value)}
          className="max-w-1/5"
        />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={addTask}>{t('task.createTask')}</Button>
          </DialogTrigger>
          <DialogContent
            aria-describedby={undefined}
            className="sm:max-w-4xl w-full"
          >
            <DialogTitle>
              {selectedTaskId ? t('task.editTask') : t('task.createTask')}
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
                        <FormLabel>{t('task.name')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('task.name')} {...field} />
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
                            onValueChange={(value) => {
                              setSelectedPlatformId(value);
                              field.onChange(value);
                            }}
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
                    name="platformTaskId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('account.platformTask')}</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            defaultValue={field.value}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue
                                placeholder={t('account.platformTask')}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectLabel>
                                  {t('account.platformTask')}
                                </SelectLabel>
                                {getPlatformTasks.data?.map((platform) => (
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
                    name="accountId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('account.accountName')}</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            defaultValue={field.value}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue
                                placeholder={t('account.accountName')}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectLabel>
                                  {t('account.accountName')}
                                </SelectLabel>
                                {getAllAccounts.data?.map((account) => (
                                  <SelectItem
                                    key={account.id}
                                    value={account.id}
                                  >
                                    {account.name}
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
                    name="schedule"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>schedule</FormLabel>
                        <FormControl>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline">
                                {t('task.cronExpression')} {field.value}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-10">
                              <div className="w-80">
                                <CronPicker
                                  value={field.value}
                                  onChange={field.onChange}
                                />
                              </div>
                            </PopoverContent>
                          </Popover>
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
                    disabled={createTask.isPending || updateTask.isPending}
                    type="submit"
                  >
                    {createTask.isPending || updateTask.isPending
                      ? t('common.loading')
                      : t('common.confirm')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      <MyTable<ResPonseTask>
        columns={columns}
        data={getAllTasks.data ?? []}
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
            onClick: (row) => deleteTask.mutate(row.id),
            variant: 'destructive',
            size: 'sm',
            loading: deleteTask.isPending,
          },
        ]}
      />
    </div>
  );
}
