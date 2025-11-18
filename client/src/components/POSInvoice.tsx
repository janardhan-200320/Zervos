import React from 'react';

interface InvoiceItem {
  name: string;
  qty: number;
  price: number;
  assignedPerson?: string;
}

interface POSInvoiceProps {
  transaction: {
    id: string;
    date: string;
    customer: {
      name: string;
      email?: string;
      phone?: string;
    };
    items: InvoiceItem[];
    amount: number;
    staff?: string;
    serviceAttendee?: string;
    paymentMethod: string;
  };
  company: {
    name: string;
    businessType?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    phone?: string;
    email?: string;
    gst?: string;
  };
  showTax?: boolean;
}

export const POSInvoice = React.forwardRef<HTMLDivElement, POSInvoiceProps>(
  ({ transaction, company, showTax = true }, ref) => {
    const subtotal = transaction.items.reduce(
      (sum, item) => sum + item.price * item.qty,
      0
    );

    const cgst = showTax ? Math.round(subtotal * 0.09) : 0;
    const sgst = showTax ? Math.round(subtotal * 0.09) : 0;
    const totalTax = cgst + sgst;
    const total = subtotal + totalTax;

    const formatPrice = (cents: number) => `₹ ${(cents / 100).toFixed(2)}`;

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };

    const convertToWords = (num: number): string => {
      const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
      const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
      const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

      if (num === 0) return 'Zero';

      const convertHundreds = (n: number): string => {
        if (n === 0) return '';
        if (n < 10) return ones[n];
        if (n < 20) return teens[n - 10];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
        return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertHundreds(n % 100) : '');
      };

      const convertThousands = (n: number): string => {
        if (n < 1000) return convertHundreds(n);
        return convertHundreds(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convertHundreds(n % 1000) : '');
      };

      const lakhs = Math.floor(num / 100000);
      const thousands = Math.floor((num % 100000) / 1000);
      const hundreds = num % 1000;

      let result = '';
      if (lakhs > 0) result += convertHundreds(lakhs) + ' Lakh ';
      if (thousands > 0) result += convertHundreds(thousands) + ' Thousand ';
      if (hundreds > 0) result += convertHundreds(hundreds);

      return result.trim();
    };

    const amountInWords = convertToWords(Math.floor(total / 100));

    return (
      <div ref={ref} className="bg-white mx-auto" style={{ 
        fontFamily: 'Courier New, monospace',
        width: '302px', // 80mm thermal paper width
        fontSize: '12px',
        padding: '10px 8px',
        lineHeight: '1.4'
      }}>
        {/* Header */}
        <div className="text-center" style={{ borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px' }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px', letterSpacing: '1px' }}>
            {company.name.toUpperCase()}
          </div>
          {company.businessType && (
            <div style={{ fontSize: '11px', fontWeight: '600', marginBottom: '3px' }}>
              {company.businessType.toUpperCase()}
            </div>
          )}
          {company.address && (
            <div style={{ fontSize: '10px', marginBottom: '2px' }}>{company.address}</div>
          )}
          {company.city && (
            <div style={{ fontSize: '10px', marginBottom: '2px' }}>
              {company.city}{company.state && `, ${company.state}`}{company.pincode && ` - ${company.pincode}`}
            </div>
          )}
          {company.phone && (
            <div style={{ fontSize: '10px', marginBottom: '2px' }}>Tel: {company.phone}</div>
          )}
          {company.email && (
            <div style={{ fontSize: '10px', marginBottom: '2px' }}>{company.email}</div>
          )}
          {company.gst && showTax && (
            <div style={{ fontSize: '10px', fontWeight: '600', marginTop: '3px' }}>
              GSTIN: {company.gst}
            </div>
          )}
        </div>

        {/* Invoice Info */}
        <div style={{ marginBottom: '8px', fontSize: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span>Bill No: {transaction.id}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span>Date: {formatDate(transaction.date)}</span>
            <span>Time: {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
          </div>
          {transaction.customer.name && transaction.customer.name !== 'Walk-in Customer' && (
            <div style={{ marginBottom: '2px' }}>Customer: {transaction.customer.name}</div>
          )}
          {transaction.staff && (
            <div style={{ marginBottom: '2px' }}>Cashier: {transaction.staff}</div>
          )}
        </div>

        {/* Items Header */}
        <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '4px 0', marginBottom: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 'bold' }}>
            <span style={{ flex: '3' }}>ITEM</span>
            <span style={{ flex: '1', textAlign: 'center' }}>QTY</span>
            <span style={{ flex: '1', textAlign: 'right' }}>RATE</span>
            <span style={{ flex: '1.5', textAlign: 'right' }}>AMOUNT</span>
          </div>
        </div>

        {/* Items List */}
        <div style={{ marginBottom: '8px' }}>
          {transaction.items.map((item, index) => (
            <div key={index} style={{ marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                <div style={{ flex: '3', paddingRight: '4px' }}>
                  <div style={{ fontWeight: '600', wordWrap: 'break-word' }}>{item.name}</div>
                  {item.assignedPerson && (
                    <div style={{ fontSize: '9px', fontStyle: 'italic', color: '#666' }}>
                      By: {item.assignedPerson}
                    </div>
                  )}
                </div>
                <div style={{ flex: '1', textAlign: 'center' }}>{item.qty}</div>
                <div style={{ flex: '1', textAlign: 'right' }}>{formatPrice(item.price)}</div>
                <div style={{ flex: '1.5', textAlign: 'right', fontWeight: '600' }}>
                  {formatPrice(item.price * item.qty)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }}></div>

        {/* Totals */}
        <div style={{ fontSize: '10px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span>Sub Total:</span>
            <span style={{ fontWeight: '600' }}>{formatPrice(subtotal)}</span>
          </div>
          
          {showTax && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span>Discount:</span>
                <span>{formatPrice(0)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span>CGST @ 9%:</span>
                <span style={{ fontWeight: '600' }}>{formatPrice(cgst)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span>SGST @ 9%:</span>
                <span style={{ fontWeight: '600' }}>{formatPrice(sgst)}</span>
              </div>
            </>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span>Round Off:</span>
            <span>{formatPrice(0)}</span>
          </div>
        </div>

        {/* Grand Total */}
        <div style={{ 
          borderTop: '2px solid #000', 
          borderBottom: '2px solid #000', 
          padding: '6px 0',
          marginBottom: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          <span>TOTAL:</span>
          <span>{formatPrice(total)}</span>
        </div>

        {/* Payment Mode */}
        <div style={{ fontSize: '10px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span>Payment Mode:</span>
            <span style={{ fontWeight: '600' }}>{transaction.paymentMethod.toUpperCase()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span>Amount Paid:</span>
            <span style={{ fontWeight: '600' }}>{formatPrice(total)}</span>
          </div>
        </div>

        {/* Amount in Words */}
        <div style={{ 
          fontSize: '9px', 
          fontStyle: 'italic',
          marginBottom: '8px',
          textAlign: 'center',
          padding: '4px 0',
          borderTop: '1px dashed #000',
          borderBottom: '1px dashed #000'
        }}>
          Amount in Words: {amountInWords} Only
        </div>

        {/* Thank You Message */}
        <div style={{ 
          textAlign: 'center', 
          fontSize: '12px', 
          fontWeight: 'bold',
          marginBottom: '8px',
          marginTop: '8px'
        }}>
          THANK YOU FOR YOUR BUSINESS!
        </div>

        {/* Footer Info */}
        <div style={{ 
          fontSize: '9px', 
          textAlign: 'center',
          borderTop: '1px dashed #000',
          paddingTop: '6px',
          marginTop: '8px'
        }}>
          {transaction.staff && (
            <div style={{ marginBottom: '3px' }}>
              Served by: {transaction.staff}
            </div>
          )}
          <div style={{ marginBottom: '3px' }}>
            {new Date().toLocaleDateString('en-IN', { 
              day: '2-digit', 
              month: '2-digit', 
              year: 'numeric'
            })} {new Date().toLocaleTimeString('en-IN', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: true 
            })}
          </div>
          {company.email && (
            <div style={{ marginTop: '6px', fontWeight: '600' }}>
              Visit: {company.email.split('@')[1] || 'www.yourbusiness.com'}
            </div>
          )}
          <div style={{ marginTop: '8px', fontSize: '8px' }}>
            ** Please check items before leaving **
          </div>
          <div style={{ marginTop: '4px', fontSize: '8px' }}>
            This is a computer generated bill
          </div>
        </div>
      </div>
    );
  }
);

POSInvoice.displayName = 'POSInvoice';

export default POSInvoice;
