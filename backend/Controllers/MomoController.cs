using HotelManagementApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace HotelManagementApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MomoController : ControllerBase
    {
        private readonly HotelDbContext _context;
        private readonly IConfiguration _config;
        private readonly IHttpClientFactory _httpClientFactory;

        public MomoController(HotelDbContext context, IConfiguration config, IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _config = config;
            _httpClientFactory = httpClientFactory;
        }

        // ─── POST /api/momo/create-payment ─────────────────────────────
        // Frontend gọi endpoint này để lấy payUrl từ MoMo
        [HttpPost("create-payment")]
        public async Task<IActionResult> CreatePayment([FromBody] MomoCreateRequest req)
        {
            var partnerCode = _config["MoMo:PartnerCode"]!;
            var accessKey   = _config["MoMo:AccessKey"]!;
            var secretKey   = _config["MoMo:SecretKey"]!;
            var endpoint    = _config["MoMo:Endpoint"]!;
            var redirectUrl = _config["MoMo:RedirectUrl"]!;
            var ipnUrl      = _config["MoMo:IpnUrl"]!;
            var requestType = _config["MoMo:RequestType"] ?? "captureWallet";

            // Tạo orderId duy nhất = MOMO + timestamp + invoiceId
            var orderId   = $"MOMO{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}INV{req.InvoiceId}";
            var requestId = orderId;
            var orderInfo = req.OrderInfo ?? $"Thanh toan hoa don #{req.InvoiceId}";
            var amount    = req.Amount.ToString();
            var extraData = "";

            // Tạo raw signature theo chuẩn MoMo
            var rawSignature =
                $"accessKey={accessKey}" +
                $"&amount={amount}" +
                $"&extraData={extraData}" +
                $"&ipnUrl={ipnUrl}" +
                $"&orderId={orderId}" +
                $"&orderInfo={orderInfo}" +
                $"&partnerCode={partnerCode}" +
                $"&redirectUrl={redirectUrl}" +
                $"&requestId={requestId}" +
                $"&requestType={requestType}";

            var signature = HmacSha256(secretKey, rawSignature);

            // Gọi MoMo API
            var body = new
            {
                partnerCode,
                accessKey,
                requestId,
                amount,
                orderId,
                orderInfo,
                redirectUrl,
                ipnUrl,
                extraData,
                requestType,
                signature,
                lang = "vi"
            };

            var client = _httpClientFactory.CreateClient();
            var jsonBody = JsonSerializer.Serialize(body);
            var content = new StringContent(jsonBody, Encoding.UTF8, "application/json");

            var response = await client.PostAsync(endpoint, content);
            var responseStr = await response.Content.ReadAsStringAsync();

            using var doc = JsonDocument.Parse(responseStr);
            var root = doc.RootElement;

            int resultCode = root.TryGetProperty("resultCode", out var rc) ? rc.GetInt32() : -1;
            string payUrl  = root.TryGetProperty("payUrl", out var pu) ? pu.GetString() ?? "" : "";
            string message = root.TryGetProperty("message", out var msg) ? msg.GetString() ?? "" : "";

            if (resultCode != 0)
            {
                return BadRequest(new { resultCode, message, raw = responseStr });
            }

            return Ok(new
            {
                payUrl,
                orderId,
                resultCode,
                message
            });
        }

        // ─── POST /api/momo/callback ─────────────────────────────────────
        // MoMo gọi IPN vào đây sau khi thanh toán xong
        [HttpPost("callback")]
        public async Task<IActionResult> Callback([FromBody] MomoCallbackPayload payload)
        {
            // Verify signature từ MoMo
            var secretKey = _config["MoMo:SecretKey"]!;
            var accessKey = _config["MoMo:AccessKey"]!;

            var rawSignature =
                $"accessKey={accessKey}" +
                $"&amount={payload.Amount}" +
                $"&extraData={payload.ExtraData}" +
                $"&message={payload.Message}" +
                $"&orderId={payload.OrderId}" +
                $"&orderInfo={payload.OrderInfo}" +
                $"&orderType={payload.OrderType}" +
                $"&partnerCode={payload.PartnerCode}" +
                $"&payType={payload.PayType}" +
                $"&requestId={payload.RequestId}" +
                $"&responseTime={payload.ResponseTime}" +
                $"&resultCode={payload.ResultCode}" +
                $"&transId={payload.TransId}";

            var expectedSig = HmacSha256(secretKey, rawSignature);
            if (expectedSig != payload.Signature)
            {
                return Unauthorized(new { error = "Invalid signature" });
            }

            // Chỉ xử lý khi thanh toán thành công (resultCode == 0)
            if (payload.ResultCode == 0)
            {
                // Parse invoiceId từ orderId (format: MOMO{timestamp}INV{invoiceId})
                var invoiceIdStr = payload.OrderId?.Split("INV").LastOrDefault();
                if (int.TryParse(invoiceIdStr, out int invoiceId))
                {
                    var invoice = await _context.Invoices.FindAsync(invoiceId);
                    if (invoice != null && invoice.Status != "Paid")
                    {
                        // Tạo bản ghi Payment
                        var payment = new Payment
                        {
                            InvoiceId       = invoiceId,
                            AmountPaid      = decimal.Parse(payload.Amount ?? "0"),
                            PaymentMethod   = "Momo",
                            TransactionCode = payload.TransId?.ToString(),
                            PaymentDate     = DateTime.Now,
                        };
                        _context.Payments.Add(payment);

                        // Cập nhật trạng thái Invoice → Paid
                        invoice.Status = "Paid";

                        await _context.SaveChangesAsync();
                    }
                }
            }

            return Ok(new { message = "Callback processed" });
        }

        // ─── POST /api/momo/confirm ──────────────────────────────────────
        // Frontend gọi sau khi user quay về từ MoMo (redirect), kiểm tra + ghi nhận nếu chưa có
        [HttpPost("confirm")]
        public async Task<IActionResult> ConfirmReturn([FromBody] MomoConfirmRequest req)
        {
            if (req.ResultCode != 0)
            {
                return BadRequest(new { message = "Thanh toán thất bại hoặc bị hủy.", resultCode = req.ResultCode });
            }

            // Parse invoiceId từ orderId
            var invoiceIdStr = req.OrderId?.Split("INV").LastOrDefault();
            if (!int.TryParse(invoiceIdStr, out int invoiceId))
            {
                return BadRequest(new { message = "Không parse được invoiceId từ orderId." });
            }

            var invoice = await _context.Invoices.FindAsync(invoiceId);
            if (invoice == null) return NotFound(new { message = $"Không tìm thấy hóa đơn #{invoiceId}" });

            // Nếu chưa được cập nhật bởi IPN callback, ghi nhận tại đây
            if (invoice.Status != "Paid")
            {
                var payment = new Payment
                {
                    InvoiceId       = invoiceId,
                    AmountPaid      = req.Amount,
                    PaymentMethod   = "Momo",
                    TransactionCode = req.TransId,
                    PaymentDate     = DateTime.Now,
                };
                _context.Payments.Add(payment);
                invoice.Status = "Paid";
                await _context.SaveChangesAsync();
            }

            // Trả về thông tin để frontend hiển thị
            return Ok(new
            {
                success     = true,
                message     = "Thanh toán MoMo thành công!",
                invoiceId,
                transId     = req.TransId,
                amount      = req.Amount,
                invoiceStatus = invoice.Status,
            });
        }

        // ─── Helper: HMAC SHA256 ─────────────────────────────────────────
        private static string HmacSha256(string key, string data)
        {
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(key));
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
            return Convert.ToHexString(hash).ToLower();
        }
    }

    // ─── DTOs ────────────────────────────────────────────────────────────
    public class MomoCreateRequest
    {
        public int     InvoiceId { get; set; }
        public long    Amount    { get; set; }
        public string? OrderInfo { get; set; }
    }

    public class MomoCallbackPayload
    {
        [JsonPropertyName("partnerCode")]  public string? PartnerCode  { get; set; }
        [JsonPropertyName("orderId")]      public string? OrderId      { get; set; }
        [JsonPropertyName("requestId")]    public string? RequestId    { get; set; }
        [JsonPropertyName("amount")]       public string? Amount       { get; set; }
        [JsonPropertyName("orderInfo")]    public string? OrderInfo    { get; set; }
        [JsonPropertyName("orderType")]    public string? OrderType    { get; set; }
        [JsonPropertyName("transId")]      public long?   TransId      { get; set; }
        [JsonPropertyName("resultCode")]   public int     ResultCode   { get; set; }
        [JsonPropertyName("message")]      public string? Message      { get; set; }
        [JsonPropertyName("payType")]      public string? PayType      { get; set; }
        [JsonPropertyName("responseTime")] public long?   ResponseTime { get; set; }
        [JsonPropertyName("extraData")]    public string? ExtraData    { get; set; }
        [JsonPropertyName("signature")]    public string? Signature    { get; set; }
    }

    public class MomoConfirmRequest
    {
        public string?  OrderId    { get; set; }
        public int      ResultCode { get; set; }
        public decimal  Amount     { get; set; }
        public string?  TransId    { get; set; }
        public string?  Message    { get; set; }
    }
}
