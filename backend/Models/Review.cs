using System;
using System.Collections.Generic;

namespace HotelManagementApi.Models;

public partial class Review
{
    public int Id { get; set; }

    public int? UserId { get; set; }

    public int? RoomTypeId { get; set; }

    public int? Rating { get; set; }

    public string? Comment { get; set; }

    public DateTime? CreatedAt { get; set; }

    public bool IsApproved { get; set; } = false;

    public virtual RoomType? RoomType { get; set; }

    public virtual User? User { get; set; }
}
