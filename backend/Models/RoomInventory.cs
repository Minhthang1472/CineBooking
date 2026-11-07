using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace HotelManagementApi.Models;

[Table("Room_Inventory")]
public partial class RoomInventory
{
    [Column("id")]
    public int Id { get; set; }

    [Column("room_id")]
    public int? RoomId { get; set; }

    [Column("quantity")]
    public int? Quantity { get; set; }

    [Column("price_if_lost")]
    public decimal? PriceIfLost { get; set; }

    [Column("note")]
    public string? Note { get; set; }

    [Column("is_active")]
    public bool? IsActive { get; set; }

    [Column("item_type")]
    public string? ItemType { get; set; }

    [Column("EquipmentId")]
    public int? EquipmentId { get; set; }

    // ✅ THÊM DÒNG NÀY
    public virtual Equipment? Equipment { get; set; }

    public virtual ICollection<LossAndDamage> LossAndDamages { get; set; } = new List<LossAndDamage>();

    public virtual Room? Room { get; set; }
}