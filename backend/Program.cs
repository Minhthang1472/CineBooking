using Microsoft.EntityFrameworkCore;
using HotelManagementApi.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.OpenApi.Models;

using HotelManagementApi.Filters;
using HotelManagementApi.Services;

var builder = WebApplication.CreateBuilder(args);

// 1. Thêm dịch vụ Controllers và TRỊ BỆNH VÒNG LẶP VÔ TẬN
builder.Services.AddControllers(options =>
{
    // Đăng ký AuditLogFilter toàn cục - tự động log mọi hành động tạo/sửa/xóa
    options.Filters.Add<AuditLogFilter>();
}).AddJsonOptions(options =>
{
    // Bỏ qua các đối tượng bị lặp lại, không cố gắng đào sâu vào chúng nữa
    options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
});

// 2. Đăng ký DbContext kết nối với SQL Server
builder.Services.AddDbContext<HotelDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// 3. Đăng ký Dashboard Service
builder.Services.AddScoped<IRoleDashboardPeriodService, RoleDashboardPeriodService>();

// 4. Đăng ký HttpClient cho MoMo
builder.Services.AddHttpClient();


// ================= CẤU HÌNH JWT AUTHENTICATION =================
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });

// ================= MỞ CỬA CORS CHO FRONTEND REACT =================
// ĐOẠN NÀY LÚC NÃY BẠN BỊ THIẾU NÈ:
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
    {
        policy.SetIsOriginAllowed(origin => true) // Chấp nhận mọi nguồn gọi tới (cực kỳ an toàn cho lúc code ở nhà)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // Bắt buộc có để truyền Token và SignalR
    });
});
// ==================================================================

builder.Services.AddEndpointsApiExplorer();

// ================= GẮN Ổ KHÓA CHO SWAGGER =================
builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Nhập token theo định dạng: Bearer {token}",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            new string[] {}
        }
    });
});

var app = builder.Build();

// Cấu hình HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

// QUAN TRỌNG: UseRouting phải nằm TRƯỚC UseCors
app.UseRouting();

// BẬT CÔNG TẮC CORS (Đã được định nghĩa ở trên)
app.UseCors("AllowReact");

// QUAN TRỌNG: Phải có UseAuthentication TRƯỚC UseAuthorization
app.UseAuthentication(); 
app.UseAuthorization();

// 3. Map các route tới Controllers
app.MapControllers();

app.Run();