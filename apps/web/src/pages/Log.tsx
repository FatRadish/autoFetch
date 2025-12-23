import MyTable, { Column } from '@/components/my-table';
import { useGetAllLogs, ResPonseLog } from '@/api/log';
import { useTranslation } from '@/lib/i18n';
import { CircleX, CloudCheck, Loader } from 'lucide-react';

export default function Log({ taskId }: { taskId?: string }) {
  const { data, isLoading, error } = useGetAllLogs({ taskId });
  const { t } = useTranslation();

  let iconList = {
    success: <CloudCheck color="green" />,
    running: <Loader className="animate-spin" color="gray" />,
    failed: <CircleX color="red" />,
  };

  if (isLoading) {
    return <div>加载中...</div>;
  }
  const columns: Column<ResPonseLog>[] = [
    { id: 'message', header: t('log.message'), accessor: 'message' },
    {
      id: 'status',
      header: t('log.status'),
      accessor: 'status',
      component: (row) => {
        return (
          iconList[row.status] || (
            <span className="font-semibold">{row.status}</span>
          )
        );
      },
      width: '100px',
    },
    { id: 'startedAt', header: t('log.startTime'), accessor: 'startedAt' },
    { id: 'finishedAt', header: t('log.endTime'), accessor: 'finishedAt' },
  ];
  return (
    <MyTable<ResPonseLog>
      columns={columns}
      data={data ?? []}
      pageSize={8}
      pagination={true}
    ></MyTable>
  );
}
