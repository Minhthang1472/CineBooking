namespace HotelManagementApi.Dtos.Dashboard;

public class DashboardPeriodResponseDto
{
    public int Id { get; set; }
    public int RoleId { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public string DashboardCode { get; set; } = string.Empty;
    public string DashboardTitle { get; set; } = string.Empty;
    public string PeriodType { get; set; } = string.Empty;
    public string PeriodKey { get; set; } = string.Empty;
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool IsCurrent { get; set; }
    public int Version { get; set; }
    public DateTime UpdatedAt { get; set; }
    public System.Text.Json.JsonElement? Dashboard { get; set; }
    public System.Text.Json.JsonElement? Comparison { get; set; }
}

public class DashboardHistoryItemDto
{
    public int Id { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public string DashboardCode { get; set; } = string.Empty;
    public string PeriodType { get; set; } = string.Empty;
    public string PeriodKey { get; set; } = string.Empty;
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool IsCurrent { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class DashboardRebuildRequestDto
{
    public string RoleName { get; set; } = string.Empty;
    public string PeriodType { get; set; } = "MONTHLY";
    public DateTime? OccurredAtUtc { get; set; }
}

public class DashboardEventRequestDto
{
    public string EventType { get; set; } = string.Empty;
    public DateTime? OccurredAtUtc { get; set; }
    public int? RefId { get; set; }
}
