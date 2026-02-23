import { QRPay } from 'vietnam-qr-pay';

/**
 * Generates a VietQR string for banking apps to scan
 * @param amount The amount to be paid
 * @param description Payment description (note)
 * @returns The encoded VietQR string
 */
export function generateVietQRString(amount: number): string {
    try {
        const baseContent = import.meta.env.VITE_VIETQR_BASE_CONTENT || '';
        const qrPay = new QRPay(baseContent);
        qrPay.amount = amount.toString();
        const content = qrPay.build();
        const encodedContent = encodeURIComponent(content);
        const qrLink = `https://quickchart.io/qr?centerImageUrl=https://lh3.googleusercontent.com/pw/AP1GczNMvTVT6c3_6QJgMHGLNEpTLvPRa3gfDdNg7t-mRaNrNAa0k9jmfowAhCFeSyEz_5ZO71rdA8YdAfMsbcd_KoOvURyrc5piAqvWS3Z5rxWGU0fYXUuFVis_s0ZKPuzQHM_EujAZZg6GU4ol63ce2Ws=w800-h800-s-no&size=200&text=${encodedContent}`;
        return qrLink;
    } catch (error) {
        console.error('Error generating VietQR string:', error);
        return '';
    }
}
