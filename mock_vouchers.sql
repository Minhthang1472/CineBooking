-- ============================================================
--  MOCK DATA: Bảng Vouchers cho ThirtySix Resort
--  Chạy script này vào SQL Server để thêm dữ liệu mẫu
-- ============================================================

-- Xóa dữ liệu cũ nếu cần (bỏ comment nếu muốn reset)
DELETE FROM Vouchers;

INSERT INTO Vouchers (code, discount_type, discount_value, min_booking_value, valid_from, valid_to, usage_limit)
VALUES
  -- Khách mới: giảm 20%
  ('WELCOME20',  'Percentage',  20,    2000000, '2026-01-01', '2026-12-31', 500),

  -- Mùa hè: giảm 30%
  ('SUMMER30',   'Percentage',  30,    5000000, '2026-06-01', '2026-08-31', 200),

  -- Giảm cố định 500k
  ('LUXURY500K', 'FixedAmount', 500000, 3000000, '2026-01-01', '2026-12-31', 1000),

  -- Cặp đôi: giảm 15%
  ('COUPLE15',   'Percentage',  15,    4000000, '2026-01-01', '2026-12-31', 300),

  -- Gia đình: giảm 25%
  ('FAMILY25',   'Percentage',  25,    6000000, '2026-04-01', '2026-09-30', 150),

  -- VIP: giảm cố định 1 triệu
  ('VIP1000K',   'FixedAmount', 1000000, 8000000, '2026-01-01', '2026-12-31', 100),

  -- Tết: giảm 18%
  ('TET2026',    'Percentage',  18,    3500000, '2026-01-25', '2026-02-10', 250),

  -- Flash sale cuối tuần: giảm cố định 300k
  ('WEEKEND300K','FixedAmount', 300000, 2500000, '2026-01-01', '2026-12-31', 999),

  -- Đặt sớm: giảm 12%
  ('EARLYBRD12', 'Percentage',  12,    2000000, '2026-01-01', '2026-12-31', 400),

  -- Nhóm lớn (trên 10 người): giảm 22%
  ('GROUP22',    'Percentage',  22,    15000000,'2026-01-01', '2026-12-31', 80);

-- ============================================================
-- Kiểm tra dữ liệu sau khi insert
-- ============================================================
SELECT
  id,
  code,
  discount_type,
  discount_value,
  CAST(min_booking_value AS BIGINT)  AS min_booking_value,
  FORMAT(valid_from, 'dd/MM/yyyy')  AS valid_from,
  FORMAT(valid_to,   'dd/MM/yyyy')  AS valid_to,
  usage_limit
FROM Vouchers
ORDER BY id;
