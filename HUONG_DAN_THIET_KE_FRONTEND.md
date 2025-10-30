# 🎨 HƯỚNG DẪN THIẾT KẾ FRONTEND - AI SAAS CHAT PLATFORM

**Ngày tạo**: 30 tháng 10, 2025
**Mục đích**: Hướng dẫn thiết kế đầy đủ tất cả các trang frontend kết nối với backend microservices
**Tổng số trang**: 12 trang
**Backend API Gateway**: `http://localhost:4000/api`

---

## 📋 MỤC LỤC

### Phần 1: Trang Công Khai (3 trang)
1. [Landing Page - Trang Chủ](#1-landing-page---trang-chủ)
2. [Pricing Page - Bảng Giá](#2-pricing-page---bảng-giá)
3. [About/FAQ Page - Giới Thiệu](#3-aboutfaq-page---giới-thiệu)

### Phần 2: Xác Thực (5 trang)
4. [Sign Up Page - Đăng Ký](#4-sign-up-page---đăng-ký)
5. [Sign In Page - Đăng Nhập](#5-sign-in-page---đăng-nhập)
6. [Verify Email Page - Xác Thực Email](#6-verify-email-page---xác-thực-email)
7. [Forgot Password Page - Quên Mật Khẩu](#7-forgot-password-page---quên-mật-khẩu)
8. [Reset Password Page - Đặt Lại Mật Khẩu](#8-reset-password-page---đặt-lại-mật-khẩu)

### Phần 3: Ứng Dụng Chính (4 trang)
9. [Chat Page - Trang Chat Chính](#9-chat-page---trang-chat-chính)
10. [Settings Page - Cài Đặt](#10-settings-page---cài-đặt)
11. [Billing Page - Thanh Toán & Đăng Ký](#11-billing-page---thanh-toán--đăng-ký)
12. [Admin Dashboard - Bảng Điều Khiển Admin](#12-admin-dashboard---bảng-điều-khiển-admin)

---

## 🎯 TỔNG QUAN HỆ THỐNG

### Luồng Người Dùng Chính

```
Landing Page → Sign Up → Verify Email → Sign In → Chat Page
                                          ↓
                                    Settings / Billing
```

### Công Nghệ Khuyến Nghị

- **Framework**: Next.js 14 (App Router) hoặc React + Vite
- **Styling**: TailwindCSS + Shadcn/ui
- **State Management**: Zustand hoặc React Context
- **HTTP Client**: Axios hoặc Fetch API
- **Form**: React Hook Form + Zod
- **Notifications**: React Hot Toast
- **Icons**: Lucide React
- **Markdown**: React Markdown
- **Date**: date-fns

---

# PHẦN 1: TRANG CÔNG KHAI

---

## 1. Landing Page - Trang Chủ

### 📝 Mô Tả
Trang đầu tiên người dùng thấy khi truy cập website. Giới thiệu sản phẩm và thu hút người dùng đăng ký.

### 🎨 Prompt Thiết Kế

```
Thiết kế trang Landing Page cho nền tảng AI Chat SaaS với các phần sau:

HEADER:
- Logo "AI Chat Platform" bên trái
- Menu: Home, Pricing, About, Sign In (nút sáng), Sign Up (nút đậm)
- Responsive hamburger menu cho mobile

HERO SECTION:
- Tiêu đề lớn: "Chat với AI thông minh, tăng năng suất gấp 10 lần"
- Mô tả ngắn: "Tích hợp GPT-4, Claude, Gemini trong một nền tảng. Bắt đầu miễn phí ngay hôm nay."
- 2 nút CTA: "Bắt đầu miễn phí" (primary), "Xem bảng giá" (secondary)
- Hình ảnh minh họa: Screenshot của giao diện chat hoặc illustration

FEATURES SECTION (3 cột):
1. "Nhiều AI Models"
   - Icon: Sparkles
   - Mô tả: GPT-4, Claude 3.5, Gemini Pro
2. "Quản lý Conversations"
   - Icon: MessageSquare
   - Mô tả: Tổ chức theo dự án, tìm kiếm nhanh
3. "Giá cả hợp lý"
   - Icon: DollarSign
   - Mô tả: Gói miễn phí, Pro, Enterprise

PRICING PREVIEW:
- 3 thẻ giá ngắn gọn (Free, Pro, Enterprise)
- Giá và tính năng chính
- Nút "Xem chi tiết" link đến /pricing

TESTIMONIALS (Optional):
- 2-3 testimonials từ người dùng
- Avatar, tên, công ty, quote

CTA SECTION:
- Tiêu đề: "Sẵn sàng bắt đầu?"
- Nút "Đăng ký miễn phí"

FOOTER:
- Links: About, Pricing, Terms, Privacy, Contact
- Social media icons
- Copyright

MÀU SẮC:
- Primary: Blue (#3B82F6)
- Secondary: Purple (#8B5CF6)
- Background: White/Light gray
- Dark mode support

ANIMATIONS:
- Fade in on scroll
- Hover effects trên buttons
- Smooth scroll giữa các sections
```

### 🔌 API Endpoints Cần Gọi
- **Không có** (trang tĩnh, không cần auth)
- (Optional) `GET /api/billing/plans` - Nếu muốn hiển thị giá động

### 📱 Components Cần Tạo
- `Header.tsx` - Navigation bar
- `HeroSection.tsx` - Hero với CTA
- `FeaturesGrid.tsx` - Grid 3 tính năng
- `PricingPreview.tsx` - Preview 3 gói giá
- `CTASection.tsx` - Call to action cuối trang
- `Footer.tsx` - Footer

### ✅ Checklist
- [ ] Responsive trên mobile, tablet, desktop
- [ ] Dark mode support
- [ ] SEO meta tags
- [ ] Page load speed < 2s
- [ ] Accessibility (WCAG AA)

---

## 2. Pricing Page - Bảng Giá

### 📝 Mô Tả
Hiển thị chi tiết các gói đăng ký với giá và tính năng đầy đủ.

### 🎨 Prompt Thiết Kế

```
Thiết kế trang Pricing cho AI Chat SaaS:

HEADER:
- Tiêu đề: "Chọn gói phù hợp với bạn"
- Mô tả: "Bắt đầu miễn phí, nâng cấp bất cứ lúc nào"
- Toggle: "Monthly" / "Yearly" (save 20%)

PRICING CARDS (3 thẻ ngang):

1. FREE PLAN (Trái):
   - Badge: "Popular"
   - Giá: $0/tháng
   - Mô tả: "Cho cá nhân và thử nghiệm"
   - Tính năng:
     ✓ 10,000 tokens/tháng
     ✓ GPT-3.5 Turbo
     ✓ 5 conversations
     ✓ Hỗ trợ email
     ✓ 24h response time
   - Nút: "Bắt đầu miễn phí" (outline)

2. PRO PLAN (Giữa - Highlight):
   - Badge: "Best Value"
   - Giá: $29.99/tháng ($24.99/tháng nếu yearly)
   - Mô tả: "Cho chuyên gia và đội nhỏ"
   - Tính năng:
     ✓ 100,000 tokens/tháng
     ✓ GPT-4, Claude 3.5, Gemini Pro
     ✓ Unlimited conversations
     ✓ Projects & organization
     ✓ Priority support
     ✓ Export conversations
     ✓ Advanced analytics
   - Nút: "Nâng cấp ngay" (primary, lớn hơn)
   - Viền đậm, shadow lớn

3. ENTERPRISE PLAN (Phải):
   - Badge: "Custom"
   - Giá: $99.99/tháng
   - Mô tả: "Cho doanh nghiệp và team lớn"
   - Tính năng:
     ✓ 500,000 tokens/tháng
     ✓ Tất cả AI models
     ✓ Custom integrations
     ✓ Team collaboration
     ✓ API access
     ✓ 24/7 dedicated support
     ✓ SLA guarantee
     ✓ Custom training
   - Nút: "Liên hệ Sales"

COMPARISON TABLE (Bảng so sánh chi tiết):
- Header: Features, Free, Pro, Enterprise
- Rows:
  - Tokens/tháng
  - AI Models
  - Conversations
  - Projects
  - Support
  - Response time
  - Export
  - Analytics
  - API access
  - Team features
  - SLA
- Checkmarks/X marks cho từng ô

FAQ SECTION:
- 5-6 câu hỏi thường gặp về billing:
  1. "Tôi có thể hủy bất cứ lúc nào không?"
  2. "Token là gì?"
  3. "Tôi có thể nâng cấp/hạ cấp không?"
  4. "Có hoàn tiền không?"
  5. "Tính phí như thế nào?"

CTA BOTTOM:
- "Bắt đầu với gói miễn phí ngay hôm nay"
- Nút "Sign Up"

TRUST SIGNALS:
- Icons: Shield (bảo mật), Lock (privacy), CheckCircle (no commitment)

MÀU SẮC:
- Pro plan highlight: Gradient blue-purple
- Checkmarks: Green
- X marks: Gray
```

### 🔌 API Endpoints Cần Gọi
```javascript
// Lấy danh sách gói (optional, có thể hardcode)
GET /api/billing/plans
Response: {
  plans: [
    {
      id: "free",
      name: "Free Plan",
      price: 0,
      tokensIncluded: 10000,
      features: [...]
    }
  ]
}
```

### 📱 Components Cần Tạo
- `PricingHeader.tsx` - Header với toggle monthly/yearly
- `PricingCard.tsx` - Card cho mỗi gói (reusable)
- `ComparisonTable.tsx` - Bảng so sánh chi tiết
- `PricingFAQ.tsx` - FAQ accordion
- `CTASection.tsx` - CTA cuối

### ✅ Checklist
- [ ] Toggle monthly/yearly hoạt động
- [ ] Highlight Pro plan
- [ ] Responsive table trên mobile
- [ ] Smooth animations
- [ ] Link đến /signup với plan parameter

---

## 3. About/FAQ Page - Giới Thiệu

### 📝 Mô Tả
Trang giới thiệu về sản phẩm và FAQ tổng quát.

### 🎨 Prompt Thiết Kế

```
Thiết kế trang About/FAQ đơn giản:

HERO:
- Tiêu đề: "Về AI Chat Platform"
- Mô tả ngắn về mission và vision

ABOUT SECTION:
- Story: Tại sao tạo platform này
- Team: Ảnh và tên founders (optional)
- Values: 3 giá trị cốt lõi

FAQ SECTION (Accordion):
1. General
   - Platform là gì?
   - AI models nào được hỗ trợ?
   - Bảo mật như thế nào?
2. Pricing
   - Giá cả?
   - Có trial không?
   - Hoàn tiền?
3. Technical
   - API có không?
   - Tích hợp?
   - Uptime?
4. Support
   - Liên hệ như thế nào?
   - Response time?

CONTACT:
- Email: support@example.com
- Form liên hệ đơn giản

CTA:
- "Sẵn sàng bắt đầu?"
- Nút "Sign Up"
```

### 🔌 API Endpoints Cần Gọi
- **Không có** (trang tĩnh)

### 📱 Components Cần Tạo
- `AboutHero.tsx`
- `FAQAccordion.tsx`
- `ContactForm.tsx`

### ✅ Checklist
- [ ] Accordion mở/đóng smooth
- [ ] Contact form validation
- [ ] Responsive

---

# PHẦN 2: XÁC THỰC

---

## 4. Sign Up Page - Đăng Ký

### 📝 Mô Tả
Form đăng ký tài khoản mới. Gửi email verification sau khi đăng ký thành công.

### 🎨 Prompt Thiết Kế

```
Thiết kế trang Sign Up đơn giản và chuyên nghiệp:

LAYOUT:
- Split screen: Trái form, phải illustration/benefits
- Mobile: Full width form

LEFT SIDE - FORM:
- Logo và link về home
- Tiêu đề: "Tạo tài khoản miễn phí"
- Mô tả: "Không cần thẻ tín dụng. Bắt đầu với 10,000 tokens."

FORM FIELDS:
1. Full Name
   - Icon: User
   - Placeholder: "Nguyễn Văn A"
   - Required
   - Min 2 characters

2. Email
   - Icon: Mail
   - Placeholder: "email@example.com"
   - Required
   - Email validation
   - Check email format

3. Password
   - Icon: Lock
   - Placeholder: "Mật khẩu (tối thiểu 8 ký tự)"
   - Required
   - Toggle show/hide password (Eye icon)
   - Strength indicator: Weak/Medium/Strong
   - Requirements:
     • Tối thiểu 8 ký tự
     • Ít nhất 1 chữ hoa
     • Ít nhất 1 số
     • Ít nhất 1 ký tự đặc biệt

4. Confirm Password
   - Icon: Lock
   - Placeholder: "Nhập lại mật khẩu"
   - Required
   - Must match password

5. Checkbox: "Tôi đồng ý với Terms of Service và Privacy Policy"
   - Required
   - Links mở trong modal hoặc tab mới

SUBMIT BUTTON:
- Text: "Tạo tài khoản"
- Full width
- Primary color
- Loading spinner khi đang submit
- Disabled nếu form invalid

DIVIDER:
- "hoặc" với lines hai bên

SOCIAL SIGN UP (Optional):
- Nút "Continue with Google" (white với logo)
- Nút "Continue with GitHub"

FOOTER:
- Text: "Đã có tài khoản?"
- Link: "Đăng nhập" (đậm, màu primary)

RIGHT SIDE - BENEFITS:
- Gradient background
- Icon + Text cho 3 benefits:
  1. "10,000 tokens miễn phí"
  2. "Không cần thẻ tín dụng"
  3. "Bắt đầu trong 1 phút"
- Testimonial quote (optional)

ERROR HANDLING:
- Show errors dưới mỗi field
- Email đã tồn tại: "Email này đã được đăng ký"
- Network error: Toast notification top-right
- Rate limit: "Quá nhiều yêu cầu, vui lòng thử lại sau"

SUCCESS:
- Redirect đến /verify-email page
- Hoặc show modal: "Kiểm tra email để xác thực tài khoản"

VALIDATION:
- Real-time validation khi blur field
- Show checkmarks khi field valid
- Show X marks khi field invalid
```

### 🔌 API Endpoints Cần Gọi

```javascript
// Đăng ký
POST /api/auth/signup
Request: {
  email: string,
  password: string,
  name: string
}
Response: {
  message: "Đăng ký thành công. Vui lòng kiểm tra email.",
  userId: string
}
Errors:
- 400: Invalid email/password
- 409: Email already exists
- 429: Too many requests
```

### 📱 Components Cần Tạo
- `SignUpForm.tsx` - Form chính
- `PasswordStrengthIndicator.tsx` - Thanh hiển thị độ mạnh mật khẩu
- `FormInput.tsx` - Input component reusable
- `SocialButton.tsx` - Button cho social login
- `BenefitsPanel.tsx` - Panel bên phải

### 🔄 User Flow
1. User nhập thông tin → Validate real-time
2. Click "Tạo tài khoản" → Loading spinner
3. API call thành công → Redirect đến /verify-email
4. API call thất bại → Hiện error message

### ✅ Checklist
- [ ] Real-time validation
- [ ] Password strength indicator
- [ ] Toggle show/hide password
- [ ] Error messages rõ ràng
- [ ] Loading states
- [ ] Responsive mobile
- [ ] Keyboard accessibility (Enter to submit)
- [ ] Focus management

---

## 5. Sign In Page - Đăng Nhập

### 📝 Mô Tả
Form đăng nhập. Redirect đến chat page sau khi thành công.

### 🎨 Prompt Thiết Kế

```
Thiết kế trang Sign In tương tự Sign Up nhưng đơn giản hơn:

LAYOUT:
- Split screen: Trái form, phải branding/illustration
- Center alignment cho form

LEFT SIDE - FORM:
- Logo và link về home
- Tiêu đề: "Chào mừng trở lại"
- Mô tả: "Đăng nhập để tiếp tục chat với AI"

FORM FIELDS:
1. Email
   - Icon: Mail
   - Placeholder: "email@example.com"
   - Required
   - Auto-focus khi load trang
   - Remember last email (localStorage optional)

2. Password
   - Icon: Lock
   - Placeholder: "Mật khẩu"
   - Required
   - Toggle show/hide
   - Link "Quên mật khẩu?" bên phải label

3. Checkbox: "Ghi nhớ đăng nhập" (Remember me)
   - Optional
   - Lưu session lâu hơn (30 days)

SUBMIT BUTTON:
- Text: "Đăng nhập"
- Full width
- Loading spinner khi đang submit

DIVIDER:
- "hoặc"

SOCIAL SIGN IN (Optional):
- "Continue with Google"
- "Continue with GitHub"

FOOTER:
- Text: "Chưa có tài khoản?"
- Link: "Đăng ký miễn phí"

RIGHT SIDE:
- Branding: Logo lớn
- Tagline: "Chat thông minh với AI"
- Rotating quotes/benefits

ERROR HANDLING:
- Sai email/password: "Email hoặc mật khẩu không đúng"
- Email chưa verify: "Vui lòng xác thực email trước khi đăng nhập"
  → Show link "Gửi lại email xác thực"
- Account locked: "Tài khoản đã bị khóa do quá nhiều lần đăng nhập sai"
- Network error: Toast notification

SUCCESS:
- Save session cookie
- Redirect đến /chat
- Optional: Show loading screen "Đang tải..."

FORGOT PASSWORD:
- Link rõ ràng
- Hover effect
```

### 🔌 API Endpoints Cần Gọi

```javascript
// Đăng nhập
POST /api/auth/signin
Request: {
  email: string,
  password: string
}
Response: {
  message: "Đăng nhập thành công",
  user: {
    id: string,
    email: string,
    name: string,
    isVerified: boolean,
    role: string
  }
}
// Session cookie tự động lưu bởi browser
Errors:
- 400: Missing email/password
- 401: Invalid credentials
- 403: Email not verified
- 429: Too many attempts
```

### 📱 Components Cần Tạo
- `SignInForm.tsx` - Form đăng nhập
- `FormInput.tsx` - Reuse từ Sign Up
- `SocialButton.tsx` - Reuse
- `BrandingPanel.tsx` - Panel bên phải

### 🔄 User Flow
1. User nhập email/password → Validate
2. Click "Đăng nhập" → Loading
3. Success → Save session → Redirect /chat
4. Fail → Show error → User có thể retry

### ✅ Checklist
- [ ] Auto-focus email field
- [ ] Remember me checkbox
- [ ] Clear error messages
- [ ] Rate limiting protection
- [ ] Redirect after login
- [ ] Handle unverified email
- [ ] Loading states
- [ ] Keyboard shortcuts

---

## 6. Verify Email Page - Xác Thực Email

### 📝 Mô Tả
Trang xác nhận sau khi user đăng ký. Hướng dẫn kiểm tra email.

### 🎨 Prompt Thiết Kế

```
Thiết kế trang Verify Email đơn giản:

LAYOUT:
- Center card trên background gradient
- Max width 500px
- Padding 40px

CONTENT:
- Icon: MailCheck (lớn, màu primary)
- Tiêu đề: "Kiểm tra email của bạn"
- Email address: "email@example.com" (bold, từ state/URL)
- Mô tả: "Chúng tôi đã gửi link xác thực đến email của bạn. Vui lòng kiểm tra hộp thư (và spam) để xác thực tài khoản."

INSTRUCTIONS (Steps):
1. Mở email từ "AI Chat Platform"
2. Click vào link xác thực
3. Bạn sẽ được chuyển về trang đăng nhập

RESEND SECTION:
- Text: "Không nhận được email?"
- Button: "Gửi lại email xác thực"
  - Secondary style
  - Countdown timer: Có thể gửi lại sau 60s
  - Loading spinner khi đang gửi
  - Success message: "Đã gửi lại email"

FOOTER:
- Link: "Về trang đăng nhập"
- Link: "Thay đổi email" (redirect về signup với email pre-filled)

AUTO-CHECK (Optional):
- Poll API mỗi 5s để check xem đã verify chưa
- Nếu verified → Auto redirect /signin với success toast

ILLUSTRATION:
- Email inbox illustration
- Hoặc animation email flying
```

### 🔌 API Endpoints Cần Gọi

```javascript
// Gửi lại email xác thực
POST /api/auth/resend-verification
Request: {
  email: string
}
Response: {
  message: "Email xác thực đã được gửi"
}
Errors:
- 429: Too many requests (3 per hour)

// Check verification status (optional)
GET /api/auth/me
Response: {
  user: {
    isVerified: boolean
  }
}
```

### 📱 Components Cần Tạo
- `VerifyEmailPage.tsx` - Trang chính
- `ResendButton.tsx` - Button với countdown
- `EmailIllustration.tsx` - SVG illustration

### 🔄 User Flow
1. User đăng ký thành công → Redirect đến trang này
2. User check email → Click link trong email
3. Link redirect về `/verify-email-confirm?token=xxx`
4. Page đó gọi API → Success → Redirect /signin

### ✅ Checklist
- [ ] Hiển thị email đã đăng ký
- [ ] Countdown timer cho resend
- [ ] Rate limiting cho resend
- [ ] Success/error messages
- [ ] Link về sign in

---

## 7. Forgot Password Page - Quên Mật Khẩu

### 📝 Mô Tả
Form yêu cầu reset password. Gửi email có link reset.

### 🎨 Prompt Thiết Kế

```
Thiết kế trang Forgot Password đơn giản:

LAYOUT:
- Center card
- Max width 450px

CONTENT:
- Icon: KeyRound (màu primary)
- Tiêu đề: "Quên mật khẩu?"
- Mô tả: "Nhập email đã đăng ký, chúng tôi sẽ gửi link đặt lại mật khẩu."

FORM:
- Email field
  - Icon: Mail
  - Placeholder: "email@example.com"
  - Required
  - Email validation

SUBMIT BUTTON:
- Text: "Gửi link đặt lại mật khẩu"
- Full width
- Loading state

SUCCESS STATE:
- Thay toàn bộ form bằng:
  - Icon: CheckCircle (green)
  - Tiêu đề: "Email đã được gửi"
  - Mô tả: "Kiểm tra email và click vào link để đặt lại mật khẩu."
  - Countdown: "Có thể gửi lại sau 60s"
  - Button: "Gửi lại email"
  - Link: "Về trang đăng nhập"

ERROR HANDLING:
- Email không tồn tại: "Không tìm thấy tài khoản với email này"
- Rate limit: "Quá nhiều yêu cầu, vui lòng thử lại sau 1 giờ"

FOOTER:
- Link: "Về trang đăng nhập"
- Link: "Đăng ký tài khoản mới"
```

### 🔌 API Endpoints Cần Gọi

```javascript
// Yêu cầu reset password
POST /api/auth/forgot-password
Request: {
  email: string
}
Response: {
  message: "Email đặt lại mật khẩu đã được gửi"
}
Errors:
- 404: Email không tồn tại (nhưng vẫn trả 200 để security)
- 429: Too many requests (3 per hour)
```

### 📱 Components Cần Tạo
- `ForgotPasswordForm.tsx`
- `SuccessMessage.tsx` - Component hiện sau khi gửi thành công

### 🔄 User Flow
1. User click "Quên mật khẩu" từ sign in
2. Nhập email → Submit
3. API gửi email → Show success message
4. User check email → Click link
5. Redirect đến /reset-password?token=xxx

### ✅ Checklist
- [ ] Email validation
- [ ] Success state
- [ ] Error handling
- [ ] Countdown timer
- [ ] Links navigation
- [ ] Loading states

---

## 8. Reset Password Page - Đặt Lại Mật Khẩu

### 📝 Mô Tả
Form đặt mật khẩu mới với token từ email.

### 🎨 Prompt Thiết Kế

```
Thiết kế trang Reset Password:

LAYOUT:
- Center card
- Max width 450px

TOKEN VALIDATION:
- Khi page load, check token từ URL
- Nếu token invalid/expired:
  - Icon: XCircle (red)
  - Tiêu đề: "Link không hợp lệ"
  - Mô tả: "Link đặt lại mật khẩu đã hết hạn hoặc không hợp lệ."
  - Button: "Yêu cầu link mới" → redirect /forgot-password

FORM (nếu token valid):
- Icon: Lock
- Tiêu đề: "Tạo mật khẩu mới"
- Mô tả: "Nhập mật khẩu mới cho tài khoản của bạn."

FORM FIELDS:
1. New Password
   - Icon: Lock
   - Placeholder: "Mật khẩu mới"
   - Required
   - Toggle show/hide
   - Password strength indicator
   - Requirements list:
     • Tối thiểu 8 ký tự
     • Ít nhất 1 chữ hoa
     • Ít nhất 1 số
     • Ít nhất 1 ký tự đặc biệt

2. Confirm New Password
   - Icon: Lock
   - Placeholder: "Nhập lại mật khẩu"
   - Required
   - Must match new password

SUBMIT BUTTON:
- Text: "Đặt lại mật khẩu"
- Full width
- Loading state
- Disabled nếu passwords không match

SUCCESS STATE:
- Icon: CheckCircle (green)
- Tiêu đề: "Mật khẩu đã được đặt lại"
- Mô tả: "Bạn có thể đăng nhập với mật khẩu mới."
- Button: "Đăng nhập ngay" → redirect /signin
- Auto redirect sau 3 giây

ERROR HANDLING:
- Token expired: "Link đã hết hạn"
- Weak password: "Mật khẩu không đủ mạnh"
- Network error: Toast notification
```

### 🔌 API Endpoints Cần Gọi

```javascript
// Đặt lại mật khẩu
POST /api/auth/reset-password
Request: {
  token: string,  // Từ URL query parameter
  newPassword: string
}
Response: {
  message: "Đặt lại mật khẩu thành công"
}
Errors:
- 400: Invalid/expired token hoặc weak password
- 404: User not found
```

### 📱 Components Cần Tạo
- `ResetPasswordForm.tsx`
- `PasswordStrengthIndicator.tsx` - Reuse
- `TokenValidator.tsx` - Component check token validity

### 🔄 User Flow
1. User click link trong email → Redirect /reset-password?token=xxx
2. Page load → Validate token
3. Token valid → Show form
4. User nhập password mới → Submit
5. Success → Show success → Redirect /signin

### ✅ Checklist
- [ ] Token validation on load
- [ ] Password strength indicator
- [ ] Password match validation
- [ ] Success state với auto redirect
- [ ] Error handling cho expired token
- [ ] Loading states

---

# PHẦN 3: ỨNG DỤNG CHÍNH

---

## 9. Chat Page - Trang Chat Chính

### 📝 Mô Tả
Trang chính của ứng dụng. Giao diện chat với AI, quản lý conversations.

### 🎨 Prompt Thiết Kế

```
Thiết kế trang Chat với layout 3 cột (responsive):

=== LAYOUT TỔNG THỂ ===

Desktop: [Sidebar] [Chat Area] [Settings Panel (optional)]
Mobile: Hamburger menu → Sidebar overlay, full-width chat

=== SIDEBAR (Trái - 280px) ===

HEADER:
- Logo + App name
- Nút "New Chat" (primary, full width)
  - Icon: Plus
  - Click → Clear current chat → Start new

USER SECTION:
- Avatar (circle)
- Name + Email (truncate)
- Dropdown menu:
  - Settings
  - Billing
  - Sign Out

CONVERSATIONS LIST:
- Search bar:
  - Icon: Search
  - Placeholder: "Tìm kiếm conversations..."
  - Filter theo title/content

- Group theo thời gian:
  - Today
  - Yesterday
  - Last 7 days
  - Last 30 days
  - Older

- Mỗi conversation item:
  - Icon: MessageSquare
  - Title (1 line, ellipsis)
  - Last message preview (1 line, gray)
  - Timestamp (right, small)
  - Hover → Show actions:
    • Rename (Edit icon)
    • Pin (Pin icon)
    • Delete (Trash icon)
  - Active conversation: Highlight background

- Pinned conversations:
  - Section riêng ở trên
  - Badge "Pinned"

FOOTER (Sidebar):
- Token usage bar:
  - "25,000 / 100,000 tokens used"
  - Progress bar
  - Link "Upgrade plan"
- Settings icon
- Theme toggle (Sun/Moon)

=== CHAT AREA (Giữa - Flex 1) ===

HEADER:
- Conversation title (editable on click)
- Metadata:
  - AI Provider badge (GPT-4, Claude, etc.)
  - Message count
- Actions (right):
  - Export (Download icon)
    - Dropdown: PDF, Markdown, JSON
  - Clear chat (Trash icon)
  - Settings (Gear icon)
- Mobile: Hamburger menu (mở sidebar)

MESSAGES CONTAINER:
- Scroll container
- Padding: 20px

Message Structure:
1. USER MESSAGE:
   - Avatar (right)
   - Name (right, above message)
   - Message bubble:
     - Background: Primary color (light)
     - Border-radius: 12px
     - Padding: 12px 16px
     - Max-width: 70%
     - Align right
   - Timestamp (small, below)
   - Actions (hover):
     • Copy
     • Edit (optional)
     • Delete

2. AI MESSAGE:
   - Avatar (left, AI logo)
   - Model name (left, above)
   - Message bubble:
     - Background: Gray/white
     - Border-radius: 12px
     - Padding: 12px 16px
     - Max-width: 70%
     - Align left
   - Markdown rendering:
     • Headings
     • Lists
     • Code blocks (with syntax highlighting)
     • Tables
     • Links
   - Timestamp
   - Actions (hover):
     • Copy (Copy icon)
     • Regenerate (RefreshCw icon)
     • Feedback (ThumbsUp/Down icons)
   - Token count badge: "245 tokens"

EMPTY STATE (no messages):
- Icon: Sparkles (large)
- Heading: "Bắt đầu cuộc trò chuyện mới"
- Suggestions (4 cards):
  1. "Giải thích code này..."
  2. "Viết email chuyên nghiệp..."
  3. "Tóm tắt văn bản..."
  4. "Brainstorm ideas về..."
  - Click → Fill input với prompt

LOADING STATE:
- Typing indicator:
  - 3 dots animation
  - "AI đang suy nghĩ..."

ERROR STATE:
- Error message trong bubble:
  - Icon: AlertCircle (red)
  - Message: "Không thể gửi tin nhắn. Vui lòng thử lại."
  - Retry button

INPUT AREA (Bottom):
- Container:
  - Background: White/gray
  - Border-top
  - Padding: 16px
  - Sticky bottom

- Provider selector (above input):
  - Dropdown/Tabs: GPT-4 | Claude 3.5 | Gemini Pro
  - Show current tokens quota for selected provider

- Text input:
  - Textarea auto-expand (max 6 lines)
  - Placeholder: "Nhập tin nhắn... (Shift+Enter để xuống dòng)"
  - No border
  - Padding: 12px

- Actions bar (below input):
  LEFT:
  - Attach file (Paperclip icon)
    - Tooltip: "Upload file (PDF, DOCX, TXT)"
    - File size limit: 10MB
  - Voice input (Mic icon) - Optional

  RIGHT:
  - Character/token counter: "150 chars"
  - Send button (Paper plane icon)
    - Primary color
    - Disabled nếu input empty
    - Loading spinner khi sending

=== SETTINGS PANEL (Phải - 320px, optional, toggle) ===

SECTIONS (Accordion):

1. MODEL SETTINGS:
   - Temperature slider (0-1)
     - Label: "Creativity"
     - 0 = Focused, 1 = Creative
   - Max tokens input
   - Top P slider

2. CONVERSATION INFO:
   - Created date
   - Total messages
   - Total tokens used
   - Provider breakdown

3. QUICK ACTIONS:
   - Export conversation
   - Share (copy link - optional)
   - Archive
   - Delete

=== RESPONSIVE ===

Mobile (<768px):
- Hide sidebar by default
- Hamburger menu top-left
- Full-width chat area
- Floating "New Chat" button (bottom-right)
- Input area sticky bottom

Tablet (768-1024px):
- Collapsible sidebar
- Full chat area
- Hide settings panel

=== FEATURES ===

KEYBOARD SHORTCUTS:
- Cmd/Ctrl + K: New chat
- Cmd/Ctrl + /: Focus search
- Cmd/Ctrl + S: Save/Export
- Escape: Close modals
- Enter: Send (Shift+Enter = new line)

REAL-TIME UPDATES:
- Typing indicator khi AI đang trả lời
- Streaming response (xuất hiện từng từ)
- Auto-scroll to bottom khi có message mới

MARKDOWN SUPPORT:
- Bold, italic, strikethrough
- Code inline và blocks
- Lists (ordered, unordered)
- Tables
- Links (open in new tab)
- Images (optional)

CODE BLOCKS:
- Syntax highlighting (Prism.js)
- Copy button
- Language badge
- Line numbers (optional)

INFINITE SCROLL:
- Load older messages khi scroll lên top
- Loading spinner
- "No more messages"

AUTO-SAVE:
- Auto-save draft trong localStorage
- Restore draft khi reload page

THEMES:
- Light mode
- Dark mode
- Auto (system preference)
```

### 🔌 API Endpoints Cần Gọi

```javascript
// 1. Lấy danh sách conversations
GET /api/chat/conversations?limit=50&offset=0
Response: {
  conversations: [
    {
      id: string,
      title: string,
      lastMessageAt: string,
      messageCount: number,
      provider: string,
      model: string
    }
  ],
  total: number
}

// 2. Lấy một conversation
GET /api/chat/conversations/:id
Response: {
  conversation: {
    id: string,
    title: string,
    messages: [
      {
        id: string,
        role: "user" | "assistant",
        content: string,
        tokensUsed: number,
        timestamp: string
      }
    ]
  }
}

// 3. Gửi message
POST /api/chat/chat
Request: {
  message: string,
  provider: string,  // "openai", "anthropic", "google"
  model: string,     // "gpt-4", "claude-3.5-sonnet"
  conversationId?: string  // Optional, tạo mới nếu không có
}
Response: {
  response: string,
  conversationId: string,
  messageId: string,
  tokensUsed: number
}

// 4. Xóa conversation
DELETE /api/chat/conversations/:id

// 5. Lấy usage stats
GET /api/chat/usage?startDate=xxx&endDate=xxx
Response: {
  totalMessages: number,
  totalTokens: number,
  byProvider: {...}
}
```

### 📱 Components Cần Tạo
- `ChatLayout.tsx` - Layout chính
- `Sidebar.tsx` - Sidebar trái
  - `ConversationsList.tsx`
  - `ConversationItem.tsx`
  - `TokenUsageBar.tsx`
- `ChatArea.tsx` - Vùng chat chính
  - `ChatHeader.tsx`
  - `MessageList.tsx`
  - `Message.tsx`
    - `UserMessage.tsx`
    - `AIMessage.tsx`
  - `ChatInput.tsx`
  - `ProviderSelector.tsx`
  - `EmptyState.tsx`
  - `TypingIndicator.tsx`
- `SettingsPanel.tsx` - Panel phải (optional)
- `ExportModal.tsx` - Modal export
- `MarkdownRenderer.tsx` - Render markdown
- `CodeBlock.tsx` - Render code với syntax highlighting

### 🔄 User Flow
1. User load /chat → Fetch conversations
2. Click conversation → Load messages
3. Type message → Select provider → Send
4. AI response streaming → Display real-time
5. User có thể: rename, delete, export, new chat

### ⚡ Tính Năng Nâng Cao
- [ ] Streaming responses (SSE hoặc WebSocket)
- [ ] Infinite scroll conversations
- [ ] Search conversations
- [ ] Pin conversations
- [ ] Dark mode
- [ ] Export (PDF, MD, JSON)
- [ ] File upload support
- [ ] Voice input (optional)
- [ ] Regenerate response
- [ ] Edit message (optional)
- [ ] Feedback (thumbs up/down)

### ✅ Checklist
- [ ] Responsive 3 layouts
- [ ] Markdown rendering
- [ ] Code syntax highlighting
- [ ] Auto-scroll messages
- [ ] Token counter
- [ ] Provider selector
- [ ] Empty state
- [ ] Loading states
- [ ] Error handling
- [ ] Keyboard shortcuts
- [ ] Auto-save drafts
- [ ] Theme toggle
- [ ] Real-time updates

---

## 10. Settings Page - Cài Đặt

### 📝 Mô Tả
Trang cài đặt profile, password, preferences.

### 🎨 Prompt Thiết Kế

```
Thiết kế trang Settings với tabs:

=== LAYOUT ===
- Sidebar tabs (trái, 220px):
  - Profile
  - Security
  - Preferences
  - Notifications
  - Account
- Content area (phải, flex 1)

=== TAB 1: PROFILE ===

AVATAR SECTION:
- Current avatar (circle, 120px)
- "Change photo" button
- Upload modal:
  - Drag & drop
  - File input
  - Crop tool
  - Max 5MB

PROFILE FORM:
1. Full Name
   - Current value
   - Edit icon
   - Save button

2. Email
   - Current value
   - Badge: "Verified" (green checkmark)
   - Cannot change (readonly)

3. Bio (optional)
   - Textarea
   - Max 200 characters
   - Counter

4. Language
   - Dropdown: English, Tiếng Việt

SAVE BUTTON:
- Bottom right
- Primary
- Loading state
- Success toast

=== TAB 2: SECURITY ===

CHANGE PASSWORD:
1. Current Password
   - Input type password
   - Toggle show/hide

2. New Password
   - Password strength indicator
   - Requirements list

3. Confirm New Password
   - Must match

Button: "Change Password"
- Loading state
- Success toast: "Mật khẩu đã được thay đổi"

ACTIVE SESSIONS:
- List của sessions:
  - Device: "Chrome on Windows"
  - Location: "Hanoi, Vietnam" (từ IP)
  - Last active: "2 minutes ago"
  - Current session badge
  - "Sign out" button (cho các sessions khác)

2FA (Optional):
- Enable/Disable toggle
- QR code setup
- Backup codes

=== TAB 3: PREFERENCES ===

THEME:
- Radio buttons:
  - Light
  - Dark
  - Auto (system)
- Preview thumbnail

DEFAULT AI PROVIDER:
- Dropdown: OpenAI, Anthropic, Google
- Description: "Provider mặc định cho chat mới"

EDITOR PREFERENCES:
- Font size slider (12-20px)
- Enable code highlighting
- Show line numbers
- Enable vim mode (optional)

LANGUAGE:
- Dropdown: English, Vietnamese

AUTO-SAVE:
- Toggle: "Tự động lưu drafts"

=== TAB 4: NOTIFICATIONS ===

EMAIL NOTIFICATIONS:
- Checkboxes:
  - Weekly usage summary
  - New features
  - Security alerts
  - Marketing emails

IN-APP NOTIFICATIONS:
- New message
- Token quota warning
- Payment updates

NOTIFICATION SETTINGS:
- Quiet hours: From - To

=== TAB 5: ACCOUNT ===

SUBSCRIPTION:
- Current plan badge
- Upgrade/Downgrade button
- Link to Billing page

DANGER ZONE (Red border):
- Export Data:
  - Button "Export all data"
  - Download JSON with all conversations

- Delete Account:
  - Button "Delete account" (red)
  - Confirmation modal:
    - Warning message
    - Type "DELETE" to confirm
    - Cannot undo
```

### 🔌 API Endpoints Cần Gọi

```javascript
// 1. Lấy thông tin user
GET /api/auth/me
Response: {
  user: {
    id: string,
    email: string,
    name: string,
    isVerified: boolean,
    avatar?: string,
    preferences: {...}
  }
}

// 2. Cập nhật profile
PATCH /api/user/update
Request: {
  name?: string,
  bio?: string,
  language?: string,
  preferences?: {...}
}

// 3. Đổi mật khẩu
POST /api/auth/change-password
Request: {
  currentPassword: string,
  newPassword: string
}

// 4. Lấy active sessions
GET /api/auth/sessions
Response: {
  sessions: [...]
}

// 5. Sign out session
DELETE /api/auth/sessions/:sessionId

// 6. Xóa tài khoản
DELETE /api/user/delete-account
Request: {
  confirmation: "DELETE",
  password: string
}
```

### 📱 Components Cần Tạo
- `SettingsLayout.tsx`
- `SettingsSidebar.tsx`
- `ProfileTab.tsx`
- `SecurityTab.tsx`
- `PreferencesTab.tsx`
- `NotificationsTab.tsx`
- `AccountTab.tsx`
- `AvatarUpload.tsx`
- `PasswordForm.tsx`
- `SessionsList.tsx`
- `DeleteAccountModal.tsx`

### ✅ Checklist
- [ ] Tab navigation
- [ ] Form validation
- [ ] Avatar upload
- [ ] Password strength
- [ ] Session management
- [ ] Export data
- [ ] Delete confirmation
- [ ] Success/error toasts
- [ ] Auto-save preferences

---

## 11. Billing Page - Thanh Toán & Đăng Ký

### 📝 Mô Tả
Trang quản lý subscription, usage, payments.

### 🎨 Prompt Thiết Kế

```
Thiết kế trang Billing với sections:

=== CURRENT PLAN CARD (Top) ===

LAYOUT: Card nổi bật, gradient background

CONTENT:
- Badge: "PRO PLAN" (hoặc FREE/ENTERPRISE)
- Pricing: "$29.99/month"
- Next billing date: "Gia hạn vào 28/11/2025"
- Status badge: "Active" (green) hoặc "Canceled"

ACTIONS:
- Upgrade button (nếu Free → Pro)
- Manage subscription button
  - Dropdown:
    • Upgrade to Enterprise
    • Change billing cycle (monthly/yearly)
    • Cancel subscription

TOKEN USAGE:
- Heading: "Token Usage This Month"
- Progress bar:
  - Used: 25,000
  - Limit: 100,000
  - Percentage: 25%
  - Color gradient: green → yellow → red
- Breakdown by provider:
  - OpenAI: 15,000 (60%)
  - Claude: 7,000 (28%)
  - Gemini: 3,000 (12%)

OVERAGE (nếu có):
- Warning badge: "You've exceeded your quota"
- Additional tokens: 5,000
- Cost: $5.00
- Explanation

=== USAGE CHARTS ===

TAB 1: OVERVIEW
- Line chart: Token usage over time (30 days)
- Bar chart: Usage by provider
- Pie chart: Messages by model

TAB 2: DETAILED
- Table:
  - Date | Messages | Tokens | Provider | Cost
  - Sortable columns
  - Pagination
  - Export CSV

=== PAYMENT HISTORY ===

HEADING: "Payment History"

TABLE:
- Columns:
  - Invoice # (link to PDF)
  - Date
  - Description ("Pro Plan - Monthly")
  - Amount ($29.99)
  - Status (Paid, Failed, Refunded)
  - Actions (Download PDF)

PAGINATION:
- 10 items per page
- Previous/Next buttons

=== PAYMENT METHOD ===

CARD:
- Current method:
  - Card type icon (Visa, Mastercard)
  - Last 4 digits: "**** 1234"
  - Expiry: "12/25"
  - "Update" button

UPDATE MODAL:
- Stripe/PayOS payment form
- Card number input
- Expiry date
- CVV
- Billing address

=== INVOICES ===

LIST:
- Each invoice:
  - Date
  - Amount
  - Status
  - Download button (PDF)

=== CANCEL SUBSCRIPTION MODAL ===

WARNING:
- "Are you sure you want to cancel?"
- Consequences:
  - Access until end of billing period
  - No refund
  - Data retained for 30 days

OPTIONS:
- Radio buttons:
  - Cancel at period end (default)
  - Cancel immediately

FEEDBACK (optional):
- "Why are you canceling?"
- Dropdown reasons

CONFIRMATION:
- Type "CANCEL" to confirm
- Button "Confirm Cancellation"

=== UPGRADE MODAL ===

PLAN COMPARISON:
- Current plan vs Target plan
- Feature differences highlighted
- Price difference
- Pro-rated amount

PAYMENT:
- Total due today
- Next billing date
- Payment method selector

CONFIRM BUTTON:
- "Upgrade to Pro - $29.99"
- Processing state
```

### 🔌 API Endpoints Cần Gọi

```javascript
// 1. Lấy subscription info
GET /api/billing/subscription
Response: {
  subscription: {
    planId: string,
    planName: string,
    status: string,
    amount: number,
    tokensIncluded: number,
    tokensUsed: number,
    tokensRemaining: number,
    currentPeriodEnd: string
  }
}

// 2. Lấy usage
GET /api/billing/usage?startDate=xxx&endDate=xxx
Response: {
  tokensUsed: number,
  dailyUsage: [...],
  byProvider: {...}
}

// 3. Lấy payment history
GET /api/billing/payments?limit=10&offset=0
Response: {
  payments: [
    {
      id: string,
      amount: number,
      status: string,
      createdAt: string
    }
  ]
}

// 4. Subscribe
POST /api/billing/subscribe
Request: {
  planId: string,
  paymentMethodId: string
}

// 5. Cancel subscription
POST /api/billing/cancel
Request: {
  cancelAtPeriodEnd: boolean
}

// 6. Update payment method
POST /api/billing/payment-method
Request: {
  paymentMethodId: string
}
```

### 📱 Components Cần Tạo
- `BillingPage.tsx`
- `CurrentPlanCard.tsx`
- `TokenUsageCard.tsx`
- `UsageChart.tsx`
- `PaymentHistoryTable.tsx`
- `PaymentMethodCard.tsx`
- `InvoicesList.tsx`
- `CancelSubscriptionModal.tsx`
- `UpgradeModal.tsx`
- `PaymentForm.tsx`

### ✅ Checklist
- [ ] Current plan display
- [ ] Token usage progress
- [ ] Usage charts (Chart.js/Recharts)
- [ ] Payment history table
- [ ] Payment method management
- [ ] Invoice downloads
- [ ] Cancel subscription flow
- [ ] Upgrade flow
- [ ] Stripe/PayOS integration
- [ ] Success/error handling

---

## 12. Admin Dashboard - Bảng Điều Khiển Admin

### 📝 Mô Tả
Dashboard cho admin xem analytics tổng thể của platform (chỉ dành cho role admin).

### 🎨 Prompt Thiết Kế

```
Thiết kế Admin Dashboard với nhiều charts và metrics:

=== LAYOUT ===
- Sidebar (trái):
  - Logo
  - Menu items:
    • Overview (home)
    • Users
    • Chat Analytics
    • Revenue
    - Providers
    • Settings
  - User info (bottom)

- Main content (phải):
  - Header: "Admin Dashboard"
  - Date range picker: "Last 30 days"
  - Refresh button

=== OVERVIEW PAGE ===

KPI CARDS (4 cards ngang):
1. Total Users
   - Icon: Users
   - Number: 1,234
   - Change: +12% vs last period (green/red arrow)
   - Sparkline chart (mini)

2. Total Messages
   - Icon: MessageSquare
   - Number: 50,000
   - Change: +8%
   - Sparkline

3. Total Revenue
   - Icon: DollarSign
   - Number: $15,000
   - Change: +15%
   - Sparkline

4. Active Subscriptions
   - Icon: CreditCard
   - Number: 400
   - Change: +5%
   - Sparkline

CHARTS ROW 1 (2 charts):

1. User Growth Chart (Left, 60%):
   - Line chart
   - X-axis: Time
   - Y-axis: Users
   - 2 lines: New users, Total users
   - Hover tooltips

2. Revenue by Plan (Right, 40%):
   - Pie/Donut chart
   - Free: 60%
   - Pro: 30%
   - Enterprise: 10%
   - Legend
   - Total in center

CHARTS ROW 2 (2 charts):

3. Chat Activity (Left):
   - Bar chart
   - Messages per day
   - By provider (stacked)
   - Color coded

4. Token Usage (Right):
   - Area chart
   - Tokens used over time
   - By provider (stacked)

TABLES:

5. Top Users (Table):
   - Columns: Name, Email, Messages, Tokens, Plan
   - Top 10
   - "View all" link

6. Recent Signups:
   - User avatar
   - Name, email
   - Plan
   - Signup date
   - Verified status

=== USERS PAGE ===

FILTERS:
- Search: Name/Email
- Filter by plan: All, Free, Pro, Enterprise
- Filter by status: All, Verified, Unverified
- Date range: Signup date

TABLE:
- Columns:
  - Avatar
  - Name
  - Email
  - Plan
  - Status (Verified badge)
  - Signup date
  - Last active
  - Actions (View, Edit, Suspend)
- Pagination
- Export CSV

USER DETAIL MODAL:
- Profile info
- Usage stats
- Payment history
- Conversations count
- Actions: Send email, Suspend, Delete

=== CHAT ANALYTICS PAGE ===

METRICS:
- Total messages
- Total conversations
- Average messages/conversation
- Average response time

CHARTS:
1. Messages by Provider
   - Bar chart: OpenAI, Claude, Gemini

2. Popular Models
   - Horizontal bar chart
   - GPT-4, GPT-3.5, Claude 3.5, etc.

3. Token Usage by Plan
   - Stacked bar chart

4. Response Time by Provider
   - Line chart
   - Average, p95, p99

=== REVENUE PAGE ===

METRICS:
- Total revenue
- MRR (Monthly Recurring Revenue)
- Average revenue per user (ARPU)
- Churn rate

CHARTS:
1. Revenue Over Time
   - Line chart
   - Monthly/Weekly view

2. Revenue by Plan
   - Pie chart

3. New vs Churned Subscriptions
   - Bar chart
   - Green (new), Red (churned)

4. LTV by Cohort
   - Heatmap table

TABLES:
- Recent payments
- Failed payments (with reasons)

=== PROVIDERS PAGE ===

METRICS:
- Total requests
- Total tokens
- Total cost (estimated)
- Uptime

PROVIDER CARDS (3-4 cards):
Each card:
- Provider logo
- Usage: 30,000 requests
- Tokens: 9M
- Cost: $180
- Success rate: 99.5%
- Avg response time: 1.2s

CHARTS:
1. Usage Over Time by Provider
   - Multi-line chart

2. Cost Estimation
   - Bar chart per provider

3. Performance Metrics
   - Table: Provider, Avg time, p95, p99, Success rate

=== FEATURES ===

REAL-TIME UPDATES:
- Auto refresh every 30s
- Loading indicators

EXPORT:
- Export all charts/tables to CSV/PDF
- Date range selection

NOTIFICATIONS:
- Alert when metrics exceed thresholds
- System health alerts

RESPONSIVE:
- Mobile: Stack charts vertically
- Tablet: 1 column layout
```

### 🔌 API Endpoints Cần Gọi

Tất cả endpoints trong Analytics Service:

```javascript
// User Analytics
GET /api/analytics/users/count
GET /api/analytics/users/growth?interval=day
GET /api/analytics/users/active?period=day
GET /api/analytics/users/signups
GET /api/analytics/users/retention
GET /api/analytics/users/top?limit=10&metric=messages

// Chat Analytics
GET /api/analytics/chat/messages
GET /api/analytics/chat/by-provider
GET /api/analytics/chat/by-model
GET /api/analytics/chat/activity?interval=day
GET /api/analytics/chat/response-time
GET /api/analytics/chat/conversations
GET /api/analytics/chat/tokens-by-plan

// Revenue Analytics
GET /api/analytics/revenue/total
GET /api/analytics/revenue/mrr
GET /api/analytics/revenue/over-time?interval=month
GET /api/analytics/revenue/by-plan
GET /api/analytics/revenue/subscriptions
GET /api/analytics/revenue/failed-payments
GET /api/analytics/revenue/ltv

// Provider Analytics
GET /api/analytics/providers/usage
GET /api/analytics/providers/:provider/models
GET /api/analytics/providers/usage-over-time
GET /api/analytics/providers/performance
GET /api/analytics/providers/cost
GET /api/analytics/providers/usage-by-plan
GET /api/analytics/providers/popular-models
```

### 📱 Components Cần Tạo
- `AdminLayout.tsx`
- `AdminSidebar.tsx`
- `AdminHeader.tsx`
- `KPICard.tsx`
- `LineChart.tsx`
- `BarChart.tsx`
- `PieChart.tsx`
- `AreaChart.tsx`
- `DataTable.tsx`
- `DateRangePicker.tsx`
- `ExportButton.tsx`
- `UserDetailModal.tsx`
- `ProviderCard.tsx`

### 📊 Chart Libraries Khuyến Nghị
- **Recharts** (khuyến nghị): React-friendly, responsive
- **Chart.js** với react-chartjs-2: Feature-rich
- **Victory**: Flexible, customizable
- **Nivo**: Beautiful, animated

### ✅ Checklist
- [ ] Role-based access (chỉ admin)
- [ ] KPI cards với sparklines
- [ ] Multiple chart types
- [ ] Date range picker
- [ ] Real-time updates
- [ ] Export functionality
- [ ] Responsive layout
- [ ] Loading states
- [ ] Error handling
- [ ] Data refresh
- [ ] Tooltips
- [ ] Legends

---

## 🎯 TỔNG KẾT

### Số Lượng Trang
**Tổng: 12 trang**
- Công khai: 3
- Xác thực: 5
- Ứng dụng: 4

### Độ Ưu Tiên Phát Triển

#### Phase 1 - MVP (2-3 tuần):
1. ✅ Sign Up
2. ✅ Sign In
3. ✅ Verify Email
4. ✅ Forgot/Reset Password
5. ✅ Chat Page (core features)
6. ✅ Settings Page (basic)

#### Phase 2 - Essential (1-2 tuần):
7. ✅ Landing Page
8. ✅ Pricing Page
9. ✅ Billing Page

#### Phase 3 - Advanced (1-2 tuần):
10. ✅ Admin Dashboard
11. ✅ About/FAQ
12. ✅ Advanced chat features

### Tech Stack Khuyến Nghị

```json
{
  "framework": "Next.js 14 (App Router)",
  "styling": "TailwindCSS + Shadcn/ui",
  "forms": "React Hook Form + Zod",
  "charts": "Recharts",
  "http": "Axios + TanStack Query",
  "state": "Zustand",
  "notifications": "React Hot Toast",
  "markdown": "React Markdown + Prism",
  "icons": "Lucide React",
  "dates": "date-fns"
}
```

### Cấu Trúc Thư Mục Khuyến Nghị

```
src/
├── app/
│   ├── (public)/
│   │   ├── page.tsx          # Landing
│   │   ├── pricing/
│   │   └── about/
│   ├── (auth)/
│   │   ├── signup/
│   │   ├── signin/
│   │   ├── verify-email/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   └── (app)/
│       ├── chat/
│       ├── settings/
│       ├── billing/
│       └── admin/
├── components/
│   ├── ui/                   # Shadcn components
│   ├── layout/
│   ├── forms/
│   └── charts/
├── lib/
│   ├── api/                  # API client
│   ├── hooks/                # Custom hooks
│   ├── utils/
│   └── constants/
└── styles/
```

### API Client Setup

```typescript
// lib/api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:4000/api',
  withCredentials: true,  // Cho session cookies
  timeout: 30000,
});

// Interceptors cho error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

## 📋 CHECKLIST TỔNG THỂ

### Trước Khi Bắt Đầu
- [ ] Setup Next.js project
- [ ] Cài đặt dependencies
- [ ] Setup TailwindCSS + Shadcn/ui
- [ ] Setup API client
- [ ] Setup environment variables
- [ ] Setup Git và version control

### Trong Quá Trình Phát Triển
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Dark mode support
- [ ] Error handling
- [ ] Loading states
- [ ] Form validation
- [ ] Accessibility (WCAG AA)
- [ ] SEO optimization
- [ ] Performance optimization

### Testing
- [ ] Manual testing mỗi trang
- [ ] Cross-browser testing
- [ ] Mobile device testing
- [ ] API integration testing
- [ ] E2E testing (Playwright/Cypress)

### Production Ready
- [ ] Environment config
- [ ] Build optimization
- [ ] Error tracking (Sentry)
- [ ] Analytics (Google Analytics)
- [ ] Performance monitoring
- [ ] Security headers
- [ ] SSL certificate
- [ ] Domain setup

---

**Chúc bạn thiết kế frontend thành công!** 🚀

_File này được tạo vào 30/10/2025_
