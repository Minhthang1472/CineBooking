# Hướng dẫn chạy dự án Quản lý khách sạn

Dự án này là một hệ thống quản lý khách sạn bao gồm:
- **Backend**: ASP.NET Core Web API, sử dụng SQL Server.
- **Frontend**: React (Vite) sử dụng Ant Design.

---

## 1. Yêu cầu hệ thống
- **.NET SDK** (phiên bản 8.0 trở lên).
- **Node.js** (phiên bản 20.19 trở lên hoặc 22.12 trở lên, theo yêu cầu của Vite 8).
- **SQL Server** (Khuyên dùng SQL Server Express).

---

## 2. Cài đặt tất cả thư viện bằng một lệnh
Mở PowerShell tại thư mục gốc dự án và chạy:
```powershell
powershell -ExecutionPolicy Bypass -File .\setup.ps1
```
Script restore thư viện NuGet cho backend, cài `dotnet-ef` nếu chưa có và cài package frontend theo `frontend/package-lock.json`.

> Cần cài sẵn .NET SDK 8+ và Node.js tương thích. SQL Server cũng cần được cài/cấu hình riêng để chạy backend.

## 3. Cài đặt Backend
Di chuyển vào thư mục `backend`:
```powershell
cd backend
```

### Bước 1: Cấu hình Database
Mở file `appsettings.json` và kiểm tra chuỗi kết nối:
```json
"ConnectionStrings": {
  "DefaultConnection": "Server=.\\SQLEXPRESS;Database=HotelManagementDB;Trusted_Connection=True;TrustServerCertificate=True;"
}
```
*Lưu ý: Nếu bạn dùng SQL Server instance khác, hãy đổi `.\\SQLEXPRESS` thành tên server của bạn.*

### Bước 2: Cập nhật Database (Migrations)
Chạy lệnh sau để tạo database và các bảng:
```powershell
dotnet ef database update
```
*(Nếu chưa cài công cụ EF Core, hãy chạy: `dotnet tool install --global dotnet-ef`)*

### Bước 3: Chạy Backend
```powershell
dotnet run
```
Backend sẽ mặc định chạy tại: `https://localhost:5001` hoặc `http://localhost:5000` (Kiểm tra log console). Bạn có thể truy cập `/swagger` để xem tài liệu API.

---

## 4. Cài đặt Frontend
Mở một terminal mới và di chuyển vào thư mục `frontend`:
```powershell
cd frontend
```

### Bước 1: Cài đặt thư viện
```powershell
npm install
```

### Bước 2: Chạy Frontend
```powershell
npm run dev
```
Frontend sẽ chạy tại: `http://localhost:5173` (hoặc cổng khác nếu 5173 đã bị chiếm).

---

## 5. Các lưu ý quan trọng
1. **Dữ liệu mẫu**: Bạn có file `mock_vouchers.sql` ở thư mục gốc. Sau khi database được tạo, bạn có thể chạy script này trong SQL Server Management Studio (SSMS) để thêm dữ liệu mẫu.
2. **JWT**: Hệ thống có sử dụng JWT Authentication. Key bí mật đã được cấu hình sẵn trong `appsettings.json`.
3. **CORS**: Backend đã được mở CORS để cho phép Frontend truy cập.

## 6. Chạy tự động UI bằng Robot Framework Browser
Cài thư viện test một lần:
```powershell
python -m venv .venv-tests
.\.venv-tests\Scripts\python -m pip install -r .\tests\requirements-robot.txt
.\.venv-tests\Scripts\rfbrowser init
```
Khởi động Frontend bằng `npm run dev`, sau đó mở PowerShell tại thư mục gốc dự án và chạy:
```powershell
.\.venv-tests\Scripts\robot --outputdir .\tests\robot-results .\tests\ui-smoke.robot
```
Mặc định test mở `http://localhost:5173`; có thể đổi URL bằng biến môi trường `FRONTEND_BASE_URL`. Mặc định frontend gọi API ở cổng 5262. Để dùng một API kiểm thử riêng, chạy frontend với `VITE_API_BASE_URL` được đặt trong cùng terminal:
```powershell
$env:VITE_API_BASE_URL = 'http://localhost:5263'
npm run dev
```

Robot suite có kiểm tra đăng nhập và một số trang admin khi được cấp tài khoản kiểm thử qua `TEST_ADMIN_EMAIL` và `TEST_ADMIN_PASSWORD`. Các bài kiểm tra tạo/sửa/xóa dữ liệu chỉ được chạy trên database clone dùng riêng cho test; không trỏ các luồng này vào database đang dùng chung. Những case cần payment/storage bên thứ ba, dữ liệu fixture chuyên biệt hoặc kiểm thử bảo mật chủ động sẽ được đánh dấu SKIP/BLOCKED thay vì báo PASS khi chưa kiểm tra hành vi đó. Các kiểm tra điều hướng trang admin chỉ xác nhận trang tải được, không thay thế test CRUD/permission đầy đủ.

## 7. Chạy API smoke tests
Khởi động Backend trước, sau đó mở PowerShell tại thư mục gốc dự án và chạy:
```powershell
node --test .\tests\api-smoke.test.mjs
```
Các bài test dùng thư viện có sẵn của Node.js, mặc định gọi `http://localhost:5262` và không tạo/sửa/xóa dữ liệu. Có thể đặt `API_BASE_URL` nếu Backend chạy ở địa chỉ khác. Test đăng nhập thành công và email trùng chỉ chạy khi đặt lần lượt `TEST_ADMIN_EMAIL`, `TEST_ADMIN_PASSWORD` và `TEST_EXISTING_EMAIL`; hãy dùng tài khoản kiểm thử.

Để chạy cả Robot Framework và API smoke tests sau khi đã khởi động Frontend và Backend:
```powershell
.\tests\run-all-tests.ps1
```
Có thể đặt `FRONTEND_BASE_URL` và `API_BASE_URL` trước khi chạy nếu ứng dụng dùng cổng khác.

---

## Cấu trúc thư mục chính
- `backend/Controllers`: Xử lý logic API.
- `backend/Models`: Định nghĩa thực thể database.
- `frontend/src/pages`: Giao diện các chức năng.
- `frontend/src/api`: Các hàm gọi API tới Backend.
