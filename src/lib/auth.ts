export async function requireUserId() {
// TODO: Lấy từ session/cookie/JWT. Nếu chưa đăng nhập thì throw.
// Ví dụ tạm thời (mock) để dev nhanh:
    const userId = "demo-user-id";
    if (!userId) throw new Error("UNAUTHORIZED");
    return userId;
}