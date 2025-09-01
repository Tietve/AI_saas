export async function checkApiLimit(_: string = ""): Promise<boolean> {
    if (process.env.DEV_BYPASS_LIMIT === "1") return true; // dev: luôn còn lượt
    return true; // tạm cho qua khi chưa làm quota thật
}
export async function increaseApiLimit(_: string = ""): Promise<void> {
    /* dev: không tăng đếm */
}
