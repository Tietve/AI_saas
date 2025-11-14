import { LoginForm } from '@/features/auth/components/LoginForm';

export const LoginPage = () => {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#c8e6c9] to-[#a5d6a7]">
      {/* Animated Background Gradients */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_30%,rgba(27,94,32,0.25)_0%,transparent_50%),radial-gradient(ellipse_at_80%_70%,rgba(13,71,16,0.2)_0%,transparent_50%)]" />

      {/* Pine Trees */}
      {[
        { left: '5%', delay: '0s', duration: '18s' },
        { left: '20%', delay: '3s', duration: '20s' },
        { right: '20%', delay: '6s', duration: '22s' },
        { right: '5%', delay: '9s', duration: '19s' },
      ].map((tree, i) => (
        <div
          key={i}
          className="absolute bottom-0 animate-moveHorizontal"
          style={{
            ...('left' in tree ? { left: tree.left } : { right: tree.right }),
            animationDelay: tree.delay,
            animationDuration: tree.duration,
          }}
        >
          <div className="mx-auto h-0 w-0 border-b-[180px] border-l-[100px] border-r-[100px] border-b-[rgba(27,94,32,0.85)] border-l-transparent border-r-transparent" />
          <div className="mx-auto h-[60px] w-[25px] rounded-sm bg-[#5d4037]" />
        </div>
      ))}

      {/* Fog Effect - Light mist at bottom only */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[300px] animate-fogMove bg-gradient-to-t from-white/70 via-white/50 via-25% via-white/30 via-50% via-white/15 via-75% to-transparent" />

      {/* Falling Leaves */}
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="leaf absolute -top-12 h-3 w-3 animate-fall bg-[#1b5e20] opacity-70"
          style={{
            left: `${10 + i * 10}%`,
            animationDelay: `${i * 0.5}s`,
            animationDuration: `${8 + (i % 4)}s`,
            clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
          }}
        />
      ))}

      {/* Vietnamese Flag */}
      <div className="absolute right-5 top-5 z-50 flex h-10 w-[60px] items-center justify-center rounded-lg bg-[#da251d] shadow-md">
        <svg viewBox="0 0 24 24" fill="#ffcd00" className="h-6 w-6">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
      </div>

      {/* Login Container */}
      <div className="z-10 w-full max-w-[900px] rounded-3xl bg-white/97 p-12 shadow-2xl backdrop-blur-md">
        <div className="grid gap-12 md:grid-cols-2">
          {/* Left Section - Logo & Social Login */}
          <div className="flex flex-col justify-center">
            {/* Logo */}
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#a5d6a7]">
                <svg
                  viewBox="0 0 100 120"
                  fill="none"
                  className="h-10 w-10"
                >
                  <path
                    d="M50 15 L70 40 L30 40 Z"
                    fill="none"
                    stroke="#1b5e20"
                    strokeWidth="7"
                    strokeLinejoin="miter"
                  />
                  <path
                    d="M50 35 L70 60 L30 60 Z"
                    fill="none"
                    stroke="#1b5e20"
                    strokeWidth="7"
                    strokeLinejoin="miter"
                  />
                  <path
                    d="M50 55 L70 80 L30 80 Z"
                    fill="none"
                    stroke="#1b5e20"
                    strokeWidth="7"
                    strokeLinejoin="miter"
                  />
                  <rect x="45" y="80" width="10" height="20" fill="#1b5e20" />
                </svg>
              </div>
              <div className="font-display text-3xl font-bold tracking-tight text-[#1b5e20]">
                Fir Box
              </div>
            </div>

            <p className="mb-8 text-[15px] font-medium leading-relaxed text-gray-600">
              Chào mừng trở lại. Vui lòng đăng nhập để tiếp tục.
            </p>

            {/* Divider */}
            <div className="my-6 flex items-center text-sm text-gray-400">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="px-3">hoặc đăng nhập bằng</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            {/* Social Login Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-[#1877f2] transition-all hover:-translate-y-0.5 hover:border-[#1877f2] hover:bg-blue-50 hover:shadow-md"
                title="Đăng nhập bằng Facebook"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 flex-shrink-0">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>Facebook</span>
              </button>

              <button
                type="button"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-[#db4437] transition-all hover:-translate-y-0.5 hover:border-[#db4437] hover:bg-red-50 hover:shadow-md"
                title="Đăng nhập bằng Google"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 flex-shrink-0">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-[#0068ff] transition-all hover:-translate-y-0.5 hover:border-[#0068ff] hover:bg-blue-50 hover:shadow-md"
                title="Đăng nhập bằng Zalo"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 flex-shrink-0">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 5.523 4.477 10 10 10s10-4.477 10-10c0-5.523-4.477-10-10-10zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z" />
                  <path d="M14.5 8.5h-5c-.276 0-.5.224-.5.5v6c0 .276.224.5.5.5h5c.276 0 .5-.224.5-.5V9c0-.276-.224-.5-.5-.5zm-3.5 5v-3l2.5 1.5L11 13.5z" />
                </svg>
                <span>Zalo</span>
              </button>
            </div>
          </div>

          {/* Right Section - Login Form */}
          <div className="flex flex-col justify-center">
            <LoginForm />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fall {
          0% {
            top: -50px;
            transform: translateX(0) rotate(0deg);
          }
          100% {
            top: 100vh;
            transform: translateX(100px) rotate(360deg);
          }
        }

        @keyframes moveHorizontal {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(30px);
          }
        }

        @keyframes fogMove {
          0%, 100% {
            opacity: 0.8;
            transform: translateX(0);
          }
          50% {
            opacity: 1;
            transform: translateX(20px);
          }
        }

        .animate-fall {
          animation: fall linear infinite;
        }

        .animate-moveHorizontal {
          animation: moveHorizontal ease-in-out infinite;
        }

        .animate-fogMove {
          animation: fogMove 20s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
