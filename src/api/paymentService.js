const API_BASE_URL = "http://localhost:8080/api";
const MERCHANT_ID = "1234776";

export const paymentService = {
  async generateHash(orderId, amount, currency) {
    const response = await fetch(
      `${API_BASE_URL}/payment/generate-hash?orderId=${orderId}&amount=${amount}&currency=${currency}`
    );
    if (!response.ok) throw new Error("Failed to generate payment hash");
    return await response.text();
  },

  startPayHerePayment(paymentData, onCompleted, onDismissed, onError) {
    if (typeof window.payhere === 'undefined') {
      onError("PayHere SDK not loaded");
      return;
    }

    window.payhere.onCompleted = onCompleted;
    window.payhere.onDismissed = onDismissed;
    window.payhere.onError = onError;

    const payment = {
      sandbox: true,
      merchant_id: MERCHANT_ID,
      return_url: window.location.origin + "/payment-success",
      cancel_url: window.location.origin + "/payment-cancel",
      notify_url: "http://localhost:8080/api/payment/notify", 
      order_id: paymentData.orderId,
      items: paymentData.items,
      amount: parseFloat(paymentData.totalAmount).toFixed(2),
      currency: "LKR",
      hash: paymentData.hash,
      first_name: paymentData.firstName || "Customer",
      last_name: paymentData.lastName || "",
      email: paymentData.email || "",
      phone: paymentData.phone || "",
      address: paymentData.address || "N/A",
      city: paymentData.city || "N/A",
      country: "Sri Lanka",
    };

    window.payhere.startPayment(payment);
  }
};
