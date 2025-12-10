import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from '@/lib/i18n.ts'
import { useLogin } from '@/api/login';


export function LoginCard() {
  const { t } = useTranslation()
  // 定义表单校验规则
  const loginSchema = z.object({
    username: z
      .string()
      .min(1, t('validation.required'))
      .min(3, t('validation.minLength', { min: 3 }))
      .max(20, t('validation.maxLength', { max: 20 })),
    password: z
      .string()
      .min(1, t('validation.required'))
      .min(6, t('validation.minLength', { min: 6 }))
      .max(50, t('validation.maxLength', { max: 50 })),
  });

  type LoginFormData = z.infer<typeof loginSchema>;
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const loginMutation = useLogin();

  const onSubmit = async (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <div className="flex items-center justify-center space-x-2">
          <img className="w-8 h-8" src="/public/autoFetch.svg" alt="AutoFetch Logo" />
          <CardTitle>{t('auth.login')}</CardTitle>
        </div>
        {/* <CardAction>
          <Button variant="link">Sign Up</Button>
        </CardAction> */}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.username')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('auth.username')} autoComplete="username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.password')}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={t('auth.password')}
                      autoComplete="current-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? t('auth.logging_in') : t('auth.login')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
