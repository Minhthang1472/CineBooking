using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using HotelManagementApi.Dtos.Dashboard;
using HotelManagementApi.Helpers;
using HotelManagementApi.Models;

namespace HotelManagementApi.Services;

public sealed class RoleDashboardPeriodService : IRoleDashboardPeriodService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web) { WriteIndented = false };
    private readonly HotelDbContext _context;

    public RoleDashboardPeriodService(HotelDbContext context) => _context = context;

    public async Task<DashboardPeriodResponseDto?> GetDashboardAsync(string roleName, string periodType, string? periodKey, bool currentOnly, CancellationToken ct = default)
    {
        var normalizedType = DashboardPeriodHelper.NormalizePeriodType(periodType);
        var dashboardCode = DashboardPeriodHelper.GetDashboardCode(roleName);

        var query = _context.RoleDashboardPeriodStates.AsNoTracking()
            .Where(x => x.RoleName == roleName && x.DashboardCode == dashboardCode && x.PeriodType == normalizedType);

        query = currentOnly || string.IsNullOrWhiteSpace(periodKey)
            ? query.Where(x => x.IsCurrent)
            : query.Where(x => x.PeriodKey == periodKey);

        var entity = await query.OrderByDescending(x => x.PeriodStart).FirstOrDefaultAsync(ct);
        return entity == null ? null : ToResponseDto(entity);
    }

    public async Task<IReadOnlyList<DashboardHistoryItemDto>> GetHistoryAsync(string roleName, string periodType, int take, CancellationToken ct = default)
    {
        var normalizedType = DashboardPeriodHelper.NormalizePeriodType(periodType);
        var dashboardCode = DashboardPeriodHelper.GetDashboardCode(roleName);
        var safeTake = Math.Clamp(take, 1, 36);

        return await _context.RoleDashboardPeriodStates.AsNoTracking()
            .Where(x => x.RoleName == roleName && x.DashboardCode == dashboardCode && x.PeriodType == normalizedType)
            .OrderByDescending(x => x.PeriodStart).Take(safeTake)
            .Select(x => new DashboardHistoryItemDto
            {
                Id = x.Id, RoleName = x.RoleName, DashboardCode = x.DashboardCode,
                PeriodType = x.PeriodType, PeriodKey = x.PeriodKey,
                PeriodStart = x.PeriodStart, PeriodEnd = x.PeriodEnd,
                Status = x.Status, IsCurrent = x.IsCurrent, UpdatedAt = x.UpdatedAt
            }).ToListAsync(ct);
    }

    public async Task RebuildDashboardAsync(string roleName, string periodType, DateTime occurredAtUtc, int? updatedByUserId, string eventType, int? eventRefId, CancellationToken ct = default)
    {
        var period = DashboardPeriodHelper.Resolve(periodType, occurredAtUtc);
        var role = await _context.Roles.FirstOrDefaultAsync(x => x.Name == roleName, ct);
        if (role == null) return;

        var dashboardCode = DashboardPeriodHelper.GetDashboardCode(role.Name);
        var metrics = await BuildMetricsAsync(period.PeriodStart, period.PeriodEnd, ct);
        var prevMetrics = await BuildMetricsAsync(period.PreviousPeriodStart, period.PreviousPeriodEnd, ct);
        var dashboardJson = BuildDashboardJson(role.Name, dashboardCode, period, metrics);
        var comparisonJson = BuildComparisonJson(period, metrics, prevMetrics);

        var existing = await _context.RoleDashboardPeriodStates.FirstOrDefaultAsync(x =>
            x.RoleId == role.Id && x.DashboardCode == dashboardCode &&
            x.PeriodType == period.PeriodType && x.PeriodKey == period.PeriodKey, ct);

        await ClearCurrentFlagAsync(role.Id, dashboardCode, period.PeriodType, period.IsCurrent, ct);

        if (existing == null)
        {
            existing = new RoleDashboardPeriodState
            {
                RoleId = role.Id, RoleName = role.Name, DashboardCode = dashboardCode,
                DashboardTitle = role.Name + " Dashboard", PeriodType = period.PeriodType,
                PeriodKey = period.PeriodKey, CreatedAt = DateTime.UtcNow
            };
            _context.RoleDashboardPeriodStates.Add(existing);
        }

        existing.RoleName = role.Name;
        existing.DashboardTitle = role.Name + " Dashboard";
        existing.PeriodStart = period.PeriodStart;
        existing.PeriodEnd = period.PeriodEnd;
        existing.DashboardJson = dashboardJson;
        existing.ComparisonJson = comparisonJson;
        existing.Status = period.IsCurrent ? "OPEN" : "CLOSED";
        existing.IsCurrent = period.IsCurrent;
        existing.LastEventType = eventType;
        existing.LastEventSource = "RoleDashboardPeriodService";
        existing.LastEventRefId = eventRefId;
        existing.Version += existing.Id == 0 ? 0 : 1;
        existing.UpdatedAt = DateTime.UtcNow;
        existing.ClosedAt = period.IsCurrent ? null : existing.ClosedAt ?? DateTime.UtcNow;
        existing.UpdatedBy = updatedByUserId;

        await _context.SaveChangesAsync(ct);
    }

    public async Task RebuildAffectedDashboardsAsync(string eventType, DateTime occurredAtUtc, int? updatedByUserId, int? eventRefId, CancellationToken ct = default)
    {
        var affectedRoles = ResolveAffectedRoles(eventType);
        var roles = await _context.Roles.AsNoTracking().Where(x => affectedRoles.Contains(x.Name)).Select(x => x.Name).ToListAsync(ct);
        foreach (var roleName in roles)
            foreach (var pt in DashboardPeriodHelper.DefaultEventPeriods)
                await RebuildDashboardAsync(roleName, pt, occurredAtUtc, updatedByUserId, eventType, eventRefId, ct);
    }

    public async Task RebuildAllCurrentDashboardsAsync(int? updatedByUserId, CancellationToken ct = default)
    {
        var roleNames = new[] { "Admin", "Manager", "Receptionist", "Accountant", "Housekeeping", "WarehouseStaff" };
        var roles = await _context.Roles.AsNoTracking().Where(x => roleNames.Contains(x.Name)).Select(x => x.Name).ToListAsync(ct);
        var now = DateTime.UtcNow;
        foreach (var roleName in roles)
            foreach (var pt in DashboardPeriodHelper.DefaultEventPeriods)
                await RebuildDashboardAsync(roleName, pt, now, updatedByUserId, "MANUAL_REBUILD", null, ct);
    }

    private async Task ClearCurrentFlagAsync(int roleId, string dashboardCode, string periodType, bool shouldClear, CancellationToken ct)
    {
        if (!shouldClear) return;
        var rows = await _context.RoleDashboardPeriodStates
            .Where(x => x.RoleId == roleId && x.DashboardCode == dashboardCode && x.PeriodType == periodType && x.IsCurrent)
            .ToListAsync(ct);
        foreach (var row in rows)
        {
            row.IsCurrent = false;
            if (row.Status == "OPEN") { row.Status = "CLOSED"; row.ClosedAt = DateTime.UtcNow; }
        }
    }

    private static IReadOnlyList<string> ResolveAffectedRoles(string eventType)
    {
        return eventType.Trim().ToUpperInvariant() switch
        {
            "DAMAGE_REPORTED" or "DAMAGE_UPDATED" or "DAMAGE_CANCELLED" => new[] { "WarehouseStaff", "Housekeeping", "Accountant", "Manager", "Admin" },
            "PAYMENT_CREATED" or "INVOICE_CREATED" or "INVOICE_UPDATED" => new[] { "Accountant", "Receptionist", "Manager", "Admin" },
            "BOOKING_CREATED" or "BOOKING_UPDATED" or "BOOKING_STATUS_CHANGED" or "BOOKING_CANCELLED" => new[] { "Receptionist", "Manager", "Admin" },
            "CHECK_IN" or "CHECK_OUT" or "ROOM_ASSIGNED" => new[] { "Receptionist", "Housekeeping", "Manager", "Admin" },
            "ROOM_CLEANING_UPDATED" => new[] { "Housekeeping", "Manager", "Admin" },
            _ => new[] { "Admin", "Manager", "Receptionist", "Accountant", "Housekeeping", "WarehouseStaff" }
        };
    }

    private async Task<DashboardMetrics> BuildMetricsAsync(DateTime start, DateTime end, CancellationToken ct)
    {
        var totalUsers = await _context.Users.CountAsync(ct);
        var activeUsers = await _context.Users.CountAsync(x => x.Status == true, ct);
        var newCustomers = await _context.Users
            .Where(x => x.Role != null && x.Role.Name == "Guest" && x.CreatedAt.HasValue && x.CreatedAt.Value >= start && x.CreatedAt.Value <= end)
            .CountAsync(ct);

        var totalBookings = await _context.Bookings.Where(x => x.CreatedAt.HasValue && x.CreatedAt.Value >= start && x.CreatedAt.Value <= end).CountAsync(ct);
        var completedBookings = await _context.Bookings.CountAsync(x => x.Status == "Completed" && x.CreatedAt.HasValue && x.CreatedAt.Value >= start && x.CreatedAt.Value <= end, ct);
        var cancelledBookings = await _context.Bookings.CountAsync(x => x.Status == "Cancelled" && x.CreatedAt.HasValue && x.CreatedAt.Value >= start && x.CreatedAt.Value <= end, ct);
        var pendingBookings = await _context.Bookings.CountAsync(x => x.Status == "Pending" && x.CreatedAt.HasValue && x.CreatedAt.Value >= start && x.CreatedAt.Value <= end, ct);

        var checkIns = await _context.BookingDetails.CountAsync(x => x.ActualCheckIn.HasValue && x.ActualCheckIn.Value >= start && x.ActualCheckIn.Value <= end, ct);
        var checkOuts = await _context.BookingDetails.CountAsync(x => x.ActualCheckOut.HasValue && x.ActualCheckOut.Value >= start && x.ActualCheckOut.Value <= end, ct);

        var totalRevenue = await _context.Payments
            .Where(x => x.PaymentDate.HasValue && x.PaymentDate.Value >= start && x.PaymentDate.Value <= end)
            .SumAsync(x => (decimal?)x.AmountPaid, ct) ?? 0m;

        var invoiceMetrics = await _context.Invoices
            .Where(x => x.CreatedAt.HasValue && x.CreatedAt.Value >= start && x.CreatedAt.Value <= end)
            .GroupBy(_ => 1)
            .Select(g => new
            {
                RoomRevenue = g.Sum(x => x.Status == "Cancelled" ? 0m : (x.TotalRoomAmount ?? 0m)),
                ServiceRevenue = g.Sum(x => x.Status == "Cancelled" ? 0m : (x.TotalServiceAmount ?? 0m)),
                PendingPaymentAmount = g.Sum(x => x.Status == "Unpaid" ? (x.FinalTotal ?? 0m) : 0m),
                PaidInvoices = g.Count(x => x.Status == "Paid"),
                UnpaidInvoices = g.Count(x => x.Status == "Unpaid")
            }).FirstOrDefaultAsync(ct);

        var totalRooms = await _context.Rooms.CountAsync(ct);
        var availableRooms = await _context.Rooms.CountAsync(x => x.Status == "Available", ct);
        var occupiedRooms = await _context.Rooms.CountAsync(x => x.Status == "Occupied", ct);
        var maintenanceRooms = await _context.Rooms.CountAsync(x => x.Status == "Maintenance", ct);
        var dirtyRooms = await _context.Rooms.CountAsync(x => x.CleaningStatus == "Dirty", ct);
        var cleaningRooms = await _context.Rooms.CountAsync(x => x.CleaningStatus == "Cleaning", ct);
        var occupancyRate = totalRooms == 0 ? 0m : Math.Round((decimal)occupiedRooms / totalRooms * 100m, 2);

        var damageMetrics = await _context.LossAndDamages
            .Where(x => x.CreatedAt.HasValue && x.CreatedAt.Value >= start && x.CreatedAt.Value <= end)
            .GroupBy(_ => 1)
            .Select(g => new { Reports = g.Count(), Quantity = g.Sum(x => x.Quantity), PenaltyAmount = g.Sum(x => x.PenaltyAmount) })
            .FirstOrDefaultAsync(ct);

        var equipmentMetrics = await _context.Equipments.Where(x => x.IsActive)
            .GroupBy(_ => 1)
            .Select(g => new
            {
                TotalEquipmentTypes = g.Count(),
                InStockQuantity = g.Sum(x => x.InStockQuantity),
                InUseQuantity = g.Sum(x => x.InUseQuantity),
                CurrentDamagedQuantity = g.Sum(x => x.DamagedQuantity),
                LowStockItems = g.Count(x => x.InStockQuantity <= 10)
            }).FirstOrDefaultAsync(ct);

        var reviewMetrics = await _context.Reviews
            .Where(x => x.CreatedAt.HasValue && x.CreatedAt.Value >= start && x.CreatedAt.Value <= end)
            .GroupBy(_ => 1)
            .Select(g => new { NewReviews = g.Count(), AverageRating = g.Average(x => (decimal)(x.Rating ?? 0)) })
            .FirstOrDefaultAsync(ct);

        var unreadNotifications = await _context.Notifications
            .CountAsync(x => x.IsRead == false && x.CreatedAt.HasValue && x.CreatedAt.Value >= start && x.CreatedAt.Value <= end, ct);

        return new DashboardMetrics
        {
            TotalUsers = totalUsers, ActiveUsers = activeUsers, NewCustomers = newCustomers,
            UnreadNotifications = unreadNotifications,
            TotalBookings = totalBookings, CompletedBookings = completedBookings,
            CancelledBookings = cancelledBookings, PendingBookings = pendingBookings,
            CheckIns = checkIns, CheckOuts = checkOuts,
            TotalRevenue = totalRevenue,
            RoomRevenue = invoiceMetrics?.RoomRevenue ?? 0m,
            ServiceRevenue = invoiceMetrics?.ServiceRevenue ?? 0m,
            PendingPaymentAmount = invoiceMetrics?.PendingPaymentAmount ?? 0m,
            PaidInvoices = invoiceMetrics?.PaidInvoices ?? 0,
            UnpaidInvoices = invoiceMetrics?.UnpaidInvoices ?? 0,
            TotalRooms = totalRooms, AvailableRooms = availableRooms,
            OccupiedRooms = occupiedRooms, MaintenanceRooms = maintenanceRooms,
            DirtyRooms = dirtyRooms, CleaningRooms = cleaningRooms, OccupancyRate = occupancyRate,
            DamageReports = damageMetrics?.Reports ?? 0,
            DamagedQuantityInPeriod = damageMetrics?.Quantity ?? 0,
            PenaltyAmount = damageMetrics?.PenaltyAmount ?? 0m,
            TotalEquipmentTypes = equipmentMetrics?.TotalEquipmentTypes ?? 0,
            InStockQuantity = equipmentMetrics?.InStockQuantity ?? 0,
            InUseQuantity = equipmentMetrics?.InUseQuantity ?? 0,
            CurrentDamagedQuantity = equipmentMetrics?.CurrentDamagedQuantity ?? 0,
            LowStockItems = equipmentMetrics?.LowStockItems ?? 0,
            NewReviews = reviewMetrics?.NewReviews ?? 0,
            AverageRating = Math.Round(reviewMetrics?.AverageRating ?? 0m, 2)
        };
    }

    private string BuildDashboardJson(string roleName, string dashboardCode, DashboardPeriodInfo period, DashboardMetrics m)
    {
        var alerts = new List<object>();
        if (m.LowStockItems > 0)
            alerts.Add(new { level = "warning", code = "LOW_STOCK_ITEMS", message = "Có vật tư dưới ngưỡng tồn kho.", value = m.LowStockItems });
        if (m.PendingPaymentAmount > 0)
            alerts.Add(new { level = "warning", code = "PENDING_PAYMENT_AMOUNT", message = "Có hóa đơn chưa thanh toán.", value = m.PendingPaymentAmount });

        var payload = new
        {
            meta = new { schemaVersion = 1, dashboardCode, roleName, periodType = period.PeriodType, periodKey = period.PeriodKey, status = period.IsCurrent ? "OPEN" : "CLOSED", generatedAt = DateTime.UtcNow },
            summary = new
            {
                booking = new { m.TotalBookings, m.CompletedBookings, m.CancelledBookings, m.PendingBookings, m.CheckIns, m.CheckOuts },
                revenue = new { m.TotalRevenue, m.RoomRevenue, m.ServiceRevenue, m.PendingPaymentAmount, m.PaidInvoices, m.UnpaidInvoices },
                rooms = new { m.TotalRooms, m.AvailableRooms, m.OccupiedRooms, m.MaintenanceRooms, m.DirtyRooms, m.CleaningRooms, m.OccupancyRate },
                warehouse = new { m.TotalEquipmentTypes, m.InStockQuantity, m.InUseQuantity, m.CurrentDamagedQuantity, m.DamageReports, m.LowStockItems },
                customer = new { m.NewCustomers, m.AverageRating, m.NewReviews },
                system = new { m.TotalUsers, m.ActiveUsers, m.UnreadNotifications }
            },
            widgets = new { kpiCards = BuildKpiCards(roleName, m) },
            alerts,
            events = new[] { new { eventType = "DASHBOARD_REBUILT", source = "RoleDashboardPeriodService", createdAt = DateTime.UtcNow } }
        };
        return JsonSerializer.Serialize(payload, JsonOptions);
    }

    private string BuildComparisonJson(DashboardPeriodInfo period, DashboardMetrics cur, DashboardMetrics prev)
    {
        var payload = new
        {
            baseInfo = new { comparisonType = "PREVIOUS_PERIOD", currentPeriodKey = period.PeriodKey, previousPeriodStart = period.PreviousPeriodStart, previousPeriodEnd = period.PreviousPeriodEnd },
            metrics = new
            {
                totalBookings = CompareMetric(cur.TotalBookings, prev.TotalBookings, "higher_is_better"),
                totalRevenue = CompareMetric(cur.TotalRevenue, prev.TotalRevenue, "higher_is_better"),
                occupancyRate = CompareMetric(cur.OccupancyRate, prev.OccupancyRate, "higher_is_better"),
                damageReports = CompareMetric(cur.DamageReports, prev.DamageReports, "lower_is_better"),
                pendingPaymentAmount = CompareMetric(cur.PendingPaymentAmount, prev.PendingPaymentAmount, "lower_is_better"),
                newCustomers = CompareMetric(cur.NewCustomers, prev.NewCustomers, "higher_is_better")
            }
        };
        return JsonSerializer.Serialize(payload, JsonOptions);
    }

    private static object CompareMetric(decimal cur, decimal prev, string dir) => new
    {
        current = cur, previous = prev, difference = cur - prev,
        growthRate = DashboardPeriodHelper.CalculateGrowthRate(cur, prev),
        trend = DashboardPeriodHelper.ResolveTrend(cur, prev), directionMeaning = dir
    };

    private static object CompareMetric(int cur, int prev, string dir) => CompareMetric((decimal)cur, prev, dir);

    private static IReadOnlyList<object> BuildKpiCards(string roleName, DashboardMetrics m) => roleName switch
    {
        "WarehouseStaff" => new object[] { new { code = "inStockQuantity", title = "Tồn kho", value = m.InStockQuantity, unit = "item" }, new { code = "damageReports", title = "Báo cáo hỏng/mất", value = m.DamageReports, unit = "report" }, new { code = "lowStockItems", title = "Dưới ngưỡng tồn", value = m.LowStockItems, unit = "item" } },
        "Housekeeping" => new object[] { new { code = "dirtyRooms", title = "Phòng cần dọn", value = m.DirtyRooms, unit = "room" }, new { code = "cleaningRooms", title = "Phòng đang dọn", value = m.CleaningRooms, unit = "room" }, new { code = "damageReports", title = "Báo cáo hỏng/mất", value = m.DamageReports, unit = "report" } },
        "Accountant" => new object[] { new { code = "totalRevenue", title = "Doanh thu", value = m.TotalRevenue, unit = "VND" }, new { code = "pendingPaymentAmount", title = "Chưa thanh toán", value = m.PendingPaymentAmount, unit = "VND" }, new { code = "paidInvoices", title = "Hóa đơn đã trả", value = m.PaidInvoices, unit = "invoice" } },
        _ => new object[] { new { code = "totalBookings", title = "Tổng đặt phòng", value = m.TotalBookings, unit = "booking" }, new { code = "totalRevenue", title = "Doanh thu", value = m.TotalRevenue, unit = "VND" }, new { code = "occupancyRate", title = "Tỷ lệ lấp đầy", value = m.OccupancyRate, unit = "%" } }
    };

    private static DashboardPeriodResponseDto ToResponseDto(RoleDashboardPeriodState e) => new()
    {
        Id = e.Id, RoleId = e.RoleId, RoleName = e.RoleName, DashboardCode = e.DashboardCode,
        DashboardTitle = e.DashboardTitle, PeriodType = e.PeriodType, PeriodKey = e.PeriodKey,
        PeriodStart = e.PeriodStart, PeriodEnd = e.PeriodEnd, Status = e.Status,
        IsCurrent = e.IsCurrent, Version = e.Version, UpdatedAt = e.UpdatedAt,
        Dashboard = DeserializeJson(e.DashboardJson),
        Comparison = string.IsNullOrWhiteSpace(e.ComparisonJson) ? null : DeserializeJson(e.ComparisonJson)
    };

    private static JsonElement? DeserializeJson(string json)
    {
        if (string.IsNullOrWhiteSpace(json)) return null;
        using var doc = JsonDocument.Parse(json);
        return doc.RootElement.Clone();
    }

    private sealed class DashboardMetrics
    {
        public int TotalUsers { get; init; }
        public int ActiveUsers { get; init; }
        public int NewCustomers { get; init; }
        public int UnreadNotifications { get; init; }
        public int TotalBookings { get; init; }
        public int CompletedBookings { get; init; }
        public int CancelledBookings { get; init; }
        public int PendingBookings { get; init; }
        public int CheckIns { get; init; }
        public int CheckOuts { get; init; }
        public decimal TotalRevenue { get; init; }
        public decimal RoomRevenue { get; init; }
        public decimal ServiceRevenue { get; init; }
        public decimal PendingPaymentAmount { get; init; }
        public int PaidInvoices { get; init; }
        public int UnpaidInvoices { get; init; }
        public int TotalRooms { get; init; }
        public int AvailableRooms { get; init; }
        public int OccupiedRooms { get; init; }
        public int MaintenanceRooms { get; init; }
        public int DirtyRooms { get; init; }
        public int CleaningRooms { get; init; }
        public decimal OccupancyRate { get; init; }
        public int DamageReports { get; init; }
        public int DamagedQuantityInPeriod { get; init; }
        public decimal PenaltyAmount { get; init; }
        public int TotalEquipmentTypes { get; init; }
        public int InStockQuantity { get; init; }
        public int InUseQuantity { get; init; }
        public int CurrentDamagedQuantity { get; init; }
        public int LowStockItems { get; init; }
        public int NewReviews { get; init; }
        public decimal AverageRating { get; init; }
    }
}
