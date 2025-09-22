export async function checkApiLimit(_: string = ""): Promise<boolean> {
    if (process.env.DEV_BYPASS_LIMIT === "1") return true; 
    return true; 
}
export async function increaseApiLimit(_: string = ""): Promise<void> {
    
}
