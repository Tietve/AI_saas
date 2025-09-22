export async function checkSubscription(_: string = ""): Promise<boolean> {
    return process.env.DEV_BYPASS_PAY === "1"; 
}
