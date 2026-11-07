using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HotelManagementApi.Dtos.Dashboard;
using HotelManagementApi.Services;

namespace HotelManagementApi.Controllers;

[Route("api/dashboard-periods")]
[ApiController]
[Authorize]
public class DashboardPeriodsController : ControllerBase
{
    private readonly IRoleDashboardPeriodService _dashboardService;

    public DashboardPeriodsController(IRoleDashboardPeriodService dashboardService)
        => _dashboardService = dashboardService;

    [HttpGet("current")]
    public async Task<IActionResult> GetCurrentDashboard(
        [FromQuery] string? roleName,
        [FromQuery] string periodType = "MONTHLY",
        CancellationToken ct = default)
    {
        var resolved = string.IsNullOrWhiteSpace(roleName)
            ? User.FindFirst(ClaimTypes.Role)?.Value ?? "Guest"
            : roleName.Trim();

        var dashboard = await _dashboardService.GetDashboardAsync(resolved, periodType, null, true, ct);
        return dashboard == null ? NotFound(new { message = "Không tìm thấy dashboard hiện tại." }) : Ok(dashboard);
    }

    [HttpGet("{roleName}/{periodType}/{periodKey}")]
    public async Task<IActionResult> GetDashboardByPeriod(string roleName, string periodType, string periodKey, CancellationToken ct = default)
    {
        var dashboard = await _dashboardService.GetDashboardAsync(roleName, periodType, periodKey, false, ct);
        return dashboard == null ? NotFound(new { message = "Không tìm thấy dashboard theo kỳ." }) : Ok(dashboard);
    }

    [HttpGet("{roleName}/{periodType}/history")]
    public async Task<IActionResult> GetHistory(string roleName, string periodType, [FromQuery] int take = 12, CancellationToken ct = default)
    {
        var items = await _dashboardService.GetHistoryAsync(roleName, periodType, take, ct);
        return Ok(items);
    }

    [HttpPost("rebuild")]
    public async Task<IActionResult> RebuildDashboard([FromBody] DashboardRebuildRequestDto request, CancellationToken ct = default)
    {
        await _dashboardService.RebuildDashboardAsync(
            request.RoleName, request.PeriodType,
            request.OccurredAtUtc ?? DateTime.UtcNow,
            GetUserId(), "MANUAL_REBUILD", null, ct);
        return Ok(new { message = "Đã rebuild dashboard theo kỳ." });
    }

    [HttpPost("rebuild-current")]
    public async Task<IActionResult> RebuildAllCurrent(CancellationToken ct = default)
    {
        await _dashboardService.RebuildAllCurrentDashboardsAsync(GetUserId(), ct);
        return Ok(new { message = "Đã rebuild toàn bộ dashboard hiện tại." });
    }

    [HttpPost("events/rebuild-affected")]
    public async Task<IActionResult> RebuildAffectedByEvent([FromBody] DashboardEventRequestDto request, CancellationToken ct = default)
    {
        await _dashboardService.RebuildAffectedDashboardsAsync(
            request.EventType, request.OccurredAtUtc ?? DateTime.UtcNow,
            GetUserId(), request.RefId, ct);
        return Ok(new { message = "Đã cập nhật các dashboard bị ảnh hưởng." });
    }

    private int? GetUserId()
    {
        var raw = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(raw, out var id) ? id : null;
    }
}
