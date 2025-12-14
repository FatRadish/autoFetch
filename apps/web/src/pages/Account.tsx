import { useAccounts, ResPonseAccount } from '@/api/account';
import MyTable, { Column } from '@/components/my-table';
import { useEffect } from 'react';

export default function Account() {
  const { getAllAccounts } = useAccounts();
  useEffect(() => {
    getAllAccounts.refetch();
    console.log(getAllAccounts.data);
  }, []);
  const columns: Column<ResPonseAccount>[] = [
    { id: 'name', header: '账号名称', accessor: 'name' },
    { id: 'platform', header: '平台', cell: (r) => r.platform?.name ?? '-' },
    { id: 'cookies', header: 'Cookie', accessor: 'cookies' },
    { id: 'platform', header: '平台', cell: (r) => r.platform?.name ?? '-' },
    { id: 'createdAt', header: '创建时间', accessor: 'createdAt' },
  ];

  return (
    <div>
      <MyTable<ResPonseAccount>
        caption="账户列表"
        columns={columns}
        data={getAllAccounts.data ?? []}
        pageSize={8}
        pagination
      />
    </div>
  );
}
