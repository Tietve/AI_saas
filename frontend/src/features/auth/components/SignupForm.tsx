import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthActions } from '../hooks/useAuthActions';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';

const signupSchema = z
  .object({
    fullname: z.string().min(2, 'Họ và tên phải có ít nhất 2 ký tự'),
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
    confirmPassword: z.string(),
    terms: z.boolean().refine((val) => val === true, {
      message: 'Bạn phải đồng ý với điều khoản',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu không khớp',
    path: ['confirmPassword'],
  });

type SignupFormData = z.infer<typeof signupSchema>;

export const SignupForm = () => {
  const { signup, isSignupLoading, signupError } = useAuthActions();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    try {
      await signup({
        name: data.fullname,
        email: data.email,
        password: data.password,
      });
    } catch (error) {
      console.error('Signup failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* API Error Display */}
      {signupError && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {(signupError as any)?.response?.data?.error ||
           (signupError instanceof Error ? signupError.message : 'Đăng ký thất bại')}
        </div>
      )}

      {/* Fullname Field */}
      <div>
        <label
          htmlFor="fullname"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Họ và tên
        </label>
        <input
          {...register('fullname')}
          type="text"
          id="fullname"
          placeholder="Nhập họ và tên của bạn"
          className={`w-full rounded-xl border px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 ${
            errors.fullname
              ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
              : 'border-gray-200 focus:border-[#1b5e20] focus:ring-[#1b5e20]/15'
          }`}
        />
        {errors.fullname && (
          <p className="mt-1 text-xs text-red-600">{errors.fullname.message}</p>
        )}
      </div>

      {/* Email Field */}
      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Email
        </label>
        <input
          {...register('email')}
          type="email"
          id="email"
          placeholder="Nhập email của bạn"
          className={`w-full rounded-xl border px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 ${
            errors.email
              ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
              : 'border-gray-200 focus:border-[#1b5e20] focus:ring-[#1b5e20]/15'
          }`}
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* Password Field */}
      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Mật khẩu
        </label>
        <input
          {...register('password')}
          type="password"
          id="password"
          placeholder="Tạo mật khẩu"
          className={`w-full rounded-xl border px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 ${
            errors.password
              ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
              : 'border-gray-200 focus:border-[#1b5e20] focus:ring-[#1b5e20]/15'
          }`}
        />
        {errors.password && (
          <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
        )}
      </div>

      {/* Confirm Password Field */}
      <div>
        <label
          htmlFor="confirmPassword"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Xác nhận mật khẩu
        </label>
        <input
          {...register('confirmPassword')}
          type="password"
          id="confirmPassword"
          placeholder="Nhập lại mật khẩu"
          className={`w-full rounded-xl border px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 ${
            errors.confirmPassword
              ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
              : 'border-gray-200 focus:border-[#1b5e20] focus:ring-[#1b5e20]/15'
          }`}
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
        )}
      </div>

      {/* Terms Checkbox */}
      <div>
        <div className="flex items-start gap-2">
          <input
            {...register('terms')}
            type="checkbox"
            id="terms"
            className="mt-1 h-4 w-4 cursor-pointer rounded border-gray-300 text-[#1b5e20] focus:ring-2 focus:ring-[#1b5e20]/15"
          />
          <label htmlFor="terms" className="cursor-pointer text-sm text-gray-600">
            Tôi đồng ý với{' '}
            <a href="#terms" className="font-medium text-[#1b5e20] hover:underline hover:text-[#0d4710]">
              Điều khoản sử dụng
            </a>{' '}
            và{' '}
            <a href="#privacy" className="font-medium text-[#1b5e20] hover:underline hover:text-[#0d4710]">
              Chính sách bảo mật
            </a>
          </label>
        </div>
        {errors.terms && (
          <p className="mt-1 text-xs text-red-600">{errors.terms.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSignupLoading}
        className="w-full rounded-xl bg-gradient-to-br from-[#1b5e20] to-[#0d4710] py-3.5 text-base font-bold tracking-wide text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#1b5e20]/50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSignupLoading ? 'Đang đăng ký...' : 'Đăng ký'}
      </button>

      {/* Login Link */}
      <div className="text-center text-sm text-gray-600">
        Đã có tài khoản?{' '}
        <Link
          to={ROUTES.LOGIN}
          className="font-semibold text-[#1b5e20] hover:underline hover:text-[#0d4710]"
        >
          Đăng nhập ngay
        </Link>
      </div>

      {/* Terms Text */}
      <p className="text-center text-xs leading-relaxed text-gray-500">
        Bằng việc đăng ký, bạn đã đồng ý với{' '}
        <a href="#terms" className="text-[#1b5e20] hover:underline hover:text-[#0d4710]">
          Điều khoản dịch vụ
        </a>{' '}
        và{' '}
        <a href="#privacy" className="text-[#1b5e20] hover:underline hover:text-[#0d4710]">
          Chính sách bảo mật
        </a>{' '}
        của chúng tôi.
      </p>
    </form>
  );
};
