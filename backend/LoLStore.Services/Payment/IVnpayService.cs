using LoLStore.Core.Payment;
using Microsoft.AspNetCore.Http;

namespace LoLStore.Services.Payment;

public interface IVnpayService
{
    string CreatePaymentUrl(Guid orderId, decimal amount, string orderInfo, string ipAddress);
    VnpayCallbackResult ProcessCallback(IQueryCollection queryParams);
}