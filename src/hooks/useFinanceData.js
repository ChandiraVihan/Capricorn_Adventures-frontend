import { useState, useCallback } from "react";
import { getPayments, getInvoices, markRefund } from "../api/financeApi";

export function useFinanceData() {
  const [payments, setPayments]   = useState([]);
  const [invoices, setInvoices]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  const fetchData = useCallback(async (from, to) => {
    setLoading(true);
    setError(null);
    try {
      const [paymentsRes, invoicesRes] = await Promise.all([
        getPayments(from, to),
        getInvoices(from, to),
      ]);
      setPayments(paymentsRes.data);
      setInvoices(invoicesRes.data);
    } catch (err) {
      setError("Failed to load finance data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const refundPayment = useCallback(async (paymentId, from, to) => {
    await markRefund(paymentId);
    await fetchData(from, to);
  }, [fetchData]);

  return { payments, invoices, loading, error, fetchData, refundPayment };
}