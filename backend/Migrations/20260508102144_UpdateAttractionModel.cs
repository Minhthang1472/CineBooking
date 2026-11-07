using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HotelManagementApi.Migrations
{
    /// <inheritdoc />
    public partial class UpdateAttractionModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Amenities",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    icon_url = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Amenitie__3213E83FBD2AAAAE", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "Article_Categories",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Article___3213E83F71C963D5", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "Attractions",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    distance_km = table.Column<decimal>(type: "decimal(5,2)", nullable: true),
                    description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    map_embed_link = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Attracti__3213E83FC7416AF1", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "Equipments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ItemCode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Category = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Unit = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    TotalQuantity = table.Column<int>(type: "int", nullable: false),
                    InUseQuantity = table.Column<int>(type: "int", nullable: false),
                    DamagedQuantity = table.Column<int>(type: "int", nullable: false),
                    LiquidatedQuantity = table.Column<int>(type: "int", nullable: false),
                    InStockQuantity = table.Column<int>(type: "int", nullable: false),
                    BasePrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    DefaultPriceIfLost = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Supplier = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ImageUrl = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Equipments", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Memberships",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    tier_name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    min_points = table.Column<int>(type: "int", nullable: true, defaultValue: 0),
                    discount_percent = table.Column<decimal>(type: "decimal(5,2)", nullable: true, defaultValue: 0.00m)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Membersh__3213E83F173B8B61", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "Permissions",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Permissi__3213E83F8B67CE9B", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "Roles",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Roles__3213E83F6EA2DBE0", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "Room_Types",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    base_price = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    capacity_adults = table.Column<int>(type: "int", nullable: false),
                    capacity_children = table.Column<int>(type: "int", nullable: false),
                    description = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Room_Typ__3213E83FF97313CB", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "Service_Categories",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Service___3213E83F59480DC6", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "Vouchers",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    discount_type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    discount_value = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    min_booking_value = table.Column<decimal>(type: "decimal(18,2)", nullable: true, defaultValue: 0m),
                    valid_from = table.Column<DateTime>(type: "datetime", nullable: true),
                    valid_to = table.Column<DateTime>(type: "datetime", nullable: true),
                    usage_limit = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Vouchers__3213E83F4BACC0A7", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "Role_Permissions",
                columns: table => new
                {
                    role_id = table.Column<int>(type: "int", nullable: false),
                    permission_id = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Role_Per__C85A546370DE4C7D", x => new { x.role_id, x.permission_id });
                    table.ForeignKey(
                        name: "FK__Role_Perm__permi__6166761E",
                        column: x => x.permission_id,
                        principalTable: "Permissions",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK__Role_Perm__role___625A9A57",
                        column: x => x.role_id,
                        principalTable: "Roles",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    role_id = table.Column<int>(type: "int", nullable: true),
                    membership_id = table.Column<int>(type: "int", nullable: true),
                    full_name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    email = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    phone = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    password_hash = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    status = table.Column<bool>(type: "bit", nullable: true, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Users__3213E83F1887AADB", x => x.id);
                    table.ForeignKey(
                        name: "FK__Users__membershi__18EBB532",
                        column: x => x.membership_id,
                        principalTable: "Memberships",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK__Users__role_id__19DFD96B",
                        column: x => x.role_id,
                        principalTable: "Roles",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "Room_Images",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    room_type_id = table.Column<int>(type: "int", nullable: true),
                    image_url = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    is_primary = table.Column<bool>(type: "bit", nullable: true, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Room_Ima__3213E83F94AF0BB6", x => x.id);
                    table.ForeignKey(
                        name: "FK__Room_Imag__room___634EBE90",
                        column: x => x.room_type_id,
                        principalTable: "Room_Types",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "Rooms",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    room_type_id = table.Column<int>(type: "int", nullable: true),
                    room_number = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    floor = table.Column<int>(type: "int", nullable: true),
                    status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true, defaultValue: "Available")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Rooms__3213E83F2CCEEBC3", x => x.id);
                    table.ForeignKey(
                        name: "FK__Rooms__room_type__151B244E",
                        column: x => x.room_type_id,
                        principalTable: "Room_Types",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "RoomType_Amenities",
                columns: table => new
                {
                    room_type_id = table.Column<int>(type: "int", nullable: false),
                    amenity_id = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__RoomType__8CA9DAD6AB9CB1C3", x => new { x.room_type_id, x.amenity_id });
                    table.ForeignKey(
                        name: "FK__RoomType___ameni__662B2B3B",
                        column: x => x.amenity_id,
                        principalTable: "Amenities",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK__RoomType___room___671F4F74",
                        column: x => x.room_type_id,
                        principalTable: "Room_Types",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "Services",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    category_id = table.Column<int>(type: "int", nullable: true),
                    name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    price = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    unit = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Services__3213E83F337130E4", x => x.id);
                    table.ForeignKey(
                        name: "FK__Services__catego__17F790F9",
                        column: x => x.category_id,
                        principalTable: "Service_Categories",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "Articles",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    category_id = table.Column<int>(type: "int", nullable: true),
                    author_id = table.Column<int>(type: "int", nullable: true),
                    title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    slug = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    content = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    thumbnail_url = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    published_at = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Articles__3213E83FE73B7D9B", x => x.id);
                    table.ForeignKey(
                        name: "FK__Articles__author__51300E55",
                        column: x => x.author_id,
                        principalTable: "Users",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK__Articles__catego__5224328E",
                        column: x => x.category_id,
                        principalTable: "Article_Categories",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "Audit_Logs",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    user_id = table.Column<int>(type: "int", nullable: true),
                    action = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    table_name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    record_id = table.Column<int>(type: "int", nullable: false),
                    old_value = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    new_value = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Audit_Lo__3213E83FC2A3F4BE", x => x.id);
                    table.ForeignKey(
                        name: "FK__Audit_Log__user___531856C7",
                        column: x => x.user_id,
                        principalTable: "Users",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "Bookings",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    user_id = table.Column<int>(type: "int", nullable: true),
                    guest_name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    guest_phone = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    guest_email = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    booking_code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    voucher_id = table.Column<int>(type: "int", nullable: true),
                    status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true, defaultValue: "Pending")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Bookings__3213E83F1EDAA578", x => x.id);
                    table.ForeignKey(
                        name: "FK__Bookings__user_i__06CD04F7",
                        column: x => x.user_id,
                        principalTable: "Users",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK__Bookings__vouche__07C12930",
                        column: x => x.voucher_id,
                        principalTable: "Vouchers",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    user_id = table.Column<int>(type: "int", nullable: true),
                    title = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    content = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    reference_link = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    is_read = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    created_at = table.Column<DateTime>(type: "datetime", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.id);
                    table.ForeignKey(
                        name: "FK__Notificat__user___43210ABC",
                        column: x => x.user_id,
                        principalTable: "Users",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "Reviews",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    user_id = table.Column<int>(type: "int", nullable: true),
                    room_type_id = table.Column<int>(type: "int", nullable: true),
                    rating = table.Column<int>(type: "int", nullable: true),
                    comment = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Reviews__3213E83FBACFB23F", x => x.id);
                    table.ForeignKey(
                        name: "FK__Reviews__room_ty__5F7E2DAC",
                        column: x => x.room_type_id,
                        principalTable: "Room_Types",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK__Reviews__user_id__607251E5",
                        column: x => x.user_id,
                        principalTable: "Users",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "Room_Inventory",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    room_id = table.Column<int>(type: "int", nullable: true),
                    quantity = table.Column<int>(type: "int", nullable: true, defaultValue: 1),
                    price_if_lost = table.Column<decimal>(type: "decimal(18,2)", nullable: true, defaultValue: 0m),
                    note = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    is_active = table.Column<bool>(type: "bit", nullable: true),
                    item_type = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    EquipmentId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Room_Inv__3213E83F33B187F1", x => x.id);
                    table.ForeignKey(
                        name: "FK_Room_Inventory_Equipments_EquipmentId",
                        column: x => x.EquipmentId,
                        principalTable: "Equipments",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK__Room_Inve__room___14270015",
                        column: x => x.room_id,
                        principalTable: "Rooms",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "Booking_Details",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    booking_id = table.Column<int>(type: "int", nullable: true),
                    room_id = table.Column<int>(type: "int", nullable: true),
                    room_type_id = table.Column<int>(type: "int", nullable: true),
                    check_in_date = table.Column<DateTime>(type: "datetime", nullable: false),
                    check_out_date = table.Column<DateTime>(type: "datetime", nullable: false),
                    price_per_night = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Booking___3213E83F9A5B3A64", x => x.id);
                    table.ForeignKey(
                        name: "FK__Booking_D__booki__03F0984C",
                        column: x => x.booking_id,
                        principalTable: "Bookings",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK__Booking_D__room___04E4BC85",
                        column: x => x.room_id,
                        principalTable: "Rooms",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK__Booking_D__room___05D8E0BE",
                        column: x => x.room_type_id,
                        principalTable: "Room_Types",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "Invoices",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    booking_id = table.Column<int>(type: "int", nullable: true),
                    total_room_amount = table.Column<decimal>(type: "decimal(18,2)", nullable: true, defaultValue: 0m),
                    total_service_amount = table.Column<decimal>(type: "decimal(18,2)", nullable: true, defaultValue: 0m),
                    discount_amount = table.Column<decimal>(type: "decimal(18,2)", nullable: true, defaultValue: 0m),
                    tax_amount = table.Column<decimal>(type: "decimal(18,2)", nullable: true, defaultValue: 0m),
                    final_total = table.Column<decimal>(type: "decimal(18,2)", nullable: true, defaultValue: 0m),
                    status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true, defaultValue: "Unpaid")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Invoices__3213E83F0D30A246", x => x.id);
                    table.ForeignKey(
                        name: "FK__Invoices__bookin__58D1301D",
                        column: x => x.booking_id,
                        principalTable: "Bookings",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "Loss_And_Damages",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    booking_detail_id = table.Column<int>(type: "int", nullable: true),
                    room_inventory_id = table.Column<int>(type: "int", nullable: true),
                    quantity = table.Column<int>(type: "int", nullable: false),
                    penalty_amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Loss_And__3213E83FA34FFDFF", x => x.id);
                    table.ForeignKey(
                        name: "FK__Loss_And___booki__59C55456",
                        column: x => x.booking_detail_id,
                        principalTable: "Booking_Details",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK__Loss_And___room___5AB9788F",
                        column: x => x.room_inventory_id,
                        principalTable: "Room_Inventory",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "Order_Services",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    booking_detail_id = table.Column<int>(type: "int", nullable: true),
                    order_date = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())"),
                    total_amount = table.Column<decimal>(type: "decimal(18,2)", nullable: true, defaultValue: 0m),
                    status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true, defaultValue: "Pending")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Order_Se__3213E83F6F6B15EA", x => x.id);
                    table.ForeignKey(
                        name: "FK__Order_Ser__booki__0D7A0286",
                        column: x => x.booking_detail_id,
                        principalTable: "Booking_Details",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "Payments",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    invoice_id = table.Column<int>(type: "int", nullable: true),
                    payment_method = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    amount_paid = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    transaction_code = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    payment_date = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Payments__3213E83FE485D877", x => x.id);
                    table.ForeignKey(
                        name: "FK__Payments__invoic__5E8A0973",
                        column: x => x.invoice_id,
                        principalTable: "Invoices",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "Order_Service_Details",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    order_service_id = table.Column<int>(type: "int", nullable: true),
                    service_id = table.Column<int>(type: "int", nullable: true),
                    quantity = table.Column<int>(type: "int", nullable: false),
                    unit_price = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Order_Se__3213E83FC1F51539", x => x.id);
                    table.ForeignKey(
                        name: "FK__Order_Ser__order__5BAD9CC8",
                        column: x => x.order_service_id,
                        principalTable: "Order_Services",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK__Order_Ser__servi__5CA1C101",
                        column: x => x.service_id,
                        principalTable: "Services",
                        principalColumn: "id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Articles_author_id",
                table: "Articles",
                column: "author_id");

            migrationBuilder.CreateIndex(
                name: "IX_Articles_category_id",
                table: "Articles",
                column: "category_id");

            migrationBuilder.CreateIndex(
                name: "UQ__Articles__32DD1E4C0375A21D",
                table: "Articles",
                column: "slug",
                unique: true,
                filter: "[slug] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Audit_Logs_user_id",
                table: "Audit_Logs",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_Booking_Details_booking_id",
                table: "Booking_Details",
                column: "booking_id");

            migrationBuilder.CreateIndex(
                name: "IX_Booking_Details_room_id",
                table: "Booking_Details",
                column: "room_id");

            migrationBuilder.CreateIndex(
                name: "IX_Booking_Details_room_type_id",
                table: "Booking_Details",
                column: "room_type_id");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_user_id",
                table: "Bookings",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_voucher_id",
                table: "Bookings",
                column: "voucher_id");

            migrationBuilder.CreateIndex(
                name: "UQ__Bookings__FF29040F16585CE3",
                table: "Bookings",
                column: "booking_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ__Bookings__FF29040FF71AC35D",
                table: "Bookings",
                column: "booking_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_booking_id",
                table: "Invoices",
                column: "booking_id");

            migrationBuilder.CreateIndex(
                name: "IX_Loss_And_Damages_booking_detail_id",
                table: "Loss_And_Damages",
                column: "booking_detail_id");

            migrationBuilder.CreateIndex(
                name: "IX_Loss_And_Damages_room_inventory_id",
                table: "Loss_And_Damages",
                column: "room_inventory_id");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_user_id",
                table: "Notifications",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_Order_Service_Details_order_service_id",
                table: "Order_Service_Details",
                column: "order_service_id");

            migrationBuilder.CreateIndex(
                name: "IX_Order_Service_Details_service_id",
                table: "Order_Service_Details",
                column: "service_id");

            migrationBuilder.CreateIndex(
                name: "IX_Order_Services_booking_detail_id",
                table: "Order_Services",
                column: "booking_detail_id");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_invoice_id",
                table: "Payments",
                column: "invoice_id");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_room_type_id",
                table: "Reviews",
                column: "room_type_id");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_user_id",
                table: "Reviews",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_Role_Permissions_permission_id",
                table: "Role_Permissions",
                column: "permission_id");

            migrationBuilder.CreateIndex(
                name: "IX_Room_Images_room_type_id",
                table: "Room_Images",
                column: "room_type_id");

            migrationBuilder.CreateIndex(
                name: "IX_Room_Inventory_EquipmentId",
                table: "Room_Inventory",
                column: "EquipmentId");

            migrationBuilder.CreateIndex(
                name: "IX_Room_Inventory_room_id",
                table: "Room_Inventory",
                column: "room_id");

            migrationBuilder.CreateIndex(
                name: "IX_Rooms_room_type_id",
                table: "Rooms",
                column: "room_type_id");

            migrationBuilder.CreateIndex(
                name: "IX_RoomType_Amenities_amenity_id",
                table: "RoomType_Amenities",
                column: "amenity_id");

            migrationBuilder.CreateIndex(
                name: "IX_Services_category_id",
                table: "Services",
                column: "category_id");

            migrationBuilder.CreateIndex(
                name: "IX_Users_membership_id",
                table: "Users",
                column: "membership_id");

            migrationBuilder.CreateIndex(
                name: "IX_Users_role_id",
                table: "Users",
                column: "role_id");

            migrationBuilder.CreateIndex(
                name: "UQ__Users__AB6E61640F3C79AE",
                table: "Users",
                column: "email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ__Users__AB6E6164DB0B057E",
                table: "Users",
                column: "email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ__Vouchers__357D4CF932BA9E56",
                table: "Vouchers",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ__Vouchers__357D4CF97FB14D96",
                table: "Vouchers",
                column: "code",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Articles");

            migrationBuilder.DropTable(
                name: "Attractions");

            migrationBuilder.DropTable(
                name: "Audit_Logs");

            migrationBuilder.DropTable(
                name: "Loss_And_Damages");

            migrationBuilder.DropTable(
                name: "Notifications");

            migrationBuilder.DropTable(
                name: "Order_Service_Details");

            migrationBuilder.DropTable(
                name: "Payments");

            migrationBuilder.DropTable(
                name: "Reviews");

            migrationBuilder.DropTable(
                name: "Role_Permissions");

            migrationBuilder.DropTable(
                name: "Room_Images");

            migrationBuilder.DropTable(
                name: "RoomType_Amenities");

            migrationBuilder.DropTable(
                name: "Article_Categories");

            migrationBuilder.DropTable(
                name: "Room_Inventory");

            migrationBuilder.DropTable(
                name: "Order_Services");

            migrationBuilder.DropTable(
                name: "Services");

            migrationBuilder.DropTable(
                name: "Invoices");

            migrationBuilder.DropTable(
                name: "Permissions");

            migrationBuilder.DropTable(
                name: "Amenities");

            migrationBuilder.DropTable(
                name: "Equipments");

            migrationBuilder.DropTable(
                name: "Booking_Details");

            migrationBuilder.DropTable(
                name: "Service_Categories");

            migrationBuilder.DropTable(
                name: "Bookings");

            migrationBuilder.DropTable(
                name: "Rooms");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "Vouchers");

            migrationBuilder.DropTable(
                name: "Room_Types");

            migrationBuilder.DropTable(
                name: "Memberships");

            migrationBuilder.DropTable(
                name: "Roles");
        }
    }
}
