import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthActions } from '../hooks/useAuthActions';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import { useTranslation } from 'react-i18next';

type LoginFormData = {
  email: string;
  password: string;
};

export const LoginForm = () => {
  const { t } = useTranslation();
  const { login, isLoginLoading, loginError } = useAuthActions();

  const loginSchema = z.object({
    email: z.string().email(t('auth.validation.emailInvalid')),
    password: z.string().min(8, t('auth.validation.passwordMinLength')),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Email Field */}
      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-semibold tracking-tight text-gray-700"
        >
          {t('auth.login.email')}
        </label>
        <input
          {...register('email')}
          type="email"
          id="email"
          placeholder={t('auth.login.emailPlaceholder')}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-[15px] transition-all duration-200 placeholder:text-gray-400 focus:border-[#1b5e20] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#1b5e20]/15"
        />
        {errors.email && (
          <p className="mt-1.5 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* Password Field */}
      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-semibold tracking-tight text-gray-700"
        >
          {t('auth.login.password')}
        </label>
        <input
          {...register('password')}
          type="password"
          id="password"
          placeholder={t('auth.login.passwordPlaceholder')}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-[15px] transition-all duration-200 placeholder:text-gray-400 focus:border-[#1b5e20] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#1b5e20]/15"
        />
        {errors.password && (
          <p className="mt-1.5 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      {/* Links */}
      <div className="flex items-center justify-between text-sm">
        <Link
          to={ROUTES.FORGOT_PASSWORD}
          className="font-semibold text-[#1b5e20] hover:underline hover:text-[#0d4710]"
        >
          {t('auth.login.forgotPassword')}
        </Link>
        <Link
          to={ROUTES.SIGNUP}
          className="font-semibold text-[#1b5e20] hover:underline hover:text-[#0d4710]"
        >
          {t('auth.login.signup')}
        </Link>
      </div>

      {/* Error Message */}
      {loginError && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {(loginError as any)?.response?.data?.error || t('auth.login.loginError')}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoginLoading}
        className="w-full rounded-xl bg-gradient-to-br from-[#1b5e20] to-[#0d4710] py-3.5 text-base font-bold tracking-wide text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#1b5e20]/50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoginLoading ? t('auth.login.loggingIn') : t('auth.login.loginButton')}
      </button>

      {/* Terms */}
      <p className="text-center text-xs text-gray-400">
        {t('auth.login.termsPrefix')}{' '}
        <a href="#" className="text-[#1b5e20] hover:underline hover:text-[#0d4710]">
          {t('auth.login.terms')}
        </a>{' '}
        {t('auth.login.and')}{' '}
        <a href="#" className="text-[#1b5e20] hover:underline hover:text-[#0d4710]">
          {t('auth.login.privacy')}
        </a>
        {t('auth.login.termsSuffix')}
      </p>
    </form>
  );
};
