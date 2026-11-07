namespace HotelManagementApi.Models;

public class RoleDashboardPeriodState
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

    public string DashboardJson { get; set; } = string.Empty;
    public string? ComparisonJson { get; set; }

    public string Status { get; set; } = "OPEN";
    public bool IsCurrent { get; set; } = false;

    public string? LastEventType { get; set; }
    public string? LastEventSource { get; set; }
    public int? LastEventRefId { get; set; }

    public int Version { get; set; } = 1;

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? ClosedAt { get; set; }

    public int? UpdatedBy { get; set; }

    // Navigation properties
    public virtual Role? Role { get; set; }
    public virtual User? UpdatedByUser { get; set; }
}
