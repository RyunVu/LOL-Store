using System.Net;
using System.Security.Cryptography;
using System.Text;
using LoLStore.Core.Payment;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

namespace LoLStore.Services.Payment;

public class VnpayService : IVnpayService
{
    private readonly VnpayOptions _options;

    public VnpayService(IOptions<VnpayOptions> options)
    {
        _options = options.Value;
    }

    public string CreatePaymentUrl(Guid orderId, decimal amount, string orderInfo, string ipAddress)
    {
        var vnpayData = new SortedDictionary<string, string>
        {
            ["vnp_Version"]    = "2.1.0",
            ["vnp_Command"]    = "pay",
            ["vnp_TmnCode"]    = _options.TmnCode,
            ["vnp_Amount"]     = ((long)(amount * 100)).ToString(),
            ["vnp_CreateDate"] = DateTime.UtcNow.AddHours(7).ToString("yyyyMMddHHmmss"), // ICT
            ["vnp_CurrCode"]   = "VND",
            ["vnp_IpAddr"]     = ipAddress,
            ["vnp_Locale"]     = "vn",
            ["vnp_OrderInfo"]  = orderInfo,
            ["vnp_OrderType"]  = "other",
            ["vnp_ReturnUrl"]  = _options.ReturnUrl,
            ["vnp_TxnRef"]     = orderId.ToString(),
            ["vnp_ExpireDate"] = DateTime.UtcNow.AddHours(7).AddMinutes(15).ToString("yyyyMMddHHmmss"),
        };

        var queryString = string.Join("&", vnpayData.Select(kv =>
            $"{WebUtility.UrlEncode(kv.Key)}={WebUtility.UrlEncode(kv.Value)}"));

        var secureHash = HmacSha512(_options.HashSecret, queryString);

        return $"{_options.BaseUrl}?{queryString}&vnp_SecureHash={secureHash}";
    }

    public VnpayCallbackResult ProcessCallback(IQueryCollection queryParams)
    {
        // Separate secure hash from the rest
        var vnpParams = queryParams
            .Where(kv => kv.Key.StartsWith("vnp_") && kv.Key != "vnp_SecureHash")
            .OrderBy(kv => kv.Key)
            .ToDictionary(kv => kv.Key, kv => kv.Value.ToString());

        var queryString = string.Join("&", vnpParams.Select(kv =>
            $"{WebUtility.UrlEncode(kv.Key)}={WebUtility.UrlEncode(kv.Value)}"));

        var expectedHash = HmacSha512(_options.HashSecret, queryString);
        var receivedHash = queryParams["vnp_SecureHash"].ToString();

        var isValid = string.Equals(expectedHash, receivedHash, StringComparison.OrdinalIgnoreCase);
        var responseCode = queryParams["vnp_ResponseCode"].ToString();

        return new VnpayCallbackResult
        {
            IsSuccess    = isValid && responseCode == "00",
            TransactionId = queryParams["vnp_TransactionNo"].ToString(),
            OrderId      = queryParams["vnp_TxnRef"].ToString(),
            Amount       = long.Parse(queryParams["vnp_Amount"].ToString()) / 100m,
            ResponseCode = responseCode,
            Message      = GetResponseMessage(responseCode)
        };
    }

    private static string HmacSha512(string key, string data)
    {
        using var hmac = new HMACSHA512(Encoding.UTF8.GetBytes(key));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
        return BitConverter.ToString(hash).Replace("-", "").ToLower();
    }

    private static string GetResponseMessage(string code) => code switch
    {
        "00" => "Transaction successful",
        "07" => "Suspicious transaction deducted",
        "09" => "Card/Account not registered for internet banking",
        "10" => "Card/Account verification failed more than 3 times",
        "11" => "Payment session expired",
        "12" => "Card/Account locked",
        "13" => "Wrong OTP",
        "24" => "Customer cancelled transaction",
        "51" => "Insufficient balance",
        "65" => "Daily transaction limit exceeded",
        "75" => "Bank under maintenance",
        "79" => "Wrong payment password more than allowed times",
        _    => "Unknown error"
    };
}