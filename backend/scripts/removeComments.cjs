const fs = require("fs-extra");
const { glob } = require("glob");
const strip = require("strip-comments");
const path = require("path");

// Cấu hình mở rộng file & thư mục nguồn bạn muốn quét
const DIRS = ["src", "prisma"]; // thêm "scripts" nếu muốn
const EXTENSIONS = ["ts", "tsx", "js", "jsx", "prisma", "css", "scss"];
// ❗ Mặc định KHÔNG xử lý .json để tránh phá dữ liệu

// Dùng: node scripts/removeComments.cjs [--in-place]
const IN_PLACE = process.argv.includes("--in-place");

const OUT_ROOT = "src_clean"; // chỉ dùng khi KHÔNG in-place

(async () => {
    if (!IN_PLACE) {
        await fs.remove(OUT_ROOT);
    }

    for (const dir of DIRS) {
        // Bỏ qua nếu thư mục không tồn tại
        if (!(await fs.pathExists(dir))) continue;

        const pattern = `${dir}/**/*.{${EXTENSIONS.join(",")}}`;
        const files = await glob(pattern, { dot: false });

        for (const file of files) {
            const content = await fs.readFile(file, "utf8");

            // Loại bỏ comment (// và /* ... */)
            // Lưu ý: nếu bạn có chuỗi có chứa "//" hay "/*" trong string literal,
            // strip-comments vẫn xử lý đúng cho code hợp lệ.
            const cleaned = strip(content);

            if (IN_PLACE) {
                // Ghi đè ngay tại chỗ
                await fs.writeFile(file, cleaned, "utf8");
            } else {
                // Copy sang OUT_ROOT giữ cấu trúc thư mục
                const newPath = path.join(OUT_ROOT, file);
                await fs.ensureDir(path.dirname(newPath));
                await fs.writeFile(newPath, cleaned, "utf8");
            }
        }
    }

    console.log(
        IN_PLACE
            ? "✅ Đã xóa comment trực tiếp trong source."
            : `✅ Xong! Bản sạch nằm trong thư mục ${OUT_ROOT}/`
    );
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
