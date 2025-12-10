/**
 * API Hooks 使用指南
 * 
 * 1. 创建查询 (GET 请求):
 * 
 *   export function useGetUsers() {
 *     return useQuery({
 *       queryKey: ['users'],
 *       queryFn: () => request.get('/users'),
 *     });
 *   }
 *   
 *   // 在组件中使用
 *   const { data, isLoading, error } = useGetUsers();
 * 
 * 
 * 2. 创建 Mutation (POST/PUT/DELETE 请求):
 * 
 *   export function useCreateUser() {
 *     const queryClient = useQueryClient();
 *     
 *     return useMutation({
 *       mutationFn: (data: CreateUserPayload) => request.post('/users', data),
 *       onSuccess: () => {
 *         // 重新获取用户列表
 *         queryClient.invalidateQueries({ queryKey: ['users'] });
 *       },
 *     });
 *   }
 *   
 *   // 在组件中使用
 *   const createUserMutation = useCreateUser();
 *   createUserMutation.mutate(userData, {
 *     onSuccess: () => console.log('创建成功'),
 *   });
 * 
 * 
 * 3. 带分页的查询:
 * 
 *   export function useGetUsersPaginated(page: number, pageSize: number) {
 *     return useQuery({
 *       queryKey: ['users', page, pageSize],
 *       queryFn: () => request.get('/users', { params: { page, pageSize } }),
 *     });
 *   }
 * 
 * 
 * 4. 禁用错误 Toast:
 * 
 *   export function useSomeRequest() {
 *     return useQuery({
 *       queryKey: ['some'],
 *       queryFn: () => request.get('/some'),
 *       meta: {
 *         hideErrorToast: true, // 不显示错误 toast
 *       },
 *     });
 *   }
 * 
 * 
 * 5. 带重试逻辑的 Mutation:
 * 
 *   export function useRetryMutation() {
 *     return useMutation({
 *       mutationFn: (data) => request.post('/endpoint', data),
 *       retry: 3, // 失败后重试 3 次
 *       retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
 *     });
 *   }
 */

export const API_HOOKS_GUIDE = 'API Hooks 使用指南已定义，请参考此文件中的注释';
