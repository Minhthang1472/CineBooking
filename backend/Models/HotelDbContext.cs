using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace HotelManagementApi.Models;

public partial class HotelDbContext : DbContext
{
    public HotelDbContext()
    {
    }

    public HotelDbContext(DbContextOptions<HotelDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Amenity> Amenities { get; set; }

    public virtual DbSet<Article> Articles { get; set; }

    public virtual DbSet<ArticleCategory> ArticleCategories { get; set; }

    public virtual DbSet<Attraction> Attractions { get; set; }

    public virtual DbSet<AuditLog> AuditLogs { get; set; }

    public virtual DbSet<Booking> Bookings { get; set; }

    public virtual DbSet<BookingDetail> BookingDetails { get; set; }

    public virtual DbSet<Invoice> Invoices { get; set; }

    public virtual DbSet<LossAndDamage> LossAndDamages { get; set; }

    public virtual DbSet<Equipment> Equipments { get; set; }

    public virtual DbSet<Membership> Memberships { get; set; }

    public virtual DbSet<OrderService> OrderServices { get; set; }

    public virtual DbSet<OrderServiceDetail> OrderServiceDetails { get; set; }

    public virtual DbSet<Payment> Payments { get; set; }

    public virtual DbSet<Permission> Permissions { get; set; }

    public virtual DbSet<Review> Reviews { get; set; }

    public virtual DbSet<Role> Roles { get; set; }

    public virtual DbSet<Room> Rooms { get; set; }

    public virtual DbSet<RoomImage> RoomImages { get; set; }

    public virtual DbSet<RoomInventory> RoomInventories { get; set; }

    public virtual DbSet<RoomType> RoomTypes { get; set; }

    public virtual DbSet<Service> Services { get; set; }

    public virtual DbSet<ServiceCategory> ServiceCategories { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<Voucher> Vouchers { get; set; }

    public virtual DbSet<Notification> Notifications { get; set; }

    public virtual DbSet<RoleDashboardPeriodState> RoleDashboardPeriodStates { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Amenity>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Amenitie__3213E83FBD2AAAAE");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.IconUrl).HasColumnName("icon_url");
            entity.Property(e => e.Name)
                .HasMaxLength(255)
                .HasColumnName("name");
        });

        modelBuilder.Entity<Article>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Articles__3213E83FE73B7D9B");

            entity.HasIndex(e => e.Slug, "UQ__Articles__32DD1E4C0375A21D").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.AuthorId).HasColumnName("author_id");
            entity.Property(e => e.CategoryId).HasColumnName("category_id");
            entity.Property(e => e.Summary).HasColumnName("summary");
            entity.Property(e => e.Content).HasColumnName("content");
            entity.Property(e => e.IsPublished)
                .HasDefaultValue(false)
                .HasColumnName("is_published");
            entity.Property(e => e.PublishedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("published_at");
            entity.Property(e => e.Slug)
                .HasMaxLength(255)
                .HasColumnName("slug");
            entity.Property(e => e.ThumbnailUrl).HasColumnName("thumbnail_url");
            entity.Property(e => e.Title).HasColumnName("title");

            entity.HasOne(d => d.Author).WithMany(p => p.Articles)
                .HasForeignKey(d => d.AuthorId)
                .HasConstraintName("FK__Articles__author__51300E55");

            entity.HasOne(d => d.Category).WithMany(p => p.Articles)
                .HasForeignKey(d => d.CategoryId)
                .HasConstraintName("FK__Articles__catego__5224328E");
        });


        modelBuilder.Entity<ArticleCategory>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Article___3213E83F71C963D5");

            entity.ToTable("Article_Categories");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Name)
                .HasMaxLength(255)
                .HasColumnName("name");
        });

        modelBuilder.Entity<Attraction>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Attracti__3213E83FC7416AF1");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.DistanceKm)
                .HasColumnType("decimal(5, 2)")
                .HasColumnName("distance_km");
            entity.Property(e => e.ImageUrl).HasColumnName("image_url");
            entity.Property(e => e.MapEmbedLink).HasColumnName("map_embed_link");
            entity.Property(e => e.Name)
                .HasMaxLength(255)
                .HasColumnName("name");
            entity.Property(e => e.Category).HasColumnName("category").HasMaxLength(255);
            entity.Property(e => e.Latitude).HasColumnName("latitude").HasColumnType("decimal(9, 6)");
            entity.Property(e => e.Longitude).HasColumnName("longitude").HasColumnType("decimal(9, 6)");
        });

        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Audit_Lo__3213E83FC2A3F4BE");

            entity.ToTable("Audit_Logs");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Action)
                .HasMaxLength(50)
                .HasColumnName("action");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.NewValue).HasColumnName("new_value");
            entity.Property(e => e.OldValue).HasColumnName("old_value");
            entity.Property(e => e.RecordId).HasColumnName("record_id");
            entity.Property(e => e.TableName)
                .HasMaxLength(100)
                .HasColumnName("table_name");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.AuditLogs)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK__Audit_Log__user___531856C7");
        });

        modelBuilder.Entity<Booking>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Bookings__3213E83F1EDAA578");

            entity.HasIndex(e => e.BookingCode, "UQ__Bookings__FF29040F16585CE3").IsUnique();

            entity.HasIndex(e => e.BookingCode, "UQ__Bookings__FF29040FF71AC35D").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.BookingCode)
                .HasMaxLength(50)
                .HasColumnName("booking_code");
            entity.Property(e => e.GuestEmail)
                .HasMaxLength(255)
                .HasColumnName("guest_email");
            entity.Property(e => e.GuestName)
                .HasMaxLength(255)
                .HasColumnName("guest_name");
            entity.Property(e => e.GuestPhone)
                .HasMaxLength(50)
                .HasColumnName("guest_phone");
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasDefaultValue("Pending")
                .HasColumnName("status");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.VoucherId).HasColumnName("voucher_id");
            entity.Property(e => e.CreatedAt).HasColumnType("datetime").HasColumnName("created_at");

            entity.HasOne(d => d.User).WithMany(p => p.Bookings)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK__Bookings__user_i__06CD04F7");

            entity.HasOne(d => d.Voucher).WithMany(p => p.Bookings)
                .HasForeignKey(d => d.VoucherId)
                .HasConstraintName("FK__Bookings__vouche__07C12930");
        });

        modelBuilder.Entity<BookingDetail>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Booking___3213E83F9A5B3A64");

            entity.ToTable("Booking_Details");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.BookingId).HasColumnName("booking_id");
            entity.Property(e => e.CheckInDate)
                .HasColumnType("datetime")
                .HasColumnName("check_in_date");
            entity.Property(e => e.CheckOutDate)
                .HasColumnType("datetime")
                .HasColumnName("check_out_date");
            entity.Property(e => e.PricePerNight)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("price_per_night");
            entity.Property(e => e.RoomId).HasColumnName("room_id");
            entity.Property(e => e.RoomTypeId).HasColumnName("room_type_id");
            entity.Property(e => e.ActualCheckIn).HasColumnType("datetime").HasColumnName("actual_check_in");
            entity.Property(e => e.ActualCheckOut).HasColumnType("datetime").HasColumnName("actual_check_out");

            entity.HasOne(d => d.Booking).WithMany(p => p.BookingDetails)
                .HasForeignKey(d => d.BookingId)
                .HasConstraintName("FK__Booking_D__booki__03F0984C");

            entity.HasOne(d => d.Room).WithMany(p => p.BookingDetails)
                .HasForeignKey(d => d.RoomId)
                .HasConstraintName("FK__Booking_D__room___04E4BC85");

            entity.HasOne(d => d.RoomType).WithMany(p => p.BookingDetails)
                .HasForeignKey(d => d.RoomTypeId)
                .HasConstraintName("FK__Booking_D__room___05D8E0BE");
        });

        modelBuilder.Entity<Invoice>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Invoices__3213E83F0D30A246");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.BookingId).HasColumnName("booking_id");
            entity.Property(e => e.DiscountAmount)
                .HasDefaultValue(0m)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("discount_amount");
            entity.Property(e => e.FinalTotal)
                .HasDefaultValue(0m)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("final_total");
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasDefaultValue("Unpaid")
                .HasColumnName("status");
            entity.Property(e => e.TaxAmount)
                .HasDefaultValue(0m)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("tax_amount");
            entity.Property(e => e.TotalRoomAmount)
                .HasDefaultValue(0m)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("total_room_amount");
            entity.Property(e => e.TotalServiceAmount)
                .HasDefaultValue(0m)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("total_service_amount");

            entity.Property(e => e.CreatedAt)
                .HasColumnType("datetime")
                .HasColumnName("created_at");

            entity.HasOne(d => d.Booking).WithMany(p => p.Invoices)
                .HasForeignKey(d => d.BookingId)
                .HasConstraintName("FK__Invoices__bookin__58D1301D");
        });

        modelBuilder.Entity<LossAndDamage>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Loss_And__3213E83FA34FFDFF");

            entity.ToTable("Loss_And_Damages");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.BookingDetailId).HasColumnName("booking_detail_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.PenaltyAmount)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("penalty_amount");
            entity.Property(e => e.Quantity).HasColumnName("quantity");
            entity.Property(e => e.RoomInventoryId).HasColumnName("room_inventory_id");

            entity.HasOne(d => d.BookingDetail).WithMany(p => p.LossAndDamages)
                .HasForeignKey(d => d.BookingDetailId)
                .HasConstraintName("FK__Loss_And___booki__59C55456");

            entity.HasOne(d => d.RoomInventory).WithMany(p => p.LossAndDamages)
                .HasForeignKey(d => d.RoomInventoryId)
                .HasConstraintName("FK__Loss_And___room___5AB9788F");
        });

        modelBuilder.Entity<Membership>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Membersh__3213E83F173B8B61");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.DiscountPercent)
                .HasDefaultValue(0.00m)
                .HasColumnType("decimal(5, 2)")
                .HasColumnName("discount_percent");
            entity.Property(e => e.MinPoints)
                .HasDefaultValue(0)
                .HasColumnName("min_points");
            entity.Property(e => e.TierName)
                .HasMaxLength(100)
                .HasColumnName("tier_name");
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK_Notifications");

            entity.ToTable("Notifications");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.Title)
                .HasMaxLength(255)
                .HasColumnName("title");
            entity.Property(e => e.Content).HasColumnName("content");
            entity.Property(e => e.Type)
                .HasMaxLength(50)
                .HasColumnName("type");
            entity.Property(e => e.ReferenceLink)
                .HasMaxLength(255)
                .HasColumnName("reference_link");
            entity.Property(e => e.IsRead)
                .HasDefaultValue(false)
                .HasColumnName("is_read");
            entity.Property(e => e.CreatedAt)
                .HasColumnType("datetime")
                .HasColumnName("created_at");

            entity.HasOne(d => d.User).WithMany(p => p.Notifications)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK__Notificat__user___43210ABC");
        });

        modelBuilder.Entity<OrderService>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Order_Se__3213E83F6F6B15EA");

            entity.ToTable("Order_Services");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.BookingDetailId).HasColumnName("booking_detail_id");
            entity.Property(e => e.OrderDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("order_date");
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasDefaultValue("Pending")
                .HasColumnName("status");
            entity.Property(e => e.TotalAmount)
                .HasDefaultValue(0m)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("total_amount");

            entity.HasOne(d => d.BookingDetail).WithMany(p => p.OrderServices)
                .HasForeignKey(d => d.BookingDetailId)
                .HasConstraintName("FK__Order_Ser__booki__0D7A0286");
        });

        modelBuilder.Entity<OrderServiceDetail>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Order_Se__3213E83FC1F51539");

            entity.ToTable("Order_Service_Details");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.OrderServiceId).HasColumnName("order_service_id");
            entity.Property(e => e.Quantity).HasColumnName("quantity");
            entity.Property(e => e.ServiceId).HasColumnName("service_id");
            entity.Property(e => e.UnitPrice)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("unit_price");

            entity.HasOne(d => d.OrderService).WithMany(p => p.OrderServiceDetails)
                .HasForeignKey(d => d.OrderServiceId)
                .HasConstraintName("FK__Order_Ser__order__5BAD9CC8");

            entity.HasOne(d => d.Service).WithMany(p => p.OrderServiceDetails)
                .HasForeignKey(d => d.ServiceId)
                .HasConstraintName("FK__Order_Ser__servi__5CA1C101");
        });

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Payments__3213E83FE485D877");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.AmountPaid)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("amount_paid");
            entity.Property(e => e.InvoiceId).HasColumnName("invoice_id");
            entity.Property(e => e.PaymentDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("payment_date");
            entity.Property(e => e.PaymentMethod)
                .HasMaxLength(50)
                .HasColumnName("payment_method");
            entity.Property(e => e.TransactionCode)
                .HasMaxLength(100)
                .HasColumnName("transaction_code");

            entity.HasOne(d => d.Invoice).WithMany(p => p.Payments)
                .HasForeignKey(d => d.InvoiceId)
                .HasConstraintName("FK__Payments__invoic__5E8A0973");
        });

        modelBuilder.Entity<Permission>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Permissi__3213E83F8B67CE9B");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .HasColumnName("name");
        });

        modelBuilder.Entity<Review>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Reviews__3213E83FBACFB23F");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Comment).HasColumnName("comment");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.Rating).HasColumnName("rating");
            entity.Property(e => e.RoomTypeId).HasColumnName("room_type_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.IsApproved)
                .HasDefaultValue(false)
                .HasColumnName("is_approved");

            entity.HasOne(d => d.RoomType).WithMany(p => p.Reviews)
                .HasForeignKey(d => d.RoomTypeId)
                .HasConstraintName("FK__Reviews__room_ty__5F7E2DAC");

            entity.HasOne(d => d.User).WithMany(p => p.Reviews)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK__Reviews__user_id__607251E5");
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Roles__3213E83F6EA2DBE0");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .HasColumnName("name");

            entity.HasMany(d => d.Permissions).WithMany(p => p.Roles)
                .UsingEntity<Dictionary<string, object>>(
                    "RolePermission",
                    r => r.HasOne<Permission>().WithMany()
                        .HasForeignKey("PermissionId")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("FK__Role_Perm__permi__6166761E"),
                    l => l.HasOne<Role>().WithMany()
                        .HasForeignKey("RoleId")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("FK__Role_Perm__role___625A9A57"),
                    j =>
                    {
                        j.HasKey("RoleId", "PermissionId").HasName("PK__Role_Per__C85A546370DE4C7D");
                        j.ToTable("Role_Permissions");
                        j.IndexerProperty<int>("RoleId").HasColumnName("role_id");
                        j.IndexerProperty<int>("PermissionId").HasColumnName("permission_id");
                    });
        });

        modelBuilder.Entity<Room>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Rooms__3213E83F2CCEEBC3");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Floor).HasColumnName("floor");
            entity.Property(e => e.RoomNumber)
                .HasMaxLength(50)
                .HasColumnName("room_number");
            entity.Property(e => e.RoomTypeId).HasColumnName("room_type_id");
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasDefaultValue("Available")
                .HasColumnName("status");

            entity.Property(e => e.CleaningStatus)
                .HasMaxLength(50)
                .HasColumnName("cleaning_status");

            entity.HasOne(d => d.RoomType).WithMany(p => p.Rooms)
                .HasForeignKey(d => d.RoomTypeId)
                .HasConstraintName("FK__Rooms__room_type__151B244E");
        });

        modelBuilder.Entity<RoomImage>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Room_Ima__3213E83F94AF0BB6");

            entity.ToTable("Room_Images");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ImageUrl).HasColumnName("image_url");
            entity.Property(e => e.IsPrimary)
                .HasDefaultValue(false)
                .HasColumnName("is_primary");
            entity.Property(e => e.RoomTypeId).HasColumnName("room_type_id");

            entity.HasOne(d => d.RoomType).WithMany(p => p.RoomImages)
                .HasForeignKey(d => d.RoomTypeId)
                .HasConstraintName("FK__Room_Imag__room___634EBE90");
        });

        modelBuilder.Entity<RoomInventory>(entity =>
{
    entity.HasKey(e => e.Id).HasName("PK__Room_Inv__3213E83F33B187F1");

    entity.ToTable("Room_Inventory");

    entity.Property(e => e.Id).HasColumnName("id");
    entity.Property(e => e.RoomId).HasColumnName("room_id");
    entity.Property(e => e.Quantity)
        .HasDefaultValue(1)
        .HasColumnName("quantity");
    entity.Property(e => e.PriceIfLost)
        .HasDefaultValue(0m)
        .HasColumnType("decimal(18, 2)")
        .HasColumnName("price_if_lost");
    entity.Property(e => e.Note).HasColumnName("note");
    entity.Property(e => e.IsActive).HasColumnName("is_active");
    entity.Property(e => e.ItemType).HasColumnName("item_type");
    entity.Property(e => e.EquipmentId).HasColumnName("EquipmentId");

    entity.HasOne(d => d.Room).WithMany(p => p.RoomInventories)
        .HasForeignKey(d => d.RoomId)
        .HasConstraintName("FK__Room_Inve__room___14270015");
});

        modelBuilder.Entity<RoomType>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Room_Typ__3213E83FF97313CB");

            entity.ToTable("Room_Types");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.BasePrice)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("base_price");
            entity.Property(e => e.CapacityAdults).HasColumnName("capacity_adults");
            entity.Property(e => e.CapacityChildren).HasColumnName("capacity_children");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.Name)
                .HasMaxLength(255)
                .HasColumnName("name");

            entity.HasMany(d => d.Amenities).WithMany(p => p.RoomTypes)
                .UsingEntity<Dictionary<string, object>>(
                    "RoomTypeAmenity",
                    r => r.HasOne<Amenity>().WithMany()
                        .HasForeignKey("AmenityId")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("FK__RoomType___ameni__662B2B3B"),
                    l => l.HasOne<RoomType>().WithMany()
                        .HasForeignKey("RoomTypeId")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("FK__RoomType___room___671F4F74"),
                    j =>
                    {
                        j.HasKey("RoomTypeId", "AmenityId").HasName("PK__RoomType__8CA9DAD6AB9CB1C3");
                        j.ToTable("RoomType_Amenities");
                        j.IndexerProperty<int>("RoomTypeId").HasColumnName("room_type_id");
                        j.IndexerProperty<int>("AmenityId").HasColumnName("amenity_id");
                    });
        });

        modelBuilder.Entity<Service>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Services__3213E83F337130E4");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CategoryId).HasColumnName("category_id");
            entity.Property(e => e.Name)
                .HasMaxLength(255)
                .HasColumnName("name");
            entity.Property(e => e.Price)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("price");
            entity.Property(e => e.Unit)
                .HasMaxLength(50)
                .HasColumnName("unit");

            entity.HasOne(d => d.Category).WithMany(p => p.Services)
                .HasForeignKey(d => d.CategoryId)
                .HasConstraintName("FK__Services__catego__17F790F9");
        });

        modelBuilder.Entity<ServiceCategory>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Service___3213E83F59480DC6");

            entity.ToTable("Service_Categories");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Name)
                .HasMaxLength(255)
                .HasColumnName("name");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Users__3213E83F1887AADB");

            entity.HasIndex(e => e.Email, "UQ__Users__AB6E61640F3C79AE").IsUnique();

            entity.HasIndex(e => e.Email, "UQ__Users__AB6E6164DB0B057E").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Email)
                .HasMaxLength(255)
                .HasColumnName("email");
            entity.Property(e => e.FullName)
                .HasMaxLength(255)
                .HasColumnName("full_name");
            entity.Property(e => e.MembershipId).HasColumnName("membership_id");
            entity.Property(e => e.PasswordHash).HasColumnName("password_hash");
            entity.Property(e => e.Phone)
                .HasMaxLength(50)
                .HasColumnName("phone");
            entity.Property(e => e.RoleId).HasColumnName("role_id");
            entity.Property(e => e.Status)
                .HasDefaultValue(true)
                .HasColumnName("status");

            entity.Property(e => e.CreatedAt)
                .HasColumnType("datetime")
                .HasColumnName("created_at");

            entity.HasOne(d => d.Membership).WithMany(p => p.Users)
                .HasForeignKey(d => d.MembershipId)
                .HasConstraintName("FK__Users__membershi__18EBB532");

            entity.HasOne(d => d.Role).WithMany(p => p.Users)
                .HasForeignKey(d => d.RoleId)
                .HasConstraintName("FK__Users__role_id__19DFD96B");
        });

        modelBuilder.Entity<Voucher>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Vouchers__3213E83F4BACC0A7");

            entity.HasIndex(e => e.Code, "UQ__Vouchers__357D4CF932BA9E56").IsUnique();

            entity.HasIndex(e => e.Code, "UQ__Vouchers__357D4CF97FB14D96").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Code)
                .HasMaxLength(50)
                .HasColumnName("code");
            entity.Property(e => e.DiscountType)
                .HasMaxLength(50)
                .HasColumnName("discount_type");
            entity.Property(e => e.DiscountValue)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("discount_value");
            entity.Property(e => e.MinBookingValue)
                .HasDefaultValue(0m)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("min_booking_value");
            entity.Property(e => e.UsageLimit).HasColumnName("usage_limit");
            entity.Property(e => e.ValidFrom)
                .HasColumnType("datetime")
                .HasColumnName("valid_from");
            entity.Property(e => e.ValidTo)
                .HasColumnType("datetime")
                .HasColumnName("valid_to");
        });

        modelBuilder.Entity<RoleDashboardPeriodState>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK_Role_Dashboard_Period_States");

            entity.ToTable("Role_Dashboard_Period_States");

            entity.Property(e => e.Id).HasColumnName("id").UseIdentityColumn();
            entity.Property(e => e.RoleId).HasColumnName("role_id");
            entity.Property(e => e.RoleName).HasMaxLength(100).HasColumnName("role_name");
            entity.Property(e => e.DashboardCode).HasMaxLength(100).HasColumnName("dashboard_code");
            entity.Property(e => e.DashboardTitle).HasMaxLength(255).HasColumnName("dashboard_title");
            entity.Property(e => e.PeriodType).HasMaxLength(20).HasColumnName("period_type");
            entity.Property(e => e.PeriodKey).HasMaxLength(30).HasColumnName("period_key");
            entity.Property(e => e.PeriodStart).HasColumnName("period_start");
            entity.Property(e => e.PeriodEnd).HasColumnName("period_end");
            entity.Property(e => e.DashboardJson).HasColumnName("dashboard_json");
            entity.Property(e => e.ComparisonJson).HasColumnName("comparison_json");
            entity.Property(e => e.Status).HasMaxLength(20).HasColumnName("status").HasDefaultValue("OPEN");
            entity.Property(e => e.IsCurrent).HasColumnName("is_current").HasDefaultValue(false);
            entity.Property(e => e.LastEventType).HasMaxLength(100).HasColumnName("last_event_type");
            entity.Property(e => e.LastEventSource).HasMaxLength(100).HasColumnName("last_event_source");
            entity.Property(e => e.LastEventRefId).HasColumnName("last_event_ref_id");
            entity.Property(e => e.Version).HasColumnName("version").HasDefaultValue(1);
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("SYSUTCDATETIME()");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("SYSUTCDATETIME()");
            entity.Property(e => e.ClosedAt).HasColumnName("closed_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");

            entity.HasOne(d => d.Role).WithMany()
                .HasForeignKey(d => d.RoleId)
                .HasConstraintName("FK_RoleDashboardPeriod_Roles");

            entity.HasOne(d => d.UpdatedByUser).WithMany()
                .HasForeignKey(d => d.UpdatedBy)
                .HasConstraintName("FK_RoleDashboardPeriod_UpdatedBy")
                .IsRequired(false);
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
