using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HotelManagementApi.Models
{
    [Table("Equipments")]
    public class Equipment
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        public string ItemCode { get; set; }

        [Required]
        [StringLength(255)]
        public string Name { get; set; }

        [Required]
        [StringLength(100)]
        public string Category { get; set; }

        [Required]
        [StringLength(50)]
        public string Unit { get; set; }

        public int TotalQuantity { get; set; }
        public int InUseQuantity { get; set; }
        public int DamagedQuantity { get; set; }
        public int LiquidatedQuantity { get; set; }

        [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
        public int InStockQuantity { get; set; } // Cột này SQL Server tự tính

        [Column(TypeName = "decimal(18, 2)")]
        public decimal BasePrice { get; set; }

        [Column(TypeName = "decimal(18, 2)")]
        public decimal DefaultPriceIfLost { get; set; }

        [StringLength(255)]
        public string Supplier { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public string ImageUrl { get; set; }
    }
}