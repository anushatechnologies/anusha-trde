import { numberToWordsINR } from './format';

export type ReceiptModel = {
  receiptNo?: string;
  receiptDate?: string;
  status?: string;
  currency?: string;
  investorName?: string;
  address?: string;
  mobile?: string;
  email?: string;
  description?: string;
  paymentMode?: string;
  referenceNo?: string;
  amount?: number;
  amountInWords?: string;
};

export const generateReceiptHtml = (data: ReceiptModel): string => {
  const receiptNo = data.receiptNo || 'AT-INV-2026-0001';
  const receiptDate = data.receiptDate || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const status = data.status || 'PAID / RECEIVED';
  const currency = data.currency || 'INR';
  const investorName = data.investorName || 'Anusha Trade Investor';
  const address = data.address || 'Telangana, India';
  const mobile = data.mobile || 'Registered Mobile';
  const email = data.email || 'investor@anushatrade.com';
  const description = data.description || 'Business Investment';
  const paymentMode = data.paymentMode || 'Bank Transfer / Gateway';
  const referenceNo = data.referenceNo || 'REF2026081001';
  const amount = data.amount || 0;
  const formattedAmount = amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const amountInWords = data.amountInWords || numberToWordsINR(amount);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Investment Payment Receipt - ${receiptNo}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      padding: 24px;
      color: #0f172a;
    }
    .receipt-card {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      padding: 32px;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.06);
      border: 1px solid #e2e8f0;
    }
    .header-frame {
      border: 2px solid #1e40af;
      border-radius: 8px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 24px;
    }
    .logo-container {
      width: 70px;
      height: 70px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .logo-img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    .company-details {
      flex: 1;
    }
    .company-title {
      font-size: 22px;
      font-weight: 800;
      color: #1e3a8a;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .company-text {
      font-size: 11px;
      color: #334155;
      line-height: 1.5;
    }
    .doc-title-block {
      text-align: center;
      margin-bottom: 22px;
    }
    .doc-main-title {
      font-size: 22px;
      font-weight: 800;
      color: #1e3a8a;
      letter-spacing: 0.5px;
    }
    .doc-sub-title {
      font-size: 11px;
      font-weight: 700;
      color: #16a34a;
      letter-spacing: 1px;
      margin-top: 2px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 10px 14px;
      font-size: 13px;
      text-align: left;
    }
    .lbl {
      background-color: #f8fafc;
      font-weight: 700;
      color: #0f172a;
      width: 25%;
    }
    .val {
      color: #334155;
    }
    .status-ok {
      color: #16a34a;
      font-weight: 800;
    }
    .section-head {
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .items-tbl th {
      background-color: #1e3a8a;
      color: #ffffff;
      font-weight: 700;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .amt-right {
      text-align: right;
    }
    .total-row td {
      background-color: #eff6ff;
      font-size: 14px;
      font-weight: 800;
    }
    .notice-text {
      font-size: 11px;
      color: #64748b;
      line-height: 1.5;
      margin-top: 10px;
      margin-bottom: 30px;
    }
    .sig-flex {
      display: flex;
      justify-content: space-between;
      margin-top: 40px;
    }
    .sig-box {
      width: 42%;
    }
    .sig-head {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 45px;
    }
    .sig-line {
      border-top: 1px solid #94a3b8;
      padding-top: 6px;
      font-size: 12px;
      color: #64748b;
    }
    .footer-note {
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="receipt-card">
    <div class="header-frame">
      <div class="logo-container">
        <img class="logo-img" src="https://api.anushatrade.com/assets/brand-logo.png" alt="Anusha Trade" onerror="this.style.display='none'">
      </div>
      <div class="company-details">
        <div class="company-title">ANUSHA TRADE</div>
        <div class="company-text">
          Rd No. 5, Laxminagar Colony, Vivekananda Nagar Extension,<br>
          Kukatpally, Hyderabad, Telangana - 500072<br>
          🌐 Website: https://anushatrade.com/<br>
          ✉️ Email: anushamilktrading@gmail.com
        </div>
      </div>
    </div>

    <div class="doc-title-block">
      <div class="doc-main-title">INVESTMENT PAYMENT RECEIPT</div>
      <div class="doc-sub-title">SYSTEM GENERATED RECEIPT</div>
    </div>

    <table>
      <tr>
        <td class="lbl">Receipt No.</td>
        <td class="val">${receiptNo}</td>
        <td class="lbl">Receipt Date</td>
        <td class="val">${receiptDate}</td>
      </tr>
      <tr>
        <td class="lbl">Status</td>
        <td class="val status-ok">${status}</td>
        <td class="lbl">Currency</td>
        <td class="val">${currency}</td>
      </tr>
    </table>

    <div class="section-head">INVESTOR DETAILS</div>
    <table>
      <tr>
        <td class="lbl">Investor Name</td>
        <td class="val">${investorName}</td>
      </tr>
      <tr>
        <td class="lbl">Address</td>
        <td class="val">${address}</td>
      </tr>
      <tr>
        <td class="lbl">Mobile / Email</td>
        <td class="val">${mobile} | ${email}</td>
      </tr>
    </table>

    <div class="section-head">INVESTMENT / PAYMENT DETAILS</div>
    <table class="items-tbl">
      <thead>
        <tr>
          <th>Description</th>
          <th>Payment Mode</th>
          <th>Reference / UTR</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${description}</td>
          <td>${paymentMode}</td>
          <td>${referenceNo}</td>
          <td class="amt-right">Rs. ${formattedAmount}</td>
        </tr>
        <tr>
          <td colspan="2" class="lbl">Amount in Words</td>
          <td colspan="2" class="val" style="font-weight: 600;">${amountInWords}</td>
        </tr>
        <tr class="total-row">
          <td colspan="3" class="lbl">TOTAL AMOUNT RECEIVED</td>
          <td class="amt-right" style="color: #1e3a8a;">Rs. ${formattedAmount}</td>
        </tr>
      </tbody>
    </table>

    <div class="notice-text">
      This receipt acknowledges an investment/payment received by ANUSHA TRADE. For an actual transaction, replace the example investor, amount, payment reference and purpose with the genuine transaction details and maintain applicable supporting records.
    </div>

    <div class="sig-flex">
      <div class="sig-box">
        <div class="sig-head">Investor / Payer</div>
        <div class="sig-line">Signature</div>
      </div>
      <div class="sig-box" style="text-align: right;">
        <div class="sig-head">For ANUSHA TRADE</div>
        <div class="sig-line" style="text-align: right;">Authorized Signatory</div>
      </div>
    </div>

    <div class="footer-note">
      System-generated document. Transaction data is verified.
    </div>
  </div>
</body>
</html>`;
};
